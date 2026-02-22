import { AppModule } from './app.module';
import { AuthModule } from './auth/auth.module';
import { DbModule } from './db/db.module';
import { FileModule } from './files/file.module';

describe('Modules (smoke)', () => {
  it('imports without crashing', () => {
    expect(AppModule).toBeDefined();
    expect(AuthModule).toBeDefined();
    expect(DbModule).toBeDefined();
    expect(FileModule).toBeDefined();
  });
});
