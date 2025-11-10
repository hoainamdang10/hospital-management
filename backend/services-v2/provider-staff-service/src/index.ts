/**
 * Provider/Staff Service - Hospital Management System
 * Clean Architecture + DDD + CQRS + Event-Driven Implementation
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @port 3002
 * @schema provider_schema
 */

// Load environment variables first
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { setupDependencies, ServiceTokens } from "./infrastructure/di/setup";
import { setupRoutes } from "./presentation/routes";
import { logger } from "./infrastructure/logging/logger";
import { ErrorHandlingMiddleware } from "./presentation/middleware/ErrorHandlingMiddleware";
import { RegisterStaffUseCase } from "./application/use-cases/RegisterStaffUseCase";
import { GetStaffProfileUseCase } from "./application/use-cases/GetStaffProfileUseCase";
import { StaffCommandHandlers } from "./application/handlers/StaffCommandHandlers";
import { StaffQueryHandlers } from "./application/handlers/StaffQueryHandlers";
import { RabbitMQEventPublisher } from "./infrastructure/events/RabbitMQEventPublisher";
import { IdentityEventConsumer } from "./infrastructure/events/IdentityEventConsumer";
import { AppointmentsEventConsumer } from "./infrastructure/events/AppointmentsEventConsumer";
import { PatientEventConsumer } from "./infrastructure/events/PatientEventConsumer";
import { RabbitMQStaffEventHandler } from "./infrastructure/events/RabbitMQStaffEventHandler";
import { IEventBus } from "@shared/events/event-bus.interface";
import { HybridEventBus } from "./infrastructure/events/HybridEventBus";

const app = express();
const PORT = process.env.PORT || 3002;
const SERVICE_NAME = "provider-staff-service";
const SERVICE_VERSION = "2.0.0";
const SERVICE_FEATURES = [
  "Doctor Management",
  "Staff Management",
  "Schedules",
  "Departments",
];
const SERVICE_PATTERNS = ["Aggregate", "Event Sourcing", "Saga"];

// Setup dependencies
const container = setupDependencies();
const eventBus = container.resolve(ServiceTokens.EVENT_BUS) as HybridEventBus;

async function initializeEventBus() {
  try {
    await eventBus.connect();
    logger.info("Hybrid Event Bus connected successfully");
  } catch (error) {
    logger.error("Failed to connect Hybrid Event Bus", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    logger.warn("Continuing with Supabase-only event publishing");
  }
}

// Initialize RabbitMQ Event Publisher and Consumers
let eventPublisher: RabbitMQEventPublisher | null = null;
let identityEventConsumer: IdentityEventConsumer | null = null;
let appointmentsEventConsumer: AppointmentsEventConsumer | null = null;
let patientEventConsumer: PatientEventConsumer | null = null;
let staffEventHandler: RabbitMQStaffEventHandler | null = null;

async function initializeEventPublisher() {
  try {
    const rabbitmqUrl =
      process.env.RABBITMQ_URL || "amqp://admin:admin@localhost:5673";
    const rabbitmqExchange = process.env.RABBITMQ_EXCHANGE || "hospital.events";
    const rabbitmqExchangeType = (process.env.RABBITMQ_EXCHANGE_TYPE ||
      "topic") as "topic" | "direct" | "fanout";

    eventPublisher = new RabbitMQEventPublisher(
      {
        url: rabbitmqUrl,
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

    await eventPublisher.connect();

    // Initialize Staff Event Handler to publish domain events to RabbitMQ
    staffEventHandler = new RabbitMQStaffEventHandler(eventPublisher, logger);

    // Subscribe staff event handler to domain events from SupabaseEventBus
    const resolvedEventBus = eventBus as IEventBus;
    await resolvedEventBus.subscribe("StaffRegistered", staffEventHandler);
    await resolvedEventBus.subscribe(
      "StaffCredentialVerified",
      staffEventHandler,
    );
    await resolvedEventBus.subscribe("StaffScheduleUpdated", staffEventHandler);
    await resolvedEventBus.subscribe("StaffStatusChanged", staffEventHandler);
    await resolvedEventBus.subscribe(
      "StaffEmploymentStatusUpdated",
      staffEventHandler,
    );
    await resolvedEventBus.subscribe("StaffUpdated", staffEventHandler);
    await resolvedEventBus.subscribe(
      "DoctorAvailabilityChanged",
      staffEventHandler,
    );

    // Subscribe StaffDomainEventHandler for audit logging and integration events
    const staffDomainEventHandler = container.resolve(
      ServiceTokens.STAFF_DOMAIN_EVENT_HANDLER,
    ) as any;
    await resolvedEventBus.subscribe(
      "StaffRegistered",
      staffDomainEventHandler,
    );
    await resolvedEventBus.subscribe(
      "StaffCredentialVerified",
      staffDomainEventHandler,
    );
    await resolvedEventBus.subscribe(
      "StaffScheduleUpdated",
      staffDomainEventHandler,
    );
    await resolvedEventBus.subscribe(
      "StaffStatusChanged",
      staffDomainEventHandler,
    );
    await resolvedEventBus.subscribe(
      "StaffEmploymentStatusUpdated",
      staffDomainEventHandler,
    );
    await resolvedEventBus.subscribe("StaffUpdated", staffDomainEventHandler);

    logger.info(
      "RabbitMQ Event Publisher and Staff Event Handler initialized successfully",
    );
  } catch (error) {
    logger.error("Failed to initialize RabbitMQ Event Publisher", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    logger.warn("Continuing without event publishing");
  }
}

// Initialize Identity Event Consumer
async function initializeIdentityEventConsumer() {
  try {
    identityEventConsumer = container.resolve<IdentityEventConsumer>(
      ServiceTokens.IDENTITY_EVENT_CONSUMER,
    );
    await identityEventConsumer.connect();
    logger.info("Identity Event Consumer initialized successfully");
  } catch (error) {
    logger.error("Failed to initialize Identity Event Consumer", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    logger.warn("Continuing without Identity event consumption");
  }
}

// Initialize Appointments Event Consumer
async function initializeAppointmentsEventConsumer() {
  try {
    appointmentsEventConsumer = container.resolve<AppointmentsEventConsumer>(
      ServiceTokens.APPOINTMENTS_EVENT_CONSUMER,
    );
    await appointmentsEventConsumer.connect();
    logger.info("Appointments Event Consumer initialized successfully");
  } catch (error) {
    logger.error("Failed to initialize Appointments Event Consumer", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    logger.warn("Continuing without Appointments event consumption");
  }
}

// Initialize Patient Event Consumer
async function initializePatientEventConsumer() {
  try {
    patientEventConsumer = container.resolve<PatientEventConsumer>(
      ServiceTokens.PATIENT_EVENT_CONSUMER,
    );
    await patientEventConsumer.connect();
    logger.info("Patient Event Consumer initialized successfully");
  } catch (error) {
    logger.error("Failed to initialize Patient Event Consumer", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    logger.warn("Continuing without Patient event consumption");
  }
}

// Initialize event publisher and consumers (non-blocking)
initializeEventBus();
initializeEventPublisher();
initializeIdentityEventConsumer();
initializeAppointmentsEventConsumer();
initializePatientEventConsumer();

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || [
      "http://localhost:3000",
    ],
    credentials: true,
  }),
);
app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Get use cases and handlers from container
const registerStaffUseCase = container.resolve<RegisterStaffUseCase>(
  ServiceTokens.REGISTER_STAFF_USE_CASE,
);
const getStaffProfileUseCase = container.resolve<GetStaffProfileUseCase>(
  ServiceTokens.GET_STAFF_PROFILE_USE_CASE,
);
const staffCommandHandlers = container.resolve<StaffCommandHandlers>(
  ServiceTokens.STAFF_COMMAND_HANDLERS,
);
const staffQueryHandlers = container.resolve<StaffQueryHandlers>(
  ServiceTokens.STAFF_QUERY_HANDLERS,
);

// Setup routes
setupRoutes(
  app,
  registerStaffUseCase,
  getStaffProfileUseCase,
  container.resolve(ServiceTokens.ASSIGN_STAFF_TO_DEPARTMENT_USE_CASE),
  container.resolve(ServiceTokens.SET_DEPARTMENT_HEAD_USE_CASE),
  staffCommandHandlers,
  staffQueryHandlers,
  container.resolve(ServiceTokens.ADD_STAFF_CREDENTIAL_USE_CASE),
  container.resolve(ServiceTokens.REMOVE_STAFF_CREDENTIAL_USE_CASE),
  container.resolve(ServiceTokens.RENEW_STAFF_CREDENTIAL_USE_CASE),
  container.resolve(ServiceTokens.GET_EXPIRING_CREDENTIALS_USE_CASE),
  container.resolve(ServiceTokens.ACTIVATE_STAFF_USE_CASE),
  container.resolve(ServiceTokens.SUSPEND_STAFF_USE_CASE),
  container.resolve(ServiceTokens.REACTIVATE_STAFF_USE_CASE),
  container.resolve(ServiceTokens.TERMINATE_STAFF_USE_CASE),
  container.resolve(ServiceTokens.UPDATE_EMPLOYMENT_STATUS_USE_CASE),
  container.resolve(ServiceTokens.UPDATE_STAFF_SCHEDULE_USE_CASE),
  // REMOVED: Availability use cases - Belongs to Scheduling/Appointment Service
  container.resolve(ServiceTokens.GET_STAFF_SPECIALIZATIONS_USE_CASE),
  container.resolve(ServiceTokens.ADD_STAFF_SPECIALIZATION_USE_CASE),
  container.resolve(ServiceTokens.REMOVE_STAFF_SPECIALIZATION_USE_CASE),
);

// Health check
app.get("/health", async (_req, res) => {
  try {
    const healthStatus = await container.getServiceHealth();
    const rabbitmqStatus = eventPublisher?.isReady()
      ? "connected"
      : "disconnected";
    const identityConsumerStatus = identityEventConsumer?.isHealthy()
      ? "connected"
      : "disconnected";

    res.json({
      service: SERVICE_NAME,
      version: SERVICE_VERSION,
      status: "healthy",
      timestamp: new Date().toISOString(),
      port: PORT,
      features: SERVICE_FEATURES,
      patterns: SERVICE_PATTERNS,
      services: healthStatus,
      rabbitmq: {
        publisher: {
          status: rabbitmqStatus,
          exchange: process.env.RABBITMQ_EXCHANGE || "hospital.events",
        },
        identityConsumer: {
          status: identityConsumerStatus,
          queue: "provider-staff-service.identity-events",
          routingKeys: [
            "user.created.event",
            "user.deactivated.event",
            "user.role.changed.event",
          ],
        },
      },
    });
  } catch (error) {
    res.status(503).json({
      service: SERVICE_NAME,
      version: SERVICE_VERSION,
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Error handling middleware
const errorHandler = new ErrorHandlingMiddleware(logger);
app.use(errorHandler.handle());

// Start server
const server = app.listen(PORT, () => {
  logger.info(`${SERVICE_NAME} started on port ${PORT}`);
  logger.info(`Features: ${SERVICE_FEATURES.join(", ")}`);
  logger.info(`Patterns: ${SERVICE_PATTERNS.join(", ")}`);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("SIGTERM signal received: closing HTTP server");

  // Disconnect Event Consumers
  if (identityEventConsumer) {
    await identityEventConsumer.disconnect();
    logger.info("Identity Event Consumer disconnected");
  }
  if (appointmentsEventConsumer) {
    await appointmentsEventConsumer.disconnect();
    logger.info("Appointments Event Consumer disconnected");
  }
  if (patientEventConsumer) {
    await patientEventConsumer.disconnect();
    logger.info("Patient Event Consumer disconnected");
  }

  if (eventBus) {
    await eventBus.disconnect();
    logger.info("Hybrid Event Bus disconnected");
  }

  // Disconnect RabbitMQ
  if (eventPublisher) {
    await eventPublisher.disconnect();
    logger.info("RabbitMQ disconnected");
  }

  server.close(() => {
    logger.info("HTTP server closed");
    process.exit(0);
  });
});

process.on("SIGINT", async () => {
  logger.info("SIGINT signal received: closing HTTP server");

  // Disconnect Event Consumers
  if (identityEventConsumer) {
    await identityEventConsumer.disconnect();
    logger.info("Identity Event Consumer disconnected");
  }
  if (appointmentsEventConsumer) {
    await appointmentsEventConsumer.disconnect();
    logger.info("Appointments Event Consumer disconnected");
  }
  if (patientEventConsumer) {
    await patientEventConsumer.disconnect();
    logger.info("Patient Event Consumer disconnected");
  }

  if (eventBus) {
    await eventBus.disconnect();
    logger.info("Hybrid Event Bus disconnected");
  }

  // Disconnect RabbitMQ
  if (eventPublisher) {
    await eventPublisher.disconnect();
    logger.info("RabbitMQ disconnected");
  }

  server.close(() => {
    logger.info("HTTP server closed");
    process.exit(0);
  });
});

export default app;
