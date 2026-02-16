import { Body, Controller, Post, Get, UseGuards, Req } from "@nestjs/common";
import type { Request } from "express";
import { JwtService } from "@nestjs/jwt";
import { AuthService } from "./auth.service";
import type { SignOptions } from "jsonwebtoken";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { JwtAuthGuard } from "./jwt-auth.guard";

@Controller("api/auth")
export class AuthController {
  constructor(private auth: AuthService, private jwt: JwtService) {}

  // POST /api/auth/register
  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto.email, dto.password);
  }

  // POST /api/auth/login
  @Post("login")
  async login(@Body() dto: LoginDto) {
    const user = await this.auth.validateUser(dto.email, dto.password);

    // cast propre vers le type attendu par jsonwebtoken
    const expiresIn = (process.env.JWT_EXPIRES_IN ?? "3600s") as SignOptions["expiresIn"];
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, email: user.email },
      { expiresIn },
    );

    return { accessToken, user };
  }

  @Get("serge")
  @UseGuards(JwtAuthGuard)
    serge(@Req() req) {
    return req.user;
  }

}
