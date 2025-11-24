/**
 * Application Builder Module
 * Constructs Express application with middleware and configuration
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import compression from "compression";
import { ILogger } from "../application/services/ILogger";
import { AppConfig } from "./config";
import { createRequestIdMiddleware } from "../presentation/middleware/RequestIdMiddleware";
import { createMetricsAuthMiddleware } from "../presentation/middleware/MetricsAuthMiddleware";

/**
 * Build Express application with all middleware
 */
export function buildExpressApp(
  config: AppConfig,
  logger: ILogger,
): Application {
  const app = express();
  app.set("trust proxy", config.trustProxy);

  // Basic middleware
  setupBasicMiddleware(app, logger);

  // Security middleware
  setupSecurityMiddleware(app, config, logger);

  // Request tracing
  setupRequestTracing(app, logger);

  // Request logging
  setupRequestLogging(app, logger);

  return app;
}

/**
 * Setup basic middleware (body parsing, compression)
 */
function setupBasicMiddleware(app: Application, logger: ILogger): void {
  // Body parsing
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Compression
  app.use(compression());

  logger.debug("Basic middleware configured");
}

/**
 * Setup security middleware (CORS, Helmet, Rate Limiting)
 */
function setupSecurityMiddleware(
  app: Application,
  config: AppConfig,
  logger: ILogger,
): void {
  // CORS
  app.use(
    cors({
      origin: config.allowedOrigins,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "x-request-id",
        "x-idempotency-key",
      ],
    }),
  );

  // Helmet for security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }),
  );

  // Rate limiting (disabled in test environment)
  if (process.env.NODE_ENV !== "test") {
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limit each IP to 100 requests per windowMs
      message: "Too many requests from this IP, please try again later.",
      standardHeaders: true,
      legacyHeaders: false,
      validate: false, // avoid trust proxy validation errors behind gateway
      skip: (req) =>
        req.path.startsWith("/health") || req.path.startsWith("/metrics"),
    });
    app.use(limiter);

    logger.debug("Security middleware configured", {
      allowedOrigins: config.allowedOrigins,
      rateLimitWindow: "15 minutes",
      rateLimitMax: 100,
    });
  } else {
    logger.debug(
      "Security middleware configured (rate limiting disabled for tests)",
      {
        allowedOrigins: config.allowedOrigins,
      },
    );
  }
}

/**
 * Setup request tracing (Request ID)
 */
function setupRequestTracing(app: Application, logger: ILogger): void {
  app.use(createRequestIdMiddleware(logger));
  logger.debug("Request tracing configured");
}

/**
 * Setup request logging
 */
function setupRequestLogging(app: Application, logger: ILogger): void {
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();

    res.on("finish", () => {
      const duration = Date.now() - start;
      const reqLogger = (req as any).logger || logger;

      reqLogger.info("HTTP Request", {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        userAgent: req.headers["user-agent"],
      });
    });

    next();
  });

  logger.debug("Request logging configured");
}

/**
 * Create metrics authentication middleware
 */
export function createMetricsAuth(config: AppConfig, logger: ILogger) {
  return createMetricsAuthMiddleware(
    {
      enabled: config.metricsAuthEnabled,
      authToken: config.metricsAuthToken,
      allowedIPs: config.metricsAllowedIPs,
    },
    logger,
  );
}

/**
 * Register global error handlers
 */
export function registerErrorHandlers(app: Application, logger: ILogger): void {
  // 404 handler
  app.use((req: Request, res: Response) => {
    logger.warn("Route not found", {
      method: req.method,
      path: req.path,
      ip: req.ip,
    });

    res.status(404).json({
      success: false,
      error: "Endpoint không tồn tại",
      path: req.path,
      method: req.method,
    });
  });

  // Global error handler
  app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
    logger.error("Unhandled error", {
      error: err.message,
      stack: err.stack,
      method: req.method,
      path: req.path,
    });

    res.status(500).json({
      success: false,
      error: "Lỗi hệ thống, vui lòng thử lại sau",
    });
  });

  logger.debug("Error handlers registered");
}

/**
 * Legacy export for backward compatibility
 */
export class AppBuilder {
  private app: Application;

  constructor(
    private config: AppConfig,
    private logger: ILogger,
  ) {
    this.app = express();
  }

  public build(): Application {
    setupBasicMiddleware(this.app, this.logger);
    setupSecurityMiddleware(this.app, this.config, this.logger);
    setupRequestTracing(this.app, this.logger);
    setupRequestLogging(this.app, this.logger);

    return this.app;
  }

  public getMetricsAuthMiddleware() {
    return createMetricsAuth(this.config, this.logger);
  }

  public getApp(): Application {
    return this.app;
  }
}
