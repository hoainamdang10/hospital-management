/**
 * App Factory for Integration Tests
 *
 * Creates and configures Express app instance for testing
 * without starting the actual server
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { createClient } from "@supabase/supabase-js";

// Infrastructure imports
import { SupabasePatientRepository } from "../../src/infrastructure/repositories/SupabasePatientRepository";
import { InMemoryPatientRepository } from "./InMemoryPatientRepository";
import { IPatientRepository } from "../../src/domain/repositories/IPatientRepository";
import { RabbitMQEventPublisher } from "../../src/infrastructure/events/RabbitMQEventPublisher";

// Application Services
import { PatientMatchingService } from "../../src/application/services/PatientMatchingService";
import { InsuranceValidationService } from "../../src/application/services/InsuranceValidationService";

// Use Cases
import { RegisterPatientUseCase } from "../../src/application/use-cases/RegisterPatientUseCase";
import { UpdatePatientInfoUseCase } from "../../src/application/use-cases/UpdatePatientInfoUseCase";
import { GetPatientProfileUseCase } from "../../src/application/use-cases/GetPatientProfileUseCase";
import { SearchPatientsUseCase } from "../../src/application/use-cases/SearchPatientsUseCase";
/* POST-MVP: Archived use case imports - Not required for graduation project
import { MatchPatientsUseCase } from '../../src/application/use-cases/MatchPatientsUseCase';
import { MergePatientsUseCase } from '../../src/application/use-cases/MergePatientsUseCase';
import { LinkPatientsUseCase } from '../../src/application/use-cases/LinkPatientsUseCase';
import { DeactivatePatientUseCase } from '../../src/application/use-cases/DeactivatePatientUseCase';
END POST-MVP */
import { ValidateInsuranceUseCase } from "../../src/application/use-cases/ValidateInsuranceUseCase";
import { AddEmergencyContactUseCase } from "../../src/application/use-cases/AddEmergencyContactUseCase";
/* POST-MVP: Archived use case imports - Not required for graduation project
import { GrantConsentUseCase } from '../../src/application/use-cases/GrantConsentUseCase';
import { MarkAsDeceasedUseCase } from '../../src/application/use-cases/MarkAsDeceasedUseCase';
import { ReactivatePatientUseCase } from '../../src/application/use-cases/ReactivatePatientUseCase';
END POST-MVP */
import { GetEmergencyContactsUseCase } from "../../src/application/use-cases/GetEmergencyContactsUseCase";
import { UpdateEmergencyContactUseCase } from "../../src/application/use-cases/UpdateEmergencyContactUseCase";
/* POST-MVP: Archived use case imports - Not required for graduation project
import { RemoveEmergencyContactUseCase } from '../../src/application/use-cases/RemoveEmergencyContactUseCase';
import { SetPrimaryEmergencyContactUseCase } from '../../src/application/use-cases/SetPrimaryEmergencyContactUseCase';
import { GetConsentsUseCase } from '../../src/application/use-cases/GetConsentsUseCase';
import { GetConsentDetailsUseCase } from '../../src/application/use-cases/GetConsentDetailsUseCase';
import { RevokeConsentUseCase } from '../../src/application/use-cases/RevokeConsentUseCase';
import { GetActiveConsentsUseCase } from '../../src/application/use-cases/GetActiveConsentsUseCase';
END POST-MVP */
import { GetInsuranceInfoUseCase } from "../../src/application/use-cases/GetInsuranceInfoUseCase";
import { AddInsuranceInfoUseCase } from "../../src/application/use-cases/AddInsuranceInfoUseCase";
import { UpdateInsuranceInfoUseCase } from "../../src/application/use-cases/UpdateInsuranceInfoUseCase";
import { VerifyInsuranceUseCase } from "../../src/application/use-cases/VerifyInsuranceUseCase";
import { GetPatientStatisticsUseCase } from "../../src/application/use-cases/GetPatientStatisticsUseCase";
/* POST-MVP: Archived use case imports - Not required for graduation project
import { UploadPatientPhotoUseCase } from '../../src/application/use-cases/UploadPatientPhotoUseCase';
import { GetPatientPhotoUseCase } from '../../src/application/use-cases/GetPatientPhotoUseCase';
import { DeletePatientPhotoUseCase } from '../../src/application/use-cases/DeletePatientPhotoUseCase';
import { UpdateCommunicationPreferencesUseCase } from '../../src/application/use-cases/UpdateCommunicationPreferencesUseCase';
import { GetCommunicationPreferencesUseCase } from '../../src/application/use-cases/GetCommunicationPreferencesUseCase';
import { GetPatientHistoryUseCase } from '../../src/application/use-cases/GetPatientHistoryUseCase';
END POST-MVP */
import { PatientCommandHandlers } from "../../src/application/handlers/PatientCommandHandlers";
import { PatientQueryHandlers } from "../../src/application/handlers/PatientQueryHandlers";

// Presentation
import { PatientController } from "../../src/presentation/controllers/PatientController";
import { CommandController } from "../../src/presentation/controllers/CommandController";
import { createPatientRoutes } from "../../src/presentation/routes/patientRoutes";
import { createCommandRoutes } from "../../src/presentation/routes/commandRoutes";
import { ErrorHandlingMiddleware } from "../../src/presentation/middleware/ErrorHandlingMiddleware";
import { AuthenticationMiddleware } from "../../src/presentation/middleware/AuthenticationMiddleware";
import { ensureIdentityMockServer } from "./identityMockServer";

// Logger
import {
  ILogger,
  LogMetadata as _LogMetadata,
} from "@shared/application/services/logger.interface";
import { IEventBus } from "@shared/application/services/event-bus.interface";
import { PatientCache } from "../../src/infrastructure/cache/PatientCache";
import { AuditService } from "../../src/infrastructure/audit/AuditService";
import { SupabaseOutboxRepository } from "../../src/infrastructure/outbox/SupabaseOutboxRepository";
import { SupabaseStorageService } from "../../src/infrastructure/storage/SupabaseStorageService";

/**
 * Test Logger - Silent logger for tests
 */
const createTestLogger = (): ILogger => ({
  debug: () => {}, // eslint-disable-line @typescript-eslint/no-empty-function -- Silent for tests
  info: () => {}, // eslint-disable-line @typescript-eslint/no-empty-function -- Silent for tests
  warn: (...args: unknown[]) => console.warn("[TestLogger][WARN]", ...args),
  error: (...args: unknown[]) => console.error("[TestLogger][ERROR]", ...args),
  fatal: (...args: unknown[]) => console.error("[TestLogger][FATAL]", ...args),
});

/**
 * App Factory Configuration
 */
export interface AppFactoryConfig {
  supabaseUrl: string;
  supabaseKey: string;
  rabbitmqUrl?: string;
  enableRabbitMQ?: boolean;
  enableAuthentication?: boolean;
  identityServiceUrl?: string;
  logger?: ILogger;
  useInMemoryRepository?: boolean;
}

/**
 * App Factory Result
 */
export interface AppFactoryResult {
  app: Application;
  cleanup: () => Promise<void>;
  eventPublisher?: RabbitMQEventPublisher;
  patientRepository: IPatientRepository;
  inMemoryRepository?: InMemoryPatientRepository;
}

/**
 * Create Express app for testing
 */
export async function createTestApp(
  config: AppFactoryConfig,
): Promise<AppFactoryResult> {
  const app = express();
  const logger = config.logger || createTestLogger();
  const previousIdentityServiceUrl = process.env.IDENTITY_SERVICE_URL;
  const previousIdentityUseMock = process.env.IDENTITY_USE_MOCK;

  // Initialize Event Publisher (optional for tests)
  let eventPublisher: RabbitMQEventPublisher | undefined;

  if (config.enableRabbitMQ && config.rabbitmqUrl) {
    eventPublisher = new RabbitMQEventPublisher(
      {
        url: config.rabbitmqUrl,
        exchange: "patient-registry-events-test",
        exchangeType: "topic",
        durable: false,
        autoDelete: true,
        serviceName: "patient-registry",
      },
      {
        enableRetry: false,
        maxRetries: 1,
        retryDelayMs: 100,
        enableLogging: false,
      },
      logger,
    );

    try {
      await eventPublisher.connect();
    } catch (error) {
      console.warn(
        "⚠️  RabbitMQ not available for tests, continuing without event publishing",
      );
      eventPublisher = undefined;
    }
  }

  // Initialize Application Services
  const matchingService = new PatientMatchingService(logger);
  const insuranceValidationService = new InsuranceValidationService(logger);

  // Initialize Cache (optional for tests)
  const redisUrl = process.env.REDIS_URL || "redis://localhost:6380";
  const patientCache = new PatientCache(redisUrl);

  // Initialize Audit Service (optional for tests)
  const supabaseClient = createClient(config.supabaseUrl, config.supabaseKey);
  const auditService = new AuditService(supabaseClient, logger);

  // Initialize Repository
  let patientRepository: IPatientRepository;
  if (config.useInMemoryRepository) {
    patientRepository = new InMemoryPatientRepository();
  } else {
    // Create OptimizedSupabaseClient for SupabasePatientRepository
    const { createOptimizedSupabaseClient } = await import(
      "@shared/infrastructure/database/optimized-supabase-client"
    );
    const optimizedClient = createOptimizedSupabaseClient({
      supabaseUrl: config.supabaseUrl,
      supabaseServiceKey: config.supabaseKey,
      serviceName: "patient-registry-service",
      schemaName: "patient_schema",
      enableOptimizations: false, // Disable for tests
    });

    // Create Outbox Repository for tests
    const outboxRepository = new SupabaseOutboxRepository(
      supabaseClient,
      logger,
    );

    patientRepository = new SupabasePatientRepository(
      optimizedClient,
      logger,
      matchingService,
      eventPublisher,
      patientCache,
      outboxRepository, // ✅ Inject outbox repository
    );
  }

  // Create mock event bus for tests (if no RabbitMQ)
  const mockEventBus = {
    connect: async () => {}, // eslint-disable-line @typescript-eslint/no-empty-function -- Mock for tests
    disconnect: async () => {}, // eslint-disable-line @typescript-eslint/no-empty-function -- Mock for tests
    publish: async () => {}, // eslint-disable-line @typescript-eslint/no-empty-function -- Mock for tests
    subscribe: async () => {}, // eslint-disable-line @typescript-eslint/no-empty-function -- Mock for tests
  };

  const eventBus = eventPublisher || mockEventBus;

  // Mock SupabaseClient for tests
  const mockSupabaseClient = createClient(
    "https://mock.supabase.co",
    "mock-key",
  );

  // Initialize Use Cases
  const registerPatientUseCase = new RegisterPatientUseCase(
    patientRepository,
    eventBus as IEventBus,
    logger,
    auditService,
    mockSupabaseClient,
  );
  const updatePatientInfoUseCase = new UpdatePatientInfoUseCase(
    patientRepository,
    eventBus as IEventBus,
    logger,
    auditService,
  );
  const getPatientProfileUseCase = new GetPatientProfileUseCase(
    patientRepository,
    logger,
    auditService,
  );
  const searchPatientsUseCase = new SearchPatientsUseCase(patientRepository);
  /* POST-MVP: Archived use case instantiations - Not required for graduation project
  const matchPatientsUseCase = new MatchPatientsUseCase(patientRepository, matchingService, logger);
  const mergePatientsUseCase = new MergePatientsUseCase(patientRepository);
  const linkPatientsUseCase = new LinkPatientsUseCase(patientRepository);
  const deactivatePatientUseCase = new DeactivatePatientUseCase(
    patientRepository,
    eventBus as IEventBus,
    logger,
    auditService
  );
  END POST-MVP */
  const validateInsuranceUseCase = new ValidateInsuranceUseCase(
    patientRepository,
    insuranceValidationService,
    logger,
  );
  const addEmergencyContactUseCase = new AddEmergencyContactUseCase(
    patientRepository,
    eventBus as IEventBus,
    logger,
    auditService,
  );
  /* POST-MVP: Archived use case instantiations - Not required for graduation project
  const grantConsentUseCase = new GrantConsentUseCase(patientRepository, auditService, logger);
  const markAsDeceasedUseCase = new MarkAsDeceasedUseCase(patientRepository);
  const reactivatePatientUseCase = new ReactivatePatientUseCase(patientRepository);
  END POST-MVP */

  // New use cases
  const getEmergencyContactsUseCase = new GetEmergencyContactsUseCase(
    patientRepository,
    logger,
  );
  const updateEmergencyContactUseCase = new UpdateEmergencyContactUseCase(
    patientRepository,
    eventBus as IEventBus,
    logger,
  );
  /* POST-MVP: Archived use case instantiations - Not required for graduation project
  const removeEmergencyContactUseCase = new RemoveEmergencyContactUseCase(
    patientRepository,
    eventBus as IEventBus,
    logger,
    auditService
  );
  const setPrimaryEmergencyContactUseCase = new SetPrimaryEmergencyContactUseCase(
    patientRepository,
    eventBus as IEventBus,
    logger
  );
  const getConsentsUseCase = new GetConsentsUseCase(patientRepository, logger);
  const getConsentDetailsUseCase = new GetConsentDetailsUseCase(patientRepository, logger);
  const revokeConsentUseCase = new RevokeConsentUseCase(
    patientRepository,
    eventBus as IEventBus,
    logger,
    auditService
  );
  const getActiveConsentsUseCase = new GetActiveConsentsUseCase(patientRepository, logger);
  END POST-MVP */
  const getInsuranceInfoUseCase = new GetInsuranceInfoUseCase(
    patientRepository,
    logger,
  );
  const addInsuranceInfoUseCase = new AddInsuranceInfoUseCase(
    patientRepository,
    logger,
  );
  const updateInsuranceInfoUseCase = new UpdateInsuranceInfoUseCase(
    patientRepository,
    eventBus as IEventBus,
    logger,
  );
  const verifyInsuranceUseCase = new VerifyInsuranceUseCase(
    patientRepository,
    logger,
  );
  const getPatientStatisticsUseCase = new GetPatientStatisticsUseCase(
    patientRepository,
  );

  /* POST-MVP: Archived use case instantiations - Not required for graduation project

  // Mock storage service for photo use cases
  const mockStorageService = {
    bucketName: 'test-bucket',
    supabaseClient: null,
    logger: logger,
    uploadPatientPhoto: jest.fn(),
    getPatientPhoto: jest.fn(),
    deletePatientPhoto: jest.fn(),
    deleteAllPatientPhotos: jest.fn(),
    ensureBucketExists: jest.fn()
  } as unknown as SupabaseStorageService;

  const uploadPatientPhotoUseCase = new UploadPatientPhotoUseCase(patientRepository, mockStorageService);
  const getPatientPhotoUseCase = new GetPatientPhotoUseCase(patientRepository);
  const deletePatientPhotoUseCase = new DeletePatientPhotoUseCase(patientRepository, mockStorageService);
  const updateCommunicationPreferencesUseCase = new UpdateCommunicationPreferencesUseCase(patientRepository);
  const getCommunicationPreferencesUseCase = new GetCommunicationPreferencesUseCase(patientRepository);
  const getPatientHistoryUseCase = new GetPatientHistoryUseCase(patientRepository, logger);
  END POST-MVP */

  const patientQueryHandlers = new PatientQueryHandlers(
    getPatientProfileUseCase,
    searchPatientsUseCase,
    patientRepository,
    logger,
  );

  // Initialize Command Handlers
  const patientCommandHandlers = new PatientCommandHandlers(
    registerPatientUseCase,
    updatePatientInfoUseCase,
    /* POST-MVP: Archived use cases - Not required for graduation project
    deactivatePatientUseCase,
    grantConsentUseCase,
    END POST-MVP */
    addEmergencyContactUseCase,
    logger,
  );

  // Initialize Controllers
  const patientController = new PatientController(
    logger,
    registerPatientUseCase,
    updatePatientInfoUseCase,
    patientQueryHandlers,
    /* POST-MVP: Archived use case constructor parameters - Not required for graduation project
    matchPatientsUseCase,
    mergePatientsUseCase,
    linkPatientsUseCase,
    deactivatePatientUseCase,
    END POST-MVP */
    validateInsuranceUseCase,
    getInsuranceInfoUseCase,
    addInsuranceInfoUseCase,
    updateInsuranceInfoUseCase,
    verifyInsuranceUseCase,
    addEmergencyContactUseCase,
    getEmergencyContactsUseCase,
    updateEmergencyContactUseCase,
    getPatientStatisticsUseCase,
    /* POST-MVP: Archived use case constructor parameters - Not required for graduation project
    removeEmergencyContactUseCase,
    setPrimaryEmergencyContactUseCase,
    grantConsentUseCase,
    getConsentsUseCase,
    getConsentDetailsUseCase,
    revokeConsentUseCase,
    getActiveConsentsUseCase,
    markAsDeceasedUseCase,
    reactivatePatientUseCase,
    getPatientStatisticsUseCase,
    uploadPatientPhotoUseCase,
    getPatientPhotoUseCase,
    deletePatientPhotoUseCase,
    updateCommunicationPreferencesUseCase,
    getCommunicationPreferencesUseCase,
    getPatientHistoryUseCase,
    END POST-MVP */
  );

  const commandController = new CommandController(
    logger,
    patientCommandHandlers,
  );
  const errorHandlingMiddleware = new ErrorHandlingMiddleware(logger);

  // Setup Middleware
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: "*", credentials: true }));
  app.use(compression());
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Setup Authentication Middleware (if enabled)
  let authMiddleware: AuthenticationMiddleware | undefined;
  let identityMockRelease: (() => Promise<void>) | undefined;
  if (config.enableAuthentication) {
    let identityServiceUrl = config.identityServiceUrl;

    if (!identityServiceUrl) {
      const identityMock = await ensureIdentityMockServer();
      identityMockRelease = identityMock.release;
      identityServiceUrl = identityMock.url;
      process.env.IDENTITY_USE_MOCK = "true";
      process.env.IDENTITY_SERVICE_URL = identityServiceUrl;
      console.log(
        `[AppFactory] Using mock Identity Service at ${identityServiceUrl}`,
      );
    } else {
      console.log(
        `[AppFactory] Using real Identity Service at ${identityServiceUrl}`,
      );
    }

    authMiddleware = new AuthenticationMiddleware({
      identityServiceUrl,
      logger,
      skipPaths: ["/health", "/api-docs"],
    });

    // Apply authentication to all routes except skipped paths
    app.use(authMiddleware.authenticate());
  }

  // Setup Routes
  app.get("/health", (_req, res) => {
    res.status(200).json({
      status: "healthy",
      service: "patient-registry-service-test",
      version: "2.0.0",
      timestamp: new Date().toISOString(),
    });
  });

  // Create AuthorizationMiddleware for tests
  const { AuthorizationMiddleware } = await import(
    "../../src/presentation/middleware/AuthorizationMiddleware"
  );
  const authorizationMiddleware = new AuthorizationMiddleware({
    logger,
    patientRepository,
  });

  const patientRoutes = createPatientRoutes(
    patientController,
    authorizationMiddleware,
  );
  app.use("/api/v1/patients", patientRoutes);

  const commandRoutes = createCommandRoutes(commandController);
  app.use("/api/v1/commands", commandRoutes);

  // Error handling
  app.use(errorHandlingMiddleware.notFound());
  app.use(errorHandlingMiddleware.handle());

  // Cleanup function
  const cleanup = async () => {
    if (eventPublisher) {
      await eventPublisher.close();
    }
    if (identityMockRelease) {
      await identityMockRelease();
    }

    if (previousIdentityServiceUrl !== undefined) {
      process.env.IDENTITY_SERVICE_URL = previousIdentityServiceUrl;
    } else {
      delete process.env.IDENTITY_SERVICE_URL;
    }

    if (previousIdentityUseMock !== undefined) {
      process.env.IDENTITY_USE_MOCK = previousIdentityUseMock;
    } else {
      delete process.env.IDENTITY_USE_MOCK;
    }
  };

  return {
    app,
    cleanup,
    eventPublisher,
    patientRepository,
    inMemoryRepository:
      patientRepository instanceof InMemoryPatientRepository
        ? patientRepository
        : undefined,
  };
}

/**
 * Create minimal test app (without RabbitMQ, without authentication)
 */
export async function createMinimalTestApp(): Promise<AppFactoryResult> {
  return createTestApp({
    supabaseUrl: process.env.SUPABASE_URL || "",
    supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    enableRabbitMQ: false,
    enableAuthentication: false,
  });
}

/**
 * Create test app with authentication
 * - If IDENTITY_USE_MOCK=true or NODE_ENV=test: Uses mock Identity Service
 * - If IDENTITY_USE_MOCK=false: Uses REAL Identity Service at IDENTITY_SERVICE_URL
 */
export async function createAuthenticatedTestApp(): Promise<AppFactoryResult> {
  const useMock =
    process.env.IDENTITY_USE_MOCK === "true" || process.env.NODE_ENV === "test";
  const identityServiceUrl = useMock
    ? undefined
    : process.env.IDENTITY_SERVICE_URL || "http://localhost:3021";

  return createTestApp({
    supabaseUrl: process.env.SUPABASE_URL || "",
    supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    enableRabbitMQ: false,
    enableAuthentication: true,
    useInMemoryRepository: true,
    identityServiceUrl, // Pass URL for real service, undefined for mock
  });
}

/**
 * Create full test app (with RabbitMQ)
 */
export async function createFullTestApp(): Promise<AppFactoryResult> {
  return createTestApp({
    supabaseUrl: process.env.SUPABASE_URL || "",
    supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    rabbitmqUrl:
      process.env.RABBITMQ_URL || "amqp://admin:admin@localhost:5672",
    enableRabbitMQ: true,
  });
}
