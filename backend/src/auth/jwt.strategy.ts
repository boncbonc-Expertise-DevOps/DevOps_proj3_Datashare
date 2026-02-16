import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    console.log("JWT_SECRET loaded?", !!config.get("JWT_SECRET"));
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // Le ! ci dessous pour dire que je promets que ce n’est pas undefined - enlever erreur TypeScript
      secretOrKey: config.get<string>("JWT_SECRET")!,
    });
  }

  async validate(payload: any) {
    // Ce que tu retournes ici sera accessible via req.user
    return {
      userId: payload.sub,
      email: payload.email,
    };
  }
}
