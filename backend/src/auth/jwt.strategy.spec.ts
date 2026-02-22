import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  it('validate maps jwt payload to user object', async () => {
    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'JWT_SECRET') return 'test-secret';
        return undefined;
      }),
    } as any;

    const strategy = new JwtStrategy(configService);

    const user = await strategy.validate({ sub: 'user-123', email: 'a@b.c' } as any);
    expect(user).toEqual({ userId: 'user-123', email: 'a@b.c' });
  });
});
