/**
 * Provider/Staff Service V2 - Main Application
 * Production-ready service with Clean Architecture + DDD + CQRS
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @port 3002 (External), 3022 (Internal)
 * @schema provider_schema
 * @compliance Clean Architecture, HIPAA, Vietnamese Healthcare Standards
 */

// Load environment variables FIRST
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';

// Infrastructure imports
import { RabbitMQEventPublisher } from './infrastructure/events/RabbitMQEventPublisher';
import { ProviderStaffHealthCheck } from './infrastructure/monitoring/HealthChecks';
import { logger } from './infrastructure/logging/logger';

// Application imports
import { RegisterStaffUseCase } from './application/use-cases/RegisterStaffUseCase';
import { GetStaffProfileUseCase } from './application/use-cases/GetStaffProfileUseCase';
import { AssignStaffToDepartmentUseCase } from './application/use-cases/AssignStaffToDepartmentUseCase';
import { AddStaffCredentialUseCase } from './application/use-cases/AddStaffCredentialUseCase';
import { RemoveStaffCredentialUseCase } from './application/use-cases/RemoveStaffCredentialUseCase';
import { RenewStaffCredentialUseCase } from './application/use-cases/RenewStaffCredentialUseCase';
import { GetExpiringCredentialsUseCase } from './application/use-cases/GetExpiringCredentialsUseCase';
import { ActivateStaffUseCase } from './application/use-cases/ActivateStaffUseCase';
import { SuspendStaffUseCase } from './application/use-cases/SuspendStaffUseCase';
import { ReactivateStaffUseCase } from './application/use-cases/ReactivateStaffUseCase';
import { TerminateStaffUseCase } from './application/use-cases/TerminateStaffUseCase';
import { UpdateEmploymentStatusUseCase } from './application/use-cases/UpdateEmploymentStatusUseCase';
import { UpdateStaffScheduleUseCase } from './application/use-cases/UpdateStaffScheduleUseCase';
// REMOVED: Availability use cases - Belongs to Scheduling/Appointment Service (bounded context violation)
import { GetStaffSpecializationsUseCase } from './application/use-cases/GetStaffSpecializationsUseCase';
import { AddStaffSpecializationUseCase } from './application/use-cases/AddStaffSpecializationUseCase';
import { RemoveStaffSpecializationUseCase } from './application/use-cases/RemoveStaffSpecializationUseCase';
import { StaffCommandHandlers } from './application/handlers/StaffCommandHandlers';
import { StaffQueryHandlers } from './application/handlers/StaffQueryHandlers';

// Presentation imports
import { setupRoutes } from './presentation/routes';
// import { ErrorHandlingMiddleware } from './presentation/middleware/ErrorHandlingMiddleware';

// DI Container
import { setupDependencies, ServiceTokens } from './infrastructure/di/setup';

// Configuration
const config = {
  port: process.env.PORT || 3002,
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5673',
  nodeEnv: process.env.NODE_ENV || 'development',
  serviceName: 'provider-staff-service',
  version: '2.0.0',
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:3101').split(','),
  schema: 'provider_schema'
};

/**
 * Provider/Staff Service Application Class
 * Implements production-ready patterns with Clean Architecture
 */
class ProviderStaffServiceApp {
  private app: express.Application;
  private container!: ReturnType<typeof setupDependencies>;
  private eventPublisher!: RabbitMQEventPublisher | null;
  private healthCheck!: ProviderStaffHealthCheck;

  // Use Cases
  private registerStaffUseCase!: RegisterStaffUseCase;
  private getStaffProfileUseCase!: GetStaffProfileUseCase;
  private assignStaffToDepartmentUseCase!: AssignStaffToDepartmentUseCase;
  private addStaffCredentialUseCase!: AddStaffCredentialUseCase;
  private removeStaffCredentialUseCase!: RemoveStaffCredentialUseCase;
  private renewStaffCredentialUseCase!: RenewStaffCredentialUseCase;
  private getExpiringCredentialsUseCase!: GetExpiringCredentialsUseCase;
  private activateStaffUseCase!: ActivateStaffUseCase;
  private suspendStaffUseCase!: SuspendStaffUseCase;
  private reactivateStaffUseCase!: ReactivateStaffUseCase;
  private terminateStaffUseCase!: TerminateStaffUseCase;
  private updateEmploymentStatusUseCase!: UpdateEmploymentStatusUseCase;

  // Handlers
  private staffCommandHandlers!: StaffCommandHandlers;
  private staffQueryHandlers!: StaffQueryHandlers;

  // Middleware
  // private errorHandlingMiddleware!: ErrorHandlingMiddleware;

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupErrorHandling();
  }

  /**
   * Initialize the application
   */
  async initialize(): Promise<void> {
    await this.initializeInfrastructure();
    this.setupRoutes();
  }

  /**
   * Validate configuration
   */
  private validateConfiguration(): void {
    const requiredEnvVars = [
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    logger.info('Configuration validated successfully');
  }

  /**
   * Initialize infrastructure components
   */
  private async initializeInfrastructure(): Promise<void> {
    try {
      logger.info('Initializing infrastructure...');

      // Validate configuration
      this.validateConfiguration();

      // Initialize Health Check Service
      this.healthCheck = new ProviderStaffHealthCheck(
        config.supabaseUrl,
        config.supabaseKey,
        logger
      );

      // Setup DI Container
      this.container = setupDependencies();

      // Resolve dependencies from container
      this.registerStaffUseCase = this.container.resolve<RegisterStaffUseCase>(ServiceTokens.REGISTER_STAFF_USE_CASE);
      this.getStaffProfileUseCase = this.container.resolve<GetStaffProfileUseCase>(ServiceTokens.GET_STAFF_PROFILE_USE_CASE);
      this.assignStaffToDepartmentUseCase = this.container.resolve<AssignStaffToDepartmentUseCase>(ServiceTokens.ASSIGN_STAFF_TO_DEPARTMENT_USE_CASE);
      this.addStaffCredentialUseCase = this.container.resolve<AddStaffCredentialUseCase>(ServiceTokens.ADD_STAFF_CREDENTIAL_USE_CASE);
      this.removeStaffCredentialUseCase = this.container.resolve<RemoveStaffCredentialUseCase>(ServiceTokens.REMOVE_STAFF_CREDENTIAL_USE_CASE);
      this.renewStaffCredentialUseCase = this.container.resolve<RenewStaffCredentialUseCase>(ServiceTokens.RENEW_STAFF_CREDENTIAL_USE_CASE);
      this.getExpiringCredentialsUseCase = this.container.resolve<GetExpiringCredentialsUseCase>(ServiceTokens.GET_EXPIRING_CREDENTIALS_USE_CASE);
      this.activateStaffUseCase = this.container.resolve<ActivateStaffUseCase>(ServiceTokens.ACTIVATE_STAFF_USE_CASE);
      this.suspendStaffUseCase = this.container.resolve<SuspendStaffUseCase>(ServiceTokens.SUSPEND_STAFF_USE_CASE);
      this.reactivateStaffUseCase = this.container.resolve<ReactivateStaffUseCase>(ServiceTokens.REACTIVATE_STAFF_USE_CASE);
      this.terminateStaffUseCase = this.container.resolve<TerminateStaffUseCase>(ServiceTokens.TERMINATE_STAFF_USE_CASE);
      this.updateEmploymentStatusUseCase = this.container.resolve<UpdateEmploymentStatusUseCase>(ServiceTokens.UPDATE_EMPLOYMENT_STATUS_USE_CASE);
      this.staffCommandHandlers = this.container.resolve<StaffCommandHandlers>(ServiceTokens.STAFF_COMMAND_HANDLERS);
      this.staffQueryHandlers = this.container.resolve<StaffQueryHandlers>(ServiceTokens.STAFF_QUERY_HANDLERS);

      // Initialize RabbitMQ Event Publisher
      await this.initializeEventPublisher();

      // Initialize error handling middleware
      // this.errorHandlingMiddleware = new ErrorHandlingMiddleware(logger);

      logger.info('Infrastructure initialized successfully');
    } catch (error) {
      logger.fatal('Failed to initialize infrastructure', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Initialize RabbitMQ Event Publisher
   */
  private async initializeEventPublisher(): Promise<void> {
    try {
      const rabbitmqExchange = process.env.RABBITMQ_EXCHANGE || 'hospital.events';
      const rabbitmqExchangeType = (process.env.RABBITMQ_EXCHANGE_TYPE || 'topic') as 'topic' | 'direct' | 'fanout';

      this.eventPublisher = new RabbitMQEventPublisher(
        {
          url: config.rabbitmqUrl,
          exchange: rabbitmqExchange,
          exchangeType: rabbitmqExchangeType,
          durable: process.env.RABBITMQ_DURABLE === 'true' || true,
          autoDelete: process.env.RABBITMQ_AUTO_DELETE === 'true' || false
        },
        {
          enableRetry: process.env.RABBITMQ_ENABLE_RETRY === 'true' || true,
          maxRetries: parseInt(process.env.RABBITMQ_MAX_RETRIES || '3'),
          retryDelayMs: parseInt(process.env.RABBITMQ_RETRY_DELAY_MS || '1000'),
          enableLogging: process.env.RABBITMQ_ENABLE_LOGGING === 'true' || true
        },
        logger
      );

      await this.eventPublisher.connect();
      logger.info('RabbitMQ Event Publisher initialized successfully');
      
      // Subscribe to Review Service events
      await this.subscribeToReviewEvents();
      
      // Subscribe to Billing Service events
      await this.subscribeToBillingEvents();
      
    } catch (error) {
      logger.error('Failed to initialize RabbitMQ Event Publisher', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      logger.warn('Continuing without event publishing');
      this.eventPublisher = null;
    }
  }

  /**
   * Subscribe to Review Service events
   */
  private async subscribeToReviewEvents(): Promise<void> {
    try {
      const reviewHandler = this.container.resolve(ServiceTokens.REVIEW_EVENT_HANDLER);
      const eventBus = this.container.resolve(ServiceTokens.EVENT_BUS) as any;

      // Subscribe to review events
      await eventBus.subscribe('review.created', reviewHandler);
      await eventBus.subscribe('review.updated', reviewHandler);
      await eventBus.subscribe('review.deleted', reviewHandler);
      await eventBus.subscribe('review.rating.recalculated', reviewHandler);

      logger.info('Subscribed to Review Service events successfully', {
        events: ['review.created', 'review.updated', 'review.deleted', 'review.rating.recalculated']
      });
    } catch (error) {
      logger.error('Failed to subscribe to Review Service events', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      // Graceful degradation: continue without review event subscriptions
    }
  }

  /**
   * Subscribe to Billing Service events
   */
  private async subscribeToBillingEvents(): Promise<void> {
    try {
      const billingHandler = this.container.resolve(ServiceTokens.BILLING_EVENT_HANDLER);
      const eventBus = this.container.resolve(ServiceTokens.EVENT_BUS) as any;

      // Subscribe to billing events
      await eventBus.subscribe('billing.payment.processed', billingHandler);
      await eventBus.subscribe('billing.invoice.generated', billingHandler);
      await eventBus.subscribe('billing.consultation_fee.updated', billingHandler);
      await eventBus.subscribe('billing.payment.refunded', billingHandler);

      logger.info('Subscribed to Billing Service events successfully', {
        events: [
          'billing.payment.processed',
          'billing.invoice.generated',
          'billing.consultation_fee.updated',
          'billing.payment.refunded'
        ]
      });
    } catch (error) {
      logger.error('Failed to subscribe to Billing Service events', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      // Graceful degradation: continue without billing event subscriptions
    }
  }

  /**
   * Setup Express middleware with security and monitoring
   */
  private setupMiddleware(): void {
    logger.info('Setting up middleware...');

    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:']
        }
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    }));

    // CORS
    this.app.use(cors({
      origin: config.allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // Compression
    this.app.use(compression());

    // Request logging
    if (config.nodeEnv === 'development') {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined'));
    }

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request ID middleware
    this.app.use((req, _res, next) => {
      (req as any).requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      next();
    });

    logger.info('Middleware setup complete');
  }

  /**
   * Setup API routes
   */
  private setupRoutes(): void {
    logger.info('Setting up routes...');

    // Health check endpoint
    this.app.get('/health', async (_req, res) => {
      try {
        const health = await this.healthCheck.checkHealth();
        const statusCode = health.overall === 'HEALTHY' ? 200 : 503;

        res.status(statusCode).json(health);
      } catch (error) {
        logger.error('Health check failed', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });

        res.status(503).json({
          overall: 'UNHEALTHY',
          service: config.serviceName,
          version: config.version,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
      }
    });

    // Service info endpoint
    this.app.get('/info', (_req, res) => {
      res.json({
        service: config.serviceName,
        version: config.version,
        environment: config.nodeEnv,
        schema: config.schema,
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    });

    // Setup application routes
    const updateStaffScheduleUseCase = this.container.resolve<UpdateStaffScheduleUseCase>(ServiceTokens.UPDATE_STAFF_SCHEDULE_USE_CASE);
    // REMOVED: Availability use cases - Belongs to Scheduling/Appointment Service
    const getStaffSpecializationsUseCase = this.container.resolve<GetStaffSpecializationsUseCase>(ServiceTokens.GET_STAFF_SPECIALIZATIONS_USE_CASE);
    const addStaffSpecializationUseCase = this.container.resolve<AddStaffSpecializationUseCase>(ServiceTokens.ADD_STAFF_SPECIALIZATION_USE_CASE);
    const removeStaffSpecializationUseCase = this.container.resolve<RemoveStaffSpecializationUseCase>(ServiceTokens.REMOVE_STAFF_SPECIALIZATION_USE_CASE);

    setupRoutes(
      this.app as any,
      this.registerStaffUseCase,
      this.getStaffProfileUseCase,
      this.assignStaffToDepartmentUseCase,
      this.staffCommandHandlers,
      this.staffQueryHandlers,
      this.addStaffCredentialUseCase,
      this.removeStaffCredentialUseCase,
      this.renewStaffCredentialUseCase,
      this.getExpiringCredentialsUseCase,
      this.activateStaffUseCase,
      this.suspendStaffUseCase,
      this.reactivateStaffUseCase,
      this.terminateStaffUseCase,
      this.updateEmploymentStatusUseCase,
      updateStaffScheduleUseCase,
      // REMOVED: Availability use cases - Belongs to Scheduling/Appointment Service
      getStaffSpecializationsUseCase,
      addStaffSpecializationUseCase,
      removeStaffSpecializationUseCase
    );

    logger.info('Routes setup complete');
  }

  /**
   * Setup error handling middleware
   */
  private setupErrorHandling(): void {
    // Global error handler
    this.app.use((error: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
      logger.error('Unhandled error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        url: req.url,
        method: req.method,
        requestId: (req as any).requestId
      });

      res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Lỗi hệ thống không xác định',
        timestamp: new Date().toISOString(),
        requestId: (req as any).requestId || 'unknown'
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', { 
        error: error.message, 
        stack: error.stack 
      });
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection', { reason, promise });
      process.exit(1);
    });
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    try {
      logger.info(`Starting ${config.serviceName} v${config.version}...`);

      // Initialize infrastructure
      await this.initialize();

      // Perform initial health check
      const health = await this.healthCheck.checkHealth();
      if (health.overall === 'UNHEALTHY') {
        logger.warn('Service starting with unhealthy status', { health });
      }

      // Start listening
      this.app.listen(config.port, () => {
        logger.info(`${config.serviceName} is running`, {
          port: config.port,
          environment: config.nodeEnv,
          version: config.version,
          schema: config.schema,
          healthStatus: health.overall
        });
      });

    } catch (error) {
      logger.fatal('Failed to start service', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      process.exit(1);
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown(signal: string): Promise<void> {
    logger.info(`${signal} received, shutting down gracefully...`);

    try {
      // Disconnect RabbitMQ
      if (this.eventPublisher) {
        await this.eventPublisher.disconnect();
        logger.info('RabbitMQ disconnected');
      }

      logger.info('Graceful shutdown complete');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      process.exit(1);
    }
  }
}

// Start the application
if (require.main === module) {
  const app = new ProviderStaffServiceApp();

  // Graceful shutdown handlers
  const shutdown = (signal: string) => app.shutdown(signal);
  
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Start the service
  app.start().catch((error) => {
    logger.fatal('Failed to start application', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    process.exit(1);
  });
}

export default ProviderStaffServiceApp;

