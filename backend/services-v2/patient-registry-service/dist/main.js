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
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const compression_1 = __importDefault(require("compression"));
// Infrastructure imports
const SupabasePatientRepository_1 = require("./infrastructure/repositories/SupabasePatientRepository");
const PatientMatchingService_1 = require("./infrastructure/services/PatientMatchingService");
const InsuranceValidationService_1 = require("./infrastructure/services/InsuranceValidationService");
const PatientDomainEventHandler_1 = require("./infrastructure/events/PatientDomainEventHandler");
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
// Presentation imports
const PatientController_1 = require("./presentation/controllers/PatientController");
const patientRoutes_1 = require("./presentation/routes/patientRoutes");
const ErrorHandlingMiddleware_1 = require("./presentation/middleware/ErrorHandlingMiddleware");
// Configuration
const config = {
    port: process.env.PORT || 3023,
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    nodeEnv: process.env.NODE_ENV || 'development',
    serviceName: 'patient-registry-service',
    version: '2.0.0',
    allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',')
};
// Logger setup (simplified - in production use Winston or similar)
const logger = {
    debug: (message, meta) => {
        if (config.nodeEnv === 'development') {
            console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`, meta || '');
        }
    },
    info: (message, meta) => {
        console.log(`[INFO] ${new Date().toISOString()} - ${message}`, meta || '');
    },
    warn: (message, meta) => {
        console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, meta || '');
    },
    error: (message, meta) => {
        console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, meta || '');
    },
    fatal: (message, meta) => {
        console.error(`[FATAL] ${new Date().toISOString()} - ${message}`, meta || '');
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
            // Initialize Infrastructure Layer
            this.patientRepository = new SupabasePatientRepository_1.SupabasePatientRepository(config.supabaseUrl, config.supabaseKey, logger);
            this.matchingService = new PatientMatchingService_1.PatientMatchingService(logger);
            this.insuranceValidationService = new InsuranceValidationService_1.InsuranceValidationService();
            this.eventHandler = new PatientDomainEventHandler_1.PatientDomainEventHandler(logger);
            // Initialize Application Layer (Use Cases)
            this.registerPatientUseCase = new RegisterPatientUseCase_1.RegisterPatientUseCase(this.patientRepository, this.eventHandler, logger);
            this.updatePatientInfoUseCase = new UpdatePatientInfoUseCase_1.UpdatePatientInfoUseCase(this.patientRepository, this.eventHandler, logger);
            this.getPatientProfileUseCase = new GetPatientProfileUseCase_1.GetPatientProfileUseCase(this.patientRepository, logger);
            this.searchPatientsUseCase = new SearchPatientsUseCase_1.SearchPatientsUseCase(this.patientRepository, logger);
            this.matchPatientsUseCase = new MatchPatientsUseCase_1.MatchPatientsUseCase(this.patientRepository, this.matchingService, logger);
            this.mergePatientsUseCase = new MergePatientsUseCase_1.MergePatientsUseCase(this.patientRepository, this.eventHandler, logger);
            this.linkPatientsUseCase = new LinkPatientsUseCase_1.LinkPatientsUseCase(this.patientRepository, this.eventHandler, logger);
            this.deactivatePatientUseCase = new DeactivatePatientUseCase_1.DeactivatePatientUseCase(this.patientRepository, this.eventHandler, logger);
            this.validateInsuranceUseCase = new ValidateInsuranceUseCase_1.ValidateInsuranceUseCase(this.insuranceValidationService, logger);
            // Initialize Presentation Layer
            this.patientController = new PatientController_1.PatientController(logger, this.registerPatientUseCase, this.updatePatientInfoUseCase, this.getPatientProfileUseCase, this.searchPatientsUseCase, this.matchPatientsUseCase, this.mergePatientsUseCase, this.linkPatientsUseCase, this.deactivatePatientUseCase, this.validateInsuranceUseCase);
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
        this.app.get('/health', (_req, res) => {
            res.status(200).json({
                status: 'healthy',
                service: config.serviceName,
                version: config.version,
                timestamp: new Date().toISOString()
            });
        });
        // API routes
        const patientRoutes = (0, patientRoutes_1.createPatientRoutes)(this.patientController);
        this.app.use('/api/v1/patients', patientRoutes);
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
        // Close database connections, etc.
        // await this.patientRepository.close();
        logger.info('Shutdown complete');
        process.exit(0);
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