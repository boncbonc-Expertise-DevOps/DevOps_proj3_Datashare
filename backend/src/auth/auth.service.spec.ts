import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { DbService } from '../db/db.service';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;

  const db = {
    query: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [{ provide: DbService, useValue: db }, AuthService],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('validateUser throws when user not found', async () => {
    db.query.mockResolvedValue({ rows: [] });
    await expect(service.validateUser('a@b.com', 'Password123!')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
