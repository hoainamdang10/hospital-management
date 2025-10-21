import { Request, Response, NextFunction } from 'express';
import { Logger } from '../../infrastructure/observability/Logger';

const logger = Logger.getInstance();

export function loggingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const correlationId = (req as any).correlationId || logger.generateCorrelationId();
  const startTime = Date.now();

  // Set correlation ID in logger context
  logger.setDefaultContext({ correlationId });

  // Log incoming request
  logger.debug('Incoming request', {
    correlationId,
    method: req.method,
    path: req.path,
    query: req.query,
    headers: {
      'user-agent': req.get('user-agent'),
      'content-type': req.get('content-type')
    },
    ip: req.ip
  });

  // Capture response
  const originalSend = res.send;
  res.send = function (data: any): Response {
    const duration = Date.now() - startTime;

    // Log response
    logger.debug('Outgoing response', {
      correlationId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      responseSize: data ? Buffer.byteLength(JSON.stringify(data)) : 0
    });

    return originalSend.call(this, data);
  };

  next();
}

