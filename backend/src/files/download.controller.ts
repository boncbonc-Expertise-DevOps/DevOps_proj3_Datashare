import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Res,
  StreamableFile,
  Body,
} from '@nestjs/common';
import type { Response } from 'express';
import * as fs from 'fs';
import { FileService } from './file.service';
import { DownloadPasswordDto } from './dto/download-password.dto';

@Controller('download')
export class DownloadController {
  constructor(private readonly fileService: FileService) {}

  @Get(':token/meta')
  async getMeta(@Param('token') token: string) {
    if (!token) throw new BadRequestException('Token manquant');
    return await this.fileService.getPublicFileMeta({ token });
  }

  @Get(':token')
  async downloadUnprotected(
    @Param('token') token: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!token) throw new BadRequestException('Token manquant');

    const dl = await this.fileService.preparePublicDownload({ token, password: undefined });

    res.setHeader('Content-Type', dl.mimeType);
    res.setHeader('Content-Disposition', dl.contentDisposition);
    if (dl.sizeBytes !== undefined) {
      res.setHeader('Content-Length', String(dl.sizeBytes));
    }

    return new StreamableFile(fs.createReadStream(dl.streamPath));
  }

  @Post(':token')
  async downloadProtected(
    @Param('token') token: string,
    @Body() body: DownloadPasswordDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!token) throw new BadRequestException('Token manquant');

    const dl = await this.fileService.preparePublicDownload({ token, password: body.password });

    res.setHeader('Content-Type', dl.mimeType);
    res.setHeader('Content-Disposition', dl.contentDisposition);
    if (dl.sizeBytes !== undefined) {
      res.setHeader('Content-Length', String(dl.sizeBytes));
    }

    return new StreamableFile(fs.createReadStream(dl.streamPath));
  }
}
