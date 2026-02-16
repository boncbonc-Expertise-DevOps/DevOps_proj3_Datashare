import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { DbService } from "../db/db.service";

type PublicUser = { id: number; email: string };

@Injectable()
export class AuthService {
  constructor(private db: DbService) {}

  /**
   * Register: crée un user, password hashé.
   */
  async register(email: string, password: string): Promise<PublicUser> {
    const passwordHash = await bcrypt.hash(password, 10);

    try {
      const r = await this.db.query<PublicUser>(
        `INSERT INTO users (email, password_hash)
         VALUES ($1, $2)
         RETURNING id, email`,
        [email, passwordHash],
      );

      return r.rows[0];
    } catch (e: any) {
      // PostgreSQL unique violation -> 23505 (email déjà pris)
      if (e?.code === "23505") {
        throw new ConflictException({ message: "Email déjà utilisé", code: "EMAIL_EXISTS" });
      }
      throw e;
    }
  }

  /**
   * Validate user: vérifie email + password, renvoie user public si OK.
   */
  async validateUser(email: string, password: string): Promise<PublicUser> {
    const r = await this.db.query<{
      id: number;
      email: string;
      password_hash: string;
    }>(
      `SELECT id, email, password_hash
       FROM users
       WHERE email = $1`,
      [email],
    );

    const user = r.rows[0];
    if (!user) {
      throw new UnauthorizedException({ message: "Identifiants invalides", code: "UNAUTHORIZED" });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      throw new UnauthorizedException({ message: "Identifiants invalides", code: "UNAUTHORIZED" });
    }

    return { id: user.id, email: user.email };
  }
}
