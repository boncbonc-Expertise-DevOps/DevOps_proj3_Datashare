import { Test, TestingModule } from '@nestjs/testing';
import { DbService } from './db.service';
import { ConfigService } from '@nestjs/config';

jest.mock('pg', () => {
  return {
    Pool: jest.fn().mockImplementation(() => ({
      query: jest.fn().mockResolvedValue({ rows: [] }),
      end: jest.fn().mockResolvedValue(undefined),
    })),
  };
});

describe('DbService', () => {
  let service: DbService;

  const config = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [{ provide: ConfigService, useValue: config }, DbService],
    }).compile();

    service = module.get<DbService>(DbService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
