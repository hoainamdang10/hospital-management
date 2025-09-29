/**
 * Scheduling Service Main Application
 * Express server bootstrap with production-ready configuration
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Production Readiness, Security, Healthcare Standards
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { config } from 'dotenv';

// Load environment variables
config();

import { SchedulingContainer, SchedulingServiceConfig } from './infrastructure/di/scheduling.container';
import { AppointmentController } from './presentation/controllers/appointment.controller';
import { AppointmentWebSocketHandler } from './presentation/websocket/appointment-websocket.handler';
import { IHealthCheck } from '../../shared/infrastructure/health/health-check.interface';
import { ConsoleLogger } from '../../shared/infrastructure/logging/console.logger';

// Configuration
const PORT = process.env.PORT || 3004;
const NODE_ENV = process.env.NODE_ENV || 'development';
const SERVICE_NAME = 'scheduling-service';
const SERVICE_VERSION = '2.0.0';

/**
 * Scheduling Service Application
 * Main application class with complete setup and lifecycle management
 */
class SchedulingServiceApplication {
  private app: Application;
  private server: any;
  private io: SocketIOServer;
  private container: SchedulingContainer;
  private webSocketHandler: AppointmentWebSocketHandler;
  private healthChecks: IHealthCheck[] = [];
  private logger = new ConsoleLogger('SchedulingApp');
  private isShuttingDown = false;

  constructor() {
    this.app = express();
    this.setupConfiguration();
  }

  /**
   * Setup service configuration
   */
  private setupConfiguration(): void {
    const config: SchedulingServiceConfig = {
      // Database
      supabase: {
        url: process.env.SUPABASE_URL || 'http://localhost:54321',
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
        schema: process.env.SUPABASE_SCHEMA || 'scheduling_schema'
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
        }
      },

      // Event Publishing
      eventPublisher: {
        type: (process.env.EVENT_PUBLISHER_TYPE as any) || 'hybrid',
        rabbitmq: {
          connectionUrl: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
          exchange: process.env.RABBITMQ_EXCHANGE || 'hospital-events',
          exchangeType: 'topic',
          durable: true,
          autoDelete: false
        },
        inMemory: {
          maxEvents: parseInt(process.env.MAX_MEMORY_EVENTS || '1000'),
          retentionTime: parseInt(process.env.EVENT_RETENTION_TIME || '3600000') // 1 hour
        },
        retryConfig: {
          maxRetries: parseInt(process.env.EVENT_MAX_RETRIES || '3'),
          baseDelay: parseInt(process.env.EVENT_BASE_DELAY || '1000'),
          maxDelay: parseInt(process.env.EVENT_MAX_DELAY || '10000')
        }
      },

      // Cache
      redis: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        keyPrefix: process.env.REDIS_KEY_PREFIX || 'scheduling:',
        defaultTtl: parseInt(process.env.REDIS_DEFAULT_TTL || '3600')
      },

      // WebSocket
      websocket: {
        namespace: process.env.WEBSOCKET_NAMESPACE || '/appointments',
        corsOrigins: process.env.WEBSOCKET_CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
        maxConnections: parseInt(process.env.WEBSOCKET_MAX_CONNECTIONS || '1000'),
        heartbeatInterval: parseInt(process.env.WEBSOCKET_HEARTBEAT_INTERVAL || '30000'),
        connectionTimeout: parseInt(process.env.WEBSOCKET_CONNECTION_TIMEOUT || '300000')
      },

      // Security
      security: {
        jwtSecret: process.env.JWT_SECRET || 'your-jwt-secret-key',
        corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
        rateLimiting: {
          windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
          maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
        }
      },

      // Monitoring
      monitoring: {
        enableMetrics: process.env.ENABLE_METRICS === 'true',
        metricsPort: parseInt(process.env.METRICS_PORT || '9090'),
        healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000')
      }
    };

    this.container = new SchedulingContainer(config);
  }

  /**
   * Initialize application
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing Scheduling Service', {
        serviceName: SERVICE_NAME,
        version: SERVICE_VERSION,
        nodeEnv: NODE_ENV,
        port: PORT
      });

      // Initialize dependency injection container
      await this.container.initialize();

      // Setup middleware
      this.setupMiddleware();

      // Setup routes
      this.setupRoutes();

      // Setup error handling
      this.setupErrorHandling();

      // Setup HTTP server
      this.setupServer();

      // Setup WebSocket
      this.setupWebSocket();

      // Setup health checks
      this.setupHealthChecks();

      // Setup graceful shutdown
      this.setupGracefulShutdown();

      this.logger.info('Scheduling Service initialized successfully');

    } catch (error) {
      this.logger.error('Failed to initialize Scheduling Service', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
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
          connectSrc: ["'self'", "ws:", "wss:"],
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
        code: 'RATE_LIMIT_EXCEEDED'
      },
      standardHeaders: true,
      legacyHeaders: false
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

    const appointmentController = this.container.get<AppointmentController>('AppointmentController');

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
        container: this.container.getStatistics()
      });
    });

    // API routes
    const apiRouter = express.Router();

    // Appointment routes
    apiRouter.post('/appointments', appointmentController.createAppointment.bind(appointmentController));
    apiRouter.get('/appointments/:appointmentId', appointmentController.getAppointment.bind(appointmentController));
    apiRouter.get('/appointments', appointmentController.searchAppointments.bind(appointmentController));
    apiRouter.put('/appointments/:appointmentId/status', appointmentController.updateAppointmentStatus.bind(appointmentController));
    apiRouter.delete('/appointments/:appointmentId', appointmentController.cancelAppointment.bind(appointmentController));
    apiRouter.get('/appointments/statistics', appointmentController.getAppointmentStatistics.bind(appointmentController));

    this.app.use('/api/v1', apiRouter);

    // Root route
    this.app.get('/', (req: Request, res: Response) => {
      res.json({
        message: 'Scheduling Service API',
        messageVietnamese: 'API Dịch vụ Lên lịch',
        version: SERVICE_VERSION,
        status: 'running',
        timestamp: new Date().toISOString(),
        endpoints: {
          health: '/health',
          info: '/info',
          api: '/api/v1',
          websocket: '/appointments'
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
        code: 'ENDPOINT_NOT_FOUND',
        timestamp: new Date().toISOString(),
        path: req.originalUrl
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
   * Setup HTTP server
   */
  private setupServer(): void {
    this.server = createServer(this.app);

    this.server.on('error', (error: any) => {
      if (error.syscall !== 'listen') {
        throw error;
      }

      const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;

      switch (error.code) {
        case 'EACCES':
          this.logger.error(`${bind} requires elevated privileges`);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          this.logger.error(`${bind} is already in use`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });

    this.server.on('listening', () => {
      const addr = this.server.address();
      const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr?.port;
      this.logger.info(`Scheduling Service listening on ${bind}`);
    });
  }

  /**
   * Setup WebSocket
   */
  private setupWebSocket(): void {
    this.logger.debug('Setting up WebSocket');

    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: process.env.WEBSOCKET_CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000
    });

    // Register WebSocket handler
    this.webSocketHandler = this.container.registerWebSocketHandler(this.io);

    this.logger.debug('WebSocket setup completed');
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

        // Close WebSocket connections
        if (this.io) {
          this.io.close(() => {
            this.logger.info('WebSocket server closed');
          });
        }

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
      
      this.server.listen(PORT, () => {
        this.logger.info('Scheduling Service started successfully', {
          serviceName: SERVICE_NAME,
          version: SERVICE_VERSION,
          port: PORT,
          environment: NODE_ENV,
          processId: process.pid
        });
      });

    } catch (error) {
      this.logger.error('Failed to start Scheduling Service', {
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
        websocket: this.webSocketHandler?.getConnectionStatistics(),
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
        `# HELP scheduling_service_uptime_seconds Total uptime of the service`,
        `# TYPE scheduling_service_uptime_seconds counter`,
        `scheduling_service_uptime_seconds ${process.uptime()}`,
        '',
        `# HELP scheduling_service_memory_usage_bytes Memory usage in bytes`,
        `# TYPE scheduling_service_memory_usage_bytes gauge`,
        `scheduling_service_memory_usage_bytes{type="rss"} ${process.memoryUsage().rss}`,
        `scheduling_service_memory_usage_bytes{type="heapTotal"} ${process.memoryUsage().heapTotal}`,
        `scheduling_service_memory_usage_bytes{type="heapUsed"} ${process.memoryUsage().heapUsed}`,
        '',
        `# HELP scheduling_service_websocket_connections Current WebSocket connections`,
        `# TYPE scheduling_service_websocket_connections gauge`,
        `scheduling_service_websocket_connections ${this.webSocketHandler?.getConnectionStatistics()?.totalConnections || 0}`
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
const app = new SchedulingServiceApplication();
app.start().catch((error) => {
  console.error('Failed to start Scheduling Service:', error);
  process.exit(1);
});

export default app;
