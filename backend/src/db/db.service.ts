import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Pool, QueryResult, QueryResultRow } from "pg";

@Injectable()
export class DbService implements OnModuleDestroy {
  private readonly pool: Pool;

  constructor(private config: ConfigService) {
    const host = this.config.get<string>("DB_HOST") || "localhost";
    const port = Number(this.config.get<string>("DB_PORT") || 5432);
    const user = this.config.get<string>("DB_USER") || "datashare";
    const password = this.config.get<string>("DB_PASSWORD") || "datashare";
    const database = this.config.get<string>("DB_NAME") || "datashare";
    // optionnel: utile si tu ajoutes SSL plus tard
    // ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined;

    // Debug temporaire : on peut le retirer après
    console.log("[DB CONFIG]", { host, port, user, database });

    this.pool = new Pool({ host, port, user, password, database });
  }

  /**
   * Exécute une requête SQL paramétrée.
   * text: "SELECT * FROM users WHERE email=$1"
   * params: ["a@b.com"]
   * T est garanti compatible avec pg
   */
  async query<T extends QueryResultRow = any>(
    text: string,
    params: any[] = [],
  ): Promise<QueryResult<T>> {
    try {
      return await this.pool.query<T>(text, params);
    } catch (e) {
      console.error("DB query error:", e); // donne l'erreur exacte
      throw e;
    }
  }

  // Ferme proprement le pool quand Nest s'arrête
  async onModuleDestroy() {
    await this.pool.end();
  }
}
