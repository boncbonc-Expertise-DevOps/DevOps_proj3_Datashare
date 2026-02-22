import {
  Controller,
  Post,
  Get,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  Req,
  Body,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FileService } from './file.service';
import { ListFilesQueryDto } from './dto/list-files.query.dto';

@Controller('api/files')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async listFiles(@Req() req: any, @Query() query: ListFilesQueryDto) {
    const rawUserId = req.user?.userId;
    const userId = Number(rawUserId);
    if (!userId) throw new BadRequestException('Utilisateur non authentifié');

    return await this.fileService.listUserFiles({ userId, query });
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
    @Body() body: any,
  ) {
    const rawUserId = req.user?.userId;
    const userId = Number(rawUserId);
    if (!userId) throw new BadRequestException('Utilisateur non authentifié');

    // Si Multer a refusé le fichier (extension interdite/sans extension/doublon),
    // @UploadedFile() est undefined. On renvoie une erreur 400 explicite.
    if (!file) {
      throw new BadRequestException(req.fileValidationError ?? 'Aucun fichier fourni');
    }

    // Le controller ne touche jamais la DB : toute la logique est dans le service.
    return await this.fileService.handleUpload({ userId, file, body });
  }
}