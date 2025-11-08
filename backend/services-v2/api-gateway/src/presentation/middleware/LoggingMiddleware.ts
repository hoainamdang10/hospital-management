import { Response, NextFunction } from 'express';
import { ILogger } from '@application/services/ILogger';
import { AuthenticatedRequest } from './AuthenticationMiddleware';
import { PerformanceMonitor } from '@infrastructure/monitoring/PerformanceMonitor';

export class LoggingMiddleware {
  constructor(
    private logger: ILogger,
    private performanceMonitor?: PerformanceMonitor
  ) {}

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

        // Record performance metric
        if (this.performanceMonitor) {
          this.performanceMonitor.recordRequest({
            timestamp: Date.now(),
            path: req.path,
            method: req.method,
            statusCode: res.statusCode,
            responseTime: duration,
            success: res.statusCode < 400
          });
        }
      });

      next();
    };
  }
}

