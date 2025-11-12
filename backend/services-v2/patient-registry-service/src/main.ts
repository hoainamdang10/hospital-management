/**
 * Patient Registry Service V2 - Main Application
 * Production-ready service with Clean Architecture + DDD + CQRS
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, HIPAA, Vietnamese Healthcare Standards
 */

// Load environment variables FIRST
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import compression from "compression";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./infrastructure/swagger/swagger.config";

// Infrastructure imports
import { SupabasePatientRepository } from "./infrastructure/repositories/SupabasePatientRepository";
import { PatientRegistryHealthCheck } from "./infrastructure/monitoring/HealthChecks";
import { prometheusMetrics } from "./infrastructure/monitoring/PrometheusMetrics";
import { RedisCacheService } from "./infrastructure/cache/RedisCacheService";
import { PatientCache } from "./infrastructure/cache/PatientCache";
import { PatientRegistryDegradation } from "./infrastructure/resilience/GracefulDegradation";
import { createOptimizedSupabaseClient } from "@shared/infrastructure/database/optimized-supabase-client";
import type { OptimizedSupabaseClient } from "@shared/infrastructure/database/optimized-supabase-client";
import { SupabaseOutboxRepository } from "./infrastructure/outbox/SupabaseOutboxRepository";
import { OutboxPublisherWorker } from "./infrastructure/outbox/OutboxPublisherWorker";

// Application Services imports
import { PatientMatchingService } from "./application/services/PatientMatchingService";
import { InsuranceValidationService } from "./application/services/InsuranceValidationService";
import { RabbitMQEventPublisher } from "./infrastructure/events/RabbitMQEventPublisher";
import { ILogger } from "@shared/application/services/logger.interface";
import { IEventBus } from "@shared/application/services/event-bus.interface";
import {
  InMemoryEventBus,
  RabbitMQEventBus,
} from "@shared/infrastructure/event-bus/EventBus";
import { validateAndLog } from "./infrastructure/config/validator";
import { createProductionLogger } from "./infrastructure/logging/PinoLogger";

// Application imports
import { RegisterPatientUseCase } from "./application/use-cases/RegisterPatientUseCase";
import { UpdatePatientInfoUseCase } from "./application/use-cases/UpdatePatientInfoUseCase";
import { GetPatientProfileUseCase } from "./application/use-cases/GetPatientProfileUseCase";
import { SearchPatientsUseCase } from "./application/use-cases/SearchPatientsUseCase";
import { MatchPatientsUseCase } from "./application/use-cases/MatchPatientsUseCase";
import { MergePatientsUseCase } from "./application/use-cases/MergePatientsUseCase";
import { LinkPatientsUseCase } from "./application/use-cases/LinkPatientsUseCase";
import { DeactivatePatientUseCase } from "./application/use-cases/DeactivatePatientUseCase";
import { ValidateInsuranceUseCase } from "./application/use-cases/ValidateInsuranceUseCase";
import { AddEmergencyContactUseCase } from "./application/use-cases/AddEmergencyContactUseCase";
import { GetEmergencyContactsUseCase } from "./application/use-cases/GetEmergencyContactsUseCase";
import { UpdateEmergencyContactUseCase } from "./application/use-cases/UpdateEmergencyContactUseCase";
import { RemoveEmergencyContactUseCase } from "./application/use-cases/RemoveEmergencyContactUseCase";
import { SetPrimaryEmergencyContactUseCase } from "./application/use-cases/SetPrimaryEmergencyContactUseCase";
import { GrantConsentUseCase } from "./application/use-cases/GrantConsentUseCase";
import { GetConsentsUseCase } from "./application/use-cases/GetConsentsUseCase";
import { GetConsentDetailsUseCase } from "./application/use-cases/GetConsentDetailsUseCase";
import { RevokeConsentUseCase } from "./application/use-cases/RevokeConsentUseCase";
import { GetActiveConsentsUseCase } from "./application/use-cases/GetActiveConsentsUseCase";
import { GetInsuranceInfoUseCase } from "./application/use-cases/GetInsuranceInfoUseCase";
import { AddInsuranceInfoUseCase } from "./application/use-cases/AddInsuranceInfoUseCase";
import { UpdateInsuranceInfoUseCase } from "./application/use-cases/UpdateInsuranceInfoUseCase";
import { VerifyInsuranceUseCase } from "./application/use-cases/VerifyInsuranceUseCase";
import { MarkAsDeceasedUseCase } from "./application/use-cases/MarkAsDeceasedUseCase";
import { ReactivatePatientUseCase } from "./application/use-cases/ReactivatePatientUseCase";
import { GetPatientStatisticsUseCase } from "./application/use-cases/GetPatientStatisticsUseCase";
import { UploadPatientPhotoUseCase } from "./application/use-cases/UploadPatientPhotoUseCase";
import { GetPatientPhotoUseCase } from "./application/use-cases/GetPatientPhotoUseCase";
import { DeletePatientPhotoUseCase } from "./application/use-cases/DeletePatientPhotoUseCase";
import { UpdateCommunicationPreferencesUseCase } from "./application/use-cases/UpdateCommunicationPreferencesUseCase";
import { GetCommunicationPreferencesUseCase } from "./application/use-cases/GetCommunicationPreferencesUseCase";
import { GetPatientHistoryUseCase } from "./application/use-cases/GetPatientHistoryUseCase";
import { PatientCommandHandlers } from "./application/handlers/PatientCommandHandlers";
import { PatientQueryHandlers } from "./application/handlers/PatientQueryHandlers";

// Infrastructure imports
import { SupabaseStorageService } from "./infrastructure/storage/SupabaseStorageService";
import { AuditService } from "./infrastructure/audit/AuditService";
import {
  IdentityEventConsumer,
  IdentityUserCreatedEventHandler,
  IdentityUserDeletedEventHandler,
  IdentityUserUpdatedEventHandler,
} from "./infrastructure";

// Presentation imports
import { PatientController } from "./presentation/controllers/PatientController";
import { CommandController } from "./presentation/controllers/CommandController";
import { createPatientRoutes } from "./presentation/routes/patientRoutes";
import { createCommandRoutes } from "./presentation/routes/commandRoutes";
import { createHealthRoutes } from "./presentation/routes/healthRoutes";
import { ErrorHandlingMiddleware } from "./presentation/middleware/ErrorHandlingMiddleware";
import { AuthenticationMiddleware } from "./presentation/middleware/AuthenticationMiddleware";
import { AuthorizationMiddleware } from "./presentation/middleware/AuthorizationMiddleware";

// Configuration
const config = {
  port: process.env.PORT || 3023,
  supabaseUrl: process.env.SUPABASE_URL || "",
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  rabbitmqUrl: process.env.RABBITMQ_URL || "amqp://admin:admin@localhost:5673",
  rabbitmqExchange: process.env.RABBITMQ_EXCHANGE || "hospital.events",
  redisUrl: process.env.REDIS_URL || "redis://localhost:6380",
  nodeEnv: process.env.NODE_ENV || "development",
  serviceName: "patient-registry-service",
  version: "2.0.0",
  allowedOrigins: (
    process.env.ALLOWED_ORIGINS || "http://localhost:3000"
  ).split(","),
  identityServiceUrl:
    process.env.IDENTITY_SERVICE_URL || "http://localhost:3021",
};

const rabbitmqConnectionRetries = Number(
  process.env.RABBITMQ_CONNECT_MAX_RETRIES || 5,
);
const rabbitmqConnectionRetryDelayMs = Number(
  process.env.RABBITMQ_CONNECT_RETRY_DELAY_MS || 3000,
);

// Logger setup - HIPAA-compliant Pino logger with PHI/PII redaction
const logger: ILogger = createProductionLogger(config.serviceName);

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
  private optimizedSupabase!: OptimizedSupabaseClient;
  private supabaseClient!: any; // Raw Supabase client for PatientId generation
  private identityEventConsumer!: any; // IdentityEventConsumer
  private outboxRepository!: SupabaseOutboxRepository;
  private outboxWorker!: OutboxPublisherWorker;

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
  private addInsuranceInfoUseCase!: AddInsuranceInfoUseCase;
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
  private getPatientHistoryUseCase!: GetPatientHistoryUseCase;

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
  private authorizationMiddleware!: AuthorizationMiddleware;

  constructor() {
    this.app = express();
  }

  /**
   * Initialize all dependencies
   */
  private async initializeDependencies(): Promise<void> {
    logger.info("Initializing dependencies...");

    try {
      // Validate environment configuration (fail-fast)
      validateAndLog(logger);

      // Validate configuration
      this.validateConfiguration();

      const exchangeName = config.rabbitmqExchange;

      // Initialize Event Publisher
      this.eventPublisher = new RabbitMQEventPublisher(
        {
          url: config.rabbitmqUrl,
          exchange: exchangeName,
          exchangeType: "topic",
          durable: true,
          autoDelete: false,
          serviceName: "patient-registry",
          connectionRetries: rabbitmqConnectionRetries,
          connectionRetryDelayMs: rabbitmqConnectionRetryDelayMs,
        },
        {
          enableRetry: true,
          maxRetries: 3,
          retryDelayMs: 1000,
          enableLogging: true,
        },
        logger,
      );

      // Connect to RabbitMQ
      await this.eventPublisher.connect();

      // Initialize EventBus (RabbitMQEventBus for production, InMemoryEventBus for test)
      if (config.nodeEnv === "test") {
        this.eventBus = new InMemoryEventBus();
        await this.eventBus.connect();
        logger.info("EventBus initialized (InMemoryEventBus for testing)", {});
      } else {
        this.eventBus = new RabbitMQEventBus({
          rabbitmqUrl: config.rabbitmqUrl,
          exchangeName,
          serviceName: config.serviceName,
        });
        await this.eventBus.connect();
        logger.info("EventBus initialized (RabbitMQEventBus)", {
          url: config.rabbitmqUrl.replace(/:[^:@]+@/, ":****@"), // Hide password
          exchange: exchangeName,
        });
      }

      // Initialize Redis Cache Service (optional)
      try {
        this.cacheService = new RedisCacheService(config.redisUrl, logger);
        await this.cacheService.connect();
        logger.info("Redis cache service initialized and connected", {});
      } catch (error) {
        logger.warn("Redis cache not available, running without cache", {
          error,
        });
        this.cacheService = null;
      }

      // Initialize Patient Cache (L1/L2)
      this.patientCache = new PatientCache(config.redisUrl);
      try {
        await this.patientCache.connect();
        logger.info("Patient cache connected successfully", {});
      } catch (error) {
        logger.error("Failed to connect Patient Cache", {
          error: error instanceof Error ? error.message : "Unknown error",
        });
        logger.warn(
          "Continuing without patient caching - patients will be fetched from database",
          {},
        );
      }

      // Initialize Application Services (Domain Services)
      this.matchingService = new PatientMatchingService(logger);
      this.insuranceValidationService = new InsuranceValidationService(logger);

      this.optimizedSupabase = createOptimizedSupabaseClient({
        supabaseUrl: config.supabaseUrl,
        supabaseServiceKey: config.supabaseKey,
        serviceName: config.serviceName,
        schemaName: "patient_schema",
        enableOptimizations: config.nodeEnv !== "test",
      });

      // Store raw Supabase client for PatientId generation
      this.supabaseClient = this.optimizedSupabase.getConnection();

      // Initialize Audit Service
      // Type cast needed due to duplicate @supabase/supabase-js in root and service node_modules
      this.auditService = new AuditService(
        this.optimizedSupabase.getConnection() as any,
        logger,
      );
      logger.info("Audit service initialized", {});

      // Initialize Outbox Repository
      this.outboxRepository = new SupabaseOutboxRepository(
        this.optimizedSupabase.getConnection() as any,
        logger,
      );
      logger.info("Outbox repository initialized", {});

      // Initialize Infrastructure Layer (inject services + event publisher + outbox)
      this.patientRepository = new SupabasePatientRepository(
        this.optimizedSupabase,
        logger,
        this.matchingService, // ✅ Inject matching service
        this.eventPublisher, // ✅ Inject event publisher (fallback)
        this.patientCache, // ✅ Inject patient cache (L1/L2)
        this.outboxRepository, // ✅ Inject outbox repository (primary)
      );

      // Initialize degradation service with real repository (BEFORE health check)
      this.degradationService = new PatientRegistryDegradation(
        {
          enableReadOnlyFallback: true,
          enableCacheFallback: true,
          enableEmergencyMode: true,
          maxDegradationTime: 300000, // 5 minutes
        },
        {
          supabaseUrl: config.supabaseUrl,
          supabaseServiceRoleKey: config.supabaseKey,
        },
        logger,
        this.patientRepository, // ✅ Inject real repository
      );
      logger.info("Degradation service initialized with real repository", {});

      // Initialize Health Check Service (AFTER degradation service)
      this.healthCheck = new PatientRegistryHealthCheck(
        config.supabaseUrl,
        config.supabaseKey,
        this.degradationService,
      );
      logger.info("Health check service initialized", {});

      // Initialize Application Layer (Use Cases)
      this.registerPatientUseCase = new RegisterPatientUseCase(
        this.patientRepository,
        this.eventBus,
        logger,
        this.auditService,
        this.supabaseClient,
      );

      this.updatePatientInfoUseCase = new UpdatePatientInfoUseCase(
        this.patientRepository,
        this.eventBus,
        logger,
        this.auditService,
      );

      this.getPatientProfileUseCase = new GetPatientProfileUseCase(
        this.patientRepository,
        logger,
        this.auditService,
      );

      this.searchPatientsUseCase = new SearchPatientsUseCase(
        this.patientRepository,
      );

      this.matchPatientsUseCase = new MatchPatientsUseCase(
        this.patientRepository,
        this.matchingService,
        logger,
      );

      this.mergePatientsUseCase = new MergePatientsUseCase(
        this.patientRepository,
      );

      this.linkPatientsUseCase = new LinkPatientsUseCase(
        this.patientRepository,
      );

      this.deactivatePatientUseCase = new DeactivatePatientUseCase(
        this.patientRepository,
        this.eventBus,
        logger,
        this.auditService,
      );

      this.validateInsuranceUseCase = new ValidateInsuranceUseCase(
        this.patientRepository,
        this.insuranceValidationService,
        logger,
      );

      this.addEmergencyContactUseCase = new AddEmergencyContactUseCase(
        this.patientRepository,
        this.eventBus,
        logger,
        this.auditService,
      );

      this.getEmergencyContactsUseCase = new GetEmergencyContactsUseCase(
        this.patientRepository,
        logger,
      );

      this.updateEmergencyContactUseCase = new UpdateEmergencyContactUseCase(
        this.patientRepository,
        this.eventBus,
        logger,
      );

      this.removeEmergencyContactUseCase = new RemoveEmergencyContactUseCase(
        this.patientRepository,
        this.eventBus,
        logger,
        this.auditService,
      );

      this.setPrimaryEmergencyContactUseCase =
        new SetPrimaryEmergencyContactUseCase(
          this.patientRepository,
          this.eventBus,
          logger,
        );

      this.grantConsentUseCase = new GrantConsentUseCase(
        this.patientRepository,
        this.auditService,
        logger,
      );

      this.getConsentsUseCase = new GetConsentsUseCase(
        this.patientRepository,
        logger,
      );

      this.getConsentDetailsUseCase = new GetConsentDetailsUseCase(
        this.patientRepository,
        logger,
      );

      this.revokeConsentUseCase = new RevokeConsentUseCase(
        this.patientRepository,
        this.eventBus,
        logger,
        this.auditService,
      );

      this.getActiveConsentsUseCase = new GetActiveConsentsUseCase(
        this.patientRepository,
        logger,
      );

      this.getInsuranceInfoUseCase = new GetInsuranceInfoUseCase(
        this.patientRepository,
        logger,
      );

      this.addInsuranceInfoUseCase = new AddInsuranceInfoUseCase(
        this.patientRepository,
        logger,
      );

      this.updateInsuranceInfoUseCase = new UpdateInsuranceInfoUseCase(
        this.patientRepository,
        this.eventBus,
        logger,
      );

      this.verifyInsuranceUseCase = new VerifyInsuranceUseCase(
        this.patientRepository,
        logger,
      );

      this.markAsDeceasedUseCase = new MarkAsDeceasedUseCase(
        this.patientRepository,
      );

      this.reactivatePatientUseCase = new ReactivatePatientUseCase(
        this.patientRepository,
      );

      this.getPatientStatisticsUseCase = new GetPatientStatisticsUseCase(
        this.patientRepository,
      );

      // Initialize Storage Service
      // Type cast needed due to duplicate @supabase/supabase-js in root and service node_modules
      this.storageService = new SupabaseStorageService(
        this.optimizedSupabase.getConnection() as any,
        logger,
      );

      // Initialize Photo Use Cases
      this.uploadPatientPhotoUseCase = new UploadPatientPhotoUseCase(
        this.patientRepository,
        this.storageService,
      );

      this.getPatientPhotoUseCase = new GetPatientPhotoUseCase(
        this.patientRepository,
      );

      this.deletePatientPhotoUseCase = new DeletePatientPhotoUseCase(
        this.patientRepository,
        this.storageService,
      );

      // Initialize Communication Preferences Use Cases
      this.updateCommunicationPreferencesUseCase =
        new UpdateCommunicationPreferencesUseCase(this.patientRepository);

      this.getCommunicationPreferencesUseCase =
        new GetCommunicationPreferencesUseCase(this.patientRepository);

      // Initialize Patient History Use Case
      this.getPatientHistoryUseCase = new GetPatientHistoryUseCase(
        this.patientRepository,
        logger,
      );

      this.patientQueryHandlers = new PatientQueryHandlers(
        this.getPatientProfileUseCase,
        this.searchPatientsUseCase,
        this.patientRepository,
        logger,
      );

      // Initialize Command Handlers (CQRS)
      this.patientCommandHandlers = new PatientCommandHandlers(
        this.registerPatientUseCase,
        this.updatePatientInfoUseCase,
        this.deactivatePatientUseCase,
        this.grantConsentUseCase,
        this.addEmergencyContactUseCase,
        logger,
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
        this.addInsuranceInfoUseCase,
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
        this.getPatientHistoryUseCase,
        this.patientQueryHandlers,
      );

      this.commandController = new CommandController(
        logger,
        this.patientCommandHandlers,
      );

      this.errorHandlingMiddleware = new ErrorHandlingMiddleware(logger);

      // Initialize Authentication Middleware
      this.authMiddleware = new AuthenticationMiddleware({
        identityServiceUrl: config.identityServiceUrl,
        logger,
        skipPaths: ["/health", "/degradation"],
      });

      // Initialize Authorization Middleware (Smart Ownership-based)
      this.authorizationMiddleware = new AuthorizationMiddleware({
        logger,
        patientRepository: this.patientRepository,
      });

      // Initialize Identity Event Handlers
      const userCreatedHandler = new IdentityUserCreatedEventHandler(
        logger,
        this.patientRepository,
      );

      const userDeletedHandler = new IdentityUserDeletedEventHandler(
        logger,
        this.patientRepository,
      );

      const userUpdatedHandler = new IdentityUserUpdatedEventHandler(
        logger,
        this.patientRepository,
      );

      // Initialize Identity Event Consumer with DLQ support
      this.identityEventConsumer = new IdentityEventConsumer(
        {
          rabbitmqUrl: config.rabbitmqUrl,
          queueName: "patient.identity.queue",
          exchangeName: "hospital.events",
          routingKeys: [
            "user.created.event",      // UserCreatedEvent
            "user.deleted.event",      // UserDeletedEvent
            "user.updated.event",      // UserUpdatedEvent
            "user.activated.event",    // UserActivatedEvent (bonus)
          ],
          deadLetterExchange: "hospital.events.dlx",
          deadLetterQueue: "patient.identity.queue.dlq",
          maxRetries: 3,
          connectionRetries: rabbitmqConnectionRetries,
          connectionRetryDelayMs: rabbitmqConnectionRetryDelayMs,
        },
        logger,
        userCreatedHandler,
        userDeletedHandler,
        userUpdatedHandler,
        this.auditService, // ✅ Inject audit service for idempotent event handling
      );

      // Connect Identity Event Consumer
      await this.identityEventConsumer.connect();
      logger.info("Identity event consumer connected");

      logger.info("Dependencies initialized successfully");
    } catch (error) {
      logger.fatal("Failed to initialize dependencies", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Validate configuration
   */
  private validateConfiguration(): void {
    const requiredEnvVars = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];

    const missingVars = requiredEnvVars.filter(
      (varName) => !process.env[varName],
    );

    if (missingVars.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missingVars.join(", ")}`,
      );
    }

    logger.info("Configuration validated successfully");
  }

  /**
   * Setup Express middleware
   */
  private setupMiddleware(): void {
    logger.info("Setting up middleware...");

    // Security middleware
    this.app.use(
      helmet({
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
          preload: true,
        },
      }),
    );

    // CORS
    this.app.use(
      cors({
        origin: config.allowedOrigins,
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
      }),
    );

    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));

    // Rate limiting (DISABLED FOR DEVELOPMENT)
    // if (process.env.NODE_ENV !== "test") {
    //   const limiter = rateLimit({
    //     windowMs: 15 * 60 * 1000, // 15 minutes
    //     max: 100, // limit each IP to 100 requests per windowMs
    //     message: "Too many requests from this IP, please try again later",
    //     standardHeaders: true,
    //     legacyHeaders: false,
    //   });
    //   this.app.use("/api/", limiter);
    //   logger.info("Rate limiting enabled", {
    //     windowMs: "15 minutes",
    //     maxRequests: 100,
    //   });
    // } else {
    logger.info("Rate limiting DISABLED for development");
    // }

    // Request logging
    this.app.use((req, _res, next) => {
      logger.info("Incoming request", {
        method: req.method,
        path: req.path,
        ip: req.ip,
      });
      next();
    });

    logger.info("Middleware setup complete");
  }

  /**
   * Setup routes
   */
  private setupRoutes(): void {
    logger.info("Setting up routes...");

    // Health & Metrics routes
    const healthRoutes = createHealthRoutes({
      healthCheck: this.healthCheck,
      logger,
    });
    this.app.use("/", healthRoutes);

    // Prometheus metrics endpoint
    this.app.get("/metrics", async (_req, res) => {
      try {
        res.set("Content-Type", "text/plain; version=0.0.4; charset=utf-8");
        const metrics = await prometheusMetrics.getMetrics();
        res.send(metrics);
      } catch (error) {
        logger.error("Failed to generate metrics", { error });
        res.status(500).send("Failed to generate metrics");
      }
    });
    logger.info("Prometheus metrics endpoint registered at /metrics");

    // Swagger API Documentation
    // Accessible at: http://localhost:3023/api-docs
    this.app.use("/api-docs", swaggerUi.serve);
    this.app.get(
      "/api-docs",
      swaggerUi.setup(swaggerSpec, {
        customSiteTitle: "Patient Registry Service API",
        customCss: ".swagger-ui .topbar { display: none }",
        swaggerOptions: {
          persistAuthorization: true,
          displayRequestDuration: true,
          filter: true,
          tryItOutEnabled: true,
        },
      }),
    );

    // OpenAPI JSON spec
    this.app.get("/api-docs/json", (_req, res) => {
      res.setHeader("Content-Type", "application/json");
      res.send(swaggerSpec);
    });

    logger.info(
      "Swagger UI available at http://localhost:" + config.port + "/api-docs",
    );

    // Degradation status endpoint
    this.app.get("/degradation", (_req, res) => {
      try {
        const status = this.degradationService.getStatus();
        res.status(200).json({
          ...status,
          timestamp: new Date(),
        });
      } catch (error) {
        logger.error("Degradation status check failed", {
          error: error instanceof Error ? error.message : "Unknown error",
        });
        res.status(500).json({
          error: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date(),
        });
      }
    });

    // API routes with authentication
    const patientRoutes = createPatientRoutes(
      this.patientController,
      this.authorizationMiddleware,
    );
    this.app.use(
      "/api/v1/patients",
      this.authMiddleware.authenticate(),
      patientRoutes,
    );

    // CQRS Command routes with authentication
    const commandRoutes = createCommandRoutes(this.commandController);
    this.app.use(
      "/api/v1/commands",
      this.authMiddleware.authenticate(),
      commandRoutes,
    );

    // 404 handler
    this.app.use(this.errorHandlingMiddleware.notFound());

    // Error handling middleware (must be last)
    this.app.use(this.errorHandlingMiddleware.handle());

    logger.info("Routes setup complete");
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

      // Start Outbox Publisher Worker
      await this.startOutboxWorker();

      // Start listening
      this.app.listen(config.port, () => {
        logger.info(`${config.serviceName} is running`, {
          port: config.port,
          environment: config.nodeEnv,
          version: config.version,
        });
      });
    } catch (error) {
      logger.fatal("Failed to start service", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      process.exit(1);
    }
  }

  /**
   * Start Outbox Publisher Worker
   */
  private async startOutboxWorker(): Promise<void> {
    try {
      // Initialize outbox worker
      this.outboxWorker = new OutboxPublisherWorker(
        this.outboxRepository,
        logger,
        async (event) => {
          // Publish event to RabbitMQ
          await this.eventPublisher.publish(event);
        },
        {
          enabled: config.nodeEnv !== "test", // Disable in test environment
          pollingIntervalMs: 5000, // Poll every 5 seconds
          batchSize: 50, // Process 50 events per batch
        },
      );

      await this.outboxWorker.start();
      logger.info("Outbox publisher worker started", {
        pollingIntervalMs: 5000,
        batchSize: 50,
      });
    } catch (error) {
      logger.error("Failed to start outbox worker", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      // Don't fail service startup if outbox worker fails
      // Events will accumulate in outbox table and can be processed later
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    logger.info("Shutting down gracefully...");

    try {
      // Stop Outbox Worker
      if (this.outboxWorker) {
        await this.outboxWorker.stop();
        logger.info("Outbox worker stopped");
      }

      // Close RabbitMQ connection
      if (this.eventPublisher) {
        await this.eventPublisher.close();
        logger.info("Event Publisher closed");
      }

      // Disconnect Identity Event Consumer
      if (this.identityEventConsumer) {
        await this.identityEventConsumer.disconnect();
        logger.info("Identity event consumer disconnected");
      }

      // Close Redis connections
      if (this.cacheService) {
        await this.cacheService.disconnect();
        logger.info("Redis Cache Service disconnected");
      }

      if (this.patientCache) {
        await this.patientCache.disconnect();
        logger.info("Patient Cache disconnected");
      }

      if (this.optimizedSupabase) {
        await this.optimizedSupabase.close();
        logger.info("Supabase client closed");
      }

      logger.info("Graceful shutdown complete");
      process.exit(0);
    } catch (error) {
      logger.error("Error during shutdown", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      process.exit(1);
    }
  }
}

// Create and start the application
const app = new PatientRegistryServiceApp();

// Handle shutdown signals
process.on("SIGTERM", () => app.shutdown());
process.on("SIGINT", () => app.shutdown());

// Start the service
app.start().catch((error) => {
  logger.fatal("Unhandled error during startup", {
    error: error instanceof Error ? error.message : "Unknown error",
  });
  process.exit(1);
});
