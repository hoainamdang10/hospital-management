import { Response, NextFunction } from 'express';
import { ILogger } from '@application/services/ILogger';
import { AuthenticatedRequest } from './AuthenticationMiddleware';

export class LoggingMiddleware {
  constructor(private logger: ILogger) {}

  logRequests() {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      const startTime = Date.now();

      this.logger.info('Incoming request', {
        requestId: req.requestId,
        method: req.method,
        path: req.path,
        query: req.query,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        userId: req.user?.userId
      });

      res.on('finish', () => {
        const duration = Date.now() - startTime;

        const logLevel = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

        this.logger[logLevel]('Outgoing response', {
          requestId: req.requestId,
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration: `${duration}ms`,
          userId: req.user?.userId
        });
      });

      next();
    };
  }
}

