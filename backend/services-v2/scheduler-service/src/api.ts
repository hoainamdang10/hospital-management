import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import { SupabaseClientFactory } from "./infrastructure/database/SupabaseClientFactory";
import { SupabaseScheduleRepository } from "./infrastructure/persistence/SupabaseScheduleRepository";
import { SupabaseScheduleRunRepository } from "./infrastructure/persistence/SupabaseScheduleRunRepository";
import {
  CreateScheduleUseCase,
  CancelScheduleUseCase,
  GetScheduleUseCase,
  GetScheduleRunsUseCase,
  RunNowUseCase,
  ListSchedulesUseCase,
  UpdateScheduleUseCase,
  DeleteScheduleUseCase,
  GetRunUseCase,
  RetryRunUseCase,
} from "./application/use-cases";
import { ScheduleController } from "./presentation/controllers/ScheduleController";
import { createScheduleRoutes } from "./presentation/routes/scheduleRoutes";
import { createMetricsRoutes } from "./presentation/routes/metricsRoutes";
import { rateLimitMiddleware } from "./presentation/middleware/rateLimitMiddleware";
import { metricsMiddleware } from "./presentation/middleware/metricsMiddleware";
import { loggingMiddleware } from "./presentation/middleware/loggingMiddleware";
import { Logger } from "./infrastructure/observability/Logger";
import { MetricsCollector } from "./infrastructure/observability/MetricsCollector";
import { swaggerSpec } from "./infrastructure/swagger/swagger.config";
import { 
  SystemEventConsumer,
  BillingEventConsumer
} from "./infrastructure/messaging";

dotenv.config();

const logger = Logger.getInstance();
const metrics = MetricsCollector.getInstance();

const PORT = process.env.PORT || 3025;

// Event Consumer instances
let systemEventConsumer: SystemEventConsumer | null = null;
let billingEventConsumer: BillingEventConsumer | null = null;

async function bootstrap() {
  try {
    logger.info("Starting Scheduler API Server...");

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = SupabaseClientFactory.create({
      url: supabaseUrl,
      serviceRoleKey: supabaseServiceKey,
      schema: "scheduler",
    });

    const scheduleRepo = new SupabaseScheduleRepository(supabase);
    const runRepo = new SupabaseScheduleRunRepository(supabase);

    const createScheduleUseCase = new CreateScheduleUseCase(scheduleRepo);
    const cancelScheduleUseCase = new CancelScheduleUseCase(
      scheduleRepo,
      runRepo,
    );
    const getScheduleUseCase = new GetScheduleUseCase(scheduleRepo, runRepo);
    const getScheduleRunsUseCase = new GetScheduleRunsUseCase(runRepo);
    const runNowUseCase = new RunNowUseCase(scheduleRepo, runRepo);
    const listSchedulesUseCase = new ListSchedulesUseCase(scheduleRepo);
    const updateScheduleUseCase = new UpdateScheduleUseCase(scheduleRepo);
    const deleteScheduleUseCase = new DeleteScheduleUseCase(
      scheduleRepo,
      runRepo,
    );
    const getRunUseCase = new GetRunUseCase(runRepo);
    const retryRunUseCase = new RetryRunUseCase(runRepo);

    const controller = new ScheduleController(
      createScheduleUseCase,
      cancelScheduleUseCase,
      getScheduleUseCase,
      getScheduleRunsUseCase,
      runNowUseCase,
      listSchedulesUseCase,
      updateScheduleUseCase,
      deleteScheduleUseCase,
      getRunUseCase,
      retryRunUseCase,
    );

    const app = express();

    // Security & CORS
    app.use(
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
      }),
    );
    app.use(cors());
    app.use(express.json());

    // Observability middleware (must be before routes)
    app.use(metricsMiddleware);
    app.use(loggingMiddleware);

    // Rate limiting
    app.use(rateLimitMiddleware);

    // Routes
    const routes = createScheduleRoutes(controller);
    app.use("/api/v1", routes);
    app.get("/health", (req, res) => controller.healthCheck(req, res));

    // Metrics endpoint (no auth required for Prometheus scraping)
    const metricsRoutes = createMetricsRoutes();
    app.use("/", metricsRoutes);

    // Swagger API Documentation
    app.use(
      "/api-docs",
      swaggerUi.serve,
      swaggerUi.setup(swaggerSpec, {
        explorer: true,
        customCss: ".swagger-ui .topbar { display: none }",
        customSiteTitle: "Scheduler Service API Documentation",
        swaggerOptions: {
          persistAuthorization: true,
          displayRequestDuration: true,
          filter: true,
          tryItOutEnabled: true,
        },
      }),
    );

    // OpenAPI JSON spec
    app.get("/api-docs/json", (req: express.Request, res: express.Response) => {
      res.setHeader("Content-Type", "application/json");
      res.send(swaggerSpec);
    });

    logger.info(
      "Swagger UI available at http://localhost:" + PORT + "/api-docs",
    );

    // Error handler
    app.use(
      (
        err: Error,
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        const correlationId = (req as any).correlationId;
        logger.error("Unhandled error", err, { correlationId });

        // Increment error metrics
        metrics.apiRequestErrors.inc({
          method: req.method,
          route: req.route?.path || req.path,
          error_type: "unhandled_error",
        });

        res.status(500).json({
          success: false,
          error: "Internal server error",
          correlationId,
        });
      },
    );

    /**
     * Initialize Event Consumers
     */
    async function initializeEventConsumers(): Promise<void> {
      try {
        logger.info("Initializing Event Consumers...");

        const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5673';
        const exchangeName = process.env.RABBITMQ_EXCHANGE || 'hospital.events';

        // Initialize System Event Consumer
        systemEventConsumer = new SystemEventConsumer(
          {
            rabbitmqUrl,
            queueName: 'scheduler-service.system-events',
            exchangeName,
            routingKeys: [
              'system.health.checked',
              'system.maintenance.scheduled',
              'system.report.requested',
              'system.alert.triggered'
            ],
            prefetchCount: 10,
            retryAttempts: 3,
            retryDelayMs: 1000
          },
          scheduleRepo,
          createScheduleUseCase,
          updateScheduleUseCase,
          cancelScheduleUseCase
        );
        await systemEventConsumer.connect();
        logger.info("System Event Consumer initialized successfully");

        // Initialize Billing Event Consumer
        billingEventConsumer = new BillingEventConsumer(
          {
            rabbitmqUrl,
            queueName: 'scheduler-service.billing-events',
            exchangeName,
            routingKeys: [
              // ONLY consume scheduling request events (suffix: .scheduled)
              'billing.payment.reminder.scheduled'
              // REMOVED: billing.invoice.generated - Domain event, not scheduling request
              // REMOVED: billing.payment.processed - Domain event, not scheduling request
              // REMOVED: billing.insurance.claim.processed - Domain event, not scheduling request
              // REMOVED: billing.report.requested - Should be billing.report.schedule.requested
            ],
            prefetchCount: 10,
            retryAttempts: 3,
            retryDelayMs: 1000
          },
          scheduleRepo,
          createScheduleUseCase,
          updateScheduleUseCase,
          cancelScheduleUseCase
        );
        await billingEventConsumer.connect();
        logger.info("Billing Event Consumer initialized successfully");

        logger.info("All Event Consumers initialized successfully");

      } catch (error) {
        logger.error("Failed to initialize Event Consumers", error as Error);
        throw error;
      }
    }

    // Initialize Event Consumers
    await initializeEventConsumers();

    /**
     * Graceful shutdown for Event Consumers
     */
    async function shutdownEventConsumers(): Promise<void> {
      try {
        logger.info("Shutting down Event Consumers...");

        if (systemEventConsumer) {
          await systemEventConsumer.disconnect();
          systemEventConsumer = null;
        }

        if (billingEventConsumer) {
          await billingEventConsumer.disconnect();
          billingEventConsumer = null;
        }

        logger.info("Event Consumers shut down successfully");

      } catch (error) {
        logger.error("Error shutting down Event Consumers", error as Error);
      }
    }

    await initializeEventConsumers();

    const server = app.listen(PORT, () => {
      logger.info(`Scheduler API Server listening on port ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/api/v1/health`);
      logger.info(`Metrics endpoint: http://localhost:${PORT}/metrics`);
    });

    process.on("SIGTERM", async () => {
      logger.info("SIGTERM received, shutting down gracefully...");
      await shutdownEventConsumers();
      server.close(async () => {
        await SupabaseClientFactory.close();
        logger.info("Server closed");
        process.exit(0);
      });
    });

    process.on("SIGINT", async () => {
      logger.info("SIGINT received, shutting down gracefully...");
      await shutdownEventConsumers();
      server.close(async () => {
        await SupabaseClientFactory.close();
        logger.info("Server closed");
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error("Failed to start API server", error as Error);
    process.exit(1);
  }
}

bootstrap();
