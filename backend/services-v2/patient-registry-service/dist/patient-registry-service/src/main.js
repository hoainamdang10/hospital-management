"use strict";
/**
 * Patient Registry Service V2 - Main Application
 * Production-ready service with Clean Architecture + DDD + CQRS
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, HIPAA, Vietnamese Healthcare Standards
 */
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
const compression_1 = __importDefault(require("compression"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_config_1 = require("./infrastructure/swagger/swagger.config");
// Infrastructure imports
const SupabasePatientRepository_1 = require("./infrastructure/repositories/SupabasePatientRepository");
const HealthChecks_1 = require("./infrastructure/monitoring/HealthChecks");
const PrometheusMetrics_1 = require("./infrastructure/monitoring/PrometheusMetrics");
const RedisCacheService_1 = require("./infrastructure/cache/RedisCacheService");
const PatientCache_1 = require("./infrastructure/cache/PatientCache");
const GracefulDegradation_1 = require("./infrastructure/resilience/GracefulDegradation");
const optimized_supabase_client_1 = require("../../shared/infrastructure/database/optimized-supabase-client");
const SupabaseOutboxRepository_1 = require("./infrastructure/outbox/SupabaseOutboxRepository");
const OutboxPublisherWorker_1 = require("./infrastructure/outbox/OutboxPublisherWorker");
// Application Services imports
const PatientMatchingService_1 = require("./application/services/PatientMatchingService");
const InsuranceValidationService_1 = require("./application/services/InsuranceValidationService");
const RabbitMQEventPublisher_1 = require("./infrastructure/events/RabbitMQEventPublisher");
const EventBus_1 = require("../../shared/infrastructure/event-bus/EventBus");
const validator_1 = require("./infrastructure/config/validator");
const PinoLogger_1 = require("./infrastructure/logging/PinoLogger");
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
const AddInsuranceInfoUseCase_1 = require("./application/use-cases/AddInsuranceInfoUseCase");
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
const GetPatientHistoryUseCase_1 = require("./application/use-cases/GetPatientHistoryUseCase");
const PatientCommandHandlers_1 = require("./application/handlers/PatientCommandHandlers");
const PatientQueryHandlers_1 = require("./application/handlers/PatientQueryHandlers");
// Infrastructure imports
const SupabaseStorageService_1 = require("./infrastructure/storage/SupabaseStorageService");
const AuditService_1 = require("./infrastructure/audit/AuditService");
const infrastructure_1 = require("./infrastructure");
// Presentation imports
const PatientController_1 = require("./presentation/controllers/PatientController");
const CommandController_1 = require("./presentation/controllers/CommandController");
const patientRoutes_1 = require("./presentation/routes/patientRoutes");
const commandRoutes_1 = require("./presentation/routes/commandRoutes");
const healthRoutes_1 = require("./presentation/routes/healthRoutes");
const ErrorHandlingMiddleware_1 = require("./presentation/middleware/ErrorHandlingMiddleware");
const AuthenticationMiddleware_1 = require("./presentation/middleware/AuthenticationMiddleware");
const AuthorizationMiddleware_1 = require("./presentation/middleware/AuthorizationMiddleware");
// Configuration
const config = {
    port: process.env.PORT || 3023,
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5673',
    rabbitmqExchange: process.env.RABBITMQ_EXCHANGE || 'hospital.events',
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6380',
    nodeEnv: process.env.NODE_ENV || 'development',
    serviceName: 'patient-registry-service',
    version: '2.0.0',
    allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(','),
    identityServiceUrl: process.env.IDENTITY_SERVICE_URL || 'http://localhost:3021',
};
const rabbitmqConnectionRetries = Number(process.env.RABBITMQ_CONNECT_MAX_RETRIES || 5);
const rabbitmqConnectionRetryDelayMs = Number(process.env.RABBITMQ_CONNECT_RETRY_DELAY_MS || 3000);
// Logger setup - HIPAA-compliant Pino logger with PHI/PII redaction
const logger = (0, PinoLogger_1.createProductionLogger)(config.serviceName);
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
            // Validate environment configuration (fail-fast)
            (0, validator_1.validateAndLog)(logger);
            // Validate configuration
            this.validateConfiguration();
            const exchangeName = config.rabbitmqExchange;
            // Initialize Event Publisher
            this.eventPublisher = new RabbitMQEventPublisher_1.RabbitMQEventPublisher({
                url: config.rabbitmqUrl,
                exchange: exchangeName,
                exchangeType: 'topic',
                durable: true,
                autoDelete: false,
                serviceName: 'patient-registry',
                connectionRetries: rabbitmqConnectionRetries,
                connectionRetryDelayMs: rabbitmqConnectionRetryDelayMs,
            }, {
                enableRetry: true,
                maxRetries: 3,
                retryDelayMs: 1000,
                enableLogging: true,
            }, logger);
            // Connect to RabbitMQ
            await this.eventPublisher.connect();
            // Initialize EventBus (RabbitMQEventBus for production, InMemoryEventBus for test)
            if (config.nodeEnv === 'test') {
                this.eventBus = new EventBus_1.InMemoryEventBus();
                await this.eventBus.connect();
                logger.info('EventBus initialized (InMemoryEventBus for testing)', {});
            }
            else {
                this.eventBus = new EventBus_1.RabbitMQEventBus({
                    rabbitmqUrl: config.rabbitmqUrl,
                    exchangeName,
                    serviceName: config.serviceName,
                });
                await this.eventBus.connect();
                logger.info('EventBus initialized (RabbitMQEventBus)', {
                    url: config.rabbitmqUrl.replace(/:[^:@]+@/, ':****@'), // Hide password
                    exchange: exchangeName,
                });
            }
            // Initialize Redis Cache Service (optional)
            try {
                this.cacheService = new RedisCacheService_1.RedisCacheService(config.redisUrl, logger);
                await this.cacheService.connect();
                logger.info('Redis cache service initialized and connected', {});
            }
            catch (error) {
                logger.warn('Redis cache not available, running without cache', {
                    error,
                });
                this.cacheService = null;
            }
            // Initialize Patient Cache (L1/L2)
            this.patientCache = new PatientCache_1.PatientCache(config.redisUrl);
            try {
                await this.patientCache.connect();
                logger.info('Patient cache connected successfully', {});
            }
            catch (error) {
                logger.error('Failed to connect Patient Cache', {
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
                logger.warn('Continuing without patient caching - patients will be fetched from database', {});
            }
            // Initialize Application Services (Domain Services)
            this.matchingService = new PatientMatchingService_1.PatientMatchingService(logger);
            this.insuranceValidationService = new InsuranceValidationService_1.InsuranceValidationService(logger);
            this.optimizedSupabase = (0, optimized_supabase_client_1.createOptimizedSupabaseClient)({
                supabaseUrl: config.supabaseUrl,
                supabaseServiceKey: config.supabaseKey,
                serviceName: config.serviceName,
                schemaName: 'patient_schema',
                enableOptimizations: config.nodeEnv !== 'test',
            });
            // Store raw Supabase client for PatientId generation
            this.supabaseClient = this.optimizedSupabase.getConnection();
            // Initialize Audit Service
            // Type cast needed due to duplicate @supabase/supabase-js in root and service node_modules
            this.auditService = new AuditService_1.AuditService(this.optimizedSupabase.getConnection(), logger);
            logger.info('Audit service initialized', {});
            // Initialize Outbox Repository
            this.outboxRepository = new SupabaseOutboxRepository_1.SupabaseOutboxRepository(this.optimizedSupabase.getConnection(), logger);
            logger.info('Outbox repository initialized', {});
            // Initialize Infrastructure Layer (inject services + event publisher + outbox)
            this.patientRepository = new SupabasePatientRepository_1.SupabasePatientRepository(this.optimizedSupabase, logger, this.matchingService, // ✅ Inject matching service
            this.eventPublisher, // ✅ Inject event publisher (fallback)
            this.patientCache, // ✅ Inject patient cache (L1/L2)
            this.outboxRepository);
            // Initialize degradation service with real repository (BEFORE health check)
            this.degradationService = new GracefulDegradation_1.PatientRegistryDegradation({
                enableReadOnlyFallback: true,
                enableCacheFallback: true,
                enableEmergencyMode: true,
                maxDegradationTime: 300000, // 5 minutes
            }, {
                supabaseUrl: config.supabaseUrl,
                supabaseServiceRoleKey: config.supabaseKey,
            }, logger, this.patientRepository);
            logger.info('Degradation service initialized with real repository', {});
            // Initialize Health Check Service (AFTER degradation service)
            this.healthCheck = new HealthChecks_1.PatientRegistryHealthCheck(config.supabaseUrl, config.supabaseKey, this.degradationService);
            logger.info('Health check service initialized', {});
            // Initialize Application Layer (Use Cases)
            this.registerPatientUseCase = new RegisterPatientUseCase_1.RegisterPatientUseCase(this.patientRepository, this.eventBus, logger, this.auditService, this.supabaseClient);
            this.updatePatientInfoUseCase = new UpdatePatientInfoUseCase_1.UpdatePatientInfoUseCase(this.patientRepository, this.eventBus, logger, this.auditService);
            this.getPatientProfileUseCase = new GetPatientProfileUseCase_1.GetPatientProfileUseCase(this.patientRepository, logger, this.auditService);
            this.searchPatientsUseCase = new SearchPatientsUseCase_1.SearchPatientsUseCase(this.patientRepository);
            this.matchPatientsUseCase = new MatchPatientsUseCase_1.MatchPatientsUseCase(this.patientRepository, this.matchingService, logger);
            this.mergePatientsUseCase = new MergePatientsUseCase_1.MergePatientsUseCase(this.patientRepository);
            this.linkPatientsUseCase = new LinkPatientsUseCase_1.LinkPatientsUseCase(this.patientRepository);
            this.deactivatePatientUseCase = new DeactivatePatientUseCase_1.DeactivatePatientUseCase(this.patientRepository, this.eventBus, logger, this.auditService);
            this.validateInsuranceUseCase = new ValidateInsuranceUseCase_1.ValidateInsuranceUseCase(this.patientRepository, this.insuranceValidationService, logger);
            this.addEmergencyContactUseCase = new AddEmergencyContactUseCase_1.AddEmergencyContactUseCase(this.patientRepository, this.eventBus, logger, this.auditService);
            this.getEmergencyContactsUseCase = new GetEmergencyContactsUseCase_1.GetEmergencyContactsUseCase(this.patientRepository, logger);
            this.updateEmergencyContactUseCase = new UpdateEmergencyContactUseCase_1.UpdateEmergencyContactUseCase(this.patientRepository, this.eventBus, logger);
            this.removeEmergencyContactUseCase = new RemoveEmergencyContactUseCase_1.RemoveEmergencyContactUseCase(this.patientRepository, this.eventBus, logger, this.auditService);
            this.setPrimaryEmergencyContactUseCase =
                new SetPrimaryEmergencyContactUseCase_1.SetPrimaryEmergencyContactUseCase(this.patientRepository, this.eventBus, logger);
            this.grantConsentUseCase = new GrantConsentUseCase_1.GrantConsentUseCase(this.patientRepository, this.auditService, logger);
            this.getConsentsUseCase = new GetConsentsUseCase_1.GetConsentsUseCase(this.patientRepository, logger);
            this.getConsentDetailsUseCase = new GetConsentDetailsUseCase_1.GetConsentDetailsUseCase(this.patientRepository, logger);
            this.revokeConsentUseCase = new RevokeConsentUseCase_1.RevokeConsentUseCase(this.patientRepository, this.eventBus, logger, this.auditService);
            this.getActiveConsentsUseCase = new GetActiveConsentsUseCase_1.GetActiveConsentsUseCase(this.patientRepository, logger);
            this.getInsuranceInfoUseCase = new GetInsuranceInfoUseCase_1.GetInsuranceInfoUseCase(this.patientRepository, logger);
            this.addInsuranceInfoUseCase = new AddInsuranceInfoUseCase_1.AddInsuranceInfoUseCase(this.patientRepository, logger);
            this.updateInsuranceInfoUseCase = new UpdateInsuranceInfoUseCase_1.UpdateInsuranceInfoUseCase(this.patientRepository, this.eventBus, logger);
            this.verifyInsuranceUseCase = new VerifyInsuranceUseCase_1.VerifyInsuranceUseCase(this.patientRepository, logger);
            this.markAsDeceasedUseCase = new MarkAsDeceasedUseCase_1.MarkAsDeceasedUseCase(this.patientRepository);
            this.reactivatePatientUseCase = new ReactivatePatientUseCase_1.ReactivatePatientUseCase(this.patientRepository);
            this.getPatientStatisticsUseCase = new GetPatientStatisticsUseCase_1.GetPatientStatisticsUseCase(this.patientRepository);
            // Initialize Storage Service
            // Type cast needed due to duplicate @supabase/supabase-js in root and service node_modules
            this.storageService = new SupabaseStorageService_1.SupabaseStorageService(this.optimizedSupabase.getConnection(), logger);
            // Initialize Photo Use Cases
            this.uploadPatientPhotoUseCase = new UploadPatientPhotoUseCase_1.UploadPatientPhotoUseCase(this.patientRepository, this.storageService);
            this.getPatientPhotoUseCase = new GetPatientPhotoUseCase_1.GetPatientPhotoUseCase(this.patientRepository);
            this.deletePatientPhotoUseCase = new DeletePatientPhotoUseCase_1.DeletePatientPhotoUseCase(this.patientRepository, this.storageService);
            // Initialize Communication Preferences Use Cases
            this.updateCommunicationPreferencesUseCase =
                new UpdateCommunicationPreferencesUseCase_1.UpdateCommunicationPreferencesUseCase(this.patientRepository);
            this.getCommunicationPreferencesUseCase =
                new GetCommunicationPreferencesUseCase_1.GetCommunicationPreferencesUseCase(this.patientRepository);
            // Initialize Patient History Use Case
            this.getPatientHistoryUseCase = new GetPatientHistoryUseCase_1.GetPatientHistoryUseCase(this.patientRepository, logger);
            this.patientQueryHandlers = new PatientQueryHandlers_1.PatientQueryHandlers(this.getPatientProfileUseCase, this.searchPatientsUseCase, this.patientRepository, logger);
            // Initialize Command Handlers (CQRS)
            this.patientCommandHandlers = new PatientCommandHandlers_1.PatientCommandHandlers(this.registerPatientUseCase, this.updatePatientInfoUseCase, this.deactivatePatientUseCase, this.grantConsentUseCase, this.addEmergencyContactUseCase, logger);
            // Initialize Presentation Layer
            this.patientController = new PatientController_1.PatientController(logger, this.registerPatientUseCase, this.updatePatientInfoUseCase, this.matchPatientsUseCase, this.mergePatientsUseCase, this.linkPatientsUseCase, this.deactivatePatientUseCase, this.validateInsuranceUseCase, this.addEmergencyContactUseCase, this.getEmergencyContactsUseCase, this.updateEmergencyContactUseCase, this.removeEmergencyContactUseCase, this.setPrimaryEmergencyContactUseCase, this.grantConsentUseCase, this.getConsentsUseCase, this.getConsentDetailsUseCase, this.revokeConsentUseCase, this.getActiveConsentsUseCase, this.getInsuranceInfoUseCase, this.addInsuranceInfoUseCase, this.updateInsuranceInfoUseCase, this.verifyInsuranceUseCase, this.markAsDeceasedUseCase, this.reactivatePatientUseCase, this.getPatientStatisticsUseCase, this.uploadPatientPhotoUseCase, this.getPatientPhotoUseCase, this.deletePatientPhotoUseCase, this.updateCommunicationPreferencesUseCase, this.getCommunicationPreferencesUseCase, this.getPatientHistoryUseCase, this.patientQueryHandlers);
            this.commandController = new CommandController_1.CommandController(logger, this.patientCommandHandlers);
            this.errorHandlingMiddleware = new ErrorHandlingMiddleware_1.ErrorHandlingMiddleware(logger);
            // Initialize Authentication Middleware
            this.authMiddleware = new AuthenticationMiddleware_1.AuthenticationMiddleware({
                identityServiceUrl: config.identityServiceUrl,
                logger,
                skipPaths: ['/health', '/degradation'],
            });
            // Initialize Authorization Middleware (Smart Ownership-based)
            this.authorizationMiddleware = new AuthorizationMiddleware_1.AuthorizationMiddleware({
                logger,
                patientRepository: this.patientRepository,
            });
            // Initialize Identity Event Handlers
            const userCreatedHandler = new infrastructure_1.IdentityUserCreatedEventHandler(logger, this.patientRepository);
            const userDeletedHandler = new infrastructure_1.IdentityUserDeletedEventHandler(logger, this.patientRepository);
            const userUpdatedHandler = new infrastructure_1.IdentityUserUpdatedEventHandler(logger, this.patientRepository);
            const userActivatedHandler = new infrastructure_1.UserActivatedEventHandler(logger, this.patientRepository);
            // Initialize Identity Event Consumer with DLQ support
            this.identityEventConsumer = new infrastructure_1.IdentityEventConsumer({
                rabbitmqUrl: config.rabbitmqUrl,
                queueName: 'patient.identity.queue',
                exchangeName: 'hospital.events',
                routingKeys: [
                    'user.created.event', // UserCreatedEvent
                    'user.deleted.event', // UserDeletedEvent
                    'user.updated.event', // UserUpdatedEvent
                    'user.activated.event', // UserActivatedEvent (bonus)
                ],
                deadLetterExchange: 'hospital.events.dlx',
                deadLetterQueue: 'patient.identity.queue.dlq',
                maxRetries: 3,
                connectionRetries: rabbitmqConnectionRetries,
                connectionRetryDelayMs: rabbitmqConnectionRetryDelayMs,
            }, logger, userCreatedHandler, userDeletedHandler, userUpdatedHandler, userActivatedHandler, this.auditService);
            // Connect Identity Event Consumer
            await this.identityEventConsumer.connect();
            logger.info('Identity event consumer connected');
            logger.info('Dependencies initialized successfully');
        }
        catch (error) {
            logger.fatal('Failed to initialize dependencies', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    /**
     * Validate configuration
     */
    validateConfiguration() {
        const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
        const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);
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
                    imgSrc: ["'self'", 'data:', 'https:'],
                },
            },
            hsts: {
                maxAge: 31536000,
                includeSubDomains: true,
                preload: true,
            },
        }));
        // CORS
        this.app.use((0, cors_1.default)({
            origin: config.allowedOrigins,
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization'],
        }));
        // Compression
        this.app.use((0, compression_1.default)());
        // Body parsing
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
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
        logger.info('Rate limiting DISABLED for development');
        // }
        // Request logging
        this.app.use((req, _res, next) => {
            logger.info('Incoming request', {
                method: req.method,
                path: req.path,
                ip: req.ip,
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
        // Health & Metrics routes
        const healthRoutes = (0, healthRoutes_1.createHealthRoutes)({
            healthCheck: this.healthCheck,
            logger,
        });
        this.app.use('/', healthRoutes);
        // Prometheus metrics endpoint
        this.app.get('/metrics', async (_req, res) => {
            try {
                res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
                const metrics = await PrometheusMetrics_1.prometheusMetrics.getMetrics();
                res.send(metrics);
            }
            catch (error) {
                logger.error('Failed to generate metrics', { error });
                res.status(500).send('Failed to generate metrics');
            }
        });
        logger.info('Prometheus metrics endpoint registered at /metrics');
        // Swagger API Documentation
        // Accessible at: http://localhost:3023/api-docs
        this.app.use('/api-docs', swagger_ui_express_1.default.serve);
        this.app.get('/api-docs', swagger_ui_express_1.default.setup(swagger_config_1.swaggerSpec, {
            customSiteTitle: 'Patient Registry Service API',
            customCss: '.swagger-ui .topbar { display: none }',
            swaggerOptions: {
                persistAuthorization: true,
                displayRequestDuration: true,
                filter: true,
                tryItOutEnabled: true,
            },
        }));
        // OpenAPI JSON spec
        this.app.get('/api-docs/json', (_req, res) => {
            res.setHeader('Content-Type', 'application/json');
            res.send(swagger_config_1.swaggerSpec);
        });
        logger.info('Swagger UI available at http://localhost:' + config.port + '/api-docs');
        // Degradation status endpoint
        this.app.get('/degradation', (_req, res) => {
            try {
                const status = this.degradationService.getStatus();
                res.status(200).json({
                    ...status,
                    timestamp: new Date(),
                });
            }
            catch (error) {
                logger.error('Degradation status check failed', {
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
                res.status(500).json({
                    error: error instanceof Error ? error.message : 'Unknown error',
                    timestamp: new Date(),
                });
            }
        });
        // API routes with authentication
        const patientRoutes = (0, patientRoutes_1.createPatientRoutes)(this.patientController, this.authorizationMiddleware);
        this.app.use('/api/v1/patients', this.authMiddleware.authenticate(), patientRoutes);
        // CQRS Command routes with authentication
        const commandRoutes = (0, commandRoutes_1.createCommandRoutes)(this.commandController);
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
    async start() {
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
        }
        catch (error) {
            logger.fatal('Failed to start service', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            process.exit(1);
        }
    }
    /**
     * Start Outbox Publisher Worker
     */
    async startOutboxWorker() {
        try {
            // Initialize outbox worker
            this.outboxWorker = new OutboxPublisherWorker_1.OutboxPublisherWorker(this.outboxRepository, logger, async (event) => {
                // Publish event to RabbitMQ
                await this.eventPublisher.publish(event);
            }, {
                enabled: config.nodeEnv !== 'test', // Disable in test environment
                pollingIntervalMs: 5000, // Poll every 5 seconds
                batchSize: 50, // Process 50 events per batch
            });
            await this.outboxWorker.start();
            logger.info('Outbox publisher worker started', {
                pollingIntervalMs: 5000,
                batchSize: 50,
            });
        }
        catch (error) {
            logger.error('Failed to start outbox worker', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            // Don't fail service startup if outbox worker fails
            // Events will accumulate in outbox table and can be processed later
        }
    }
    /**
     * Graceful shutdown
     */
    async shutdown() {
        logger.info('Shutting down gracefully...');
        try {
            // Stop Outbox Worker
            if (this.outboxWorker) {
                await this.outboxWorker.stop();
                logger.info('Outbox worker stopped');
            }
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
            if (this.optimizedSupabase) {
                await this.optimizedSupabase.close();
                logger.info('Supabase client closed');
            }
            logger.info('Graceful shutdown complete');
            process.exit(0);
        }
        catch (error) {
            logger.error('Error during shutdown', {
                error: error instanceof Error ? error.message : 'Unknown error',
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
        error: error instanceof Error ? error.message : 'Unknown error',
    });
    process.exit(1);
});
//# sourceMappingURL=main.js.map