import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { DbService } from '../db/db.service';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcryptjs';
import type { ListFilesQueryDto } from './dto/list-files.query.dto';

// Stockage local : <backend>/uploads (résout correctement en dev/prod)
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const MAX_FILE_SIZE = 1 * 1024 * 1024 * 1024; // 1 Go
const FORBIDDEN_EXTENSIONS = ['.exe', '.bat', '.cmd', '.sh', '.msi', '.com', '.scr', '.pif', '.cpl'];
const MAX_FILES_PER_USER = 10;
const MAX_EXPIRATION_DAYS = 7;

@Injectable()
export class FileService {
  constructor(private readonly db: DbService) {}

  async listUserFiles(params: { userId: number; query: ListFilesQueryDto }) {
    const status = params.query.status ?? 'all';
    const page = params.query.page ?? 1;
    const pageSize = params.query.pageSize ?? 20;
    const offset = (page - 1) * pageSize;

    const whereParts: string[] = ['user_id = $1'];
    const values: any[] = [params.userId];

    if (status === 'active') {
      whereParts.push('deleted_at IS NULL');
      whereParts.push('expires_at > NOW()');
    } else if (status === 'expired') {
      whereParts.push('deleted_at IS NULL');
      whereParts.push('expires_at <= NOW()');
    } else if (status === 'deleted') {
      whereParts.push('deleted_at IS NOT NULL');
    }

    const whereSql = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';

    const totalRes = await this.db.query<{ total: string }>(
      `SELECT COUNT(*)::text AS total
       FROM files
       ${whereSql}`,
      values,
    );
    const total = Number.parseInt(totalRes.rows[0]?.total ?? '0', 10);

    const listRes = await this.db.query<{
      id: string;
      original_name: string;
      size_bytes: string;
      expires_at: string;
      is_protected: boolean;
      status: 'ACTIVE' | 'EXPIRED' | 'DELETED';
    }>(
      `SELECT
          id,
          original_name,
          size_bytes,
          expires_at,
          (password_hash IS NOT NULL) AS is_protected,
          CASE
            WHEN deleted_at IS NOT NULL THEN 'DELETED'
            WHEN expires_at <= NOW() THEN 'EXPIRED'
            ELSE 'ACTIVE'
          END AS status
        FROM files
        ${whereSql}
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3`,
      [params.userId, pageSize, offset],
    );

    return {
      items: listRes.rows.map((r) => ({
        id: Number(r.id),
        originalName: r.original_name,
        sizeBytes: Number(r.size_bytes),
        expiresAt: r.expires_at,
        isProtected: Boolean(r.is_protected),
        status: r.status,
      })),
      page,
      pageSize,
      total,
    };
  }

  /**
   * Point d'entrée unique pour l'upload :
   * - applique les règles métier
   * - stocke le fichier (déjà écrit par Multer en diskStorage)
   * - écrit les métadonnées en base
   */
  async handleUpload(params: {
    userId: number;
    file: Express.Multer.File;
    body?: { password?: string; expiration_days?: string; expirationDays?: string };
  }) {
    const { userId, file, body } = params;

    await this.validateFile(file, userId);

    const expiresAt = this.computeExpiresAt(body);
    const passwordHash = await this.computePasswordHash(body?.password);

    // Avec Multer diskStorage, le fichier est déjà sur disque : file.path est fourni.
    const storagePath = await this.saveFileToDisk(file);
    const downloadToken = this.generateDownloadToken();

    const saved = await this.saveFileMetadata({
      userId,
      file,
      storagePath,
      downloadToken,
      expiresAt,
      passwordHash,
    });

    return {
      status: 'success',
      file: {
        id: saved.id,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        storagePath,
        downloadToken,
        expiresAt,
        createdAt: saved.createdAt,
        passwordProtected: !!passwordHash,
      },
      message: 'Fichier uploadé avec succès.',
    };
  }

  async validateFile(file: Express.Multer.File, userId: number) {
    if (!file) throw new BadRequestException('Aucun fichier fourni');
    if (file.size > MAX_FILE_SIZE) throw new BadRequestException('Fichier trop volumineux (max 1 Go)');
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ext) throw new BadRequestException('Fichier sans extension interdit');
    if (FORBIDDEN_EXTENSIONS.includes(ext)) throw new BadRequestException('Type de fichier interdit');

    // 10 fichiers max par user (actifs)
    const count = await this.db.query('SELECT COUNT(*) FROM files WHERE user_id = $1 AND expires_at > NOW() AND deleted_at IS NULL', [userId]);
    if (parseInt(count.rows[0].count, 10) >= MAX_FILES_PER_USER) throw new BadRequestException('Quota de fichiers atteint (10 max)');

    // Interdit d'uploader un fichier déjà uploadé (même nom) et encore actif
    const duplicate = await this.db.query(
      'SELECT 1 FROM files WHERE user_id = $1 AND original_name = $2 AND expires_at > NOW() AND deleted_at IS NULL LIMIT 1',
      [userId, file.originalname],
    );
    if (duplicate.rowCount && duplicate.rowCount > 0) {
      throw new BadRequestException('Ce fichier a déjà été uploadé');
    }
  }

  generateDownloadToken(): string {
        return randomUUID();
  }
  
  async saveFileToDisk(file: Express.Multer.File): Promise<string> {
    if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

    // Cas standard avec Multer diskStorage
    const anyFile: any = file as any;
    if (anyFile.path) {
      return anyFile.path as string;
    }

    // Fallback si stockage en mémoire (buffer)
    if (file.buffer) {
      const filename = `${Date.now()}_${path
        .basename(file.originalname)
        .replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const filepath = path.join(UPLOAD_DIR, filename);
      fs.writeFileSync(filepath, file.buffer);
      return filepath;
    }

    throw new InternalServerErrorException('Stockage fichier impossible (ni path, ni buffer)');
  }

  async saveFileMetadata(params: {
    userId: number;
    file: Express.Multer.File;
    storagePath: string;
    downloadToken: string;
    expiresAt: Date;
    passwordHash?: string;
  }): Promise<{ id: number; createdAt: string }> {
    const { userId, file, storagePath, downloadToken, expiresAt, passwordHash } = params;
    try {
      const result = await this.db.query<{ id: string; created_at: string }>(
        `INSERT INTO files (user_id, original_name, mime_type, size_bytes, storage_path, download_token, password_hash, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, created_at`,
        [userId, file.originalname, file.mimetype, file.size, storagePath, downloadToken, passwordHash || null, expiresAt]
      );

      const row = result.rows[0];
      return { id: Number(row.id), createdAt: row.created_at };
    } catch (err) {
      throw new InternalServerErrorException('Erreur lors de l\'enregistrement en base');
    }
  }

  async deleteExpiredFiles() {
    // À appeler périodiquement (cron ou autre)
    const expired = await this.db.query('SELECT id, storage_path FROM files WHERE expires_at < NOW() AND deleted_at IS NULL');
    for (const row of expired.rows) {
      try {
        if (fs.existsSync(row.storage_path)) fs.unlinkSync(row.storage_path);
      } catch {}
      await this.db.query('UPDATE files SET deleted_at = NOW() WHERE id = $1', [row.id]);
    }
  }

  private computeExpiresAt(body?: { expiration_days?: string; expirationDays?: string }): Date {
    const raw = body?.expiration_days ?? body?.expirationDays ?? '7';
    const parsed = Number.parseInt(raw, 10);
    const days = Number.isFinite(parsed) ? parsed : 7;
    if (days <= 0) throw new BadRequestException("Date d'expiration invalide");
    if (days > MAX_EXPIRATION_DAYS) throw new BadRequestException('Date d\'expiration : maximum 7 jours');

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);
    return expiresAt;
  }

  private async computePasswordHash(password?: string): Promise<string | undefined> {
    if (!password) return undefined;
    if (password.length < 6) {
      throw new BadRequestException('Mot de passe trop court (min 6 caractères)');
    }
    return await bcrypt.hash(password, 10);
  }
}
