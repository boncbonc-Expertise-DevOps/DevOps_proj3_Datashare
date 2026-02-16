import { Module } from '@nestjs/common';
import { ConfigModule } from "@nestjs/config";
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DbModule } from './db/db.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // charge .env automatiquement
    DbModule, AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
