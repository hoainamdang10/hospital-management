import { logger } from "@hospital/shared";
import dotenv from "dotenv";
import { createEnhancedApp } from "./enhanced-app";
import { cacheService } from "./services/cache.service";
import { integrationService } from "./services/integration.service";
import { metricsService } from "./services/metrics.service";

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "JWT_SECRET",
];

const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  logger.error("Missing required environment variables", {
    missing: missingEnvVars,
  });
  process.exit(1);
}

// Additional environment validation
if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
  logger.error("JWT_SECRET must be at least 32 characters long");
  process.exit(1);
}

async function startServer() {
  try {
    logger.info("Starting Enhanced Medical Records Service...", {
      environment: process.env.NODE_ENV || "development",
      version: process.env.SERVICE_VERSION || "1.0.0",
      port: process.env.PORT || 3007,
    });

    // Initialize services
    logger.info("Initializing services...");

    // Test cache connection
    const cacheHealthy = await cacheService.healthCheck();
    if (!cacheHealthy) {
      logger.warn("Cache service not available, continuing without cache");
    } else {
      logger.info("Cache service connected successfully");
    }

    // Test integration services
    const integrationHealth = await integrationService.healthCheck();
    const healthyServices = Object.entries(integrationHealth)
      .filter(([, status]) => status)
      .map(([service]) => service);

    if (healthyServices.length > 0) {
      logger.info("Integration services available", {
        healthy: healthyServices,
      });
    } else {
      logger.warn(
        "No integration services available, continuing with limited functionality"
      );
    }

    // Initialize metrics service
    const metricsHealth = await metricsService.healthCheck();
    if (metricsHealth.status === "healthy") {
      logger.info("Metrics service initialized successfully");
    } else {
      logger.warn("Metrics service degraded", { status: metricsHealth });
    }

    // Create and configure the app
    const app = createEnhancedApp();
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3007;

    // Start the server
    const server = app.listen(port, () => {
      logger.info("Enhanced Medical Records Service started successfully", {
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
      metricsService.recordBusinessMetric("service_startup", 1, {
        version: process.env.SERVICE_VERSION || "1.0.0",
        environment: process.env.NODE_ENV || "development",
        port: port.toString(),
      });
    });

    // Server configuration
    server.keepAliveTimeout = 61000; // Slightly longer than ALB timeout
    server.headersTimeout = 62000;

    // Handle server errors
    server.on("error", (error: any) => {
      if (error.code === "EADDRINUSE") {
        logger.error(`Port ${port} is already in use`);
      } else {
        logger.error("Server error", { error: error.message });
      }
      process.exit(1);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully`);

      // Stop accepting new connections
      server.close(async (err) => {
        if (err) {
          logger.error("Error closing server", { error: err.message });
        }

        try {
          // Close database connections, cache, etc.
          logger.info("Closing service connections...");

          // Record shutdown metric
          metricsService.recordBusinessMetric("service_shutdown", 1, {
            signal,
            uptime: process.uptime().toString(),
          });

          // Give metrics time to flush
          await new Promise((resolve) => setTimeout(resolve, 1000));

          logger.info("Graceful shutdown completed");
          process.exit(0);
        } catch (error) {
          logger.error("Error during graceful shutdown", { error });
          process.exit(1);
        }
      });

      // Force shutdown after timeout
      setTimeout(() => {
        logger.error("Forced shutdown after timeout");
        process.exit(1);
      }, 30000); // 30 second timeout
    };

    // Register signal handlers
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    // Handle uncaught exceptions
    process.on("uncaughtException", (error) => {
      logger.error("Uncaught exception", {
        error: error.message,
        stack: error.stack,
      });

      metricsService.recordError("uncaught_exception", error.name, "process");

      // Attempt graceful shutdown
      gracefulShutdown("UNCAUGHT_EXCEPTION");
    });

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (reason, promise) => {
      logger.error("Unhandled promise rejection", {
        reason: reason,
        promise: promise,
      });

      metricsService.recordError("unhandled_rejection", "promise", "process");

      // Attempt graceful shutdown
      gracefulShutdown("UNHANDLED_REJECTION");
    });

    // Handle warnings
    process.on("warning", (warning) => {
      logger.warn("Process warning", {
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
        logger.warn("High memory usage detected", { memory: memoryInMB });
      }

      // Record memory metrics
      metricsService.recordBusinessMetric(
        "memory_usage_mb",
        memoryInMB.heapUsed,
        {
          type: "heap_used",
        }
      );
    }, 60000); // Every minute
  } catch (error) {
    logger.error("Failed to start server", { error });
    process.exit(1);
  }
}

// Start the server
startServer();
