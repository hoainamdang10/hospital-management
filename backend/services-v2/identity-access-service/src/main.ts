/**
 * Identity & Access Service Main Application
 * Production-ready Express server with Supabase integration
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Supabase Auth, Healthcare Security, Production Readiness
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

import { IdentityAccessContainer, IdentityAccessServiceConfig } from './infrastructure/di/identity-access.container';
import { AuthController } from './presentation/controllers/auth.controller';
import { RoleController } from './presentation/controllers/role.controller';
import { UserController } from './presentation/controllers/user.controller';
import { SupabaseAuthMiddleware } from '../../shared/infrastructure/middleware/supabase-auth.middleware';
import { IHealthCheck } from '../../shared/infrastructure/health/health-check.interface';
import { ConsoleLogger } from '../../shared/infrastructure/logging/console.logger';

// Configuration
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';
const SERVICE_NAME = 'identity-access-service';
const SERVICE_VERSION = '2.0.0';

/**
 * Identity & Access Service Application
 * Main application class with complete setup and lifecycle management
 */
class IdentityAccessServiceApplication {
  private app: Application;
  private server: any;
  private container: IdentityAccessContainer;
  private authMiddleware: SupabaseAuthMiddleware;
  private healthChecks: IHealthCheck[] = [];
  private logger = new ConsoleLogger('IdentityAccessApp');
  private isShuttingDown = false;

  constructor() {
    this.app = express();
    this.setupConfiguration();
  }

  /**
   * Setup service configuration
   */
  private setupConfiguration(): void {
    const config: IdentityAccessServiceConfig = {
      // Supabase
      supabase: {
        url: process.env.SUPABASE_URL || 'http://localhost:54321',
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
        anonKey: process.env.SUPABASE_ANON_KEY || '',
        jwtSecret: process.env.SUPABASE_JWT_SECRET || '',
        schema: process.env.SUPABASE_SCHEMA || 'auth_schema'
      },

      // Database
      database: {
        connectionPoolSize: parseInt(process.env.DB_POOL_SIZE || '10'),
        queryTimeout: parseInt(process.env.DB_QUERY_TIMEOUT || '30000'),
        enableQueryLogging: process.env.ENABLE_QUERY_LOGGING === 'true'
      },

      // Security
      security: {
        jwtSecret: process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET || '',
        corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
        rateLimiting: {
          windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
          maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
          skipSuccessfulRequests: true
        },
        requireEmailVerification: process.env.REQUIRE_EMAIL_VERIFICATION !== 'false',
        enableAuditLogging: process.env.ENABLE_AUDIT_LOGGING !== 'false'
      },

      // Cache
      cache: {
        type: (process.env.CACHE_TYPE as 'memory' | 'redis') || 'memory',
        redis: {
          url: process.env.REDIS_URL || 'redis://localhost:6379',
          keyPrefix: process.env.REDIS_KEY_PREFIX || 'identity:',
          defaultTtl: parseInt(process.env.REDIS_DEFAULT_TTL || '3600')
        },
        memory: {
          maxSize: parseInt(process.env.MEMORY_CACHE_MAX_SIZE || '1000'),
          ttl: parseInt(process.env.MEMORY_CACHE_TTL || '3600')
        }
      },

      // Monitoring
      monitoring: {
        enableMetrics: process.env.ENABLE_METRICS === 'true',
        metricsPort: parseInt(process.env.METRICS_PORT || '9091'),
        healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000'),
        enableDetailedHealthChecks: process.env.ENABLE_DETAILED_HEALTH_CHECKS !== 'false'
      },

      // External Services
      externalServices: {
        patientRegistryService: {
          baseUrl: process.env.PATIENT_REGISTRY_SERVICE_URL || 'http://localhost:3002',
          timeout: parseInt(process.env.PATIENT_REGISTRY_TIMEOUT || '10000')
        },
        providerStaffService: {
          baseUrl: process.env.PROVIDER_STAFF_SERVICE_URL || 'http://localhost:3003',
          timeout: parseInt(process.env.PROVIDER_STAFF_TIMEOUT || '10000')
        },
        schedulingService: {
          baseUrl: process.env.SCHEDULING_SERVICE_URL || 'http://localhost:3004',
          timeout: parseInt(process.env.SCHEDULING_TIMEOUT || '10000')
        }
      }
    };

    this.container = new IdentityAccessContainer(config);
  }

  /**
   * Initialize application
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing Identity & Access Service', {
        serviceName: SERVICE_NAME,
        version: SERVICE_VERSION,
        nodeEnv: NODE_ENV,
        port: PORT
      });

      // Initialize dependency injection container
      await this.container.initialize();

      // Setup authentication middleware
      this.setupAuthMiddleware();

      // Setup middleware
      this.setupMiddleware();

      // Setup routes
      this.setupRoutes();

      // Setup error handling
      this.setupErrorHandling();

      // Setup health checks
      this.setupHealthChecks();

      // Setup graceful shutdown
      this.setupGracefulShutdown();

      this.logger.info('Identity & Access Service initialized successfully');

    } catch (error) {
      this.logger.error('Failed to initialize Identity & Access Service', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Setup authentication middleware
   */
  private setupAuthMiddleware(): void {
    const supabaseClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        db: {
          schema: process.env.SUPABASE_SCHEMA || 'auth_schema'
        }
      }
    );

    this.authMiddleware = new SupabaseAuthMiddleware({
      supabaseClient,
      logger: this.logger,
      auditService: this.container.get('AuditService'),
      skipPaths: [
        '/health',
        '/health/detailed',
        '/metrics',
        '/info',
        '/auth/login',
        '/auth/register',
        '/auth/forgot-password',
        '/auth/reset-password',
        '/auth/verify-email'
      ],
      requireEmailVerification: process.env.REQUIRE_EMAIL_VERIFICATION !== 'false',
      enableAuditLogging: process.env.ENABLE_AUDIT_LOGGING !== 'false'
    });
  }

  /**
   * Setup middleware
   */
  private setupMiddleware(): void {
    this.logger.debug('Setting up middleware');

    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "https:"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"]
        }
      },
      crossOriginEmbedderPolicy: false
    }));

    // CORS configuration
    const corsOptions = {
      origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'];
        
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID', 'X-Request-ID']
    };

    this.app.use(cors(corsOptions));

    // Compression
    this.app.use(compression());

    // Cookie parser
    this.app.use(cookieParser());

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
      message: {
        success: false,
        message: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau',
        messageVietnamese: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau',
        code: 'RATE_LIMIT_EXCEEDED'
      },
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: true
    });

    this.app.use('/api/', limiter);

    // Request logging middleware
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      const correlationId = req.headers['x-correlation-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      req.headers['x-correlation-id'] = correlationId as string;

      res.on('finish', () => {
        const duration = Date.now() - startTime;
        this.logger.info('HTTP Request', {
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          duration,
          correlationId,
          userAgent: req.headers['user-agent'],
          ip: req.ip
        });
      });

      next();
    });

    this.logger.debug('Middleware setup completed');
  }

  /**
   * Setup routes
   */
  private setupRoutes(): void {
    this.logger.debug('Setting up routes');

    const authController = this.container.get<AuthController>('AuthController');
    const roleController = this.container.get<RoleController>('RoleController');
    const userController = this.container.get<UserController>('UserController');

    // Health check routes
    this.app.get('/health', this.handleHealthCheck.bind(this));
    this.app.get('/health/detailed', this.handleDetailedHealthCheck.bind(this));
    this.app.get('/metrics', this.handleMetrics.bind(this));

    // Service info
    this.app.get('/info', (req: Request, res: Response) => {
      res.json({
        serviceName: SERVICE_NAME,
        version: SERVICE_VERSION,
        environment: NODE_ENV,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        supabase: {
          url: process.env.SUPABASE_URL,
          schema: process.env.SUPABASE_SCHEMA
        },
        features: {
          emailVerificationRequired: process.env.REQUIRE_EMAIL_VERIFICATION !== 'false',
          auditLoggingEnabled: process.env.ENABLE_AUDIT_LOGGING !== 'false',
          metricsEnabled: process.env.ENABLE_METRICS === 'true'
        }
      });
    });

    // API routes
    const apiRouter = express.Router();

    // Authentication routes (public)
    apiRouter.post('/auth/login', AuthController.getLoginValidation(), authController.login.bind(authController));
    apiRouter.post('/auth/register', AuthController.getRegistrationValidation(), authController.register.bind(authController));
    apiRouter.post('/auth/forgot-password', authController.forgotPassword.bind(authController));
    apiRouter.post('/auth/reset-password', authController.resetPassword.bind(authController));
    apiRouter.post('/auth/verify-email', authController.verifyEmail.bind(authController));

    // Protected authentication routes
    apiRouter.post('/auth/logout', this.authMiddleware.authenticate(), authController.logout.bind(authController));
    apiRouter.post('/auth/refresh', authController.refreshToken.bind(authController));
    apiRouter.get('/auth/me', this.authMiddleware.authenticate(), authController.getCurrentUser.bind(authController));

    // Role management routes (admin only)
    const { requireRole } = this.authMiddleware.getMiddleware();
    apiRouter.get('/roles', this.authMiddleware.authenticate(), requireRole(['admin', 'receptionist']), roleController.getAllRoles.bind(roleController));
    apiRouter.get('/roles/statistics', this.authMiddleware.authenticate(), requireRole('admin'), roleController.getRoleStatistics.bind(roleController));
    apiRouter.get('/roles/:roleId', this.authMiddleware.authenticate(), RoleController.getRoleIdValidation(), roleController.getRoleById.bind(roleController));

    // User role assignment routes (admin only)
    apiRouter.post('/users/:userId/roles', this.authMiddleware.authenticate(), requireRole('admin'), RoleController.getAssignRoleValidation(), roleController.assignRoleToUser.bind(roleController));
    apiRouter.delete('/users/:userId/roles/:roleId', this.authMiddleware.authenticate(), requireRole('admin'), RoleController.getRemoveRoleValidation(), roleController.removeRoleFromUser.bind(roleController));
    apiRouter.get('/users/:userId/roles', this.authMiddleware.authenticate(), RoleController.getUserIdValidation(), roleController.getUserRoles.bind(roleController));

    // User management routes
    apiRouter.get('/users/profile', this.authMiddleware.authenticate(), userController.getOwnProfile.bind(userController));
    apiRouter.put('/users/profile', this.authMiddleware.authenticate(), userController.updateOwnProfile.bind(userController));
    apiRouter.get('/users', this.authMiddleware.authenticate(), requireRole(['admin', 'receptionist']), userController.getAllUsers.bind(userController));
    apiRouter.get('/users/:userId', this.authMiddleware.authenticate(), userController.getUserById.bind(userController));
    apiRouter.put('/users/:userId', this.authMiddleware.authenticate(), requireRole('admin'), userController.updateUser.bind(userController));
    apiRouter.delete('/users/:userId', this.authMiddleware.authenticate(), requireRole('admin'), userController.deactivateUser.bind(userController));

    this.app.use('/api/v1', apiRouter);

    // Root route
    this.app.get('/', (req: Request, res: Response) => {
      res.json({
        message: 'Identity & Access Service API',
        messageVietnamese: 'API Dịch vụ Xác thực & Phân quyền',
        version: SERVICE_VERSION,
        status: 'running',
        timestamp: new Date().toISOString(),
        endpoints: {
          health: '/health',
          info: '/info',
          api: '/api/v1',
          auth: '/api/v1/auth',
          roles: '/api/v1/roles',
          users: '/api/v1/users'
        },
        documentation: {
          swagger: '/api/v1/docs',
          postman: '/api/v1/postman'
        }
      });
    });

    this.logger.debug('Routes setup completed');
  }

  /**
   * Setup error handling
   */
  private setupErrorHandling(): void {
    this.logger.debug('Setting up error handling');

    // 404 handler
    this.app.use('*', (req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        message: 'Endpoint không tồn tại',
        messageVietnamese: 'Endpoint không tồn tại',
        code: 'ENDPOINT_NOT_FOUND',
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        method: req.method
      });
    });

    // Global error handler
    this.app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
      const correlationId = req.headers['x-correlation-id'];

      this.logger.error('Unhandled error', {
        error: error.message,
        stack: error.stack,
        correlationId,
        method: req.method,
        url: req.url
      });

      // Don't expose internal errors in production
      const isDevelopment = NODE_ENV === 'development';

      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống',
        messageVietnamese: 'Lỗi hệ thống',
        code: 'INTERNAL_SERVER_ERROR',
        timestamp: new Date().toISOString(),
        correlationId,
        ...(isDevelopment && {
          error: error.message,
          stack: error.stack
        })
      });
    });

    this.logger.debug('Error handling setup completed');
  }

  /**
   * Setup health checks
   */
  private setupHealthChecks(): void {
    this.logger.debug('Setting up health checks');

    this.healthChecks = this.container.getHealthChecks();

    // Start periodic health checks
    if (process.env.ENABLE_PERIODIC_HEALTH_CHECKS === 'true') {
      const interval = parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000');
      setInterval(async () => {
        await this.performHealthChecks();
      }, interval);
    }

    this.logger.debug('Health checks setup completed');
  }

  /**
   * Setup graceful shutdown
   */
  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      if (this.isShuttingDown) {
        this.logger.warn('Shutdown already in progress, forcing exit');
        process.exit(1);
      }

      this.isShuttingDown = true;
      this.logger.info(`Received ${signal}, starting graceful shutdown`);

      try {
        // Stop accepting new connections
        this.server.close(() => {
          this.logger.info('HTTP server closed');
        });

        // Cleanup container
        await this.container.cleanup();

        this.logger.info('Graceful shutdown completed');
        process.exit(0);

      } catch (error) {
        this.logger.error('Error during graceful shutdown', {
          error: error.message,
          stack: error.stack
        });
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      this.logger.error('Uncaught exception', {
        error: error.message,
        stack: error.stack
      });
      shutdown('UNCAUGHT_EXCEPTION');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error('Unhandled promise rejection', {
        reason,
        promise
      });
      shutdown('UNHANDLED_REJECTION');
    });
  }

  /**
   * Start the application
   */
  async start(): Promise<void> {
    try {
      await this.initialize();
      
      this.server = this.app.listen(PORT, () => {
        this.logger.info('Identity & Access Service started successfully', {
          serviceName: SERVICE_NAME,
          version: SERVICE_VERSION,
          port: PORT,
          environment: NODE_ENV,
          processId: process.pid,
          supabaseUrl: process.env.SUPABASE_URL,
          schema: process.env.SUPABASE_SCHEMA
        });
      });

    } catch (error) {
      this.logger.error('Failed to start Identity & Access Service', {
        error: error.message,
        stack: error.stack
      });
      process.exit(1);
    }
  }

  /**
   * Health check handlers
   */
  private async handleHealthCheck(req: Request, res: Response): Promise<void> {
    try {
      const results = await Promise.allSettled(
        this.healthChecks.map(check => check.check())
      );

      const healthResults = results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          return {
            name: this.healthChecks[index].getName(),
            status: 'unhealthy',
            message: 'Health check failed',
            error: result.reason?.message || 'Unknown error'
          };
        }
      });

      const allHealthy = healthResults.every(result => result.status === 'healthy');
      const statusCode = allHealthy ? 200 : 503;

      res.status(statusCode).json({
        status: allHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        service: SERVICE_NAME,
        version: SERVICE_VERSION,
        checks: healthResults
      });

    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        service: SERVICE_NAME,
        version: SERVICE_VERSION,
        error: error.message
      });
    }
  }

  private async handleDetailedHealthCheck(req: Request, res: Response): Promise<void> {
    try {
      const results = await Promise.allSettled(
        this.healthChecks.map(check => check.check())
      );

      const healthResults = results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          return {
            name: this.healthChecks[index].getName(),
            status: 'unhealthy',
            message: 'Health check failed',
            error: result.reason?.message || 'Unknown error'
          };
        }
      });

      const allHealthy = healthResults.every(result => result.status === 'healthy');
      const statusCode = allHealthy ? 200 : 503;

      res.status(statusCode).json({
        status: allHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        service: SERVICE_NAME,
        version: SERVICE_VERSION,
        environment: NODE_ENV,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        checks: healthResults,
        container: this.container.getStatistics()
      });

    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        service: SERVICE_NAME,
        version: SERVICE_VERSION,
        error: error.message
      });
    }
  }

  private async handleMetrics(req: Request, res: Response): Promise<void> {
    try {
      // Basic Prometheus-style metrics
      const metrics = [
        `# HELP identity_service_uptime_seconds Total uptime of the service`,
        `# TYPE identity_service_uptime_seconds counter`,
        `identity_service_uptime_seconds ${process.uptime()}`,
        '',
        `# HELP identity_service_memory_usage_bytes Memory usage in bytes`,
        `# TYPE identity_service_memory_usage_bytes gauge`,
        `identity_service_memory_usage_bytes{type="rss"} ${process.memoryUsage().rss}`,
        `identity_service_memory_usage_bytes{type="heapTotal"} ${process.memoryUsage().heapTotal}`,
        `identity_service_memory_usage_bytes{type="heapUsed"} ${process.memoryUsage().heapUsed}`,
        '',
        `# HELP identity_service_health_checks_total Total health checks performed`,
        `# TYPE identity_service_health_checks_total counter`,
        `identity_service_health_checks_total ${this.healthChecks.length}`
      ].join('\n');

      res.set('Content-Type', 'text/plain');
      res.send(metrics);

    } catch (error) {
      res.status(500).json({
        error: 'Failed to generate metrics',
        message: error.message
      });
    }
  }

  private async performHealthChecks(): Promise<void> {
    try {
      const results = await Promise.allSettled(
        this.healthChecks.map(check => check.check())
      );

      const unhealthyChecks = results
        .map((result, index) => ({ result, check: this.healthChecks[index] }))
        .filter(({ result }) => result.status === 'rejected' || 
          (result.status === 'fulfilled' && result.value.status !== 'healthy'));

      if (unhealthyChecks.length > 0) {
        this.logger.warn('Some health checks are failing', {
          unhealthyCount: unhealthyChecks.length,
          totalChecks: this.healthChecks.length,
          unhealthyChecks: unhealthyChecks.map(({ check }) => check.getName())
        });
      }

    } catch (error) {
      this.logger.error('Error performing periodic health checks', {
        error: error.message
      });
    }
  }
}

// Start the application
const app = new IdentityAccessServiceApplication();
app.start().catch((error) => {
  console.error('Failed to start Identity & Access Service:', error);
  process.exit(1);
});

export default app;
