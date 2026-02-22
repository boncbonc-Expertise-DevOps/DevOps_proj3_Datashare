import { BadRequestException } from '@nestjs/common';
import { FileController } from './file.controller';

function makeReq(userId?: any, extra: any = {}) {
  return { user: userId !== undefined ? { userId } : undefined, ...extra } as any;
}

describe('FileController (routes /api/files)', () => {
  const fileService = {
    listUserFiles: jest.fn(),
    deleteUserFile: jest.fn(),
    handleUpload: jest.fn(),
  } as any;

  let controller: FileController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new FileController(fileService);
  });

  describe('GET /api/files', () => {
    it('rejects when user is missing', async () => {
      await expect(controller.listFiles(makeReq(undefined), {} as any)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('calls service with numeric userId', async () => {
      fileService.listUserFiles.mockResolvedValueOnce({ items: [] });
      const query = { status: 'all', page: 1, pageSize: 20 } as any;

      const r = await controller.listFiles(makeReq('12'), query);
      expect(fileService.listUserFiles).toHaveBeenCalledWith({ userId: 12, query });
      expect(r).toEqual({ items: [] });
    });
  });

  describe('DELETE /api/files/:id', () => {
    it('rejects when user is missing', async () => {
      await expect(controller.deleteFile(makeReq(undefined), 1)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('calls service with fileId and userId', async () => {
      fileService.deleteUserFile.mockResolvedValueOnce(undefined);
      await controller.deleteFile(makeReq(7), 42);
      expect(fileService.deleteUserFile).toHaveBeenCalledWith({ userId: 7, fileId: 42 });
    });
  });

  describe('POST /api/files/upload', () => {
    it('rejects when user is missing', async () => {
      await expect(controller.uploadFile({} as any, makeReq(undefined), {})).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejects when file is missing (uses fileValidationError)', async () => {
      const req = makeReq(1, { fileValidationError: 'Type de fichier interdit' });
      await expect(controller.uploadFile(undefined as any, req, {})).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('calls service handleUpload when file is present', async () => {
      const req = makeReq(3);
      const file = { originalname: 'a.txt', mimetype: 'text/plain', size: 12 } as any;
      const body = { expiration_days: '7' } as any;

      fileService.handleUpload.mockResolvedValueOnce({ status: 'success' });
      const r = await controller.uploadFile(file, req, body);

      expect(fileService.handleUpload).toHaveBeenCalledWith({ userId: 3, file, body });
      expect(r).toEqual({ status: 'success' });
    });
  });
});
