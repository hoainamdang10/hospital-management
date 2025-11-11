"use strict";
/**
 * Appointments Service - Main Entry Point
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @port 3024
 * @schema appointments_schema
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
// Load environment variables first
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const appointment_routes_1 = require("./presentation/routes/appointment.routes");
const appointmentQueryRoutes_1 = require("./presentation/routes/appointmentQueryRoutes");
const availability_routes_1 = require("./presentation/routes/availability.routes");
const queue_routes_1 = require("./presentation/routes/queue.routes");
const waitlist_routes_1 = require("./presentation/routes/waitlist.routes");
const container_1 = require("./infrastructure/di/container");
const RedisCacheService_1 = require("./infrastructure/cache/RedisCacheService");
const ValidationMiddleware_1 = require("./presentation/middleware/ValidationMiddleware");
const ConfigValidator_1 = require("./infrastructure/config/ConfigValidator");
const Logger_1 = require("./infrastructure/logging/Logger");
const LoggingMiddleware_1 = require("./presentation/middleware/LoggingMiddleware");
const MetricsMiddleware_1 = require("./presentation/middleware/MetricsMiddleware");
const PrometheusMetrics_1 = require("./infrastructure/monitoring/PrometheusMetrics");
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_config_1 = require("./infrastructure/swagger/swagger.config");
const app = (0, express_1.default)();
// Initialize DI Container
console.log("[Main] Initializing DI Container...");
const container = (0, container_1.getContainer)();
const config = container.getConfig();
const healthCheckService = container.getHealthCheckService();
const metricsService = container.getMetricsService();
console.log("[Main] DI Container initialized successfully");
const staticAllowedOrigins = new Set((Array.isArray(config.cors.origin)
    ? config.cors.origin
    : [config.cors.origin])
    .map((origin) => origin?.trim())
    .filter((origin) => Boolean(origin)));
const devOriginPatterns = [
    /^https?:\/\/localhost(?::\d+)?$/i,
    /^https?:\/\/127\.0\.0\.1(?::\d+)?$/i,
    /^https?:\/\/0\.0\.0\.0(?::\d+)?$/i,
];
const isOriginAllowed = (origin) => {
    if (staticAllowedOrigins.has(origin)) {
        return true;
    }
    return devOriginPatterns.some((pattern) => pattern.test(origin));
};
// Print configuration summary
console.log((0, ConfigValidator_1.getConfigSummary)(config));
const PORT = config.port;
const SERVICE_NAME = config.serviceName;
// Initialize logger
const logger = (0, Logger_1.createLogger)(SERVICE_NAME, config.logging.level);
// Security Middleware - Order matters!
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
            scriptSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
            imgSrc: ["'self'", "data:", "https:", "cdn.jsdelivr.net"],
            fontSrc: ["'self'", "data:", "cdn.jsdelivr.net"],
        },
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
    },
}));
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin)
            return callback(null, true);
        const normalizedOrigin = origin.trim();
        if (isOriginAllowed(normalizedOrigin)) {
            callback(null, true);
        }
        else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Idempotency-Key"],
    exposedHeaders: [
        "X-RateLimit-Limit",
        "X-RateLimit-Remaining",
        "X-RateLimit-Reset",
    ],
}));
// Request logging (Morgan for basic HTTP logs)
if (config.logging.enableRequestLogging) {
    app.use((0, morgan_1.default)("combined"));
}
// Metrics collection middleware
app.use((0, MetricsMiddleware_1.metricsMiddleware)(metricsService));
// Structured logging middleware
if (config.logging.enableRequestLogging) {
    app.use((0, LoggingMiddleware_1.requestLoggingMiddleware)(logger));
    app.use((0, LoggingMiddleware_1.performanceLoggingMiddleware)(logger, 1000)); // Log requests > 1s
}
// Rate limiting - Apply globally (reads from env: RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS)
app.use((0, ValidationMiddleware_1.rateLimitMiddleware)());
// Request size limit
app.use((0, ValidationMiddleware_1.requestSizeLimitMiddleware)(10 * 1024 * 1024)); // 10MB
// Content type validation (for POST/PUT/PATCH)
app.use((0, ValidationMiddleware_1.validateContentType)(["application/json"]));
// Body parsers
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
// Sanitize all requests
app.use(ValidationMiddleware_1.sanitizeRequest);
// Connect Redis (best-effort)
RedisCacheService_1.redisCacheService
    .connect()
    .catch(() => console.warn("[Main] Redis not connected, idempotency will be in fail-open mode"));
// Idempotency for write endpoints (applied per-route, not globally)
// Request logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});
// Health check endpoints
app.get("/health", async (req, res) => {
    try {
        const detailed = req.query.detailed === "true" || config.healthCheck.enableDetailedCheck;
        const healthStatus = await healthCheckService.check(detailed);
        const statusCode = healthStatus.status === "healthy"
            ? 200
            : healthStatus.status === "degraded"
                ? 200
                : 503;
        res.status(statusCode).json(healthStatus);
    }
    catch (error) {
        console.error("[Health] Health check failed:", error);
        res.status(503).json({
            service: SERVICE_NAME,
            status: "unhealthy",
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
// Simple liveness probe
app.get("/health/live", (req, res) => {
    res.status(200).json({
        status: "alive",
        timestamp: new Date().toISOString(),
    });
});
// Readiness probe
app.get("/health/ready", async (req, res) => {
    try {
        const healthStatus = await healthCheckService.check(true);
        const isReady = healthStatus.status === "healthy" || healthStatus.status === "degraded";
        res.status(isReady ? 200 : 503).json({
            status: isReady ? "ready" : "not_ready",
            timestamp: new Date().toISOString(),
            checks: healthStatus.checks,
        });
    }
    catch (error) {
        res.status(503).json({
            status: "not_ready",
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
// Metrics endpoint (existing service metrics)
app.get("/metrics/service", (0, MetricsMiddleware_1.createMetricsHandler)(metricsService));
// Prometheus metrics endpoint
app.get("/metrics", async (req, res) => {
    try {
        res.set("Content-Type", "text/plain; version=0.0.4; charset=utf-8");
        const metrics = await PrometheusMetrics_1.prometheusMetrics.getMetrics();
        res.send(metrics);
    }
    catch (error) {
        logger.error("Failed to generate Prometheus metrics", error);
        res.status(500).send("Failed to generate metrics");
    }
});
// Swagger API Documentation
// Accessible at: http://localhost:3024/api-docs
app.use("/api-docs", swagger_ui_express_1.default.serve);
app.get("/api-docs", swagger_ui_express_1.default.setup(swagger_config_1.swaggerSpec, {
    customSiteTitle: "Appointments Service API",
    customCss: ".swagger-ui .topbar { display: none }",
    swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        tryItOutEnabled: true,
    },
}));
// OpenAPI JSON spec
app.get("/api-docs/json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swagger_config_1.swaggerSpec);
});
console.log("[Main] Swagger UI available at http://localhost:" + PORT + "/api-docs");
// API Routes - Standardized to /api/v1/ prefix
// Command routes (Write operations - CQRS Commands)
app.use("/api/v1", (0, appointment_routes_1.createAppointmentRoutes)());
// Query routes (Read operations - CQRS Queries with denormalized data)
// Mounted on both v1 and v2 for backward compatibility
app.use("/api/v1", (0, appointmentQueryRoutes_1.createAppointmentQueryRoutes)());
app.use("/api/v2", (0, appointmentQueryRoutes_1.createAppointmentQueryRoutes)()); // For API Gateway v2 routes
// Availability routes (Provider schedule & available slots)  
// Keep full path since API Gateway forwards complete path
app.use("/api/v1/appointments", (0, availability_routes_1.createAvailabilityRoutes)());
// Queue routes (Queue management)
// Moved from /api/queue to /api/v1/queue for consistency
app.use("/api/v1/queue", (0, queue_routes_1.createQueueRoutes)());
// Waitlist routes (Waitlist management)
app.use("/api/v1/appointments/waitlist", (0, waitlist_routes_1.createWaitlistRoutes)());
// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: {
            code: "NOT_FOUND",
            message: "Endpoint not found",
        },
        path: req.path,
        method: req.method,
        correlationId: req.correlationId,
        timestamp: new Date().toISOString(),
    });
});
// Error logging middleware
if (config.logging.enableErrorTracking) {
    app.use((0, LoggingMiddleware_1.errorLoggingMiddleware)(logger));
}
// Error Handler
app.use((err, req, res, next) => {
    logger.error("Unhandled error", err, {
        correlationId: req.correlationId,
        method: req.method,
        path: req.path,
    });
    // Determine status code
    const statusCode = err.statusCode || 500;
    const errorCode = err.errorCode || "INTERNAL_ERROR";
    res.status(statusCode).json({
        success: false,
        error: {
            code: errorCode,
            message: err.message || "Internal server error",
            ...(config.nodeEnv === "development" && { stack: err.stack }),
        },
        correlationId: req.correlationId,
        timestamp: new Date().toISOString(),
    });
});
// Start server
const server = app.listen(PORT, async () => {
    console.log("=".repeat(60));
    console.log(`🏥 ${SERVICE_NAME.toUpperCase()}`);
    console.log("=".repeat(60));
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`✅ Environment: ${config.nodeEnv}`);
    console.log(`✅ Health check: http://localhost:${PORT}/health`);
    console.log(`✅ Liveness probe: http://localhost:${PORT}/health/live`);
    console.log(`✅ Readiness probe: http://localhost:${PORT}/health/ready`);
    console.log("=".repeat(60));
    console.log("📋 API V1 - Command Endpoints (Write Model):");
    console.log(`   POST   /api/v1/appointments - Schedule appointment`);
    console.log(`   POST   /api/v1/appointments/:id/confirm - Confirm appointment`);
    console.log(`   POST   /api/v1/appointments/:id/complete - Complete appointment`);
    console.log(`   POST   /api/v1/appointments/:id/cancel - Cancel appointment`);
    console.log(`   GET    /api/v1/appointments/:id - Get appointment (legacy)`);
    console.log(`   GET    /api/v1/appointments - List appointments (legacy)`);
    console.log("=".repeat(60));
    console.log("📊 API V2 - Query Endpoints (Read Model with Patient/Doctor Info):");
    console.log(`   GET    /api/v2/appointments/:id - Get appointment details`);
    console.log(`   GET    /api/v2/appointments - List appointments with filters`);
    console.log(`   GET    /api/v2/patients/:patientId/appointments - Patient appointments`);
    console.log(`   GET    /api/v2/doctors/:doctorId/appointments - Doctor appointments`);
    console.log("=".repeat(60));
    // Connect event subscriptions
    try {
        logger.info("Connecting event subscriptions...");
        const eventSubscriptions = container.getEventSubscriptions();
        await eventSubscriptions.connect();
        logger.info("Event subscriptions connected successfully");
        // Update HealthCheckService with EventSubscriptions dependency
        container.updateHealthCheckDependencies();
        logger.info("Health check service updated with EventSubscriptions");
    }
    catch (error) {
        logger.error("Failed to connect event subscriptions", error);
        logger.warn("Service will continue without event subscriptions");
    }
    // Start Outbox Publisher Worker
    try {
        const { OutboxRepository } = await Promise.resolve().then(() => __importStar(require("./infrastructure/outbox/OutboxRepository")));
        const { OutboxPublisherWorker } = await Promise.resolve().then(() => __importStar(require("./infrastructure/outbox/OutboxPublisherWorker")));
        const { RemoteSchedulerAdapter } = await Promise.resolve().then(() => __importStar(require("./infrastructure/adapters/RemoteSchedulerAdapter")));
        const outboxRepo = new OutboxRepository(config.supabase.url, config.supabase.serviceRoleKey, config.outbox.reservedTimeoutMinutes);
        const scheduler = new RemoteSchedulerAdapter({
            baseUrl: config.services.schedulerServiceUrl,
            apiKey: config.services.schedulerApiKey,
            timeout: 5000,
        });
        const worker = new OutboxPublisherWorker(outboxRepo, scheduler, {
            intervalMs: config.outbox.pollIntervalMs,
            batchSize: config.outbox.batchSize,
            baseDelayMs: config.outbox.baseDelayMs,
            maxDelayMs: config.outbox.maxDelayMs,
        });
        worker.start();
        app.outboxWorker = worker;
        logger.info("Outbox publisher worker started", undefined, {
            pollIntervalMs: config.outbox.pollIntervalMs,
            batchSize: config.outbox.batchSize,
        });
    }
    catch (e) {
        logger.error("Failed to start Outbox publisher worker", e);
    }
});
// Graceful shutdown
const gracefulShutdown = async (signal) => {
    logger.info(`${signal} signal received: initiating graceful shutdown`);
    // Disconnect event subscriptions
    try {
        const eventSubscriptions = container.getEventSubscriptions();
        await eventSubscriptions.disconnect();
        logger.info("Event subscriptions disconnected");
    }
    catch (error) {
        logger.error("Failed to disconnect event subscriptions", error);
    }
    // Stop outbox worker
    try {
        const worker = app.outboxWorker;
        if (worker) {
            worker.stop();
            logger.info("Outbox worker stopped");
        }
    }
    catch (error) {
        logger.error("Failed to stop outbox worker", error);
    }
    // Close HTTP server
    server.close(() => {
        logger.info("HTTP server closed");
        process.exit(0);
    });
    // Force shutdown after 10 seconds
    setTimeout(() => {
        logger.error("Forced shutdown after timeout");
        process.exit(1);
    }, 10000);
};
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
exports.default = app;
//# sourceMappingURL=main.js.map