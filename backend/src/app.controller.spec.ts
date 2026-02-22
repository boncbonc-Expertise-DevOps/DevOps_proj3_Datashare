import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { DbService } from './db/db.service';

describe('AppController', () => {
  let appController: AppController;
  const db = {
    query: jest.fn(),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{ provide: DbService, useValue: db }],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  it('health returns ok=1', async () => {
    db.query.mockResolvedValue({ rows: [{ ok: 1 }] });
    await expect(appController.health()).resolves.toEqual({ ok: 1 });
  });
});
