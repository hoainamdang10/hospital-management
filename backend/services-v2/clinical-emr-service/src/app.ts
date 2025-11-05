/**
 * Clinical EMR Service - Express Application Setup
 * Main application configuration and middleware setup
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Express.js, HIPAA, Vietnamese Healthcare Standards
 */

import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";

// Infrastructure
import { container, initializeContainer } from "./infrastructure/di/container";
import { TYPES } from "./infrastructure/di/types";
import { ClinicalEMRConfig } from "./infrastructure/config/clinical-emr-config";
import { prometheusMetrics } from "./infrastructure/monitoring/PrometheusMetrics";
import { swaggerSpec } from "./infrastructure/swagger/swagger.config";

// Routes
import { createMedicalRecordRoutes } from "./presentation/routes/medical-record.routes";
import { setupRoutes } from "./presentation/routes/index";

// Middleware
import { errorHandlingMiddleware } from "./presentation/middleware/error-handling.middleware";
import { requestLoggingMiddleware } from "./presentation/middleware/request-logging.middleware";
import { healthCheckMiddleware } from "./presentation/middleware/health-check.middleware";

// Events
import {
  EventSubscriptions,
  createEventSubscriptions,
} from "./infrastructure/events/EventSubscriptions";
import { ClinicalEMREventHandler } from "./infrastructure/events/ClinicalEMREventHandler";
import { MedicalRecordDomainEventHandler } from "./infrastructure/events/MedicalRecordDomainEventHandler";

// Store event subscriptions globally for cleanup
let eventSubscriptions: EventSubscriptions | null = null;

/**
 * Create and configure Express application
 */
export async function createApp(): Promise<Application> {
  const app: Application = express();

  // Get configuration
  const config = container.get<ClinicalEMRConfig>(TYPES.Config);

  // =====================================================
  // SECURITY MIDDLEWARE
  // =====================================================

  // Helmet for security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
          scriptSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
          imgSrc: ["'self'", "data:", "https:", "cdn.jsdelivr.net"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'", "data:", "cdn.jsdelivr.net"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );

  // CORS configuration
  app.use(
    cors({
      origin: config.corsOrigins,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: [
        "Origin",
        "X-Requested-With",
        "Content-Type",
        "Accept",
        "Authorization",
        "X-User-ID",
        "X-User-Roles",
        "X-Request-ID",
        "X-Correlation-ID",
      ],
    }),
  );

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs
    message: {
      error: "Quá nhiều yêu cầu từ IP này",
      message: "Vui lòng thử lại sau 15 phút",
      retryAfter: 15 * 60,
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting for health checks
      return (
        req.path.includes("/health") ||
        req.path.includes("/ready") ||
        req.path.includes("/live")
      );
    },
  });
  app.use(limiter);

  // =====================================================
  // GENERAL MIDDLEWARE
  // =====================================================

  // Compression
  app.use(compression());

  // Body parsing
  app.use(
    express.json({
      limit: "10mb",
      verify: (req: any, res, buf) => {
        req.rawBody = buf;
      },
    }),
  );
  app.use(
    express.urlencoded({
      extended: true,
      limit: "10mb",
    }),
  );

  // Request logging
  if (config.isDevelopment()) {
    app.use(morgan("dev"));
  } else {
    app.use(morgan("combined"));
  }

  // Custom request logging middleware
  app.use(requestLoggingMiddleware);

  // Request ID middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    req.headers["x-request-id"] =
      req.headers["x-request-id"] ||
      `clinical-emr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    res.setHeader("X-Request-ID", req.headers["x-request-id"] as string);
    next();
  });

  // =====================================================
  // HEALTH CHECK ENDPOINTS
  // =====================================================

  app.use("/health", healthCheckMiddleware);

  app.get("/health", (req: Request, res: Response) => {
    const eventStatus = getEventSubscriptionsStatus();

    res.status(200).json({
      service: "clinical-emr-service",
      version: "2.0.0",
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.environment,
      port: config.port,
      eventBus: eventStatus,
      features: {
        medicalRecords: true,
        diagnoses: true,
        medications: true,
        vitalSigns: true,
        fhirExport: true,
        eventDriven: eventStatus.enabled,
      },
    });
  });

  app.get("/ready", async (req: Request, res: Response) => {
    try {
      // Check container health
      const { healthy, errors } = await import(
        "./infrastructure/di/container"
      ).then((m) => m.checkContainerHealth());

      if (healthy) {
        res.status(200).json({
          status: "ready",
          timestamp: new Date().toISOString(),
          service: "clinical-emr-service",
          version: "2.0.0",
        });
      } else {
        res.status(503).json({
          status: "not ready",
          timestamp: new Date().toISOString(),
          errors,
        });
      }
    } catch (error) {
      res.status(503).json({
        status: "not ready",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.get("/live", (req: Request, res: Response) => {
    res.status(200).json({
      status: "alive",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      pid: process.pid,
    });
  });

  // Prometheus metrics endpoint
  app.get("/metrics", async (req: Request, res: Response) => {
    try {
      res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
      const metrics = await prometheusMetrics.getMetrics();
      res.send(metrics);
    } catch (error) {
      console.error('Failed to generate Prometheus metrics', { error });
      res.status(500).send('Failed to generate metrics');
    }
  });

  // Swagger API Documentation
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Clinical EMR Service API Documentation',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      tryItOutEnabled: true
    }
  }));

  // OpenAPI JSON spec
  app.get('/api-docs/json', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log('[Swagger] Swagger UI available at http://localhost:' + config.port + '/api-docs');

  // Legacy metrics endpoint (for backward compatibility)
  app.get("/metrics/legacy", async (req: Request, res: Response) => {
    try {
      const eventStatus = getEventSubscriptionsStatus();
      const isHealthy = eventStatus.enabled && eventStatus.connected;

      // Prometheus text format
      const metrics = [
        '# HELP clinical_emr_health_status Health status of the service (1=healthy, 0=unhealthy)',
        '# TYPE clinical_emr_health_status gauge',
        `clinical_emr_health_status{service="clinical-emr"} ${isHealthy ? 1 : 0}`,
        '',
        '# HELP clinical_emr_uptime_seconds Service uptime in seconds',
        '# TYPE clinical_emr_uptime_seconds counter',
        `clinical_emr_uptime_seconds{service="clinical-emr"} ${process.uptime()}`,
        '',
        '# HELP clinical_emr_memory_usage_bytes Memory usage in bytes',
        '# TYPE clinical_emr_memory_usage_bytes gauge',
        `clinical_emr_memory_usage_bytes{type="rss",service="clinical-emr"} ${process.memoryUsage().rss}`,
        `clinical_emr_memory_usage_bytes{type="heapTotal",service="clinical-emr"} ${process.memoryUsage().heapTotal}`,
        `clinical_emr_memory_usage_bytes{type="heapUsed",service="clinical-emr"} ${process.memoryUsage().heapUsed}`,
        '',
        '# HELP clinical_emr_component_health Component health status (1=healthy, 0=unhealthy)',
        '# TYPE clinical_emr_component_health gauge',
        `clinical_emr_component_health{component="database",service="clinical-emr"} ${isHealthy ? 1 : 0}`,
        `clinical_emr_component_health{component="eventBus",service="clinical-emr"} ${eventStatus.connected ? 1 : 0}`,
        `clinical_emr_component_health{component="fhir",service="clinical-emr"} ${isHealthy ? 1 : 0}`,
        ''
      ].join('\n');

      res.set('Content-Type', 'text/plain; version=0.0.4');
      res.send(metrics);
    } catch (error) {
      res.status(500).send('# Error collecting metrics\n');
    }
  });

  // =====================================================
  // API ROUTES
  // =====================================================
  // Note: Clinical EMR uses /api/v2/clinical-emr prefix instead of /api/v1/
  // Reason: FHIR R4 compliance and clinical data specificity require separate versioning
  // This allows independent evolution of clinical APIs without affecting other services

  // API version info
  app.get("/api/v2/clinical-emr", (req: Request, res: Response) => {
    res.json({
      service: "clinical-emr-service",
      version: "2.0.0",
      description:
        "Clinical EMR Service - Simplified medical records management for graduation thesis",
      author: "Hospital Management Team",
      endpoints: {
        health: "/health",
        ready: "/ready",
        live: "/live",
        medicalRecords: "/api/v2/clinical-emr/medical-records",
        patients: "/api/v2/clinical-emr/patients/:patientId/medical-records",
        doctors: "/api/v2/clinical-emr/doctors/:doctorId/medical-records",
        statistics: "/api/v2/clinical-emr/statistics",
      },
      features: [
        "Basic medical records CRUD",
        "Simple vital signs tracking",
        "Patient medical history",
        "Doctor medical records",
        "Vietnamese language support",
        "HIPAA compliance",
        "Role-based access control",
        "Audit logging",
      ],
      compliance: [
        "Clean Architecture",
        "Domain-Driven Design",
        "CQRS Pattern",
        "Event-Driven Architecture",
        "HIPAA Standards",
        "Vietnamese Healthcare Standards",
      ],
    });
  });

  // Mount medical record routes
  app.use("/api/v2/clinical-emr", createMedicalRecordRoutes());

  // Mount all other clinical routes (Clinical Notes, Diagnostic Reports, Treatment Plans, Prescriptions)
  setupRoutes(app, container);

  // =====================================================
  // ERROR HANDLING
  // =====================================================

  // 404 handler
  app.use("*", (req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: "Endpoint không tồn tại",
      error: {
        code: "ENDPOINT_NOT_FOUND",
        path: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString(),
      },
    });
  });

  // Global error handler
  app.use(errorHandlingMiddleware);

  // =====================================================
  // GRACEFUL SHUTDOWN HANDLERS
  // =====================================================

  process.on("SIGTERM", async () => {
    console.log("SIGTERM received, shutting down gracefully...");
    await gracefulShutdown();
  });

  process.on("SIGINT", async () => {
    console.log("SIGINT received, shutting down gracefully...");
    await gracefulShutdown();
  });

  process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception:", error);
    process.exit(1);
  });

  process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
    process.exit(1);
  });

  return app;
}

/**
 * Graceful shutdown handler
 */
async function gracefulShutdown(): Promise<void> {
  try {
    console.log("🛑 Starting graceful shutdown...");

    // Disconnect event subscriptions first
    console.log("📡 Disconnecting event subscriptions...");
    await cleanupEventSubscriptions();
    console.log("✅ Event subscriptions disconnected");

    // Cleanup container
    console.log("🧹 Cleaning up DI container...");
    const { cleanupContainer } = await import("./infrastructure/di/container");
    await cleanupContainer();
    console.log("✅ Container cleaned up");

    console.log("✅ Graceful shutdown completed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during graceful shutdown:", error);
    process.exit(1);
  }
}

/**
 * Initialize application with dependencies
 */
export async function initializeApp(): Promise<Application> {
  try {
    console.log("🏥 Initializing Clinical EMR Service...");

    // Initialize container
    console.log("📦 Initializing DI Container...");
    const { success, errors } = await initializeContainer();
    if (!success) {
      throw new Error(`Container initialization failed: ${errors.join(", ")}`);
    }
    console.log("✅ DI Container initialized");

    // Create Express app
    console.log("🚀 Creating Express application...");
    const app = await createApp();
    console.log("✅ Express app created");

    // Initialize event subscriptions
    console.log("📡 Initializing event subscriptions...");
    await initializeEventSubscriptions();
    console.log("✅ Event subscriptions initialized");

    console.log("✅ Clinical EMR Service initialized successfully");
    return app;
  } catch (error) {
    console.error("💥 Failed to initialize Clinical EMR Service:", error);
    throw error;
  }
}

/**
 * Initialize event subscriptions and connect to RabbitMQ
 */
async function initializeEventSubscriptions(): Promise<void> {
  try {
    // Get event handlers from DI container
    const clinicalEMRHandler = container.get<ClinicalEMREventHandler>(
      TYPES.ClinicalEMREventHandler,
    );
    const domainEventHandler = container.get<MedicalRecordDomainEventHandler>(
      TYPES.MedicalRecordDomainEventHandler,
    );
    const logger = container.get(
      TYPES.Logger,
    ) as import("@shared/infrastructure/logging/logger.interface").ILogger;

    // Create event subscriptions
    eventSubscriptions = createEventSubscriptions(
      clinicalEMRHandler,
      domainEventHandler,
      logger,
    );

    // Connect to event bus
    await eventSubscriptions.connect();

    console.log("✅ Event bus connected and listening for events");
  } catch (error) {
    console.error("⚠️  Event subscriptions failed to initialize:", error);
    console.warn("⚠️  Service will run without event handling capabilities");
    // Don't throw - allow service to run without events in development
  }
}

/**
 * Cleanup event subscriptions
 */
export async function cleanupEventSubscriptions(): Promise<void> {
  if (eventSubscriptions) {
    await eventSubscriptions.disconnect();
    eventSubscriptions = null;
  }
}

/**
 * Get event subscriptions status
 */
export function getEventSubscriptionsStatus(): any {
  if (!eventSubscriptions) {
    return {
      enabled: false,
      message: "Event subscriptions not initialized",
    };
  }
  return {
    enabled: true,
    ...eventSubscriptions.getStatus(),
  };
}
