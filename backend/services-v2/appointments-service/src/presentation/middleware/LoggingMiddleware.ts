/**
 * Logging Middleware
 * Adds correlation IDs and structured logging to requests
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 */

import { Request, Response, NextFunction } from 'express';
import { Logger, generateCorrelationId, LogContext } from '../../infrastructure/logging/Logger';

// Extend Express Request to include logger and correlation ID
declare global {
  namespace Express {
    interface Request {
      logger?: Logger;
      correlationId?: string;
    }
  }
}

/**
 * Request logging middleware
 */
export function requestLoggingMiddleware(logger: Logger) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Generate or extract correlation ID
    const correlationId = (req.headers['x-correlation-id'] as string) || generateCorrelationId();
    req.correlationId = correlationId;

    // Add correlation ID to response headers
    res.setHeader('X-Correlation-ID', correlationId);

    // Create child logger with correlation ID
    const context: LogContext = {
      correlationId,
      requestId: correlationId,
      method: req.method,
      path: req.path,
      ip: req.ip,
    };

    // Extract user ID from auth header if available
    const authHeader = req.headers.authorization;
    if (authHeader) {
      try {
        // In a real implementation, decode JWT to get user ID
        // For now, just log that auth is present
        context.authenticated = true;
      } catch (error) {
        // Invalid token
      }
    }

    req.logger = logger.child(context);

    // Log request
    req.logger.info('Incoming request', context, {
      headers: sanitizeHeaders(req.headers),
      query: req.query,
      body: sanitizeBody(req.body),
    });

    // Capture response
    const startTime = Date.now();
    const originalSend = res.send;

    res.send = function (data: any): Response {
      const duration = Date.now() - startTime;

      // Log response
      req.logger?.info('Outgoing response', context, {
        statusCode: res.statusCode,
        duration,
        contentLength: res.get('content-length'),
      });

      return originalSend.call(this, data);
    };

    next();
  };
}

/**
 * Error logging middleware
 */
export function errorLoggingMiddleware(logger: Logger) {
  return (err: Error, req: Request, res: Response, next: NextFunction): void => {
    const context: LogContext = {
      correlationId: req.correlationId,
      method: req.method,
      path: req.path,
      ip: req.ip,
    };

    // Log error
    logger.error('Request error', err, context, {
      headers: sanitizeHeaders(req.headers),
      query: req.query,
      body: sanitizeBody(req.body),
    });

    next(err);
  };
}

/**
 * Sanitize headers (remove sensitive data)
 */
function sanitizeHeaders(headers: any): any {
  const sanitized = { ...headers };
  
  // Remove sensitive headers
  const sensitiveHeaders = [
    'authorization',
    'cookie',
    'x-api-key',
    'x-auth-token',
  ];

  for (const header of sensitiveHeaders) {
    if (sanitized[header]) {
      sanitized[header] = '***';
    }
  }

  return sanitized;
}

/**
 * Sanitize request body (remove sensitive data)
 */
function sanitizeBody(body: any): any {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const sanitized = { ...body };

  // Remove sensitive fields
  const sensitiveFields = [
    'password',
    'token',
    'secret',
    'apiKey',
    'creditCard',
    'ssn',
  ];

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '***';
    }
  }

  return sanitized;
}

/**
 * Performance logging middleware
 */
export function performanceLoggingMiddleware(logger: Logger, thresholdMs: number = 1000) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - startTime;

      // Log slow requests
      if (duration > thresholdMs) {
        const context: LogContext = {
          correlationId: req.correlationId,
          method: req.method,
          path: req.path,
        };

        logger.warn('Slow request detected', context, {
          duration,
          threshold: thresholdMs,
          statusCode: res.statusCode,
        });
      }
    });

    next();
  };
}

