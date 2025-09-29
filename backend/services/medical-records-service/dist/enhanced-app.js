"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEnhancedApp = createEnhancedApp;
const shared_1 = require("@hospital/shared");
const compression_1 = __importDefault(require("compression"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const helmet_1 = __importDefault(require("helmet"));
const enhanced_medical_record_routes_1 = require("./routes/enhanced-medical-record.routes");
const cache_service_1 = require("./services/cache.service");
const integration_service_1 = require("./services/integration.service");
const metrics_service_1 = require("./services/metrics.service");
function createEnhancedApp() {
    const app = (0, express_1.default)();
    // Basic security middleware
    app.use((0, helmet_1.default)({
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
    }));
    // CORS configuration for healthcare environment
    app.use((0, cors_1.default)({
        origin: process.env.ALLOWED_ORIGINS?.split(",") || [
            "http://localhost:3000",
        ],
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: [
            "Content-Type",
            "Authorization",
            "X-Requested-With",
            "X-User-Role",
            "X-Patient-ID",
            "X-Doctor-ID",
        ],
        maxAge: 86400, // 24 hours
    }));
    // Compression for better performance
    app.use((0, compression_1.default)({
        level: 6,
        threshold: 1024,
        filter: (req, res) => {
            if (req.headers["x-no-compression"]) {
                return false;
            }
            return compression_1.default.filter(req, res);
        },
    }));
    // Body parsing middleware
    app.use(express_1.default.json({
        limit: "10mb",
        verify: (req, res, buf) => {
            // Store raw body for signature verification if needed
            req.rawBody = buf;
        },
    }));
    app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
    // Trust proxy for accurate IP addresses
    app.set("trust proxy", 1);
    // Rate limiting - different limits for different operations
    const createRateLimit = (0, express_rate_limit_1.default)({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5, // 5 requests per window for creation
        message: {
            error: "Too many medical records created, please try again later",
            retryAfter: "15 minutes",
        },
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req) => {
            return req.ip + ":" + (req.user?.id || "anonymous");
        },
    });
    const readRateLimit = (0, express_rate_limit_1.default)({
        windowMs: 1 * 60 * 1000, // 1 minute
        max: 100, // 100 requests per minute for reading
        message: {
            error: "Too many requests, please try again later",
            retryAfter: "1 minute",
        },
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req) => {
            return req.ip + ":" + (req.user?.id || "anonymous");
        },
    });
    // Apply rate limiting based on method
    app.use("/api/medical-records", (req, res, next) => {
        if (req.method === "POST" || req.method === "PUT") {
            return createRateLimit(req, res, next);
        }
        else {
            return readRateLimit(req, res, next);
        }
    });
    // Request ID middleware for tracing
    app.use((req, res, next) => {
        const requestId = req.get("X-Request-ID") ||
            `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        req.headers["x-request-id"] = requestId;
        res.setHeader("X-Request-ID", requestId);
        next();
    });
    // Request logging middleware
    app.use((req, res, next) => {
        const startTime = Date.now();
        res.on("finish", () => {
            const duration = Date.now() - startTime;
            const logData = {
                requestId: req.headers["x-request-id"],
                method: req.method,
                url: req.url,
                userAgent: req.get("User-Agent"),
                ip: req.ip,
                statusCode: res.statusCode,
                duration: `${duration}ms`,
                userId: req.user?.id || "anonymous",
                userRole: req.user?.role || "unknown",
            };
            if (res.statusCode >= 400) {
                shared_1.logger.warn("HTTP Request Error", logData);
            }
            else {
                shared_1.logger.info("HTTP Request", logData);
            }
        });
        next();
    });
    // Health check endpoint (before authentication)
    app.get("/health", async (req, res) => {
        try {
            const [cacheHealth, integrationHealth, metricsHealth] = await Promise.all([
                cache_service_1.cacheService.healthCheck(),
                integration_service_1.integrationService.healthCheck(),
                metrics_service_1.metricsService.healthCheck(),
            ]);
            const overallHealth = cacheHealth &&
                Object.values(integrationHealth).some((status) => status) &&
                metricsHealth.status === "healthy";
            res.status(overallHealth ? 200 : 503).json({
                status: overallHealth ? "healthy" : "degraded",
                timestamp: new Date().toISOString(),
                service: "medical-records-service",
                version: process.env.SERVICE_VERSION || "1.0.0",
                environment: process.env.NODE_ENV || "development",
                uptime: process.uptime(),
                dependencies: {
                    cache: cacheHealth ? "healthy" : "unhealthy",
                    integrations: integrationHealth,
                    metrics: metricsHealth.status,
                },
                resources: {
                    memory: {
                        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
                        external: Math.round(process.memoryUsage().external / 1024 / 1024),
                    },
                    cpu: process.cpuUsage(),
                },
            });
            // Record health check metric
            metrics_service_1.metricsService.recordBusinessMetric("health_checks", 1, {
                status: overallHealth ? "healthy" : "degraded",
            });
        }
        catch (error) {
            shared_1.logger.error("Health check failed", { error });
            res.status(503).json({
                status: "unhealthy",
                timestamp: new Date().toISOString(),
                error: "Health check failed",
            });
        }
    });
    // Readiness probe
    app.get("/ready", async (req, res) => {
        try {
            // Check if service is ready to accept requests
            const cacheReady = await cache_service_1.cacheService.healthCheck();
            if (cacheReady) {
                res.status(200).json({
                    status: "ready",
                    timestamp: new Date().toISOString(),
                });
            }
            else {
                res.status(503).json({
                    status: "not ready",
                    timestamp: new Date().toISOString(),
                    reason: "Cache not available",
                });
            }
        }
        catch (error) {
            res.status(503).json({
                status: "not ready",
                timestamp: new Date().toISOString(),
                error: error.message,
            });
        }
    });
    // Liveness probe
    app.get("/live", (req, res) => {
        res.status(200).json({
            status: "alive",
            timestamp: new Date().toISOString(),
            pid: process.pid,
        });
    });
    // Prometheus metrics
    app.use((0, shared_1.metricsMiddleware)("medical-records-service"));
    app.get("/metrics", shared_1.getMetricsHandler);
    // JSON summary metrics (kept for dashboards)
    app.get("/metrics-summary", async (req, res) => {
        try {
            const metrics = await metrics_service_1.metricsService.getMetricsSummary("5m");
            const cacheStats = await cache_service_1.cacheService.getStats();
            res.setHeader("Content-Type", "application/json");
            res.json({
                timestamp: new Date().toISOString(),
                metrics: metrics,
                cache: cacheStats,
                system: {
                    uptime: process.uptime(),
                    memory: process.memoryUsage(),
                    cpu: process.cpuUsage(),
                },
            });
        }
        catch (error) {
            shared_1.logger.error("Metrics endpoint error", { error });
            res.status(500).json({ error: "Failed to retrieve metrics" });
        }
    });
    // Main API routes with enhanced middleware
    app.use("/api/medical-records", enhanced_medical_record_routes_1.enhancedMedicalRecordRoutes);
    // Fallback for undefined routes
    app.use("*", (req, res) => {
        res.status(404).json({
            success: false,
            message: "Route not found",
            path: req.originalUrl,
            method: req.method,
            timestamp: new Date().toISOString(),
        });
        // Record 404 metric
        metrics_service_1.metricsService.recordError("not_found", "404", "route_not_found");
    });
    // Global error handler
    app.use((error, req, res, next) => {
        const requestId = req.headers["x-request-id"];
        shared_1.logger.error("Unhandled error", {
            error: error.message,
            stack: error.stack,
            requestId,
            url: req.url,
            method: req.method,
            userId: req.user?.id || "anonymous",
        });
        // Record error metric
        metrics_service_1.metricsService.recordError("unhandled_error", error.name || "unknown", req.url);
        // Don't expose internal errors in production
        if (process.env.NODE_ENV === "production") {
            res.status(500).json({
                success: false,
                message: "Internal server error",
                requestId,
                timestamp: new Date().toISOString(),
            });
        }
        else {
            res.status(500).json({
                success: false,
                message: error.message,
                stack: error.stack,
                requestId,
                timestamp: new Date().toISOString(),
            });
        }
    });
    // Graceful shutdown handling
    const gracefulShutdown = async (signal) => {
        shared_1.logger.info(`Received ${signal}, starting graceful shutdown`);
        try {
            // Flush any pending metrics
            await metrics_service_1.metricsService.healthCheck();
            shared_1.logger.info("Metrics flushed successfully");
            // Close cache connections
            await cache_service_1.cacheService.healthCheck();
            shared_1.logger.info("Cache connections closed");
            shared_1.logger.info("Graceful shutdown completed");
            process.exit(0);
        }
        catch (error) {
            shared_1.logger.error("Error during graceful shutdown", { error });
            process.exit(1);
        }
    };
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
    // Handle uncaught exceptions
    process.on("uncaughtException", (error) => {
        shared_1.logger.error("Uncaught Exception", {
            error: error.message,
            stack: error.stack,
        });
        metrics_service_1.metricsService.recordError("uncaught_exception", error.name, "process");
        process.exit(1);
    });
    // Handle unhandled promise rejections
    process.on("unhandledRejection", (reason, promise) => {
        shared_1.logger.error("Unhandled Rejection", { reason, promise });
        metrics_service_1.metricsService.recordError("unhandled_rejection", "promise", "process");
    });
    return app;
}
//# sourceMappingURL=enhanced-app.js.map