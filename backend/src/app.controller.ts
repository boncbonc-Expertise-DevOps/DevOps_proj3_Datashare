import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { DbService } from "./db/db.service";

@ApiTags('system')
@Controller()
export class AppController {
  constructor(private db: DbService) {}

  @Get("health")
  @ApiOperation({ summary: 'Healthcheck' })
  @ApiOkResponse({ description: 'DB connectivity OK' })
  async health() {
    const r = await this.db.query("SELECT 1 as ok");
    return { ok: r.rows[0].ok };
  }
}
