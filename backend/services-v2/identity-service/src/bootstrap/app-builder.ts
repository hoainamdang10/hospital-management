/**
 * Express Application Builder
 * Constructs Express application with all middleware configured
 * 
 * Features:
 * - Security middleware (Helmet, CORS, Rate Limiting)
 * - Request tracing (Request ID, Logging)
 * - Idempotency middleware for write operations
 * - Metrics authentication
 * - Error handling
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Production-Ready, HIPAA-Compliant
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import { ILogger } from '../application/services/ILogger';
import { ICacheService } from '../application/services/ICacheService';
import { AppConfig } from './config';
import { createRequestIdMiddleware } from '../presentation/middleware/RequestIdMiddleware';
import { createIdempotencyMiddleware } from '../presentation/middleware/IdempotencyMiddleware';
import { createMetricsAuthMiddleware } from '../presentation/middleware/MetricsAuthMiddleware';

/**
 * Build Express application with all middleware
 * 
 * @param config Application configuration
 * @param logger Logger instance
 * @param cacheService Cache service for idempotency (optional)
 * @returns Configured Express application
 */
export function buildExpressApp(
  config: AppConfig,
  logger: ILogger,
  cacheService: ICacheService | null = null
): Application {
  const app = express();

  // 1. Basic middleware
  setupBasicMiddleware(app, logger);

  // 2. Security middleware
  setupSecurityMiddleware(app, config, logger);

  // 3. Request tracing
  setupRequestTracing(app, logger);

  // 4. Idempotency middleware (for write operations)
  if (cacheService) {
    setupIdempotencyMiddleware(app, cacheService, logger);
  }

  // 5. Request logging
  setupRequestLogging(app, logger);

  // 6. Error handling (must be last)
  setupErrorHandling(app, logger);

  logger.info('Express application built successfully', {
    middleware: [
      'body-parser',
      'compression',
      'cors',
      'helmet',
      'rate-limiting',
      'request-id',
      cacheService ? 'idempotency' : null,
      'request-logging',
      'error-handling'
    ].filter(Boolean)
  });

  return app;
}

/**
 * Setup basic middleware (body parsing, compression)
 */
function setupBasicMiddleware(app: Application, logger: ILogger): void {
  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Compression
  app.use(compression());

  logger.debug('Basic middleware configured');
}

/**
 * Setup security middleware (CORS, Helmet, Rate Limiting)
 */
function setupSecurityMiddleware(
  app: Application,
  config: AppConfig,
  logger: ILogger
): void {
  // CORS
  app.use(cors({
    origin: config.allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id', 'x-idempotency-key']
  }));

  // Helmet for security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:']
      }
    }
  }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false
  });
  app.use(limiter);

  logger.debug('Security middleware configured', {
    allowedOrigins: config.allowedOrigins,
    rateLimitWindow: '15 minutes',
    rateLimitMax: 100
  });
}

/**
 * Setup request tracing (Request ID)
 */
function setupRequestTracing(app: Application, logger: ILogger): void {
  app.use(createRequestIdMiddleware(logger));
  logger.debug('Request tracing configured');
}

/**
 * Setup idempotency middleware
 */
function setupIdempotencyMiddleware(
  app: Application,
  cacheService: ICacheService,
  logger: ILogger
): void {
  const idempotencyMiddleware = createIdempotencyMiddleware(cacheService as any);
  
  // Apply to write operations only
  app.use((req, res, next) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      idempotencyMiddleware(req, res, next);
      return;
    }
    next();
  });

  logger.debug('Idempotency middleware configured');
}

/**
 * Setup request logging
 */
function setupRequestLogging(app: Application, logger: ILogger): void {
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      const requestLogger = (req as any).logger || logger;

      requestLogger.info('HTTP Request', {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        userAgent: req.headers['user-agent'],
        requestId: (req as any).requestId
      });
    });

    next();
  });

  logger.debug('Request logging configured');
}

/**
 * Setup error handling middleware
 */
function setupErrorHandling(app: Application, logger: ILogger): void {
  // 404 handler
  app.use((req: Request, res: Response) => {
    logger.warn('Route not found', {
      method: req.method,
      path: req.path,
      requestId: (req as any).requestId
    });

    res.status(404).json({
      error: 'Not Found',
      message: `Route ${req.method} ${req.path} not found`,
      requestId: (req as any).requestId
    });
  });

  // Global error handler
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
    logger.error('Unhandled error', {
      error: err.message,
      stack: err.stack,
      method: req.method,
      path: req.path,
      requestId: (req as any).requestId
    });

    res.status(500).json({
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : err.message,
      requestId: (req as any).requestId
    });
  });

  logger.debug('Error handling configured');
}

/**
 * Create metrics authentication middleware
 * 
 * @param config Application configuration
 * @param logger Logger instance
 * @returns Metrics auth middleware
 */
export function createMetricsAuth(config: AppConfig, logger: ILogger) {
  return createMetricsAuthMiddleware({
    enabled: config.metricsAuthEnabled,
    authToken: config.metricsAuthToken,
    allowedIPs: ['127.0.0.1', '::1', '::ffff:127.0.0.1'] // localhost
  }, logger);
}
