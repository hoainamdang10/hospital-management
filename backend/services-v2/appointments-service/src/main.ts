/**
 * Appointments Service - Main Entry Point
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @port 3024
 * @schema appointments_schema
 */

// Load environment variables first
import dotenv from 'dotenv';
dotenv.config();

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createAppointmentRoutes } from './presentation/routes/appointment.routes';
import { createAppointmentQueryRoutes } from './presentation/routes/appointmentQueryRoutes';
import { createAvailabilityRoutes } from './presentation/routes/availability.routes';
import { createQueueRoutes } from './presentation/routes/queue.routes';
import { getContainer } from './infrastructure/di/container';
import { idempotencyMiddleware } from './presentation/middleware/IdempotencyMiddleware';
import { redisCacheService } from './infrastructure/cache/RedisCacheService';
import {
  rateLimitMiddleware,
  sanitizeRequest,
  requestSizeLimitMiddleware,
  validateContentType,
} from './presentation/middleware/ValidationMiddleware';
import { getConfigSummary } from './infrastructure/config/ConfigValidator';
import { createLogger } from './infrastructure/logging/Logger';
import {
  requestLoggingMiddleware,
  errorLoggingMiddleware,
  performanceLoggingMiddleware,
} from './presentation/middleware/LoggingMiddleware';
import {
  metricsMiddleware,
  createMetricsHandler,
} from './presentation/middleware/MetricsMiddleware';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './infrastructure/swagger/swagger.config';

const app: Application = express();

// Initialize DI Container
console.log('[Main] Initializing DI Container...');
const container = getContainer();
const config = container.getConfig();
const healthCheckService = container.getHealthCheckService();
const metricsService = container.getMetricsService();
console.log('[Main] DI Container initialized successfully');

// Print configuration summary
console.log(getConfigSummary(config));

const PORT = config.port;
const SERVICE_NAME = config.serviceName;

// Initialize logger
const logger = createLogger(SERVICE_NAME, config.logging.level);

// Security Middleware - Order matters!
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net'],
      scriptSrc: ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net'],
      imgSrc: ["'self'", 'data:', 'https:', 'cdn.jsdelivr.net'],
      fontSrc: ["'self'", 'data:', 'cdn.jsdelivr.net'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = Array.isArray(config.cors.origin) 
      ? config.cors.origin 
      : [config.cors.origin];
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Idempotency-Key'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
}));

// Request logging (Morgan for basic HTTP logs)
if (config.logging.enableRequestLogging) {
  app.use(morgan('combined'));
}

// Metrics collection middleware
app.use(metricsMiddleware(metricsService));

// Structured logging middleware
if (config.logging.enableRequestLogging) {
  app.use(requestLoggingMiddleware(logger));
  app.use(performanceLoggingMiddleware(logger, 1000)); // Log requests > 1s
}

// Rate limiting - Apply globally (reads from env: RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS)
app.use(rateLimitMiddleware());

// Request size limit
app.use(requestSizeLimitMiddleware(10 * 1024 * 1024)); // 10MB

// Content type validation (for POST/PUT/PATCH)
app.use(validateContentType(['application/json']));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Sanitize all requests
app.use(sanitizeRequest);

// Connect Redis (best-effort)
redisCacheService.connect().catch(() => console.warn('[Main] Redis not connected, idempotency will be in fail-open mode'));

// Idempotency for write endpoints (applied per-route, not globally)

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoints
app.get('/health', async (req: Request, res: Response) => {
  try {
    const detailed = req.query.detailed === 'true' || config.healthCheck.enableDetailedCheck;
    const healthStatus = await healthCheckService.check(detailed);

    const statusCode = healthStatus.status === 'healthy' ? 200 :
                       healthStatus.status === 'degraded' ? 200 : 503;

    res.status(statusCode).json(healthStatus);
  } catch (error) {
    console.error('[Health] Health check failed:', error);
    res.status(503).json({
      service: SERVICE_NAME,
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Simple liveness probe
app.get('/health/live', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
});

// Readiness probe
app.get('/health/ready', async (req: Request, res: Response) => {
  try {
    const healthStatus = await healthCheckService.check(true);
    const isReady = healthStatus.status === 'healthy' || healthStatus.status === 'degraded';

    res.status(isReady ? 200 : 503).json({
      status: isReady ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
      checks: healthStatus.checks,
    });
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Metrics endpoint
app.get('/metrics', createMetricsHandler(metricsService));

// Swagger API Documentation
// Accessible at: http://localhost:3024/api-docs
app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Appointments Service API',
  customCss: '.swagger-ui .topbar { display: none }',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: true
  }
}));

// OpenAPI JSON spec
app.get('/api-docs/json', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

console.log('[Main] Swagger UI available at http://localhost:' + PORT + '/api-docs');

// API Routes
// V1 - Command routes (Write operations) + Legacy queries
app.use('/api/v1', createAppointmentRoutes());

// V2 - Query routes (Read Model with denormalized data)
app.use('/api/v2', createAppointmentQueryRoutes());

// Availability routes (Provider schedule & available slots)
app.use('/api/appointments', createAvailabilityRoutes());

// Queue routes (Queue management)
app.use('/api/queue', createQueueRoutes());

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
    },
    path: req.path,
    method: req.method,
    correlationId: req.correlationId,
    timestamp: new Date().toISOString()
  });
});

// Error logging middleware
if (config.logging.enableErrorTracking) {
  app.use(errorLoggingMiddleware(logger));
}

// Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', err, {
    correlationId: req.correlationId,
    method: req.method,
    path: req.path,
  });

  // Determine status code
  const statusCode = (err as any).statusCode || 500;
  const errorCode = (err as any).errorCode || 'INTERNAL_ERROR';

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: err.message || 'Internal server error',
      ...(config.nodeEnv === 'development' && { stack: err.stack }),
    },
    correlationId: req.correlationId,
    timestamp: new Date().toISOString()
  });
});

// Start server
const server = app.listen(PORT, async () => {
  console.log('='.repeat(60));
  console.log(`🏥 ${SERVICE_NAME.toUpperCase()}`);
  console.log('='.repeat(60));
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Environment: ${config.nodeEnv}`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
  console.log(`✅ Liveness probe: http://localhost:${PORT}/health/live`);
  console.log(`✅ Readiness probe: http://localhost:${PORT}/health/ready`);
  console.log('='.repeat(60));
  console.log('📋 API V1 - Command Endpoints (Write Model):');
  console.log(`   POST   /api/v1/appointments - Schedule appointment`);
  console.log(`   POST   /api/v1/appointments/:id/confirm - Confirm appointment`);
  console.log(`   POST   /api/v1/appointments/:id/complete - Complete appointment`);
  console.log(`   POST   /api/v1/appointments/:id/cancel - Cancel appointment`);
  console.log(`   GET    /api/v1/appointments/:id - Get appointment (legacy)`);
  console.log(`   GET    /api/v1/appointments - List appointments (legacy)`);
  console.log('='.repeat(60));
  console.log('📊 API V2 - Query Endpoints (Read Model with Patient/Doctor Info):');
  console.log(`   GET    /api/v2/appointments/:id - Get appointment details`);
  console.log(`   GET    /api/v2/appointments - List appointments with filters`);
  console.log(`   GET    /api/v2/patients/:patientId/appointments - Patient appointments`);
  console.log(`   GET    /api/v2/doctors/:doctorId/appointments - Doctor appointments`);
  console.log('='.repeat(60));

  // Connect event subscriptions
  try {
    logger.info('Connecting event subscriptions...');
    const eventSubscriptions = container.getEventSubscriptions();
    await eventSubscriptions.connect();
    logger.info('Event subscriptions connected successfully');
    
    // Update HealthCheckService with EventSubscriptions dependency
    container.updateHealthCheckDependencies();
    logger.info('Health check service updated with EventSubscriptions');
  } catch (error) {
    logger.error('Failed to connect event subscriptions', error as Error);
    logger.warn('Service will continue without event subscriptions');
  }

  // Start Outbox Publisher Worker
  try {
    const { OutboxRepository } = await import('./infrastructure/outbox/OutboxRepository');
    const { OutboxPublisherWorker } = await import('./infrastructure/outbox/OutboxPublisherWorker');
    const { RemoteSchedulerAdapter } = await import('./infrastructure/adapters/RemoteSchedulerAdapter');

    const outboxRepo = new OutboxRepository(config.supabase.url, config.supabase.serviceRoleKey);

    const scheduler = new RemoteSchedulerAdapter({
      baseUrl: config.services.schedulerServiceUrl,
      apiKey: config.services.schedulerApiKey,
      timeout: 5000
    });

    const worker = new OutboxPublisherWorker(outboxRepo, scheduler, {
      intervalMs: config.outbox.pollIntervalMs,
      batchSize: config.outbox.batchSize,
      baseDelayMs: config.outbox.baseDelayMs,
      maxDelayMs: config.outbox.maxDelayMs
    });
    worker.start();
    (app as any).outboxWorker = worker;
    logger.info('Outbox publisher worker started', undefined, {
      pollIntervalMs: config.outbox.pollIntervalMs,
      batchSize: config.outbox.batchSize,
    });
  } catch (e) {
    logger.error('Failed to start Outbox publisher worker', e as Error);
  }
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} signal received: initiating graceful shutdown`);

  // Disconnect event subscriptions
  try {
    const eventSubscriptions = container.getEventSubscriptions();
    await eventSubscriptions.disconnect();
    logger.info('Event subscriptions disconnected');
  } catch (error) {
    logger.error('Failed to disconnect event subscriptions', error as Error);
  }

  // Stop outbox worker
  try {
    const worker = (app as any).outboxWorker as { stop: () => void } | undefined;
    if (worker) {
      worker.stop();
      logger.info('Outbox worker stopped');
    }
  } catch (error) {
    logger.error('Failed to stop outbox worker', error as Error);
  }

  // Close HTTP server
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;

