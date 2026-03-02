import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { randomUUID } from 'crypto';
import { FileController } from './file.controller';
import { DownloadController } from './download.controller';
import { ApiDownloadController } from './api-download.controller';
import { FileService } from './file.service';
import { DbModule } from '../db/db.module';
import { DbService } from '../db/db.service';

const MAX_FILE_SIZE = 1 * 1024 * 1024 * 1024; // 1 Go
const FORBIDDEN_EXTENSIONS = [
  '.exe',
  '.bat',
  '.cmd',
  '.sh',
  '.msi',
  '.com',
  '.scr',
  '.pif',
  '.cpl',
];

// Stream upload vers disque : <backend>/uploads (résout correctement en dev/prod)
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const MAX_FILES_PER_USER = 10;

@Module({
  imports: [
    DbModule,
    MulterModule.registerAsync({
      imports: [DbModule],
      inject: [DbService],
      useFactory: (db: DbService) => ({
        storage: diskStorage({
          destination: (req, _file, cb) => {
            try {
              if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
              cb(null, UPLOAD_DIR);
            } catch (e) {
              cb(e as any, UPLOAD_DIR);
            }
          },
          filename: (_req, file, cb) => {
            const ext = path.extname(path.basename(file.originalname)).toLowerCase();
            cb(null, `${randomUUID()}${ext}`);
          },
        }),
        limits: { fileSize: MAX_FILE_SIZE },
        fileFilter: (req, file, cb) => {
          // Objectif: rejeter avant que le controller ne voie le fichier
          // (pas de fichier sans extension, pas d'extensions interdites, pas de doublon actif).
          const ext = path.extname(path.basename(file.originalname)).toLowerCase();
          if (!ext) {
            (req as any).fileValidationError = 'Fichier sans extension interdit';
            return cb(null, false);
          }
          if (FORBIDDEN_EXTENSIONS.includes(ext)) {
            (req as any).fileValidationError = 'Type de fichier interdit';
            return cb(null, false);
          }

          const userId = Number((req as any).user?.userId);
          if (!userId) {
            (req as any).fileValidationError = 'Utilisateur non authentifié';
            return cb(null, false);
          }

          // Validations DB avant écriture disque (évite d'écrire un fichier qu'on rejettera ensuite)
          Promise.all([
            db.query('SELECT COUNT(*) FROM files WHERE user_id = $1 AND expires_at > NOW() AND deleted_at IS NULL', [userId]),
            db.query(
              'SELECT 1 FROM files WHERE user_id = $1 AND original_name = $2 AND expires_at > NOW() AND deleted_at IS NULL LIMIT 1',
              [userId, file.originalname],
            ),
          ])
            .then(([countRes, dupRes]) => {
              const count = Number.parseInt(String(countRes.rows?.[0]?.count ?? '0'), 10);
              if (Number.isFinite(count) && count >= MAX_FILES_PER_USER) {
                (req as any).fileValidationError = 'Quota de fichiers atteint (10 max)';
                return cb(null, false);
              }

              if (dupRes.rowCount && dupRes.rowCount > 0) {
                (req as any).fileValidationError = 'Ce fichier a déjà été uploadé';
                return cb(null, false);
              }

              return cb(null, true);
            })
            .catch(() => {
              (req as any).fileValidationError = 'Erreur de validation du fichier';
              return cb(null, false);
            });
        },
      }),
    }),
  ],
  controllers: [FileController, DownloadController, ApiDownloadController],
  providers: [FileService],
  exports: [FileService]
})
export class FileModule {}
