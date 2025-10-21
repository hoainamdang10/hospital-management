"use strict";
/**
 * Patient Registry Service V2 - Main Application
 * Production-ready service with Clean Architecture + DDD + CQRS
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, HIPAA, Vietnamese Healthcare Standards
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
// Load environment variables FIRST
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const compression_1 = __importDefault(require("compression"));
// Infrastructure imports
const SupabasePatientRepository_1 = require("./infrastructure/repositories/SupabasePatientRepository");
const HealthChecks_1 = require("./infrastructure/monitoring/HealthChecks");
const RedisCacheService_1 = require("./infrastructure/cache/RedisCacheService");
const PatientCache_1 = require("./infrastructure/cache/PatientCache");
const GracefulDegradation_1 = require("./infrastructure/resilience/GracefulDegradation");
// Application Services imports
const PatientMatchingService_1 = require("./application/services/PatientMatchingService");
const InsuranceValidationService_1 = require("./application/services/InsuranceValidationService");
const RabbitMQEventPublisher_1 = require("./infrastructure/events/RabbitMQEventPublisher");
const EventBus_1 = require("../../shared/infrastructure/event-bus/EventBus");
// Application imports
const RegisterPatientUseCase_1 = require("./application/use-cases/RegisterPatientUseCase");
const UpdatePatientInfoUseCase_1 = require("./application/use-cases/UpdatePatientInfoUseCase");
const GetPatientProfileUseCase_1 = require("./application/use-cases/GetPatientProfileUseCase");
const SearchPatientsUseCase_1 = require("./application/use-cases/SearchPatientsUseCase");
const MatchPatientsUseCase_1 = require("./application/use-cases/MatchPatientsUseCase");
const MergePatientsUseCase_1 = require("./application/use-cases/MergePatientsUseCase");
const LinkPatientsUseCase_1 = require("./application/use-cases/LinkPatientsUseCase");
const DeactivatePatientUseCase_1 = require("./application/use-cases/DeactivatePatientUseCase");
const ValidateInsuranceUseCase_1 = require("./application/use-cases/ValidateInsuranceUseCase");
const AddEmergencyContactUseCase_1 = require("./application/use-cases/AddEmergencyContactUseCase");
const GetEmergencyContactsUseCase_1 = require("./application/use-cases/GetEmergencyContactsUseCase");
const UpdateEmergencyContactUseCase_1 = require("./application/use-cases/UpdateEmergencyContactUseCase");
const RemoveEmergencyContactUseCase_1 = require("./application/use-cases/RemoveEmergencyContactUseCase");
const SetPrimaryEmergencyContactUseCase_1 = require("./application/use-cases/SetPrimaryEmergencyContactUseCase");
const GrantConsentUseCase_1 = require("./application/use-cases/GrantConsentUseCase");
const GetConsentsUseCase_1 = require("./application/use-cases/GetConsentsUseCase");
const GetConsentDetailsUseCase_1 = require("./application/use-cases/GetConsentDetailsUseCase");
const RevokeConsentUseCase_1 = require("./application/use-cases/RevokeConsentUseCase");
const GetActiveConsentsUseCase_1 = require("./application/use-cases/GetActiveConsentsUseCase");
const GetInsuranceInfoUseCase_1 = require("./application/use-cases/GetInsuranceInfoUseCase");
const UpdateInsuranceInfoUseCase_1 = require("./application/use-cases/UpdateInsuranceInfoUseCase");
const VerifyInsuranceUseCase_1 = require("./application/use-cases/VerifyInsuranceUseCase");
const MarkAsDeceasedUseCase_1 = require("./application/use-cases/MarkAsDeceasedUseCase");
const ReactivatePatientUseCase_1 = require("./application/use-cases/ReactivatePatientUseCase");
const GetPatientStatisticsUseCase_1 = require("./application/use-cases/GetPatientStatisticsUseCase");
const UploadPatientPhotoUseCase_1 = require("./application/use-cases/UploadPatientPhotoUseCase");
const GetPatientPhotoUseCase_1 = require("./application/use-cases/GetPatientPhotoUseCase");
const DeletePatientPhotoUseCase_1 = require("./application/use-cases/DeletePatientPhotoUseCase");
const UpdateCommunicationPreferencesUseCase_1 = require("./application/use-cases/UpdateCommunicationPreferencesUseCase");
const GetCommunicationPreferencesUseCase_1 = require("./application/use-cases/GetCommunicationPreferencesUseCase");
const PatientCommandHandlers_1 = require("./application/handlers/PatientCommandHandlers");
const PatientQueryHandlers_1 = require("./application/handlers/PatientQueryHandlers");
// Infrastructure imports
const SupabaseStorageService_1 = require("./infrastructure/storage/SupabaseStorageService");
// Presentation imports
const PatientController_1 = require("./presentation/controllers/PatientController");
const CommandController_1 = require("./presentation/controllers/CommandController");
const patientRoutes_1 = require("./presentation/routes/patientRoutes");
const commandRoutes_1 = require("./presentation/routes/commandRoutes");
const ErrorHandlingMiddleware_1 = require("./presentation/middleware/ErrorHandlingMiddleware");
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
    allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',')
};
// Logger setup (simplified - in production use Winston or similar)
const logger = {
    debug: (message, meta = {}) => {
        if (config.nodeEnv === 'development') {
            console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`, Object.keys(meta).length ? meta : '');
        }
    },
    info: (message, meta = {}) => {
        console.log(`[INFO] ${new Date().toISOString()} - ${message}`, Object.keys(meta).length ? meta : '');
    },
    warn: (message, meta = {}) => {
        console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, Object.keys(meta).length ? meta : '');
    },
    error: (message, meta = {}) => {
        console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, Object.keys(meta).length ? meta : '');
    },
    fatal: (message, meta = {}) => {
        console.error(`[FATAL] ${new Date().toISOString()} - ${message}`, Object.keys(meta).length ? meta : '');
    }
};
/**
 * Patient Registry Service Application Class
 */
class PatientRegistryServiceApp {
    constructor() {
        this.app = (0, express_1.default)();
    }
    /**
     * Initialize all dependencies
     */
    async initializeDependencies() {
        logger.info('Initializing dependencies...');
        try {
            // Validate configuration
            this.validateConfiguration();
            // Initialize Event Publisher
            this.eventPublisher = new RabbitMQEventPublisher_1.RabbitMQEventPublisher({
                url: config.rabbitmqUrl,
                exchange: 'patient-registry-events',
                exchangeType: 'topic',
                durable: true,
                autoDelete: false
            }, {
                enableRetry: true,
                maxRetries: 3,
                retryDelayMs: 1000,
                enableLogging: true
            }, logger);
            // Connect to RabbitMQ
            await this.eventPublisher.connect();
            // Initialize EventBus (InMemoryEventBus for development)
            this.eventBus = new EventBus_1.InMemoryEventBus();
            await this.eventBus.connect();
            logger.info('EventBus initialized (InMemoryEventBus)', {});
            // Initialize Redis Cache Service (optional)
            try {
                this.cacheService = new RedisCacheService_1.RedisCacheService(config.redisUrl, logger);
                await this.cacheService.connect();
                logger.info('Redis cache service initialized and connected', {});
            }
            catch (error) {
                logger.warn('Redis cache not available, running without cache', { error });
                this.cacheService = null;
            }
            // Initialize Patient Cache (L1/L2)
            this.patientCache = new PatientCache_1.PatientCache(config.redisUrl);
            try {
                await this.patientCache.connect();
                logger.info('Patient cache connected successfully', {});
            }
            catch (error) {
                logger.error('Failed to connect Patient Cache', { error: error instanceof Error ? error.message : 'Unknown error' });
                logger.warn('Continuing without patient caching - patients will be fetched from database', {});
            }
            // Initialize Application Services (Domain Services)
            this.matchingService = new PatientMatchingService_1.PatientMatchingService(logger);
            this.insuranceValidationService = new InsuranceValidationService_1.InsuranceValidationService(logger);
            // Initialize Graceful Degradation Service
            this.degradationService = new GracefulDegradation_1.PatientRegistryDegradation({
                enableReadOnlyFallback: true,
                enableCacheFallback: true,
                enableEmergencyMode: true,
                maxDegradationTime: 300000 // 5 minutes
            }, {
                supabaseUrl: config.supabaseUrl,
                supabaseServiceRoleKey: config.supabaseKey
            }, logger);
            // Initialize Health Check Service (with degradation service)
            this.healthCheck = new HealthChecks_1.PatientRegistryHealthCheck(config.supabaseUrl, config.supabaseKey, this.degradationService);
            // Initialize Infrastructure Layer (inject services + event publisher)
            this.patientRepository = new SupabasePatientRepository_1.SupabasePatientRepository(config.supabaseUrl, config.supabaseKey, logger, this.matchingService, // ✅ Inject matching service
            this.eventPublisher // ✅ Inject event publisher
            );
            // Initialize Application Layer (Use Cases)
            this.registerPatientUseCase = new RegisterPatientUseCase_1.RegisterPatientUseCase(this.patientRepository, this.eventBus, logger);
            this.updatePatientInfoUseCase = new UpdatePatientInfoUseCase_1.UpdatePatientInfoUseCase(this.patientRepository, this.eventBus, logger);
            this.getPatientProfileUseCase = new GetPatientProfileUseCase_1.GetPatientProfileUseCase(this.patientRepository, logger);
            this.searchPatientsUseCase = new SearchPatientsUseCase_1.SearchPatientsUseCase(this.patientRepository);
            this.matchPatientsUseCase = new MatchPatientsUseCase_1.MatchPatientsUseCase(this.patientRepository, this.matchingService, logger);
            this.mergePatientsUseCase = new MergePatientsUseCase_1.MergePatientsUseCase(this.patientRepository);
            this.linkPatientsUseCase = new LinkPatientsUseCase_1.LinkPatientsUseCase(this.patientRepository);
            this.deactivatePatientUseCase = new DeactivatePatientUseCase_1.DeactivatePatientUseCase(this.patientRepository, this.eventBus, logger);
            this.validateInsuranceUseCase = new ValidateInsuranceUseCase_1.ValidateInsuranceUseCase(this.patientRepository, this.insuranceValidationService, logger);
            this.addEmergencyContactUseCase = new AddEmergencyContactUseCase_1.AddEmergencyContactUseCase(this.patientRepository, this.eventBus, logger);
            this.getEmergencyContactsUseCase = new GetEmergencyContactsUseCase_1.GetEmergencyContactsUseCase(this.patientRepository, logger);
            this.updateEmergencyContactUseCase = new UpdateEmergencyContactUseCase_1.UpdateEmergencyContactUseCase(this.patientRepository, this.eventBus, logger);
            this.removeEmergencyContactUseCase = new RemoveEmergencyContactUseCase_1.RemoveEmergencyContactUseCase(this.patientRepository, this.eventBus, logger);
            this.setPrimaryEmergencyContactUseCase = new SetPrimaryEmergencyContactUseCase_1.SetPrimaryEmergencyContactUseCase(this.patientRepository, this.eventBus, logger);
            this.grantConsentUseCase = new GrantConsentUseCase_1.GrantConsentUseCase(this.patientRepository);
            this.getConsentsUseCase = new GetConsentsUseCase_1.GetConsentsUseCase(this.patientRepository, logger);
            this.getConsentDetailsUseCase = new GetConsentDetailsUseCase_1.GetConsentDetailsUseCase(this.patientRepository, logger);
            this.revokeConsentUseCase = new RevokeConsentUseCase_1.RevokeConsentUseCase(this.patientRepository, this.eventBus, logger);
            this.getActiveConsentsUseCase = new GetActiveConsentsUseCase_1.GetActiveConsentsUseCase(this.patientRepository, logger);
            this.getInsuranceInfoUseCase = new GetInsuranceInfoUseCase_1.GetInsuranceInfoUseCase(this.patientRepository, logger);
            this.updateInsuranceInfoUseCase = new UpdateInsuranceInfoUseCase_1.UpdateInsuranceInfoUseCase(this.patientRepository, this.eventBus, logger);
            this.verifyInsuranceUseCase = new VerifyInsuranceUseCase_1.VerifyInsuranceUseCase(this.patientRepository, logger);
            this.markAsDeceasedUseCase = new MarkAsDeceasedUseCase_1.MarkAsDeceasedUseCase(this.patientRepository);
            this.reactivatePatientUseCase = new ReactivatePatientUseCase_1.ReactivatePatientUseCase(this.patientRepository);
            this.getPatientStatisticsUseCase = new GetPatientStatisticsUseCase_1.GetPatientStatisticsUseCase(this.patientRepository);
            // Initialize Storage Service
            const { createClient } = await Promise.resolve().then(() => __importStar(require('@supabase/supabase-js')));
            const storageClient = createClient(config.supabaseUrl, config.supabaseKey, {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            });
            this.storageService = new SupabaseStorageService_1.SupabaseStorageService(storageClient, logger);
            // Initialize Photo Use Cases
            this.uploadPatientPhotoUseCase = new UploadPatientPhotoUseCase_1.UploadPatientPhotoUseCase(this.patientRepository, this.storageService);
            this.getPatientPhotoUseCase = new GetPatientPhotoUseCase_1.GetPatientPhotoUseCase(this.patientRepository);
            this.deletePatientPhotoUseCase = new DeletePatientPhotoUseCase_1.DeletePatientPhotoUseCase(this.patientRepository, this.storageService);
            // Initialize Communication Preferences Use Cases
            this.updateCommunicationPreferencesUseCase = new UpdateCommunicationPreferencesUseCase_1.UpdateCommunicationPreferencesUseCase(this.patientRepository);
            this.getCommunicationPreferencesUseCase = new GetCommunicationPreferencesUseCase_1.GetCommunicationPreferencesUseCase(this.patientRepository);
            this.patientQueryHandlers = new PatientQueryHandlers_1.PatientQueryHandlers(this.getPatientProfileUseCase, this.searchPatientsUseCase, this.patientRepository, logger);
            // Initialize Command Handlers (CQRS)
            this.patientCommandHandlers = new PatientCommandHandlers_1.PatientCommandHandlers(this.registerPatientUseCase, this.updatePatientInfoUseCase, this.deactivatePatientUseCase, this.grantConsentUseCase, this.addEmergencyContactUseCase, logger);
            // Initialize Presentation Layer
            this.patientController = new PatientController_1.PatientController(logger, this.registerPatientUseCase, this.updatePatientInfoUseCase, this.matchPatientsUseCase, this.mergePatientsUseCase, this.linkPatientsUseCase, this.deactivatePatientUseCase, this.validateInsuranceUseCase, this.addEmergencyContactUseCase, this.getEmergencyContactsUseCase, this.updateEmergencyContactUseCase, this.removeEmergencyContactUseCase, this.setPrimaryEmergencyContactUseCase, this.grantConsentUseCase, this.getConsentsUseCase, this.getConsentDetailsUseCase, this.revokeConsentUseCase, this.getActiveConsentsUseCase, this.getInsuranceInfoUseCase, this.updateInsuranceInfoUseCase, this.verifyInsuranceUseCase, this.markAsDeceasedUseCase, this.reactivatePatientUseCase, this.getPatientStatisticsUseCase, this.uploadPatientPhotoUseCase, this.getPatientPhotoUseCase, this.deletePatientPhotoUseCase, this.updateCommunicationPreferencesUseCase, this.getCommunicationPreferencesUseCase, this.patientQueryHandlers);
            this.commandController = new CommandController_1.CommandController(logger, this.patientCommandHandlers);
            this.errorHandlingMiddleware = new ErrorHandlingMiddleware_1.ErrorHandlingMiddleware(logger);
            logger.info('Dependencies initialized successfully');
        }
        catch (error) {
            logger.fatal('Failed to initialize dependencies', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    /**
     * Validate configuration
     */
    validateConfiguration() {
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
    setupMiddleware() {
        logger.info('Setting up middleware...');
        // Security middleware
        this.app.use((0, helmet_1.default)({
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
        this.app.use((0, cors_1.default)({
            origin: config.allowedOrigins,
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization']
        }));
        // Compression
        this.app.use((0, compression_1.default)());
        // Body parsing
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
        // Rate limiting
        const limiter = (0, express_rate_limit_1.default)({
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
    setupRoutes() {
        logger.info('Setting up routes...');
        // Health check
        this.app.get('/health', async (_req, res) => {
            try {
                const health = await this.healthCheck.checkHealth();
                const statusCode = health.overall === 'HEALTHY' ? 200 : 503;
                res.status(statusCode).json(health);
            }
            catch (error) {
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
            }
            catch (error) {
                logger.error('Degradation status check failed', { error: error instanceof Error ? error.message : 'Unknown error' });
                res.status(500).json({
                    error: error instanceof Error ? error.message : 'Unknown error',
                    timestamp: new Date()
                });
            }
        });
        // API routes
        const patientRoutes = (0, patientRoutes_1.createPatientRoutes)(this.patientController);
        this.app.use('/api/v1/patients', patientRoutes);
        // CQRS Command routes
        const commandRoutes = (0, commandRoutes_1.createCommandRoutes)(this.commandController);
        this.app.use('/api/v1/commands', commandRoutes);
        // 404 handler
        this.app.use(this.errorHandlingMiddleware.notFound());
        // Error handling middleware (must be last)
        this.app.use(this.errorHandlingMiddleware.handle());
        logger.info('Routes setup complete');
    }
    /**
     * Start the server
     */
    async start() {
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
        }
        catch (error) {
            logger.fatal('Failed to start service', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            process.exit(1);
        }
    }
    /**
     * Graceful shutdown
     */
    async shutdown() {
        logger.info('Shutting down gracefully...');
        try {
            // Close RabbitMQ connection
            if (this.eventPublisher) {
                await this.eventPublisher.close();
                logger.info('Event Publisher closed');
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
        }
        catch (error) {
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
//# sourceMappingURL=main.js.map