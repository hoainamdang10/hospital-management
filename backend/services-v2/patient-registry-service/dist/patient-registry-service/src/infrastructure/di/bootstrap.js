"use strict";
/**
 * Bootstrap Module - Application Initialization
 * Patient Registry Service V2
 *
 * Provides a clean way to initialize the application with DI container
 *
 * Usage:
 *   import { bootstrap } from './infrastructure/di/bootstrap';
 *   const { app, container } = await bootstrap(config);
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bootstrap = bootstrap;
exports.startServer = startServer;
exports.shutdown = shutdown;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const compression_1 = __importDefault(require("compression"));
const ServiceContainer_1 = require("./ServiceContainer");
const PatientController_1 = require("../../presentation/controllers/PatientController");
const patientRoutes_1 = require("../../presentation/routes/patientRoutes");
const ErrorHandlingMiddleware_1 = require("../../presentation/middleware/ErrorHandlingMiddleware");
/**
 * Bootstrap the application
 *
 * @param config Application configuration
 * @returns Express app and service container
 */
async function bootstrap(config) {
    console.log('🚀 Bootstrapping Patient Registry Service V2...\n');
    // 1. Validate configuration
    validateConfig(config);
    // 2. Create and initialize service container
    const containerConfig = {
        supabaseUrl: config.supabaseUrl,
        supabaseServiceKey: config.supabaseServiceKey,
        circuitBreakerConfig: config.circuitBreaker
    };
    const container = await (0, ServiceContainer_1.createServiceContainer)(containerConfig);
    // 3. Create Express app
    const app = (0, express_1.default)();
    // 4. Setup middleware
    setupMiddleware(app, config);
    // 5. Setup routes
    setupRoutes(app, container);
    // 6. Setup error handling
    setupErrorHandling(app);
    console.log('✅ Bootstrap complete\n');
    return { app, container, config };
}
/**
 * Validate configuration
 */
function validateConfig(config) {
    console.log('🔍 Validating configuration...');
    const requiredFields = [
        'supabaseUrl',
        'supabaseServiceKey'
    ];
    const missingFields = requiredFields.filter(field => !config[field]);
    if (missingFields.length > 0) {
        throw new Error(`Missing required configuration: ${missingFields.join(', ')}`);
    }
    console.log('  ✅ Configuration valid');
}
/**
 * Setup Express middleware
 */
function setupMiddleware(app, config) {
    console.log('🔧 Setting up middleware...');
    // Security middleware
    app.use((0, helmet_1.default)({
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
    app.use((0, cors_1.default)({
        origin: config.allowedOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    }));
    // Compression
    app.use((0, compression_1.default)());
    // Body parsing
    app.use(express_1.default.json({ limit: '10mb' }));
    app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
    // Rate limiting
    const limiter = (0, express_rate_limit_1.default)({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // Limit each IP to 100 requests per windowMs
        message: 'Too many requests from this IP, please try again later.',
        standardHeaders: true,
        legacyHeaders: false
    });
    app.use('/api/', limiter);
    // Request logging
    app.use((req, _res, next) => {
        console.log(`${req.method} ${req.path}`);
        next();
    });
    console.log('  ✅ Middleware configured');
}
/**
 * Setup application routes
 */
function setupRoutes(app, container) {
    console.log('🛣️  Setting up routes...');
    // Health check
    app.get('/health', (_req, res) => {
        res.json({
            status: 'healthy',
            service: 'patient-registry-service',
            version: '2.0.0',
            timestamp: new Date().toISOString()
        });
    });
    // API info
    app.get('/api/v1', (_req, res) => {
        res.json({
            service: 'Patient Registry Service V2',
            version: '2.0.0',
            description: 'Clean Architecture + DDD + CQRS Patient Management',
            endpoints: {
                health: '/health',
                patients: '/api/v1/patients',
                docs: '/api/v1/docs'
            }
        });
    });
    // Initialize controller with use cases from container
    const patientController = new PatientController_1.PatientController(container.getRegisterPatientUseCase(), container.getGetPatientByIdUseCase(), container.getUpdatePatientUseCase(), container.getSearchPatientsUseCase(), container.getValidateInsuranceUseCase(), container.getMergePatientsUseCase());
    // Patient routes
    const patientRoutes = (0, patientRoutes_1.createPatientRoutes)(patientController);
    app.use('/api/v1/patients', patientRoutes);
    // 404 handler
    app.use((_req, res) => {
        res.status(404).json({
            success: false,
            message: 'Endpoint not found',
            error: 'NOT_FOUND'
        });
    });
    console.log('  ✅ Routes configured');
}
/**
 * Setup error handling
 */
function setupErrorHandling(app) {
    console.log('🛡️  Setting up error handling...');
    const errorMiddleware = new ErrorHandlingMiddleware_1.ErrorHandlingMiddleware();
    // Global error handler
    app.use(errorMiddleware.handle.bind(errorMiddleware));
    console.log('  ✅ Error handling configured');
}
/**
 * Start the application server
 */
async function startServer(app, config) {
    return new Promise((resolve) => {
        app.listen(config.port, () => {
            console.log('\n🎉 Patient Registry Service V2 Started!\n');
            console.log(`📍 Environment: ${config.nodeEnv}`);
            console.log(`🌐 Port: ${config.port}`);
            console.log(`🔗 Health: http://localhost:${config.port}/health`);
            console.log(`🔗 API: http://localhost:${config.port}/api/v1`);
            console.log(`📚 Docs: http://localhost:${config.port}/api/v1/docs`);
            console.log('\n✅ Ready to accept requests\n');
            resolve();
        });
    });
}
/**
 * Graceful shutdown
 */
async function shutdown(container) {
    console.log('\n🛑 Shutting down gracefully...');
    await container.shutdown();
    console.log('✅ Shutdown complete');
    process.exit(0);
}
//# sourceMappingURL=bootstrap.js.map