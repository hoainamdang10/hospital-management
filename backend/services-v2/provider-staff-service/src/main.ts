/**
 * Provider/Staff Service V2 - Main Application
 * Production-ready service with Clean Architecture + DDD + CQRS
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @port 3002 (External), 3022 (Internal)
 * @schema provider_schema
 * @compliance Clean Architecture, HIPAA, Vietnamese Healthcare Standards
 */

// Load environment variables FIRST
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { Express } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";

// Infrastructure imports
import { RabbitMQEventPublisher } from "./infrastructure/events/RabbitMQEventPublisher";
import { HybridEventBus } from "./infrastructure/events/HybridEventBus";
import { IdentityEventConsumer } from "./infrastructure/events/IdentityEventConsumer";
import { EnhancedDepartmentEventConsumer } from "./infrastructure/events/EnhancedDepartmentEventConsumer";
import { ReviewEventConsumer } from "./infrastructure/events/ReviewEventConsumer";
// import { SchedulingEventConsumer } from "./infrastructure/events/SchedulingEventConsumer"; // DISABLED - Bounded context violation
import { ProviderStaffHealthCheck } from "./infrastructure/monitoring/HealthChecks";
import { prometheusMetrics } from "./infrastructure/monitoring/PrometheusMetrics";
import { logger } from "./infrastructure/logging/logger";
import { swaggerSpec } from "./infrastructure/swagger/swagger.config";

// Application imports
import { RegisterStaffUseCase } from "./application/use-cases/RegisterStaffUseCase";
import { GetStaffProfileUseCase } from "./application/use-cases/GetStaffProfileUseCase";
import { AssignStaffToDepartmentUseCase } from "./application/use-cases/AssignStaffToDepartmentUseCase";
import { SetDepartmentHeadUseCase } from "./application/use-cases/SetDepartmentHeadUseCase";
import { AddStaffCredentialUseCase } from "./application/use-cases/AddStaffCredentialUseCase";
import { RemoveStaffCredentialUseCase } from "./application/use-cases/RemoveStaffCredentialUseCase";
import { RenewStaffCredentialUseCase } from "./application/use-cases/RenewStaffCredentialUseCase";
import { GetExpiringCredentialsUseCase } from "./application/use-cases/GetExpiringCredentialsUseCase";
import { ActivateStaffUseCase } from "./application/use-cases/ActivateStaffUseCase";
import { SuspendStaffUseCase } from "./application/use-cases/SuspendStaffUseCase";
import { ReactivateStaffUseCase } from "./application/use-cases/ReactivateStaffUseCase";
import { TerminateStaffUseCase } from "./application/use-cases/TerminateStaffUseCase";
import { UpdateEmploymentStatusUseCase } from "./application/use-cases/UpdateEmploymentStatusUseCase";
import { UpdateStaffScheduleUseCase } from "./application/use-cases/UpdateStaffScheduleUseCase";
import { HardDeleteStaffUseCase } from "./application/use-cases/HardDeleteStaffUseCase";
// REMOVED: Availability use cases - Belongs to Scheduling/Appointment Service (bounded context violation)
import { StaffCommandHandlers } from "./application/handlers/StaffCommandHandlers";
import { StaffQueryHandlers } from "./application/handlers/StaffQueryHandlers";

// Presentation imports
import { setupRoutes } from "./presentation/routes";
import { createHealthRoutes } from "./presentation/routes/healthRoutes";
// import { ErrorHandlingMiddleware } from './presentation/middleware/ErrorHandlingMiddleware';

// DI Container
import { setupDependencies, ServiceTokens } from "./infrastructure/di/setup";
import { OutboxPublisher } from "./infrastructure/outbox/OutboxPublisher";

// Configuration
const config = {
  port: process.env.PORT || 3003,
  supabaseUrl: process.env.SUPABASE_URL || "",
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  rabbitmqUrl: process.env.RABBITMQ_URL || "amqp://admin:admin@localhost:5673",
  nodeEnv: process.env.NODE_ENV || "development",
  serviceName: "provider-staff-service",
  version: "2.0.0",
  allowedOrigins: (
    process.env.ALLOWED_ORIGINS || "http://localhost:3000,http://localhost:3101"
  ).split(","),
  schema: "provider_schema",
};

/**
 * Provider/Staff Service Application Class
 * Implements production-ready patterns with Clean Architecture
 */
class ProviderStaffServiceApp {
  private app: express.Application;
  private container!: ReturnType<typeof setupDependencies>;
  private eventPublisher!: RabbitMQEventPublisher | null;
  private eventBus!: HybridEventBus | null;
  private identityEventConsumer!: IdentityEventConsumer | null;
  private healthCheck!: ProviderStaffHealthCheck;
  private outboxPublisher!: OutboxPublisher | null;

  // Use Cases
  private registerStaffUseCase!: RegisterStaffUseCase;
  private getStaffProfileUseCase!: GetStaffProfileUseCase;
  private assignStaffToDepartmentUseCase!: AssignStaffToDepartmentUseCase;
  private addStaffCredentialUseCase!: AddStaffCredentialUseCase;
  private removeStaffCredentialUseCase!: RemoveStaffCredentialUseCase;
  private renewStaffCredentialUseCase!: RenewStaffCredentialUseCase;
  private getExpiringCredentialsUseCase!: GetExpiringCredentialsUseCase;
  private activateStaffUseCase!: ActivateStaffUseCase;
  private suspendStaffUseCase!: SuspendStaffUseCase;
  private reactivateStaffUseCase!: ReactivateStaffUseCase;
  private terminateStaffUseCase!: TerminateStaffUseCase;
  private updateEmploymentStatusUseCase!: UpdateEmploymentStatusUseCase;

  // Handlers
  private staffCommandHandlers!: StaffCommandHandlers;
  private staffQueryHandlers!: StaffQueryHandlers;

  // Middleware
  // private errorHandlingMiddleware!: ErrorHandlingMiddleware;

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupErrorHandling();
  }

  /**
   * Initialize the application
   */
  async initialize(): Promise<void> {
    await this.initializeInfrastructure();
    this.setupRoutes();
  }

  /**
   * Validate configuration
   */
  private validateConfiguration(): void {
    const requiredEnvVars = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];

    const missingVars = requiredEnvVars.filter(
      (varName) => !process.env[varName],
    );

    if (missingVars.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missingVars.join(", ")}`,
      );
    }

    logger.info("Configuration validated successfully");
  }

  /**
   * Initialize infrastructure components
   */
  private async initializeInfrastructure(): Promise<void> {
    try {
      logger.info("Initializing infrastructure...");

      // Validate configuration
      this.validateConfiguration();

      // Initialize Health Check Service
      this.healthCheck = new ProviderStaffHealthCheck(
        config.supabaseUrl,
        config.supabaseKey,
        logger,
      );

      // Setup DI Container
      this.container = setupDependencies();
      this.eventBus = this.container.resolve<HybridEventBus>(
        ServiceTokens.EVENT_BUS,
      );
      await this.eventBus.connect();
      await this.registerInternalEventHandlers();
      this.outboxPublisher = this.container.resolve<OutboxPublisher>(
        ServiceTokens.OUTBOX_PUBLISHER,
      );
      await this.outboxPublisher.start();

      // Resolve dependencies from container
      this.registerStaffUseCase = this.container.resolve<RegisterStaffUseCase>(
        ServiceTokens.REGISTER_STAFF_USE_CASE,
      );
      this.getStaffProfileUseCase =
        this.container.resolve<GetStaffProfileUseCase>(
          ServiceTokens.GET_STAFF_PROFILE_USE_CASE,
        );
      this.assignStaffToDepartmentUseCase =
        this.container.resolve<AssignStaffToDepartmentUseCase>(
          ServiceTokens.ASSIGN_STAFF_TO_DEPARTMENT_USE_CASE,
        );
      this.addStaffCredentialUseCase =
        this.container.resolve<AddStaffCredentialUseCase>(
          ServiceTokens.ADD_STAFF_CREDENTIAL_USE_CASE,
        );
      this.removeStaffCredentialUseCase =
        this.container.resolve<RemoveStaffCredentialUseCase>(
          ServiceTokens.REMOVE_STAFF_CREDENTIAL_USE_CASE,
        );
      this.renewStaffCredentialUseCase =
        this.container.resolve<RenewStaffCredentialUseCase>(
          ServiceTokens.RENEW_STAFF_CREDENTIAL_USE_CASE,
        );
      this.getExpiringCredentialsUseCase =
        this.container.resolve<GetExpiringCredentialsUseCase>(
          ServiceTokens.GET_EXPIRING_CREDENTIALS_USE_CASE,
        );
      this.activateStaffUseCase = this.container.resolve<ActivateStaffUseCase>(
        ServiceTokens.ACTIVATE_STAFF_USE_CASE,
      );
      this.suspendStaffUseCase = this.container.resolve<SuspendStaffUseCase>(
        ServiceTokens.SUSPEND_STAFF_USE_CASE,
      );
      this.reactivateStaffUseCase =
        this.container.resolve<ReactivateStaffUseCase>(
          ServiceTokens.REACTIVATE_STAFF_USE_CASE,
        );
      this.terminateStaffUseCase =
        this.container.resolve<TerminateStaffUseCase>(
          ServiceTokens.TERMINATE_STAFF_USE_CASE,
        );
      this.updateEmploymentStatusUseCase =
        this.container.resolve<UpdateEmploymentStatusUseCase>(
          ServiceTokens.UPDATE_EMPLOYMENT_STATUS_USE_CASE,
        );
      this.staffCommandHandlers = this.container.resolve<StaffCommandHandlers>(
        ServiceTokens.STAFF_COMMAND_HANDLERS,
      );
      this.staffQueryHandlers = this.container.resolve<StaffQueryHandlers>(
        ServiceTokens.STAFF_QUERY_HANDLERS,
      );

      // Initialize RabbitMQ Event Publisher
      await this.initializeEventPublisher();

      // Initialize Identity Event Consumer
      await this.initializeIdentityEventConsumer();

      // Initialize Enhanced Event Consumers
      await this.initializeEnhancedDepartmentEventConsumer();
      await this.initializeReviewEventConsumer();
      await this.initializeSchedulingEventConsumer();

      // Initialize error handling middleware
      // this.errorHandlingMiddleware = new ErrorHandlingMiddleware(logger);

      logger.info("Infrastructure initialized successfully");
    } catch (error) {
      logger.fatal("Failed to initialize infrastructure", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Initialize RabbitMQ Event Publisher
   */
  private async initializeEventPublisher(): Promise<void> {
    try {
      const rabbitmqExchange =
        process.env.RABBITMQ_EXCHANGE || "hospital.events";
      const rabbitmqExchangeType = (process.env.RABBITMQ_EXCHANGE_TYPE ||
        "topic") as "topic" | "direct" | "fanout";

      this.eventPublisher = new RabbitMQEventPublisher(
        {
          url: config.rabbitmqUrl,
          exchange: rabbitmqExchange,
          exchangeType: rabbitmqExchangeType,
          durable: process.env.RABBITMQ_DURABLE === "true" || true,
          autoDelete: process.env.RABBITMQ_AUTO_DELETE === "true" || false,
        },
        {
          enableRetry: process.env.RABBITMQ_ENABLE_RETRY === "true" || true,
          maxRetries: parseInt(process.env.RABBITMQ_MAX_RETRIES || "3"),
          retryDelayMs: parseInt(process.env.RABBITMQ_RETRY_DELAY_MS || "1000"),
          enableLogging: process.env.RABBITMQ_ENABLE_LOGGING === "true" || true,
        },
        logger,
      );

      await this.connectRabbitPublisherWithRetry();
      logger.info("RabbitMQ Event Publisher initialized successfully");

      // Subscribe to Review Service events
      await this.subscribeToReviewEvents();

      // Subscribe to Billing Service events
      await this.subscribeToBillingEvents();
    } catch (error) {
      logger.error("Failed to initialize RabbitMQ Event Publisher", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      logger.warn("Continuing without event publishing");
      this.eventPublisher = null;
    }
  }

  private async connectRabbitPublisherWithRetry(): Promise<void> {
    const maxAttempts = parseInt(
      process.env.RABBITMQ_BOOT_MAX_RETRIES || "5",
      10,
    );
    const baseDelay = parseInt(
      process.env.RABBITMQ_BOOT_RETRY_DELAY_MS || "2000",
      10,
    );

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      await this.eventPublisher?.connect();

      if (this.eventPublisher?.isReady()) {
        logger.info("RabbitMQ connection established", { attempt });
        return;
      }

      const backoffMs = Math.min(baseDelay * attempt, 10000);
      logger.warn("RabbitMQ not ready yet, retrying connection", {
        attempt,
        maxAttempts,
        backoffMs,
      });
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }

    throw new Error(
      `RabbitMQ not reachable after ${maxAttempts} attempts during bootstrap`,
    );
  }

  /**
   * Subscribe to Review Service events
   */
  private async subscribeToReviewEvents(): Promise<void> {
    try {
      const reviewHandler = this.container.resolve(
        ServiceTokens.REVIEW_EVENT_HANDLER,
      );
      const eventBus = this.container.resolve(
        ServiceTokens.EVENT_BUS,
      ) as HybridEventBus;

      // Subscribe to review events
      await eventBus.subscribe("review.created", reviewHandler);
      await eventBus.subscribe("review.updated", reviewHandler);
      await eventBus.subscribe("review.deleted", reviewHandler);
      await eventBus.subscribe("review.rating.recalculated", reviewHandler);

      logger.info("Subscribed to Review Service events successfully", {
        events: [
          "review.created",
          "review.updated",
          "review.deleted",
          "review.rating.recalculated",
        ],
      });
    } catch (error) {
      logger.error("Failed to subscribe to Review Service events", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      // Graceful degradation: continue without review event subscriptions
    }
  }

  /**
   * Subscribe to Billing Service events
   */
  private async subscribeToBillingEvents(): Promise<void> {
    try {
      const billingHandler = this.container.resolve(
        ServiceTokens.BILLING_EVENT_HANDLER,
      );
      const eventBus = this.container.resolve(
        ServiceTokens.EVENT_BUS,
      ) as HybridEventBus;

      // Subscribe to billing events
      await eventBus.subscribe("billing.payment.processed", billingHandler);
      await eventBus.subscribe("billing.invoice.generated", billingHandler);
      await eventBus.subscribe(
        "billing.consultation_fee.updated",
        billingHandler,
      );
      await eventBus.subscribe("billing.payment.refunded", billingHandler);

      logger.info("Subscribed to Billing Service events successfully", {
        events: [
          "billing.payment.processed",
          "billing.invoice.generated",
          "billing.consultation_fee.updated",
          "billing.payment.refunded",
        ],
      });
    } catch (error) {
      logger.error("Failed to subscribe to Billing Service events", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      // Graceful degradation: continue without billing event subscriptions
    }
  }

  /**
   * Initialize Identity Event Consumer
   */
  private async initializeIdentityEventConsumer(): Promise<void> {
    try {
      this.identityEventConsumer =
        this.container.resolve<IdentityEventConsumer>(
          ServiceTokens.IDENTITY_EVENT_CONSUMER,
        );
      await this.identityEventConsumer.connect();
      logger.info("Identity Event Consumer connected successfully");
    } catch (error) {
      logger.error("Failed to initialize Identity Event Consumer", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      logger.warn("Continuing without Identity event consumption");
      this.identityEventConsumer = null;
    }
  }

  /**
   * Initialize Enhanced Department Event Consumer
   */
  private async initializeEnhancedDepartmentEventConsumer(): Promise<void> {
    try {
      const enhancedDepartmentConsumer =
        this.container.resolve<EnhancedDepartmentEventConsumer>(
          ServiceTokens.ENHANCED_DEPARTMENT_EVENT_CONSUMER,
        );
      await enhancedDepartmentConsumer.connect();
      logger.info("Enhanced Department Event Consumer connected successfully");
    } catch (error) {
      logger.error("Failed to initialize Enhanced Department Event Consumer", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      logger.warn("Continuing without Enhanced Department event consumption");
    }
  }

  /**
   * Initialize Review Event Consumer
   */
  private async initializeReviewEventConsumer(): Promise<void> {
    try {
      const reviewConsumer = this.container.resolve<ReviewEventConsumer>(
        ServiceTokens.REVIEW_EVENT_CONSUMER,
      );
      await reviewConsumer.connect();
      logger.info("Review Event Consumer connected successfully");
    } catch (error) {
      logger.error("Failed to initialize Review Event Consumer", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      logger.warn("Continuing without Review event consumption");
    }
  }

  /**
   * Initialize Scheduling Event Consumer - DISABLED
   * TODO: Re-enable when proper bounded context is established
   */
  private async initializeSchedulingEventConsumer(): Promise<void> {
    logger.info(
      "Scheduling Event Consumer disabled - bounded context violation",
    );
    // Disabled: Provider Staff Service should not consume scheduling events
    // Scheduling belongs to Appointments Service bounded context
  }

  /**
   * Setup Express middleware with security and monitoring
   */
  private setupMiddleware(): void {
    logger.info("Setting up middleware...");

    // Security middleware
    this.app.use(
      helmet({
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
      }),
    );

    // CORS
    this.app.use(
      cors({
        origin: config.allowedOrigins,
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
      }),
    );

    // Compression
    this.app.use(compression());

    // Request logging
    if (config.nodeEnv === "development") {
      this.app.use(morgan("dev"));
    } else {
      this.app.use(morgan("combined"));
    }

    // Body parsing
    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));

    // Request ID middleware
    this.app.use((req, _res, next) => {
      (req as unknown as Record<string, unknown>).requestId =
        req.headers["x-request-id"] ||
        `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      next();
    });

    logger.info("Middleware setup complete");
  }

  /**
   * Setup API routes
   */
  private setupRoutes(): void {
    logger.info("Setting up routes...");

    // Health & Metrics routes
    const healthRoutes = createHealthRoutes({
      healthCheck: this.healthCheck,
      logger,
    });
    this.app.use("/", healthRoutes);

    // Prometheus metrics endpoint
    this.app.get("/metrics", async (_req, res) => {
      try {
        res.set("Content-Type", "text/plain; version=0.0.4; charset=utf-8");
        const metrics = await prometheusMetrics.getMetrics();
        res.send(metrics);
      } catch (error) {
        logger.error("Failed to generate metrics", { error });
        res.status(500).send("Failed to generate metrics");
      }
    });
    logger.info("Prometheus metrics endpoint registered at /metrics");

    // Swagger API Documentation
    this.app.use(
      "/api-docs",
      swaggerUi.serve,
      swaggerUi.setup(swaggerSpec, {
        explorer: true,
        customCss: ".swagger-ui .topbar { display: none }",
        customSiteTitle: "Provider/Staff Service API Documentation",
        swaggerOptions: {
          persistAuthorization: true,
          displayRequestDuration: true,
          filter: true,
          tryItOutEnabled: true,
        },
      }),
    );

    // OpenAPI JSON spec
    this.app.get("/api-docs/json", (_req, res) => {
      res.setHeader("Content-Type", "application/json");
      res.send(swaggerSpec);
    });

    logger.info(
      "Swagger UI available at http://localhost:" + config.port + "/api-docs",
    );

    // Setup application routes
    const updateStaffScheduleUseCase =
      this.container.resolve<UpdateStaffScheduleUseCase>(
        ServiceTokens.UPDATE_STAFF_SCHEDULE_USE_CASE,
      );
    // REMOVED: Availability/legacy profile use cases - Belongs to Scheduling/Appointment Service
    const setDepartmentHeadUseCase =
      this.container.resolve<SetDepartmentHeadUseCase>(
        ServiceTokens.SET_DEPARTMENT_HEAD_USE_CASE,
      );
    const hardDeleteStaffUseCase =
      this.container.resolve<HardDeleteStaffUseCase>(
        ServiceTokens.HARD_DELETE_STAFF_USE_CASE,
      );

    setupRoutes(
      this.app as Express,
      this.registerStaffUseCase,
      this.getStaffProfileUseCase,
      this.assignStaffToDepartmentUseCase,
      setDepartmentHeadUseCase,
      this.staffCommandHandlers,
      this.staffQueryHandlers,
      this.addStaffCredentialUseCase,
      this.removeStaffCredentialUseCase,
      this.renewStaffCredentialUseCase,
      this.getExpiringCredentialsUseCase,
      this.activateStaffUseCase,
      this.suspendStaffUseCase,
      this.reactivateStaffUseCase,
      this.terminateStaffUseCase,
      this.updateEmploymentStatusUseCase,
      updateStaffScheduleUseCase,
      hardDeleteStaffUseCase,
      // REMOVED: Availability/legacy profile use cases - Belongs to Scheduling/Appointment Service
    );

    logger.info("Routes setup complete");
  }

  /**
   * Setup error handling middleware
   */
  private setupErrorHandling(): void {
    // Global error handler
    this.app.use(
      (
        error: unknown,
        req: express.Request,
        res: express.Response,
        _next: express.NextFunction,
      ) => {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        const errorStack = error instanceof Error ? error.stack : undefined;

        logger.error("Unhandled request error", {
          error: errorMessage,
          stack: errorStack,
          url: req.url,
          method: req.method,
          requestId: (req as unknown as Record<string, unknown>).requestId,
        });

        res.status(500).json({
          success: false,
          error: "INTERNAL_SERVER_ERROR",
          message: "Lỗi hệ thống không xác định",
          timestamp: new Date().toISOString(),
          requestId:
            (req as unknown as Record<string, unknown>).requestId || "unknown",
        });
      },
    );

    // Handle uncaught exceptions
    process.on("uncaughtException", (error) => {
      logger.error("Uncaught exception", {
        error: error.message,
        stack: error.stack,
      });
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (reason, promise) => {
      logger.error("Unhandled rejection", { reason, promise });
      process.exit(1);
    });
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    try {
      logger.info(`Starting ${config.serviceName} v${config.version}...`);

      // Initialize infrastructure
      await this.initialize();

      // Perform initial health check
      const health = await this.healthCheck.checkHealth();
      if (health.overall === "UNHEALTHY") {
        logger.warn("Service starting with unhealthy status", { health });
      }

      // Start listening
      this.app.listen(config.port, () => {
        logger.info(`${config.serviceName} is running`, {
          port: config.port,
          environment: config.nodeEnv,
          version: config.version,
          schema: config.schema,
          healthStatus: health.overall,
        });
      });
    } catch (error) {
      logger.fatal("Failed to start service", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      process.exit(1);
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown(signal: string): Promise<void> {
    logger.info(`${signal} received, shutting down gracefully...`);

    try {
      if (this.outboxPublisher) {
        await this.outboxPublisher.stop();
        logger.info("Outbox publisher stopped");
      }

      if (this.eventBus) {
        await this.eventBus.disconnect();
        logger.info("Hybrid event bus disconnected");
      }

      // Disconnect RabbitMQ
      if (this.eventPublisher) {
        await this.eventPublisher.disconnect();
        logger.info("RabbitMQ disconnected");
      }

      logger.info("Graceful shutdown complete");
      process.exit(0);
    } catch (error) {
      logger.error("Error during shutdown", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      process.exit(1);
    }
  }

  /**
   * Subscribe internal domain event handlers (read models, audits, etc.)
   */
  private async registerInternalEventHandlers(): Promise<void> {
    if (!this.eventBus) {
      logger.warn("Event bus not initialized; skip handler registration");
      return;
    }

    try {
      const staffDomainEventHandler = this.container.resolve(
        ServiceTokens.STAFF_DOMAIN_EVENT_HANDLER,
      );
      const staffReadModelHandler = this.container.resolve(
        ServiceTokens.STAFF_READ_MODEL_PROJECTION_HANDLER,
      );

      const domainSubscriptions = [
        "StaffRegistered",
        "StaffCredentialVerified",
        "StaffScheduleUpdated",
        "StaffStatusChanged",
        "StaffEmploymentStatusUpdated",
        "StaffUpdated",
      ];

      for (const event of domainSubscriptions) {
        await this.eventBus.subscribe(event, staffDomainEventHandler);
      }

      await this.eventBus.subscribe("StaffRegistered", staffReadModelHandler);
      await this.eventBus.subscribe("StaffUpdated", staffReadModelHandler);

      logger.info("Internal domain event handlers registered", {
        domainHandlers: domainSubscriptions,
        readModelHandlers: ["StaffRegistered", "StaffUpdated"],
      });
    } catch (error) {
      logger.error("Failed to register internal event handlers", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}

// Start the application
if (require.main === module) {
  const app = new ProviderStaffServiceApp();

  // Graceful shutdown handlers
  const shutdown = (signal: string) => app.shutdown(signal);

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  // Start the service
  app.start().catch((error) => {
    logger.fatal("Failed to start application", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    process.exit(1);
  });
}

export default ProviderStaffServiceApp;
