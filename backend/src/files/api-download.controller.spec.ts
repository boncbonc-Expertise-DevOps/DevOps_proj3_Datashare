import { BadRequestException, StreamableFile } from '@nestjs/common';
import * as fs from 'fs';
import { Readable } from 'stream';
import { ApiDownloadController } from './api-download.controller';

jest.mock('fs', () => {
  const actual = jest.requireActual('fs');
  return {
    ...actual,
    createReadStream: jest.fn(() => Readable.from(['hello'])),
  };
});

function makeRes() {
  return {
    setHeader: jest.fn(),
  } as any;
}

describe('ApiDownloadController (routes /api/download)', () => {
  const fileService = {
    getPublicFileMeta: jest.fn(),
    preparePublicDownload: jest.fn(),
  } as any;

  let controller: ApiDownloadController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new ApiDownloadController(fileService);
  });

  describe('GET /api/download/:token/meta', () => {
    it('rejects missing token', async () => {
      await expect(controller.getMeta('' as any)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('returns meta from service', async () => {
      fileService.getPublicFileMeta.mockResolvedValueOnce({ originalName: 'a.txt' });
      const r = await controller.getMeta('token');
      expect(fileService.getPublicFileMeta).toHaveBeenCalledWith({ token: 'token' });
      expect(r).toEqual({ originalName: 'a.txt' });
    });
  });

  describe('GET /api/download/:token', () => {
    it('rejects missing token', async () => {
      await expect(controller.downloadUnprotected('' as any, makeRes())).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('sets headers and returns StreamableFile', async () => {
      const fp = 'C:/tmp/dl-test-api.txt';
      fileService.preparePublicDownload.mockResolvedValueOnce({
        streamPath: fp,
        mimeType: 'text/plain',
        sizeBytes: 5,
        contentDisposition: 'attachment; filename="dl-test-api.txt"',
      });

      const res = makeRes();
      const r = await controller.downloadUnprotected('token', res);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/plain');
      expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', expect.stringContaining('attachment'));
      expect(res.setHeader).toHaveBeenCalledWith('Content-Length', '5');
      expect(r).toBeInstanceOf(StreamableFile);
      expect((fs as any).createReadStream).toHaveBeenCalledWith(fp);
    });
  });

  describe('POST /api/download/:token', () => {
    it('rejects missing token', async () => {
      await expect(
        controller.downloadProtected('' as any, { password: 'secret123' } as any, makeRes()),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('calls service with password, sets headers, returns StreamableFile', async () => {
      const fp = 'C:/tmp/dl-test-api.txt';
      fileService.preparePublicDownload.mockResolvedValueOnce({
        streamPath: fp,
        mimeType: 'text/plain',
        sizeBytes: 5,
        contentDisposition: 'attachment; filename="dl-test-api.txt"',
      });

      const res = makeRes();
      const r = await controller.downloadProtected(
        'token',
        { password: 'secret123' } as any,
        res,
      );

      expect(fileService.preparePublicDownload).toHaveBeenCalledWith({ token: 'token', password: 'secret123' });
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/plain');
      expect(r).toBeInstanceOf(StreamableFile);
      expect((fs as any).createReadStream).toHaveBeenCalledWith(fp);
    });
  });
});
