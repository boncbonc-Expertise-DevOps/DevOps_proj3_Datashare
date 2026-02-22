import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import * as path from 'path';
import { FileController } from './file.controller';
import { DownloadController } from './download.controller';
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

@Module({
  imports: [
    DbModule,
    MulterModule.registerAsync({
      imports: [DbModule],
      inject: [DbService],
      useFactory: (db: DbService) => ({
        storage: memoryStorage(),
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

          db.query(
            'SELECT 1 FROM files WHERE user_id = $1 AND original_name = $2 AND expires_at > NOW() AND deleted_at IS NULL LIMIT 1',
            [userId, file.originalname],
          )
            .then((res) => {
              if (res.rowCount && res.rowCount > 0) {
                (req as any).fileValidationError = 'Ce fichier a déjà été uploadé';
                return cb(null, false);
              }
              return cb(null, true);
            })
            .catch(() => {
              (req as any).fileValidationError =
                'Erreur de validation du fichier';
              return cb(null, false);
            });
        },
      }),
    }),
  ],
  controllers: [FileController, DownloadController],
  providers: [FileService],
  exports: [FileService]
})
export class FileModule {}
