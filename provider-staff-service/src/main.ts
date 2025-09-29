/**
 * Provider Staff Service Main Entry Point
 * Healthcare provider and staff management service
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Healthcare Standards, Vietnamese Compliance
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { ProviderStaffContainer, ProviderStaffContainerConfig } from './infrastructure/di/provider-staff.container';
import { DoctorController } from './presentation/controllers/doctor.controller';

// Shared services (would be imported from shared module)
import { ConsoleLogger } from '../shared/infrastructure/logging/console-logger';
import { InMemoryEventPublisher } from '../shared/infrastructure/events/in-memory-event-publisher';
import { MockAuthorizationService } from '../shared/application/services/mock-authorization.service';
import { MockAuditService } from '../shared/application/services/mock-audit.service';
import { InMemoryCacheService } from '../shared/infrastructure/caching/in-memory-cache.service';

export interface ProviderStaffServiceConfig {
  port: number;
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  schema: string;
  corsOrigins: string[];
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  logLevel: string;
}

export class ProviderStaffService {
  private app: express.Application;
  private container: ProviderStaffContainer;
  private config: ProviderStaffServiceConfig;
  private server: any;

  constructor(config: ProviderStaffServiceConfig) {
    this.config = config;
    this.app = express();
    this.setupContainer();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * Setup dependency injection container
   */
  private setupContainer(): void {
    const logger = new ConsoleLogger(this.config.logLevel);
    
    const containerConfig: ProviderStaffContainerConfig = {
      supabaseUrl: this.config.supabaseUrl,
      supabaseServiceRoleKey: this.config.supabaseServiceRoleKey,
      schema: this.config.schema,
      logger,
      eventPublisher: new InMemoryEventPublisher(logger),
      authorizationService: new MockAuthorizationService(logger),
      auditService: new MockAuditService(logger),
      cacheService: new InMemoryCacheService(logger)
    };

    this.container = new ProviderStaffContainer(containerConfig);
  }

  /**
   * Setup Express middleware
   */
  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    }));

    // CORS
    this.app.use(cors({
      origin: this.config.corsOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID', 'X-User-ID']
    }));

    // Compression
    this.app.use(compression());

    // Rate limiting
    const limiter = rateLimit({
      windowMs: this.config.rateLimitWindowMs,
      max: this.config.rateLimitMaxRequests,
      message: {
        error: 'TOO_MANY_REQUESTS',
        message: 'Quá nhiều yêu cầu, vui lòng thử lại sau',
        retryAfter: Math.ceil(this.config.rateLimitWindowMs / 1000)
      },
      standardHeaders: true,
      legacyHeaders: false
    });

    this.app.use('/api/', limiter);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use((req, res, next) => {
      const logger = this.container.resolve('Logger');
      const correlationId = req.headers['x-correlation-id'] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const userId = req.headers['x-user-id'] as string;

      req.correlationId = correlationId;
      req.userId = userId;

      logger.info('HTTP Request', {
        method: req.method,
        url: req.url,
        correlationId,
        userId,
        userAgent: req.headers['user-agent'],
        ip: req.ip
      });

      const startTime = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        logger.info('HTTP Response', {
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          duration,
          correlationId,
          userId
        });
      });

      next();
    });
  }

  /**
   * Setup API routes
   */
  private setupRoutes(): void {
    const doctorController = this.container.getDoctorController();

    // Health check
    this.app.get('/health', async (req, res) => {
      try {
        const health = await this.container.healthCheck();
        const statusCode = health.status === 'healthy' ? 200 : 503;
        
        res.status(statusCode).json({
          status: health.status,
          service: 'provider-staff-service',
          version: '2.0.0',
          timestamp: new Date().toISOString(),
          details: health.details
        });
      } catch (error) {
        res.status(503).json({
          status: 'unhealthy',
          service: 'provider-staff-service',
          version: '2.0.0',
          timestamp: new Date().toISOString(),
          error: error.message
        });
      }
    });

    // Metrics endpoint
    this.app.get('/metrics', (req, res) => {
      const metrics = this.container.getMetrics();
      res.json({
        service: 'provider-staff-service',
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        metrics
      });
    });

    // API routes
    const apiRouter = express.Router();

    // Doctor routes
    apiRouter.post('/doctors', (req, res) => doctorController.registerDoctor(req, res));
    apiRouter.get('/doctors/statistics', (req, res) => doctorController.getDoctorStatistics(req, res));
    apiRouter.get('/doctors/:doctorId', (req, res) => doctorController.getDoctorById(req, res));
    apiRouter.get('/doctors/:doctorId/availability', (req, res) => doctorController.checkDoctorAvailability(req, res));
    apiRouter.get('/doctors', (req, res) => doctorController.searchDoctors(req, res));
    apiRouter.put('/doctors/:doctorId', (req, res) => doctorController.updateDoctor(req, res));
    apiRouter.delete('/doctors/:doctorId', (req, res) => doctorController.deleteDoctor(req, res));

    this.app.use('/api/v1', apiRouter);

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        service: 'provider-staff-service',
        version: '2.0.0',
        description: 'Healthcare Provider and Staff Management Service',
        documentation: '/api/v1/docs',
        health: '/health',
        metrics: '/metrics',
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * Setup error handling
   */
  private setupErrorHandling(): void {
    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Endpoint không tồn tại',
        path: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString()
      });
    });

    // Global error handler
    this.app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      const logger = this.container.resolve('Logger');
      
      logger.error('Unhandled error', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        correlationId: req.correlationId,
        userId: req.userId
      });

      // Don't expose internal errors in production
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      res.status(error.status || 500).json({
        error: 'INTERNAL_ERROR',
        message: 'Lỗi hệ thống, vui lòng thử lại sau',
        correlationId: req.correlationId,
        timestamp: new Date().toISOString(),
        ...(isDevelopment && {
          details: error.message,
          stack: error.stack
        })
      });
    });
  }

  /**
   * Start the service
   */
  public async start(): Promise<void> {
    try {
      const logger = this.container.resolve('Logger');
      
      // Initialize container
      await this.container.initialize();

      // Start HTTP server
      this.server = this.app.listen(this.config.port, () => {
        logger.info('Provider Staff Service started successfully', {
          port: this.config.port,
          schema: this.config.schema,
          environment: process.env.NODE_ENV || 'development',
          version: '2.0.0'
        });
      });

      // Graceful shutdown handling
      process.on('SIGTERM', () => this.shutdown());
      process.on('SIGINT', () => this.shutdown());

    } catch (error) {
      const logger = this.container.resolve('Logger');
      logger.error('Failed to start Provider Staff Service', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Stop the service
   */
  public async shutdown(): Promise<void> {
    try {
      const logger = this.container.resolve('Logger');
      logger.info('Shutting down Provider Staff Service...');

      // Close HTTP server
      if (this.server) {
        await new Promise<void>((resolve) => {
          this.server.close(() => {
            logger.info('HTTP server closed');
            resolve();
          });
        });
      }

      // Shutdown container
      await this.container.shutdown();

      logger.info('Provider Staff Service shutdown completed');
      process.exit(0);

    } catch (error) {
      const logger = this.container.resolve('Logger');
      logger.error('Error during shutdown', {
        error: error.message
      });
      process.exit(1);
    }
  }
}

/**
 * Bootstrap the service
 */
async function bootstrap() {
  try {
    // Load configuration from environment variables
    const config: ProviderStaffServiceConfig = {
      port: parseInt(process.env.PORT || '3002'),
      supabaseUrl: process.env.SUPABASE_URL || 'http://localhost:54321',
      supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key',
      schema: process.env.DATABASE_SCHEMA || 'provider_schema',
      corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
      rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
      rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
      logLevel: process.env.LOG_LEVEL || 'info'
    };

    // Validate required configuration
    if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
      throw new Error('Missing required Supabase configuration');
    }

    // Create and start service
    const service = new ProviderStaffService(config);
    await service.start();

  } catch (error) {
    console.error('Failed to bootstrap Provider Staff Service:', error);
    process.exit(1);
  }
}

// Start the service if this file is run directly
if (require.main === module) {
  bootstrap();
}

export { ProviderStaffService };

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
      userId?: string;
    }
  }
}
