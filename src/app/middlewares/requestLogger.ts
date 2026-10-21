import { NextFunction, Request, Response } from 'express';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  const time = new Date().toLocaleTimeString();

  // Route hit console log
  console.log(`\n🚀 [ROUTE HIT] ${req.method} ${req.originalUrl} at ${time}`);

  // Response outcome log on finish
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;

    if (status >= 200 && status < 400) {
      console.log(`✅ [SUCCESS ${status}] ${req.method} ${req.originalUrl} (took ${duration}ms)`);
    } else {
      console.log(`❌ [ERROR ${status}] ${req.method} ${req.originalUrl} (took ${duration}ms)`);
    }
  });

  next();
};

export default requestLogger;
