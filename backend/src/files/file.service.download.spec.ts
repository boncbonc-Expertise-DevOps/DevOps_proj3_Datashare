import {
  GoneException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';
import { FileService } from './file.service';

jest.mock('bcryptjs', () => {
  const actual = jest.requireActual('bcryptjs');
  return {
    ...actual,
    compare: jest.fn(),
  };
});

function uuid() {
  return '5aa7275c-1c5c-4c02-aa54-61308c508f6f';
}

function rowBase(overrides: Partial<any> = {}) {
  return {
    original_name: 'demo.txt',
    mime_type: 'text/plain',
    size_bytes: '12',
    storage_path: 'demo.txt',
    download_token: uuid(),
    password_hash: null,
    expires_at: new Date(Date.now() + 60_000).toISOString(),
    deleted_at: null,
    ...overrides,
  };
}

describe('FileService public download', () => {
  let service: FileService;
  const db = {
    query: jest.fn(),
  } as any;

  const mockCompare = bcrypt.compare as unknown as jest.Mock;

  const uploadDir = path.join(process.cwd(), 'uploads');

  beforeEach(() => {
    jest.clearAllMocks();
    db.query.mockReset();
    service = new FileService(db);
  });

  afterEach(() => {
    try {
      const f = path.join(uploadDir, 'ok.txt');
      if (fs.existsSync(f)) fs.unlinkSync(f);
    } catch {}
  });

  it('getPublicFileMeta returns public metadata', async () => {
    db.query.mockResolvedValueOnce({ rows: [rowBase({ password_hash: 'hash' })] });

    const meta = await service.getPublicFileMeta({ token: uuid() });
    expect(meta.token).toBe(uuid());
    expect(meta.originalName).toBe('demo.txt');
    expect(meta.isProtected).toBe(true);
  });

  it('preparePublicDownload rejects non-uuid token (404)', async () => {
    await expect(service.preparePublicDownload({ token: 'not-a-uuid' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('preparePublicDownload rejects missing token row (404)', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    await expect(service.preparePublicDownload({ token: uuid() })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('preparePublicDownload rejects deleted file (410)', async () => {
    db.query.mockResolvedValueOnce({ rows: [rowBase({ deleted_at: new Date().toISOString() })] });
    await expect(service.preparePublicDownload({ token: uuid() })).rejects.toBeInstanceOf(GoneException);
  });

  it('preparePublicDownload rejects expired file (410)', async () => {
    db.query.mockResolvedValueOnce({ rows: [rowBase({ expires_at: new Date(Date.now() - 1).toISOString() })] });
    await expect(service.preparePublicDownload({ token: uuid() })).rejects.toBeInstanceOf(GoneException);
  });

  it('preparePublicDownload requires password when protected (401)', async () => {
    db.query.mockResolvedValueOnce({ rows: [rowBase({ password_hash: 'hash' })] });
    await expect(service.preparePublicDownload({ token: uuid() })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('preparePublicDownload rejects wrong password (401)', async () => {
    db.query.mockResolvedValueOnce({ rows: [rowBase({ password_hash: 'hash' })] });
    mockCompare.mockImplementationOnce(async () => false);

    await expect(service.preparePublicDownload({ token: uuid(), password: 'badpass' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('preparePublicDownload returns stream info on correct password', async () => {
    // create a real file so existsSync succeeds without mocking fs
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, 'ok.txt');
    fs.writeFileSync(filePath, 'hello');

    db.query.mockResolvedValueOnce({ rows: [rowBase({ password_hash: 'hash', storage_path: 'ok.txt' })] });
    mockCompare.mockImplementationOnce(async () => true);

    const dl = await service.preparePublicDownload({ token: uuid(), password: 'goodpass' });
    expect(typeof dl.streamPath).toBe('string');
    expect(dl.mimeType).toBe('text/plain');
    expect(dl.contentDisposition).toContain('attachment');
    expect(path.resolve(dl.streamPath)).toBe(path.resolve(filePath));
  });

  it('preparePublicDownload rejects path traversal (410)', async () => {
    db.query.mockResolvedValueOnce({ rows: [rowBase({ storage_path: '../secret.txt' })] });
    await expect(service.preparePublicDownload({ token: uuid() })).rejects.toBeInstanceOf(GoneException);
  });
});
