import { Module } from '@nestjs/common';
import { ConfigModule } from "@nestjs/config";
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DbModule } from './db/db.module';
import { AuthModule } from './auth/auth.module';
import { FileModule } from './files/file.module';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // charge .env automatiquement
    DbModule, AuthModule, FileModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
