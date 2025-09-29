"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const shared_1 = require("@hospital/shared");
const dotenv_1 = __importDefault(require("dotenv"));
const enhanced_app_1 = require("./enhanced-app");
const cache_service_1 = require("./services/cache.service");
const integration_service_1 = require("./services/integration.service");
const metrics_service_1 = require("./services/metrics.service");
// Load environment variables
dotenv_1.default.config();
// Validate required environment variables
const requiredEnvVars = [
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "JWT_SECRET",
];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);
if (missingEnvVars.length > 0) {
    shared_1.logger.error("Missing required environment variables", {
        missing: missingEnvVars,
    });
    process.exit(1);
}
// Additional environment validation
if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    shared_1.logger.error("JWT_SECRET must be at least 32 characters long");
    process.exit(1);
}
async function startServer() {
    try {
        shared_1.logger.info("Starting Enhanced Medical Records Service...", {
            environment: process.env.NODE_ENV || "development",
            version: process.env.SERVICE_VERSION || "1.0.0",
            port: process.env.PORT || 3007,
        });
        // Initialize services
        shared_1.logger.info("Initializing services...");
        // Test cache connection
        const cacheHealthy = await cache_service_1.cacheService.healthCheck();
        if (!cacheHealthy) {
            shared_1.logger.warn("Cache service not available, continuing without cache");
        }
        else {
            shared_1.logger.info("Cache service connected successfully");
        }
        // Test integration services
        const integrationHealth = await integration_service_1.integrationService.healthCheck();
        const healthyServices = Object.entries(integrationHealth)
            .filter(([, status]) => status)
            .map(([service]) => service);
        if (healthyServices.length > 0) {
            shared_1.logger.info("Integration services available", {
                healthy: healthyServices,
            });
        }
        else {
            shared_1.logger.warn("No integration services available, continuing with limited functionality");
        }
        // Initialize metrics service
        const metricsHealth = await metrics_service_1.metricsService.healthCheck();
        if (metricsHealth.status === "healthy") {
            shared_1.logger.info("Metrics service initialized successfully");
        }
        else {
            shared_1.logger.warn("Metrics service degraded", { status: metricsHealth });
        }
        // Create and configure the app
        const app = (0, enhanced_app_1.createEnhancedApp)();
        const port = process.env.PORT ? parseInt(process.env.PORT) : 3007;
        // Start the server
        const server = app.listen(port, () => {
            shared_1.logger.info("Enhanced Medical Records Service started successfully", {
                port,
                environment: process.env.NODE_ENV || "development",
                processId: process.pid,
                endpoints: {
                    health: `http://localhost:${port}/health`,
                    ready: `http://localhost:${port}/ready`,
                    live: `http://localhost:${port}/live`,
                    metrics: `http://localhost:${port}/metrics`,
                    api: `http://localhost:${port}/api/medical-records`,
                },
            });
            // Record startup metric
            metrics_service_1.metricsService.recordBusinessMetric("service_startup", 1, {
                version: process.env.SERVICE_VERSION || "1.0.0",
                environment: process.env.NODE_ENV || "development",
                port: port.toString(),
            });
        });
        // Server configuration
        server.keepAliveTimeout = 61000; // Slightly longer than ALB timeout
        server.headersTimeout = 62000;
        // Handle server errors
        server.on("error", (error) => {
            if (error.code === "EADDRINUSE") {
                shared_1.logger.error(`Port ${port} is already in use`);
            }
            else {
                shared_1.logger.error("Server error", { error: error.message });
            }
            process.exit(1);
        });
        // Graceful shutdown
        const gracefulShutdown = async (signal) => {
            shared_1.logger.info(`Received ${signal}, shutting down gracefully`);
            // Stop accepting new connections
            server.close(async (err) => {
                if (err) {
                    shared_1.logger.error("Error closing server", { error: err.message });
                }
                try {
                    // Close database connections, cache, etc.
                    shared_1.logger.info("Closing service connections...");
                    // Record shutdown metric
                    metrics_service_1.metricsService.recordBusinessMetric("service_shutdown", 1, {
                        signal,
                        uptime: process.uptime().toString(),
                    });
                    // Give metrics time to flush
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                    shared_1.logger.info("Graceful shutdown completed");
                    process.exit(0);
                }
                catch (error) {
                    shared_1.logger.error("Error during graceful shutdown", { error });
                    process.exit(1);
                }
            });
            // Force shutdown after timeout
            setTimeout(() => {
                shared_1.logger.error("Forced shutdown after timeout");
                process.exit(1);
            }, 30000); // 30 second timeout
        };
        // Register signal handlers
        process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
        process.on("SIGINT", () => gracefulShutdown("SIGINT"));
        // Handle uncaught exceptions
        process.on("uncaughtException", (error) => {
            shared_1.logger.error("Uncaught exception", {
                error: error.message,
                stack: error.stack,
            });
            metrics_service_1.metricsService.recordError("uncaught_exception", error.name, "process");
            // Attempt graceful shutdown
            gracefulShutdown("UNCAUGHT_EXCEPTION");
        });
        // Handle unhandled promise rejections
        process.on("unhandledRejection", (reason, promise) => {
            shared_1.logger.error("Unhandled promise rejection", {
                reason: reason,
                promise: promise,
            });
            metrics_service_1.metricsService.recordError("unhandled_rejection", "promise", "process");
            // Attempt graceful shutdown
            gracefulShutdown("UNHANDLED_REJECTION");
        });
        // Handle warnings
        process.on("warning", (warning) => {
            shared_1.logger.warn("Process warning", {
                name: warning.name,
                message: warning.message,
                stack: warning.stack,
            });
        });
        // Log memory usage periodically
        setInterval(() => {
            const memoryUsage = process.memoryUsage();
            const memoryInMB = {
                rss: Math.round(memoryUsage.rss / 1024 / 1024),
                heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
                heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
                external: Math.round(memoryUsage.external / 1024 / 1024),
            };
            // Log if memory usage is high
            if (memoryInMB.heapUsed > 500) {
                // 500MB threshold
                shared_1.logger.warn("High memory usage detected", { memory: memoryInMB });
            }
            // Record memory metrics
            metrics_service_1.metricsService.recordBusinessMetric("memory_usage_mb", memoryInMB.heapUsed, {
                type: "heap_used",
            });
        }, 60000); // Every minute
    }
    catch (error) {
        shared_1.logger.error("Failed to start server", { error });
        process.exit(1);
    }
}
// Start the server
startServer();
//# sourceMappingURL=enhanced-index.js.map