import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';
import * as fs from 'fs';
import { FileService } from './file.service';
import { DownloadPasswordDto } from './dto/download-password.dto';
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

@ApiTags('download')
@Controller('api/download')
export class ApiDownloadController {
  constructor(private readonly fileService: FileService) {}

  @Get(':token/meta')
  @ApiOperation({ summary: 'Get download metadata (API variant)' })
  @ApiParam({ name: 'token', description: 'Download token (UUID)' })
  async getMeta(@Param('token') token: string) {
    if (!token) throw new BadRequestException('Token manquant');
    return await this.fileService.getPublicFileMeta({ token });
  }

  @Get(':token')
  @ApiOperation({ summary: 'Download file (API variant)' })
  @ApiParam({ name: 'token', description: 'Download token (UUID)' })
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
  @ApiOperation({ summary: 'Download protected file with password (API variant)' })
  @ApiParam({ name: 'token', description: 'Download token (UUID)' })
  @ApiBody({ type: DownloadPasswordDto })
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
