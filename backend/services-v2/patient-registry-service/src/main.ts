/**
 * Patient Registry Service V2 - Main Application
 * Production-ready service with Clean Architecture + DDD + CQRS
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, HIPAA, Vietnamese Healthcare Standards
 */

// Load environment variables FIRST
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';

// Infrastructure imports
import { SupabasePatientRepository } from './infrastructure/repositories/SupabasePatientRepository';
import { PatientRegistryHealthCheck } from './infrastructure/monitoring/HealthChecks';
import { RedisCacheService } from './infrastructure/cache/RedisCacheService';
import { PatientCache } from './infrastructure/cache/PatientCache';
import { PatientRegistryDegradation } from './infrastructure/resilience/GracefulDegradation';

// Application Services imports
import { PatientMatchingService } from './application/services/PatientMatchingService';
import { InsuranceValidationService } from './application/services/InsuranceValidationService';
import { RabbitMQEventPublisher } from './infrastructure/events/RabbitMQEventPublisher';
import { ILogger, LogMetadata } from '@shared/application/services/logger.interface';
import { IEventBus, InMemoryEventBus } from '@shared/infrastructure/event-bus/EventBus';

// Application imports
import { RegisterPatientUseCase } from './application/use-cases/RegisterPatientUseCase';
import { UpdatePatientInfoUseCase } from './application/use-cases/UpdatePatientInfoUseCase';
import { GetPatientProfileUseCase } from './application/use-cases/GetPatientProfileUseCase';
import { SearchPatientsUseCase } from './application/use-cases/SearchPatientsUseCase';
import { MatchPatientsUseCase } from './application/use-cases/MatchPatientsUseCase';
import { MergePatientsUseCase } from './application/use-cases/MergePatientsUseCase';
import { LinkPatientsUseCase } from './application/use-cases/LinkPatientsUseCase';
import { DeactivatePatientUseCase } from './application/use-cases/DeactivatePatientUseCase';
import { ValidateInsuranceUseCase } from './application/use-cases/ValidateInsuranceUseCase';
import { AddEmergencyContactUseCase } from './application/use-cases/AddEmergencyContactUseCase';
import { GetEmergencyContactsUseCase } from './application/use-cases/GetEmergencyContactsUseCase';
import { UpdateEmergencyContactUseCase } from './application/use-cases/UpdateEmergencyContactUseCase';
import { RemoveEmergencyContactUseCase } from './application/use-cases/RemoveEmergencyContactUseCase';
import { SetPrimaryEmergencyContactUseCase } from './application/use-cases/SetPrimaryEmergencyContactUseCase';
import { GrantConsentUseCase } from './application/use-cases/GrantConsentUseCase';
import { GetConsentsUseCase } from './application/use-cases/GetConsentsUseCase';
import { GetConsentDetailsUseCase } from './application/use-cases/GetConsentDetailsUseCase';
import { RevokeConsentUseCase } from './application/use-cases/RevokeConsentUseCase';
import { GetActiveConsentsUseCase } from './application/use-cases/GetActiveConsentsUseCase';
import { GetInsuranceInfoUseCase } from './application/use-cases/GetInsuranceInfoUseCase';
import { UpdateInsuranceInfoUseCase } from './application/use-cases/UpdateInsuranceInfoUseCase';
import { VerifyInsuranceUseCase } from './application/use-cases/VerifyInsuranceUseCase';
import { MarkAsDeceasedUseCase } from './application/use-cases/MarkAsDeceasedUseCase';
import { ReactivatePatientUseCase } from './application/use-cases/ReactivatePatientUseCase';
import { GetPatientStatisticsUseCase } from './application/use-cases/GetPatientStatisticsUseCase';
import { UploadPatientPhotoUseCase } from './application/use-cases/UploadPatientPhotoUseCase';
import { GetPatientPhotoUseCase } from './application/use-cases/GetPatientPhotoUseCase';
import { DeletePatientPhotoUseCase } from './application/use-cases/DeletePatientPhotoUseCase';
import { UpdateCommunicationPreferencesUseCase } from './application/use-cases/UpdateCommunicationPreferencesUseCase';
import { GetCommunicationPreferencesUseCase } from './application/use-cases/GetCommunicationPreferencesUseCase';
import { PatientCommandHandlers } from './application/handlers/PatientCommandHandlers';
import { PatientQueryHandlers } from './application/handlers/PatientQueryHandlers';

// Infrastructure imports
import { SupabaseStorageService } from './infrastructure/storage/SupabaseStorageService';
import { AuditService } from './infrastructure/audit/AuditService';
import { 
  IdentityEventConsumer,
  IdentityUserCreatedEventHandler,
  IdentityUserDeletedEventHandler,
  IdentityUserUpdatedEventHandler
} from './infrastructure';

// Presentation imports
import { PatientController } from './presentation/controllers/PatientController';
import { CommandController } from './presentation/controllers/CommandController';
import { createPatientRoutes } from './presentation/routes/patientRoutes';
import { createCommandRoutes } from './presentation/routes/commandRoutes';
import { ErrorHandlingMiddleware } from './presentation/middleware/ErrorHandlingMiddleware';
import { AuthenticationMiddleware } from './presentation/middleware/AuthenticationMiddleware';

// Configuration
const config = {
  port: process.env.PORT || 3023,
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5672',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6380',
  nodeEnv: process.env.NODE_ENV || 'development',
  serviceName: 'patient-registry-service',
  version: '2.0.0',
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(','),
  identityServiceUrl: process.env.IDENTITY_SERVICE_URL || 'http://localhost:3021'
};

// Logger setup (simplified - in production use Winston or similar)
const logger: ILogger = {
  debug: (message: string, meta: LogMetadata = {}) => {
    if (config.nodeEnv === 'development') {
      console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`, Object.keys(meta).length ? meta : '');
    }
  },
  info: (message: string, meta: LogMetadata = {}) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, Object.keys(meta).length ? meta : '');
  },
  warn: (message: string, meta: LogMetadata = {}) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, Object.keys(meta).length ? meta : '');
  },
  error: (message: string, meta: LogMetadata = {}) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, Object.keys(meta).length ? meta : '');
  },
  fatal: (message: string, meta: LogMetadata = {}) => {
    console.error(`[FATAL] ${new Date().toISOString()} - ${message}`, Object.keys(meta).length ? meta : '');
  }
};

/**
 * Patient Registry Service Application Class
 */
class PatientRegistryServiceApp {
  private app: express.Application;
  private eventPublisher!: RabbitMQEventPublisher;
  private eventBus!: IEventBus;
  private patientRepository!: SupabasePatientRepository;
  private matchingService!: PatientMatchingService;
  private insuranceValidationService!: InsuranceValidationService;
  private healthCheck!: PatientRegistryHealthCheck;
  private cacheService!: RedisCacheService | null;
  private patientCache!: PatientCache;
  private degradationService!: PatientRegistryDegradation;
  private auditService!: AuditService;
  private identityEventConsumer!: any; // IdentityEventConsumer

  // Use Cases
  private registerPatientUseCase!: RegisterPatientUseCase;
  private updatePatientInfoUseCase!: UpdatePatientInfoUseCase;
  private getPatientProfileUseCase!: GetPatientProfileUseCase;
  private searchPatientsUseCase!: SearchPatientsUseCase;
  private matchPatientsUseCase!: MatchPatientsUseCase;
  private mergePatientsUseCase!: MergePatientsUseCase;
  private linkPatientsUseCase!: LinkPatientsUseCase;
  private deactivatePatientUseCase!: DeactivatePatientUseCase;
  private validateInsuranceUseCase!: ValidateInsuranceUseCase;
  private addEmergencyContactUseCase!: AddEmergencyContactUseCase;
  private getEmergencyContactsUseCase!: GetEmergencyContactsUseCase;
  private updateEmergencyContactUseCase!: UpdateEmergencyContactUseCase;
  private removeEmergencyContactUseCase!: RemoveEmergencyContactUseCase;
  private setPrimaryEmergencyContactUseCase!: SetPrimaryEmergencyContactUseCase;
  private grantConsentUseCase!: GrantConsentUseCase;
  private getConsentsUseCase!: GetConsentsUseCase;
  private getConsentDetailsUseCase!: GetConsentDetailsUseCase;
  private revokeConsentUseCase!: RevokeConsentUseCase;
  private getActiveConsentsUseCase!: GetActiveConsentsUseCase;
  private getInsuranceInfoUseCase!: GetInsuranceInfoUseCase;
  private updateInsuranceInfoUseCase!: UpdateInsuranceInfoUseCase;
  private verifyInsuranceUseCase!: VerifyInsuranceUseCase;
  private markAsDeceasedUseCase!: MarkAsDeceasedUseCase;
  private reactivatePatientUseCase!: ReactivatePatientUseCase;
  private getPatientStatisticsUseCase!: GetPatientStatisticsUseCase;
  private uploadPatientPhotoUseCase!: UploadPatientPhotoUseCase;
  private getPatientPhotoUseCase!: GetPatientPhotoUseCase;
  private deletePatientPhotoUseCase!: DeletePatientPhotoUseCase;
  private updateCommunicationPreferencesUseCase!: UpdateCommunicationPreferencesUseCase;
  private getCommunicationPreferencesUseCase!: GetCommunicationPreferencesUseCase;

  // Infrastructure Services
  private storageService!: SupabaseStorageService;

  // Command Handlers
  private patientCommandHandlers!: PatientCommandHandlers;
  private patientQueryHandlers!: PatientQueryHandlers;

  // Controllers
  private patientController!: PatientController;
  private commandController!: CommandController;

  // Middleware
  private errorHandlingMiddleware!: ErrorHandlingMiddleware;
  private authMiddleware!: AuthenticationMiddleware;

  constructor() {
    this.app = express();
  }

  /**
   * Initialize all dependencies
   */
  private async initializeDependencies(): Promise<void> {
    logger.info('Initializing dependencies...');

    try {
      // Validate configuration
      this.validateConfiguration();

      // Lazy load Supabase client once for audit and storage integrations
      const { createClient } = await import('@supabase/supabase-js');

      // Initialize Event Publisher
      this.eventPublisher = new RabbitMQEventPublisher(
        {
          url: config.rabbitmqUrl,
          exchange: 'patient-registry-events',
          exchangeType: 'topic',
          durable: true,
          autoDelete: false,
          serviceName: 'patient-registry'
        },
        {
          enableRetry: true,
          maxRetries: 3,
          retryDelayMs: 1000,
          enableLogging: true
        },
        logger
      );

      // Connect to RabbitMQ
      await this.eventPublisher.connect();

      // Initialize EventBus (InMemoryEventBus for development)
      this.eventBus = new InMemoryEventBus();
      await this.eventBus.connect();
      logger.info('EventBus initialized (InMemoryEventBus)', {});

      // Initialize Redis Cache Service (optional)
      try {
        this.cacheService = new RedisCacheService(config.redisUrl, logger);
        await this.cacheService.connect();
        logger.info('Redis cache service initialized and connected', {});
      } catch (error) {
        logger.warn('Redis cache not available, running without cache', { error });
        this.cacheService = null;
      }

      // Initialize Patient Cache (L1/L2)
      this.patientCache = new PatientCache(config.redisUrl);
      try {
        await this.patientCache.connect();
        logger.info('Patient cache connected successfully', {});
      } catch (error) {
        logger.error('Failed to connect Patient Cache', { error: error instanceof Error ? error.message : 'Unknown error' });
        logger.warn('Continuing without patient caching - patients will be fetched from database', {});
      }

      // Initialize Application Services (Domain Services)
      this.matchingService = new PatientMatchingService(logger);
      this.insuranceValidationService = new InsuranceValidationService(logger);

      // Initialize Graceful Degradation Service
      this.degradationService = new PatientRegistryDegradation(
        {
          enableReadOnlyFallback: true,
          enableCacheFallback: true,
          enableEmergencyMode: true,
          maxDegradationTime: 300000 // 5 minutes
        },
        {
          supabaseUrl: config.supabaseUrl,
          supabaseServiceRoleKey: config.supabaseKey
        },
        logger
      );

      // Initialize Health Check Service (with degradation service)
      this.healthCheck = new PatientRegistryHealthCheck(
        config.supabaseUrl,
        config.supabaseKey,
        this.degradationService
      );

      // Initialize Audit Service
      const auditSupabaseClient = createClient(config.supabaseUrl, config.supabaseKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
      this.auditService = new AuditService(auditSupabaseClient as any, logger);
      logger.info('Audit service initialized', {});

      // Initialize Infrastructure Layer (inject services + event publisher)
      this.patientRepository = new SupabasePatientRepository(
        config.supabaseUrl,
        config.supabaseKey,
        logger,
        this.matchingService,  // ✅ Inject matching service
        this.eventPublisher    // ✅ Inject event publisher
      );

      // Initialize Application Layer (Use Cases)
      this.registerPatientUseCase = new RegisterPatientUseCase(
        this.patientRepository,
        this.eventBus,
        logger
      );

      this.updatePatientInfoUseCase = new UpdatePatientInfoUseCase(
        this.patientRepository,
        this.eventBus,
        logger
      );

      this.getPatientProfileUseCase = new GetPatientProfileUseCase(
        this.patientRepository,
        logger
      );

      this.searchPatientsUseCase = new SearchPatientsUseCase(
        this.patientRepository
      );

      this.matchPatientsUseCase = new MatchPatientsUseCase(
        this.patientRepository,
        this.matchingService,
        logger
      );

      this.mergePatientsUseCase = new MergePatientsUseCase(
        this.patientRepository
      );

      this.linkPatientsUseCase = new LinkPatientsUseCase(
        this.patientRepository
      );

      this.deactivatePatientUseCase = new DeactivatePatientUseCase(
        this.patientRepository,
        this.eventBus,
        logger
      );

      this.validateInsuranceUseCase = new ValidateInsuranceUseCase(
        this.patientRepository,
        this.insuranceValidationService,
        logger
      );

      this.addEmergencyContactUseCase = new AddEmergencyContactUseCase(
        this.patientRepository,
        this.eventBus,
        logger
      );

      this.getEmergencyContactsUseCase = new GetEmergencyContactsUseCase(
        this.patientRepository,
        logger
      );

      this.updateEmergencyContactUseCase = new UpdateEmergencyContactUseCase(
        this.patientRepository,
        this.eventBus,
        logger
      );

      this.removeEmergencyContactUseCase = new RemoveEmergencyContactUseCase(
        this.patientRepository,
        this.eventBus,
        logger
      );

      this.setPrimaryEmergencyContactUseCase = new SetPrimaryEmergencyContactUseCase(
        this.patientRepository,
        this.eventBus,
        logger
      );

      this.grantConsentUseCase = new GrantConsentUseCase(
        this.patientRepository
      );

      this.getConsentsUseCase = new GetConsentsUseCase(
        this.patientRepository,
        logger
      );

      this.getConsentDetailsUseCase = new GetConsentDetailsUseCase(
        this.patientRepository,
        logger
      );

      this.revokeConsentUseCase = new RevokeConsentUseCase(
        this.patientRepository,
        this.eventBus,
        logger
      );

      this.getActiveConsentsUseCase = new GetActiveConsentsUseCase(
        this.patientRepository,
        logger
      );

      this.getInsuranceInfoUseCase = new GetInsuranceInfoUseCase(
        this.patientRepository,
        logger
      );

      this.updateInsuranceInfoUseCase = new UpdateInsuranceInfoUseCase(
        this.patientRepository,
        this.eventBus,
        logger
      );

      this.verifyInsuranceUseCase = new VerifyInsuranceUseCase(
        this.patientRepository,
        logger
      );

      this.markAsDeceasedUseCase = new MarkAsDeceasedUseCase(
        this.patientRepository
      );

      this.reactivatePatientUseCase = new ReactivatePatientUseCase(
        this.patientRepository
      );

      this.getPatientStatisticsUseCase = new GetPatientStatisticsUseCase(
        this.patientRepository
      );

      // Initialize Storage Service
      const storageClient = createClient(config.supabaseUrl, config.supabaseKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
      this.storageService = new SupabaseStorageService(storageClient as any, logger);

      // Initialize Photo Use Cases
      this.uploadPatientPhotoUseCase = new UploadPatientPhotoUseCase(
        this.patientRepository,
        this.storageService
      );

      this.getPatientPhotoUseCase = new GetPatientPhotoUseCase(
        this.patientRepository
      );

      this.deletePatientPhotoUseCase = new DeletePatientPhotoUseCase(
        this.patientRepository,
        this.storageService
      );

      // Initialize Communication Preferences Use Cases
      this.updateCommunicationPreferencesUseCase = new UpdateCommunicationPreferencesUseCase(
        this.patientRepository
      );

      this.getCommunicationPreferencesUseCase = new GetCommunicationPreferencesUseCase(
        this.patientRepository
      );

      this.patientQueryHandlers = new PatientQueryHandlers(
        this.getPatientProfileUseCase,
        this.searchPatientsUseCase,
        this.patientRepository,
        logger
      );

      // Initialize Command Handlers (CQRS)
      this.patientCommandHandlers = new PatientCommandHandlers(
        this.registerPatientUseCase,
        this.updatePatientInfoUseCase,
        this.deactivatePatientUseCase,
        this.grantConsentUseCase,
        this.addEmergencyContactUseCase,
        logger
      );

      // Initialize Presentation Layer
      this.patientController = new PatientController(
        logger,
        this.registerPatientUseCase,
        this.updatePatientInfoUseCase,
        this.matchPatientsUseCase,
        this.mergePatientsUseCase,
        this.linkPatientsUseCase,
        this.deactivatePatientUseCase,
        this.validateInsuranceUseCase,
        this.addEmergencyContactUseCase,
        this.getEmergencyContactsUseCase,
        this.updateEmergencyContactUseCase,
        this.removeEmergencyContactUseCase,
        this.setPrimaryEmergencyContactUseCase,
        this.grantConsentUseCase,
        this.getConsentsUseCase,
        this.getConsentDetailsUseCase,
        this.revokeConsentUseCase,
        this.getActiveConsentsUseCase,
        this.getInsuranceInfoUseCase,
        this.updateInsuranceInfoUseCase,
        this.verifyInsuranceUseCase,
        this.markAsDeceasedUseCase,
        this.reactivatePatientUseCase,
        this.getPatientStatisticsUseCase,
        this.uploadPatientPhotoUseCase,
        this.getPatientPhotoUseCase,
        this.deletePatientPhotoUseCase,
        this.updateCommunicationPreferencesUseCase,
        this.getCommunicationPreferencesUseCase,
        this.patientQueryHandlers
      );

      this.commandController = new CommandController(
        logger,
        this.patientCommandHandlers
      );

      this.errorHandlingMiddleware = new ErrorHandlingMiddleware(logger);

      // Initialize Authentication Middleware
      this.authMiddleware = new AuthenticationMiddleware({
        identityServiceUrl: config.identityServiceUrl,
        logger,
        skipPaths: ['/health', '/degradation']
      });

      // Initialize Identity Event Handlers
      const userCreatedHandler = new IdentityUserCreatedEventHandler(
        logger,
        this.patientRepository
      );

      const userDeletedHandler = new IdentityUserDeletedEventHandler(
        logger,
        this.patientRepository
      );

      const userUpdatedHandler = new IdentityUserUpdatedEventHandler(
        logger,
        this.patientRepository
      );

      // Initialize Identity Event Consumer with DLQ support
      this.identityEventConsumer = new IdentityEventConsumer(
        {
          rabbitmqUrl: config.rabbitmqUrl,
          queueName: 'patient.identity.queue',
          exchangeName: 'hospital.events',
          routingKeys: ['user.user_created_event', 'user.user_deleted_event', 'user.user_updated_event'],
          deadLetterExchange: 'hospital.events.dlx',
          deadLetterQueue: 'patient.identity.queue.dlq',
          maxRetries: 3
        },
        logger,
        userCreatedHandler,
        userDeletedHandler,
        userUpdatedHandler
      );

      // Connect Identity Event Consumer
      await this.identityEventConsumer.connect();
      logger.info('Identity event consumer connected');

      logger.info('Dependencies initialized successfully');
    } catch (error) {
      logger.fatal('Failed to initialize dependencies', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
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
   * Setup Express middleware
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
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));

    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later',
      standardHeaders: true,
      legacyHeaders: false
    });
    this.app.use('/api/', limiter);

    // Request logging
    this.app.use((req, _res, next) => {
      logger.info('Incoming request', {
        method: req.method,
        path: req.path,
        ip: req.ip
      });
      next();
    });

    logger.info('Middleware setup complete');
  }

  /**
   * Setup routes
   */
  private setupRoutes(): void {
    logger.info('Setting up routes...');

    // Health check
    this.app.get('/health', async (_req, res) => {
      try {
        const health = await this.healthCheck.checkHealth();
        const statusCode = health.overall === 'HEALTHY' ? 200 : 503;
        res.status(statusCode).json(health);
      } catch (error) {
        logger.error('Health check failed', { error: error instanceof Error ? error.message : 'Unknown error' });
        res.status(503).json({
          overall: 'UNHEALTHY',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date()
        });
      }
    });

    // Degradation status endpoint
    this.app.get('/degradation', (_req, res) => {
      try {
        const status = this.degradationService.getStatus();
        res.status(200).json({
          ...status,
          timestamp: new Date()
        });
      } catch (error) {
        logger.error('Degradation status check failed', { error: error instanceof Error ? error.message : 'Unknown error' });
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date()
        });
      }
    });

    // API routes with authentication
    const patientRoutes = createPatientRoutes(this.patientController);
    this.app.use('/api/v1/patients', this.authMiddleware.authenticate(), patientRoutes);

    // CQRS Command routes with authentication
    const commandRoutes = createCommandRoutes(this.commandController);
    this.app.use('/api/v1/commands', this.authMiddleware.authenticate(), commandRoutes);

    // 404 handler
    this.app.use(this.errorHandlingMiddleware.notFound());

    // Error handling middleware (must be last)
    this.app.use(this.errorHandlingMiddleware.handle());

    logger.info('Routes setup complete');
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    try {
      logger.info(`Starting ${config.serviceName} v${config.version}...`);

      // Initialize dependencies
      await this.initializeDependencies();

      // Setup middleware
      this.setupMiddleware();

      // Setup routes
      this.setupRoutes();

      // Start listening
      this.app.listen(config.port, () => {
        logger.info(`${config.serviceName} is running`, {
          port: config.port,
          environment: config.nodeEnv,
          version: config.version
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
  async shutdown(): Promise<void> {
    logger.info('Shutting down gracefully...');

    try {
      // Close RabbitMQ connection
      if (this.eventPublisher) {
        await this.eventPublisher.close();
        logger.info('Event Publisher closed');
      }

      // Disconnect Identity Event Consumer
      if (this.identityEventConsumer) {
        await this.identityEventConsumer.disconnect();
        logger.info('Identity event consumer disconnected');
      }

      // Close Redis connections
      if (this.cacheService) {
        await this.cacheService.disconnect();
        logger.info('Redis Cache Service disconnected');
      }

      if (this.patientCache) {
        await this.patientCache.disconnect();
        logger.info('Patient Cache disconnected');
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

// Create and start the application
const app = new PatientRegistryServiceApp();

// Handle shutdown signals
process.on('SIGTERM', () => app.shutdown());
process.on('SIGINT', () => app.shutdown());

// Start the service
app.start().catch((error) => {
  logger.fatal('Unhandled error during startup', {
    error: error instanceof Error ? error.message : 'Unknown error'
  });
  process.exit(1);
});
