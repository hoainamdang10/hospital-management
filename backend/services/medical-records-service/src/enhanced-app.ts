import { getMetricsHandler, logger, metricsMiddleware } from "@hospital/shared";
import compression from "compression";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { enhancedMedicalRecordRoutes } from "./routes/enhanced-medical-record.routes";
import { cacheService } from "./services/cache.service";
import { integrationService } from "./services/integration.service";
import { metricsService } from "./services/metrics.service";

export function createEnhancedApp(): express.Application {
  const app = express();

  // Basic security middleware
  app.use(
    helmet({
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
    })
  );

  // CORS configuration for healthcare environment
  app.use(
    cors({
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
    })
  );

  // Compression for better performance
  app.use(
    compression({
      level: 6,
      threshold: 1024,
      filter: (req, res) => {
        if (req.headers["x-no-compression"]) {
          return false;
        }
        return compression.filter(req, res);
      },
    })
  );

  // Body parsing middleware
  app.use(
    express.json({
      limit: "10mb",
      verify: (req, res, buf) => {
        // Store raw body for signature verification if needed
        (req as any).rawBody = buf;
      },
    })
  );
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Trust proxy for accurate IP addresses
  app.set("trust proxy", 1);

  // Rate limiting - different limits for different operations
  const createRateLimit = rateLimit({
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

  const readRateLimit = rateLimit({
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
    } else {
      return readRateLimit(req, res, next);
    }
  });

  // Request ID middleware for tracing
  app.use((req, res, next) => {
    const requestId =
      req.get("X-Request-ID") ||
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
        logger.warn("HTTP Request Error", logData);
      } else {
        logger.info("HTTP Request", logData);
      }
    });

    next();
  });

  // Health check endpoint (before authentication)
  app.get("/health", async (req, res) => {
    try {
      const [cacheHealth, integrationHealth, metricsHealth] = await Promise.all(
        [
          cacheService.healthCheck(),
          integrationService.healthCheck(),
          metricsService.healthCheck(),
        ]
      );

      const overallHealth =
        cacheHealth &&
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
      metricsService.recordBusinessMetric("health_checks", 1, {
        status: overallHealth ? "healthy" : "degraded",
      });
    } catch (error: any) {
      logger.error("Health check failed", { error });
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
      const cacheReady = await cacheService.healthCheck();

      if (cacheReady) {
        res.status(200).json({
          status: "ready",
          timestamp: new Date().toISOString(),
        });
      } else {
        res.status(503).json({
          status: "not ready",
          timestamp: new Date().toISOString(),
          reason: "Cache not available",
        });
      }
    } catch (error: any) {
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
  app.use(metricsMiddleware("medical-records-service"));
  app.get("/metrics", getMetricsHandler);

  // JSON summary metrics (kept for dashboards)
  app.get("/metrics-summary", async (req, res) => {
    try {
      const metrics = await metricsService.getMetricsSummary("5m");
      const cacheStats = await cacheService.getStats();

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
    } catch (error: any) {
      logger.error("Metrics endpoint error", { error });
      res.status(500).json({ error: "Failed to retrieve metrics" });
    }
  });

  // Main API routes with enhanced middleware
  app.use("/api/medical-records", enhancedMedicalRecordRoutes);

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
    metricsService.recordError("not_found", "404", "route_not_found");
  });

  // Global error handler
  app.use(
    (
      error: any,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      const requestId = req.headers["x-request-id"] as string;

      logger.error("Unhandled error", {
        error: error.message,
        stack: error.stack,
        requestId,
        url: req.url,
        method: req.method,
        userId: req.user?.id || "anonymous",
      });

      // Record error metric
      metricsService.recordError(
        "unhandled_error",
        error.name || "unknown",
        req.url
      );

      // Don't expose internal errors in production
      if (process.env.NODE_ENV === "production") {
        res.status(500).json({
          success: false,
          message: "Internal server error",
          requestId,
          timestamp: new Date().toISOString(),
        });
      } else {
        res.status(500).json({
          success: false,
          message: error.message,
          stack: error.stack,
          requestId,
          timestamp: new Date().toISOString(),
        });
      }
    }
  );

  // Graceful shutdown handling
  const gracefulShutdown = async (signal: string) => {
    logger.info(`Received ${signal}, starting graceful shutdown`);

    try {
      // Flush any pending metrics
      await metricsService.healthCheck();
      logger.info("Metrics flushed successfully");

      // Close cache connections
      await cacheService.healthCheck();
      logger.info("Cache connections closed");

      logger.info("Graceful shutdown completed");
      process.exit(0);
    } catch (error: any) {
      logger.error("Error during graceful shutdown", { error });
      process.exit(1);
    }
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));

  // Handle uncaught exceptions
  process.on("uncaughtException", (error) => {
    logger.error("Uncaught Exception", {
      error: error.message,
      stack: error.stack,
    });
    metricsService.recordError("uncaught_exception", error.name, "process");
    process.exit(1);
  });

  // Handle unhandled promise rejections
  process.on("unhandledRejection", (reason, promise) => {
    logger.error("Unhandled Rejection", { reason, promise });
    metricsService.recordError("unhandled_rejection", "promise", "process");
  });

  return app;
}
