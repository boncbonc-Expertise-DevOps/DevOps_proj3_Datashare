import type { NextFunction, Request, Response } from 'express';

export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - start;

    // Log volontairement minimal: pas de headers, pas de body (évite tokens / mots de passe)
    const line = {
      ts: new Date().toISOString(),
      level: 'info',
      msg: 'http_request',
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs,
    };

    // eslint-disable-next-line no-console
    console.log(JSON.stringify(line));
  });

  next();
}
