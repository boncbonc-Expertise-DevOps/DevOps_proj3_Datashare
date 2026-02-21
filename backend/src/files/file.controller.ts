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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FileService } from './file.service';
import * as bcrypt from 'bcryptjs';

@Controller('api/files')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
    @Body() body: any,
  ) {
      const userId = req.user?.userId;
    if (!userId) throw new BadRequestException('Utilisateur non authentifié');

    // Validation métier
    await this.fileService.validateFile(file, userId);

    // Expiration
    const expiresAt = new Date();
    const days = Math.min(parseInt(body.expiration_days || '7', 10), 7);
    expiresAt.setDate(expiresAt.getDate() + days);

    // Mot de passe optionnel
    let passwordHash: string | undefined;
    if (body.password && body.password.length >= 6) {
      passwordHash = await bcrypt.hash(body.password, 10);
    } else if (body.password) {
      throw new BadRequestException('Mot de passe trop court (min 6 caractères)');
    }

    // Stockage
    const storagePath = await this.fileService.saveFileToDisk(file);
    const downloadToken = this.fileService.generateDownloadToken();

    // Métadonnées
    await this.fileService.saveFileMetadata({
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
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        storagePath,
        downloadToken,
        expiresAt,
        passwordProtected: !!passwordHash,
      },
      message: 'Fichier uploadé avec succès.',
    };
  }
}