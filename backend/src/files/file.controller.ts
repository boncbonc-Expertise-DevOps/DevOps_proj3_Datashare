import {
  Controller,
  Post,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  Req,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FileService } from './file.service';
import * as path from 'path';

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

@Controller('api/files')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      // Optimisation: aucun accès disque tant que l'extension n'est pas validée.
      // Le fichier sera écrit sur disque *uniquement* dans le service après validations métier.
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (_req, file, cb) => {
        const ext = path.extname(path.basename(file.originalname)).toLowerCase();
        if (!ext) {
          return cb(
            new BadRequestException('Fichier sans extension interdit') as any,
            false,
          );
        }
        if (FORBIDDEN_EXTENSIONS.includes(ext)) {
          return cb(new BadRequestException('Type de fichier interdit') as any, false);
        }
        return cb(null, true);
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
    @Body() body: any,
  ) {
    const rawUserId = req.user?.userId;
    const userId = Number(rawUserId);
    if (!userId) throw new BadRequestException('Utilisateur non authentifié');

    // Le controller ne touche jamais la DB : toute la logique est dans le service.
    return await this.fileService.handleUpload({ userId, file, body });
  }
}