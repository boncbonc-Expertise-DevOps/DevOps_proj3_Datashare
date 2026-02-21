import { Module } from '@nestjs/common';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { DbService } from '../db/db.service';

@Module({
  controllers: [FileController],
  providers: [FileService, DbService],
  exports: [FileService]
})
export class FileModule {}
