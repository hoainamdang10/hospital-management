"use strict";
/**
 * Clinical EMR Service - Express Application Setup
 * Main application configuration and middleware setup
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Express.js, HIPAA, Vietnamese Healthcare Standards
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
exports.createApp = createApp;
exports.initializeApp = initializeApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
// Infrastructure
const container_1 = require("./infrastructure/di/container");
const types_1 = require("./infrastructure/di/types");
// Routes
const medical_record_routes_1 = require("./presentation/routes/medical-record.routes");
// Middleware
const error_handling_middleware_1 = require("../../shared/presentation/middleware/error-handling.middleware");
const request_logging_middleware_1 = require("../../shared/presentation/middleware/request-logging.middleware");
const health_check_middleware_1 = require("../../shared/presentation/middleware/health-check.middleware");
/**
 * Create and configure Express application
 */
async function createApp() {
    const app = (0, express_1.default)();
    // Get configuration
    const config = container_1.container.get(types_1.TYPES.Config);
    // =====================================================
    // SECURITY MIDDLEWARE
    // =====================================================
    // Helmet for security headers
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", "data:", "https:"],
                connectSrc: ["'self'"],
                fontSrc: ["'self'"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"]
            }
        },
        crossOriginEmbedderPolicy: false
    }));
    // CORS configuration
    app.use((0, cors_1.default)({
        origin: config.corsOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: [
            'Origin',
            'X-Requested-With',
            'Content-Type',
            'Accept',
            'Authorization',
            'X-User-ID',
            'X-User-Roles',
            'X-Request-ID',
            'X-Correlation-ID'
        ]
    }));
    // Rate limiting
    const limiter = (0, express_rate_limit_1.default)({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 1000, // limit each IP to 1000 requests per windowMs
        message: {
            error: 'Quá nhiều yêu cầu từ IP này',
            message: 'Vui lòng thử lại sau 15 phút',
            retryAfter: 15 * 60
        },
        standardHeaders: true,
        legacyHeaders: false,
        skip: (req) => {
            // Skip rate limiting for health checks
            return req.path.includes('/health') ||
                req.path.includes('/ready') ||
                req.path.includes('/live');
        }
    });
    app.use(limiter);
    // =====================================================
    // GENERAL MIDDLEWARE
    // =====================================================
    // Compression
    app.use((0, compression_1.default)());
    // Body parsing
    app.use(express_1.default.json({
        limit: '10mb',
        verify: (req, res, buf) => {
            req.rawBody = buf;
        }
    }));
    app.use(express_1.default.urlencoded({
        extended: true,
        limit: '10mb'
    }));
    // Request logging
    if (config.isDevelopment()) {
        app.use((0, morgan_1.default)('dev'));
    }
    else {
        app.use((0, morgan_1.default)('combined'));
    }
    // Custom request logging middleware
    app.use(request_logging_middleware_1.requestLoggingMiddleware);
    // Request ID middleware
    app.use((req, res, next) => {
        req.headers['x-request-id'] = req.headers['x-request-id'] ||
            `clinical-emr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        res.setHeader('X-Request-ID', req.headers['x-request-id']);
        next();
    });
    // =====================================================
    // HEALTH CHECK ENDPOINTS
    // =====================================================
    app.use('/health', health_check_middleware_1.healthCheckMiddleware);
    app.get('/health', (req, res) => {
        res.status(200).json({
            service: 'clinical-emr-service',
            version: '2.0.0',
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: config.environment,
            port: config.port
        });
    });
    app.get('/ready', async (req, res) => {
        try {
            // Check container health
            const { healthy, errors } = await Promise.resolve().then(() => __importStar(require('./infrastructure/di/container'))).then(m => m.checkContainerHealth());
            if (healthy) {
                res.status(200).json({
                    status: 'ready',
                    timestamp: new Date().toISOString(),
                    service: 'clinical-emr-service',
                    version: '2.0.0'
                });
            }
            else {
                res.status(503).json({
                    status: 'not ready',
                    timestamp: new Date().toISOString(),
                    errors
                });
            }
        }
        catch (error) {
            res.status(503).json({
                status: 'not ready',
                timestamp: new Date().toISOString(),
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
    app.get('/live', (req, res) => {
        res.status(200).json({
            status: 'alive',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            pid: process.pid
        });
    });
    // =====================================================
    // API ROUTES
    // =====================================================
    // API version info
    app.get('/api/v2/clinical-emr', (req, res) => {
        res.json({
            service: 'clinical-emr-service',
            version: '2.0.0',
            description: 'Clinical EMR Service - Simplified medical records management for graduation thesis',
            author: 'Hospital Management Team',
            endpoints: {
                health: '/health',
                ready: '/ready',
                live: '/live',
                medicalRecords: '/api/v2/clinical-emr/medical-records',
                patients: '/api/v2/clinical-emr/patients/:patientId/medical-records',
                doctors: '/api/v2/clinical-emr/doctors/:doctorId/medical-records',
                statistics: '/api/v2/clinical-emr/statistics'
            },
            features: [
                'Basic medical records CRUD',
                'Simple vital signs tracking',
                'Patient medical history',
                'Doctor medical records',
                'Vietnamese language support',
                'HIPAA compliance',
                'Role-based access control',
                'Audit logging'
            ],
            compliance: [
                'Clean Architecture',
                'Domain-Driven Design',
                'CQRS Pattern',
                'Event-Driven Architecture',
                'HIPAA Standards',
                'Vietnamese Healthcare Standards'
            ]
        });
    });
    // Mount medical record routes
    app.use('/api/v2/clinical-emr', (0, medical_record_routes_1.createMedicalRecordRoutes)());
    // =====================================================
    // ERROR HANDLING
    // =====================================================
    // 404 handler
    app.use('*', (req, res) => {
        res.status(404).json({
            success: false,
            message: 'Endpoint không tồn tại',
            error: {
                code: 'ENDPOINT_NOT_FOUND',
                path: req.originalUrl,
                method: req.method,
                timestamp: new Date().toISOString()
            }
        });
    });
    // Global error handler
    app.use(error_handling_middleware_1.errorHandlingMiddleware);
    // =====================================================
    // GRACEFUL SHUTDOWN HANDLERS
    // =====================================================
    process.on('SIGTERM', async () => {
        console.log('SIGTERM received, shutting down gracefully...');
        await gracefulShutdown();
    });
    process.on('SIGINT', async () => {
        console.log('SIGINT received, shutting down gracefully...');
        await gracefulShutdown();
    });
    process.on('uncaughtException', (error) => {
        console.error('Uncaught Exception:', error);
        process.exit(1);
    });
    process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled Rejection at:', promise, 'reason:', reason);
        process.exit(1);
    });
    return app;
}
/**
 * Graceful shutdown handler
 */
async function gracefulShutdown() {
    try {
        console.log('Starting graceful shutdown...');
        // Cleanup container
        const { cleanupContainer } = await Promise.resolve().then(() => __importStar(require('./infrastructure/di/container')));
        await cleanupContainer();
        console.log('Graceful shutdown completed');
        process.exit(0);
    }
    catch (error) {
        console.error('Error during graceful shutdown:', error);
        process.exit(1);
    }
}
/**
 * Initialize application with dependencies
 */
async function initializeApp() {
    try {
        console.log('Initializing Clinical EMR Service...');
        // Initialize container
        const { success, errors } = await (0, container_1.initializeContainer)();
        if (!success) {
            throw new Error(`Container initialization failed: ${errors.join(', ')}`);
        }
        // Create Express app
        const app = await createApp();
        console.log('Clinical EMR Service initialized successfully');
        return app;
    }
    catch (error) {
        console.error('Failed to initialize Clinical EMR Service:', error);
        throw error;
    }
}
//# sourceMappingURL=app.js.map