import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { FileService } from './file.service';

function makeFile(overrides: Partial<Express.Multer.File> = {}): Express.Multer.File {
  return {
    fieldname: 'file',
    originalname: 'demo.txt',
    encoding: '7bit',
    mimetype: 'text/plain',
    size: 12,
    destination: '',
    filename: '',
    path: '',
    buffer: Buffer.from('hello'),
    stream: undefined as any,
    ...overrides,
  } as Express.Multer.File;
}

describe('FileService core behaviors', () => {
  let service: FileService;
  const db = {
    query: jest.fn(),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    db.query.mockReset();
    service = new FileService(db);
  });

  describe('validateFile', () => {
    it('rejects missing file', async () => {
      await expect(service.validateFile(undefined as any, 1)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects too large file', async () => {
      const f = makeFile({ size: 1 * 1024 * 1024 * 1024 + 1 });
      await expect(service.validateFile(f, 1)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects forbidden extension', async () => {
      const f = makeFile({ originalname: 'virus.exe' });
      await expect(service.validateFile(f, 1)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects when quota reached', async () => {
      // count query
      db.query.mockResolvedValueOnce({ rows: [{ count: '10' }] });
      const f = makeFile();
      await expect(service.validateFile(f, 1)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects duplicate active filename', async () => {
      // count query
      db.query.mockResolvedValueOnce({ rows: [{ count: '0' }] });
      // duplicate query
      db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ '1': 1 }] });

      const f = makeFile({ originalname: 'same.txt' });
      await expect(service.validateFile(f, 1)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('accepts valid file', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ count: '0' }] });
      db.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });

      await expect(service.validateFile(makeFile(), 1)).resolves.toBeUndefined();
    });
  });

  describe('listUserFiles', () => {
    it('filters active (deleted_at null and expires_at > now)', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ total: '0' }] });
      db.query.mockResolvedValueOnce({ rows: [] });

      await service.listUserFiles({ userId: 1, query: { status: 'active', page: 1, pageSize: 20 } as any });

      const sql = String(db.query.mock.calls[0][0]);
      expect(sql).toContain('FROM files');

      const sqlList = String(db.query.mock.calls[1][0]);
      expect(sqlList).toContain('deleted_at IS NULL');
      expect(sqlList).toContain('expires_at > NOW()');
    });

    it('maps list rows to API shape', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ total: '1' }] });
      db.query.mockResolvedValueOnce({
        rows: [
          {
            id: '1',
            original_name: 'a.txt',
            size_bytes: '12',
            expires_at: new Date(Date.now() + 60_000).toISOString(),
            created_at: new Date().toISOString(),
            download_token: '5aa7275c-1c5c-4c02-aa54-61308c508f6f',
            is_protected: false,
            status: 'ACTIVE',
          },
        ],
      });

      const r = await service.listUserFiles({ userId: 1, query: { status: 'all', page: 1, pageSize: 20 } as any });
      expect(r.total).toBe(1);
      expect(r.items[0].downloadUrl).toContain('/download/');
      expect(r.items[0].token).toBe('5aa7275c-1c5c-4c02-aa54-61308c508f6f');
    });
  });

  describe('deleteUserFile', () => {
    const uploadDir = path.join(process.cwd(), 'uploads');

    afterEach(() => {
      try {
        const f = path.join(uploadDir, 'todelete.txt');
        if (fs.existsSync(f)) fs.unlinkSync(f);
      } catch {}
    });

    it('rejects invalid fileId', async () => {
      await expect(service.deleteUserFile({ userId: 1, fileId: 0 })).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects not owner', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id: '1', user_id: '2', storage_path: 'x', deleted_at: null }] });
      await expect(service.deleteUserFile({ userId: 1, fileId: 1 })).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejects already deleted', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id: '1', user_id: '1', storage_path: 'x', deleted_at: new Date().toISOString() }] });
      await expect(service.deleteUserFile({ userId: 1, fileId: 1 })).rejects.toBeInstanceOf(NotFoundException);
    });

    it('deletes file from disk and marks deleted_at', async () => {
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
      const diskPath = path.join(uploadDir, 'todelete.txt');
      fs.writeFileSync(diskPath, 'bye');

      db.query.mockResolvedValueOnce({ rows: [{ id: '1', user_id: '1', storage_path: diskPath, deleted_at: null }] });
      db.query.mockResolvedValueOnce({ rows: [] });

      await expect(service.deleteUserFile({ userId: 1, fileId: 1 })).resolves.toBeUndefined();
      expect(fs.existsSync(diskPath)).toBe(false);

      const updateSql = String(db.query.mock.calls[1][0]);
      expect(updateSql).toContain('UPDATE files');
    });
  });
});
