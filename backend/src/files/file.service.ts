import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { DbService } from '../db/db.service';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const UPLOAD_DIR = path.join(__dirname, '../../uploads');
const MAX_FILE_SIZE = 1 * 1024 * 1024 * 1024; // 1 Go
const FORBIDDEN_EXTENSIONS = ['.exe', '.bat', '.cmd', '.sh', '.msi', '.com', '.scr', '.pif', '.cpl'];
const MAX_FILES_PER_USER = 10;
const MAX_EXPIRATION_DAYS = 7;

@Injectable()
export class FileService {
  constructor(private readonly db: DbService) {}

  async validateFile(file: Express.Multer.File, userId: number) {
    if (!file) throw new BadRequestException('Aucun fichier fourni');
    if (file.size > MAX_FILE_SIZE) throw new BadRequestException('Fichier trop volumineux (max 1 Go)');
    const ext = path.extname(file.originalname).toLowerCase();
    if (FORBIDDEN_EXTENSIONS.includes(ext)) throw new BadRequestException('Type de fichier interdit');
    const count = await this.db.query('SELECT COUNT(*) FROM files WHERE user_id = $1 AND expires_at > NOW() AND deleted_at IS NULL', [userId]);
    if (parseInt(count.rows[0].count, 10) >= MAX_FILES_PER_USER) throw new BadRequestException('Quota de fichiers atteint (10 max)');
  }

  generateDownloadToken(): string {
        return randomUUID();
  }
  
  async saveFileToDisk(file: Express.Multer.File): Promise<string> {
    if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    const filename = `${Date.now()}_${file.originalname}`;
    const filepath = path.join(UPLOAD_DIR, filename);
    fs.writeFileSync(filepath, file.buffer);
    return filepath;
  }

  async saveFileMetadata(params: {
    userId: number;
    file: Express.Multer.File;
    storagePath: string;
    downloadToken: string;
    expiresAt: Date;
    passwordHash?: string;
  }) {
    const { userId, file, storagePath, downloadToken, expiresAt, passwordHash } = params;
    try {
      await this.db.query(
        `INSERT INTO files (user_id, original_name, mime_type, size_bytes, storage_path, download_token, password_hash, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [userId, file.originalname, file.mimetype, file.size, storagePath, downloadToken, passwordHash || null, expiresAt]
      );
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
}
