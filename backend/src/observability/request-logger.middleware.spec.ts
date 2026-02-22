import { requestLoggerMiddleware } from './request-logger.middleware';

describe('RequestLoggerMiddleware', () => {
  it('logs a JSON line on response finish', () => {
    const finishHandlers: Array<() => void> = [];

    const req: any = {
      method: 'GET',
      originalUrl: '/api/health',
    };

    const res: any = {
      statusCode: 200,
      on: (event: string, handler: () => void) => {
        if (event === 'finish') finishHandlers.push(handler);
      },
    };

    const next = jest.fn();

    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    try {
      requestLoggerMiddleware(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);

      expect(finishHandlers).toHaveLength(1);
      finishHandlers[0]();

      expect(logSpy).toHaveBeenCalledTimes(1);
      const payload = JSON.parse(String(logSpy.mock.calls[0][0]));
      expect(payload).toEqual(
        expect.objectContaining({
          method: 'GET',
          path: '/api/health',
          status: 200,
        }),
      );
      expect(typeof payload.durationMs).toBe('number');
    } finally {
      logSpy.mockRestore();
    }
  });
});
