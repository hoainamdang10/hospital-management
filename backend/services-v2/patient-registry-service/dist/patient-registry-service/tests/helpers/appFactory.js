"use strict";
/**
 * App Factory for Integration Tests
 *
 * Creates and configures Express app instance for testing
 * without starting the actual server
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTestApp = createTestApp;
exports.createMinimalTestApp = createMinimalTestApp;
exports.createAuthenticatedTestApp = createAuthenticatedTestApp;
exports.createFullTestApp = createFullTestApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const supabase_js_1 = require("@supabase/supabase-js");
// Infrastructure imports
const SupabasePatientRepository_1 = require("../../src/infrastructure/repositories/SupabasePatientRepository");
const InMemoryPatientRepository_1 = require("./InMemoryPatientRepository");
const RabbitMQEventPublisher_1 = require("../../src/infrastructure/events/RabbitMQEventPublisher");
// Application Services
const PatientMatchingService_1 = require("../../src/application/services/PatientMatchingService");
const InsuranceValidationService_1 = require("../../src/application/services/InsuranceValidationService");
// Use Cases
const RegisterPatientUseCase_1 = require("../../src/application/use-cases/RegisterPatientUseCase");
const UpdatePatientInfoUseCase_1 = require("../../src/application/use-cases/UpdatePatientInfoUseCase");
const GetPatientProfileUseCase_1 = require("../../src/application/use-cases/GetPatientProfileUseCase");
const SearchPatientsUseCase_1 = require("../../src/application/use-cases/SearchPatientsUseCase");
/* POST-MVP: Archived use case imports - Not required for graduation project
import { MatchPatientsUseCase } from '../../src/application/use-cases/MatchPatientsUseCase';
import { MergePatientsUseCase } from '../../src/application/use-cases/MergePatientsUseCase';
import { LinkPatientsUseCase } from '../../src/application/use-cases/LinkPatientsUseCase';
import { DeactivatePatientUseCase } from '../../src/application/use-cases/DeactivatePatientUseCase';
END POST-MVP */
const ValidateInsuranceUseCase_1 = require("../../src/application/use-cases/ValidateInsuranceUseCase");
const AddEmergencyContactUseCase_1 = require("../../src/application/use-cases/AddEmergencyContactUseCase");
/* POST-MVP: Archived use case imports - Not required for graduation project
import { GrantConsentUseCase } from '../../src/application/use-cases/GrantConsentUseCase';
import { MarkAsDeceasedUseCase } from '../../src/application/use-cases/MarkAsDeceasedUseCase';
import { ReactivatePatientUseCase } from '../../src/application/use-cases/ReactivatePatientUseCase';
END POST-MVP */
const GetEmergencyContactsUseCase_1 = require("../../src/application/use-cases/GetEmergencyContactsUseCase");
const UpdateEmergencyContactUseCase_1 = require("../../src/application/use-cases/UpdateEmergencyContactUseCase");
/* POST-MVP: Archived use case imports - Not required for graduation project
import { RemoveEmergencyContactUseCase } from '../../src/application/use-cases/RemoveEmergencyContactUseCase';
import { SetPrimaryEmergencyContactUseCase } from '../../src/application/use-cases/SetPrimaryEmergencyContactUseCase';
import { GetConsentsUseCase } from '../../src/application/use-cases/GetConsentsUseCase';
import { GetConsentDetailsUseCase } from '../../src/application/use-cases/GetConsentDetailsUseCase';
import { RevokeConsentUseCase } from '../../src/application/use-cases/RevokeConsentUseCase';
import { GetActiveConsentsUseCase } from '../../src/application/use-cases/GetActiveConsentsUseCase';
END POST-MVP */
const GetInsuranceInfoUseCase_1 = require("../../src/application/use-cases/GetInsuranceInfoUseCase");
const AddInsuranceInfoUseCase_1 = require("../../src/application/use-cases/AddInsuranceInfoUseCase");
const UpdateInsuranceInfoUseCase_1 = require("../../src/application/use-cases/UpdateInsuranceInfoUseCase");
const VerifyInsuranceUseCase_1 = require("../../src/application/use-cases/VerifyInsuranceUseCase");
const GetPatientStatisticsUseCase_1 = require("../../src/application/use-cases/GetPatientStatisticsUseCase");
/* POST-MVP: Archived use case imports - Not required for graduation project
import { UploadPatientPhotoUseCase } from '../../src/application/use-cases/UploadPatientPhotoUseCase';
import { GetPatientPhotoUseCase } from '../../src/application/use-cases/GetPatientPhotoUseCase';
import { DeletePatientPhotoUseCase } from '../../src/application/use-cases/DeletePatientPhotoUseCase';
import { UpdateCommunicationPreferencesUseCase } from '../../src/application/use-cases/UpdateCommunicationPreferencesUseCase';
import { GetCommunicationPreferencesUseCase } from '../../src/application/use-cases/GetCommunicationPreferencesUseCase';
import { GetPatientHistoryUseCase } from '../../src/application/use-cases/GetPatientHistoryUseCase';
END POST-MVP */
const PatientCommandHandlers_1 = require("../../src/application/handlers/PatientCommandHandlers");
const PatientQueryHandlers_1 = require("../../src/application/handlers/PatientQueryHandlers");
// Presentation
const PatientController_1 = require("../../src/presentation/controllers/PatientController");
const CommandController_1 = require("../../src/presentation/controllers/CommandController");
const patientRoutes_1 = require("../../src/presentation/routes/patientRoutes");
const commandRoutes_1 = require("../../src/presentation/routes/commandRoutes");
const ErrorHandlingMiddleware_1 = require("../../src/presentation/middleware/ErrorHandlingMiddleware");
const AuthenticationMiddleware_1 = require("../../src/presentation/middleware/AuthenticationMiddleware");
const identityMockServer_1 = require("./identityMockServer");
const PatientCache_1 = require("../../src/infrastructure/cache/PatientCache");
const AuditService_1 = require("../../src/infrastructure/audit/AuditService");
const SupabaseOutboxRepository_1 = require("../../src/infrastructure/outbox/SupabaseOutboxRepository");
/**
 * Test Logger - Silent logger for tests
 */
const createTestLogger = () => ({
    debug: () => { }, // eslint-disable-line @typescript-eslint/no-empty-function -- Silent for tests
    info: () => { }, // eslint-disable-line @typescript-eslint/no-empty-function -- Silent for tests
    warn: (...args) => console.warn("[TestLogger][WARN]", ...args),
    error: (...args) => console.error("[TestLogger][ERROR]", ...args),
    fatal: (...args) => console.error("[TestLogger][FATAL]", ...args),
});
/**
 * Create Express app for testing
 */
async function createTestApp(config) {
    const app = (0, express_1.default)();
    const logger = config.logger || createTestLogger();
    const previousIdentityServiceUrl = process.env.IDENTITY_SERVICE_URL;
    const previousIdentityUseMock = process.env.IDENTITY_USE_MOCK;
    // Initialize Event Publisher (optional for tests)
    let eventPublisher;
    if (config.enableRabbitMQ && config.rabbitmqUrl) {
        eventPublisher = new RabbitMQEventPublisher_1.RabbitMQEventPublisher({
            url: config.rabbitmqUrl,
            exchange: "patient-registry-events-test",
            exchangeType: "topic",
            durable: false,
            autoDelete: true,
            serviceName: "patient-registry",
        }, {
            enableRetry: false,
            maxRetries: 1,
            retryDelayMs: 100,
            enableLogging: false,
        }, logger);
        try {
            await eventPublisher.connect();
        }
        catch (error) {
            console.warn("️  RabbitMQ not available for tests, continuing without event publishing");
            eventPublisher = undefined;
        }
    }
    // Initialize Application Services
    const matchingService = new PatientMatchingService_1.PatientMatchingService(logger);
    const insuranceValidationService = new InsuranceValidationService_1.InsuranceValidationService(logger);
    // Initialize Cache (optional for tests)
    const redisUrl = process.env.REDIS_URL || "redis://localhost:6380";
    const patientCache = new PatientCache_1.PatientCache(redisUrl);
    // Initialize Audit Service (optional for tests)
    const supabaseClient = (0, supabase_js_1.createClient)(config.supabaseUrl, config.supabaseKey);
    const auditService = new AuditService_1.AuditService(supabaseClient, logger);
    // Initialize Repository
    let patientRepository;
    if (config.useInMemoryRepository) {
        patientRepository = new InMemoryPatientRepository_1.InMemoryPatientRepository();
    }
    else {
        // Create OptimizedSupabaseClient for SupabasePatientRepository
        const { createOptimizedSupabaseClient } = await Promise.resolve().then(() => __importStar(require("../../../shared/infrastructure/database/optimized-supabase-client")));
        const optimizedClient = createOptimizedSupabaseClient({
            supabaseUrl: config.supabaseUrl,
            supabaseServiceKey: config.supabaseKey,
            serviceName: "patient-registry-service",
            schemaName: "patient_schema",
            enableOptimizations: false, // Disable for tests
        });
        // Create Outbox Repository for tests
        const outboxRepository = new SupabaseOutboxRepository_1.SupabaseOutboxRepository(supabaseClient, logger);
        patientRepository = new SupabasePatientRepository_1.SupabasePatientRepository(optimizedClient, logger, matchingService, eventPublisher, patientCache, outboxRepository);
    }
    // Create mock event bus for tests (if no RabbitMQ)
    const mockEventBus = {
        connect: async () => { }, // eslint-disable-line @typescript-eslint/no-empty-function -- Mock for tests
        disconnect: async () => { }, // eslint-disable-line @typescript-eslint/no-empty-function -- Mock for tests
        publish: async () => { }, // eslint-disable-line @typescript-eslint/no-empty-function -- Mock for tests
        subscribe: async () => { }, // eslint-disable-line @typescript-eslint/no-empty-function -- Mock for tests
    };
    const eventBus = eventPublisher || mockEventBus;
    // Mock SupabaseClient for tests
    const mockSupabaseClient = (0, supabase_js_1.createClient)("https://mock.supabase.co", "mock-key");
    // Initialize Use Cases
    const registerPatientUseCase = new RegisterPatientUseCase_1.RegisterPatientUseCase(patientRepository, eventBus, logger, auditService, mockSupabaseClient);
    const updatePatientInfoUseCase = new UpdatePatientInfoUseCase_1.UpdatePatientInfoUseCase(patientRepository, eventBus, logger, auditService);
    const getPatientProfileUseCase = new GetPatientProfileUseCase_1.GetPatientProfileUseCase(patientRepository, logger, auditService);
    const searchPatientsUseCase = new SearchPatientsUseCase_1.SearchPatientsUseCase(patientRepository);
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
    const validateInsuranceUseCase = new ValidateInsuranceUseCase_1.ValidateInsuranceUseCase(patientRepository, insuranceValidationService, logger);
    const addEmergencyContactUseCase = new AddEmergencyContactUseCase_1.AddEmergencyContactUseCase(patientRepository, eventBus, logger, auditService);
    /* POST-MVP: Archived use case instantiations - Not required for graduation project
    const grantConsentUseCase = new GrantConsentUseCase(patientRepository, auditService, logger);
    const markAsDeceasedUseCase = new MarkAsDeceasedUseCase(patientRepository);
    const reactivatePatientUseCase = new ReactivatePatientUseCase(patientRepository);
    END POST-MVP */
    // New use cases
    const getEmergencyContactsUseCase = new GetEmergencyContactsUseCase_1.GetEmergencyContactsUseCase(patientRepository, logger);
    const updateEmergencyContactUseCase = new UpdateEmergencyContactUseCase_1.UpdateEmergencyContactUseCase(patientRepository, eventBus, logger);
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
    const getInsuranceInfoUseCase = new GetInsuranceInfoUseCase_1.GetInsuranceInfoUseCase(patientRepository, logger);
    const addInsuranceInfoUseCase = new AddInsuranceInfoUseCase_1.AddInsuranceInfoUseCase(patientRepository, logger);
    const updateInsuranceInfoUseCase = new UpdateInsuranceInfoUseCase_1.UpdateInsuranceInfoUseCase(patientRepository, eventBus, logger);
    const verifyInsuranceUseCase = new VerifyInsuranceUseCase_1.VerifyInsuranceUseCase(patientRepository, logger);
    const getPatientStatisticsUseCase = new GetPatientStatisticsUseCase_1.GetPatientStatisticsUseCase(patientRepository);
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
    const patientQueryHandlers = new PatientQueryHandlers_1.PatientQueryHandlers(getPatientProfileUseCase, searchPatientsUseCase, patientRepository, logger);
    // Initialize Command Handlers
    const patientCommandHandlers = new PatientCommandHandlers_1.PatientCommandHandlers(registerPatientUseCase, updatePatientInfoUseCase, 
    /* POST-MVP: Archived use cases - Not required for graduation project
    deactivatePatientUseCase,
    grantConsentUseCase,
    END POST-MVP */
    addEmergencyContactUseCase, logger);
    // Initialize Controllers
    const patientController = new PatientController_1.PatientController(logger, registerPatientUseCase, updatePatientInfoUseCase, patientQueryHandlers, 
    /* POST-MVP: Archived use case constructor parameters - Not required for graduation project
    matchPatientsUseCase,
    mergePatientsUseCase,
    linkPatientsUseCase,
    deactivatePatientUseCase,
    END POST-MVP */
    validateInsuranceUseCase, getInsuranceInfoUseCase, addInsuranceInfoUseCase, updateInsuranceInfoUseCase, verifyInsuranceUseCase, addEmergencyContactUseCase, getEmergencyContactsUseCase, updateEmergencyContactUseCase, getPatientStatisticsUseCase);
    const commandController = new CommandController_1.CommandController(logger, patientCommandHandlers);
    const errorHandlingMiddleware = new ErrorHandlingMiddleware_1.ErrorHandlingMiddleware(logger);
    // Setup Middleware
    app.use((0, helmet_1.default)({ contentSecurityPolicy: false }));
    app.use((0, cors_1.default)({ origin: "*", credentials: true }));
    app.use((0, compression_1.default)());
    app.use(express_1.default.json({ limit: "10mb" }));
    app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
    // Setup Authentication Middleware (if enabled)
    let authMiddleware;
    let identityMockRelease;
    if (config.enableAuthentication) {
        let identityServiceUrl = config.identityServiceUrl;
        if (!identityServiceUrl) {
            const identityMock = await (0, identityMockServer_1.ensureIdentityMockServer)();
            identityMockRelease = identityMock.release;
            identityServiceUrl = identityMock.url;
            process.env.IDENTITY_USE_MOCK = "true";
            process.env.IDENTITY_SERVICE_URL = identityServiceUrl;
            console.log(`[AppFactory] Using mock Identity Service at ${identityServiceUrl}`);
        }
        else {
            console.log(`[AppFactory] Using real Identity Service at ${identityServiceUrl}`);
        }
        authMiddleware = new AuthenticationMiddleware_1.AuthenticationMiddleware({
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
    const { AuthorizationMiddleware } = await Promise.resolve().then(() => __importStar(require("../../src/presentation/middleware/AuthorizationMiddleware")));
    const authorizationMiddleware = new AuthorizationMiddleware({
        logger,
        patientRepository,
    });
    const patientRoutes = (0, patientRoutes_1.createPatientRoutes)(patientController, authorizationMiddleware);
    app.use("/api/v1/patients", patientRoutes);
    const commandRoutes = (0, commandRoutes_1.createCommandRoutes)(commandController);
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
        }
        else {
            delete process.env.IDENTITY_SERVICE_URL;
        }
        if (previousIdentityUseMock !== undefined) {
            process.env.IDENTITY_USE_MOCK = previousIdentityUseMock;
        }
        else {
            delete process.env.IDENTITY_USE_MOCK;
        }
    };
    return {
        app,
        cleanup,
        eventPublisher,
        patientRepository,
        inMemoryRepository: patientRepository instanceof InMemoryPatientRepository_1.InMemoryPatientRepository
            ? patientRepository
            : undefined,
    };
}
/**
 * Create minimal test app (without RabbitMQ, without authentication)
 */
async function createMinimalTestApp() {
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
async function createAuthenticatedTestApp() {
    const useMock = process.env.IDENTITY_USE_MOCK === "true" || process.env.NODE_ENV === "test";
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
async function createFullTestApp() {
    return createTestApp({
        supabaseUrl: process.env.SUPABASE_URL || "",
        supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
        rabbitmqUrl: process.env.RABBITMQ_URL || "amqp://admin:admin@localhost:5672",
        enableRabbitMQ: true,
    });
}
//# sourceMappingURL=appFactory.js.map