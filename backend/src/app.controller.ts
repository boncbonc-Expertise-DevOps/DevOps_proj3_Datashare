import { Controller, Get } from "@nestjs/common";
import { DbService } from "./db/db.service";

@Controller()
export class AppController {
  constructor(private db: DbService) {}

  @Get("health")
  async health() {
    const r = await this.db.query("SELECT 1 as ok");
    return { ok: r.rows[0].ok };
  }
}
