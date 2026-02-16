import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";

import { DbModule } from "../db/db.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

import { JwtStrategy } from "./jwt.strategy";


@Module({
  imports: [
    DbModule,

    // lit JWT_SECRET via ConfigService (donc via .env chargé par ConfigModule)
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>("JWT_SECRET");
        if (!secret) {
          // message clair au démarrage si .env mal configuré
          throw new Error("JWT_SECRET is missing. Add it to backend/.env");
        }
        return { secret };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
