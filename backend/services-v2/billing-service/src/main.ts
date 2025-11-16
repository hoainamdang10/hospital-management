/**
 * Billing Service V2 - Main Application
 * Simplified Clean Architecture + DDD + CQRS
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import compression from "compression";

// Infrastructure
import { createOptimizedSupabaseClient } from "@shared/infrastructure/database/optimized-supabase-client";
import type { OptimizedSupabaseClient } from "@shared/infrastructure/database/optimized-supabase-client";
import { RabbitMQEventBus } from "@shared/infrastructure/event-bus/EventBus";
import { IEventBus } from "@shared/application/services/event-bus.interface";
import { SupabaseInvoiceRepository } from "./infrastructure/repositories/SupabaseInvoiceRepository";
import { SupabasePatientRepository } from "./infrastructure/repositories/SupabasePatientRepository";
import { Patient } from "./domain/entities/Patient";

// Application
import { CreateInvoiceUseCase } from "./application/use-cases/CreateInvoiceUseCase";
import { GetInvoiceUseCase } from "./application/use-cases/GetInvoiceUseCase";
// REMOVED (Phase 1 Out-of-Scope): FinalizeInvoiceUseCase, CancelInvoiceUseCase
import { ProcessPaymentUseCase } from "./application/use-cases/ProcessPaymentUseCase";
import { GetPatientInvoicesUseCase } from "./application/use-cases/GetPatientInvoicesUseCase";
// REMOVED (Phase 1 Out-of-Scope): ProcessInsuranceClaimUseCase, RefundPaymentUseCase
import { SearchInvoicesUseCase } from "./application/use-cases/SearchInvoicesUseCase";
import { GetOverdueInvoicesUseCase } from "./application/use-cases/GetOverdueInvoicesUseCase";
import { GetPatientBillingSummaryUseCase } from "./application/use-cases/GetPatientBillingSummaryUseCase";
import { GetRevenueReportUseCase } from "./application/use-cases/GetRevenueReportUseCase";
import { CreatePayOSPaymentLinkUseCase } from "./application/use-cases/CreatePayOSPaymentLinkUseCase";
import { HandlePayOSWebhookUseCase } from "./application/use-cases/HandlePayOSWebhookUseCase";
// REMOVED: SendInvoiceEmailUseCase, CreatePaymentReminderUseCase - Out of scope for Phase 1
import { PayOSIntegrationService } from "./infrastructure/services/PayOSIntegrationService";
import { BillingService } from "./application/services/BillingService";

// Event Consumers
import { AppointmentEventConsumer } from "./infrastructure/events/AppointmentEventConsumer";
import { ClinicalEventConsumer } from "./infrastructure/events/ClinicalEventConsumer";
import { logger as loggerInstance } from "./infrastructure/logging/logger";

// Presentation
import { InvoiceController } from "./presentation/controllers/InvoiceController";
import { createInvoiceRoutes } from "./presentation/routes/invoiceRoutes";
import { createHealthRoutes } from "./presentation/routes/healthRoutes";
import { ErrorHandlingMiddleware } from "./presentation/middleware/ErrorHandlingMiddleware";
import { AuthenticationMiddleware } from "./presentation/middleware/AuthenticationMiddleware";

// Configuration
const config = {
  port: process.env.PORT || 3006,
  supabaseUrl: process.env.SUPABASE_URL || "",
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  rabbitmqUrl: process.env.RABBITMQ_URL || "amqp://admin:admin@localhost:5673",
  rabbitmqExchange: process.env.RABBITMQ_EXCHANGE || "hospital.events",
  nodeEnv: process.env.NODE_ENV || "development",
  serviceName: "billing-service",
  version: "2.0.0",
  allowedOrigins: (
    process.env.ALLOWED_ORIGINS || "http://localhost:3000"
  ).split(","),
  identityServiceUrl:
    process.env.IDENTITY_SERVICE_URL || "http://localhost:3021",
  payosClientId: process.env.PAYOS_CLIENT_ID || "",
  payosApiKey: process.env.PAYOS_API_KEY || "",
  payosChecksumKey: process.env.PAYOS_CHECKSUM_KEY || "",
  // Feature Flags
  enableClinicalEventConsumer: process.env.ENABLE_CLINICAL_CONSUMER === "true", // Phase 1: Disabled by default
};

// Logger is imported from ./infrastructure/logging/logger

class BillingServiceApp {
  private app: express.Application;
  private eventBus!: IEventBus;
  private invoiceRepository!: SupabaseInvoiceRepository;
  private patientRepository!: SupabasePatientRepository;
  private optimizedSupabase!: OptimizedSupabaseClient;
  private payosService!: PayOSIntegrationService;
  private billingService!: BillingService;

  // Event Consumers
  private appointmentEventConsumer!: AppointmentEventConsumer;
  private clinicalEventConsumer!: ClinicalEventConsumer;

  // Use Cases - Phase 1 (Prepaid Model)
  private createInvoiceUseCase!: CreateInvoiceUseCase;
  private getInvoiceUseCase!: GetInvoiceUseCase;
  private processPaymentUseCase!: ProcessPaymentUseCase;
  private getPatientInvoicesUseCase!: GetPatientInvoicesUseCase;
  // REMOVED (Phase 1 Out-of-Scope): finalizeInvoiceUseCase, cancelInvoiceUseCase, processInsuranceClaimUseCase, refundPaymentUseCase
  private searchInvoicesUseCase!: SearchInvoicesUseCase;
  private getOverdueInvoicesUseCase!: GetOverdueInvoicesUseCase;
  private getPatientBillingSummaryUseCase!: GetPatientBillingSummaryUseCase;
  private getRevenueReportUseCase!: GetRevenueReportUseCase;
  private createPayOSPaymentLinkUseCase!: CreatePayOSPaymentLinkUseCase;
  private handlePayOSWebhookUseCase!: HandlePayOSWebhookUseCase;
  // REMOVED: sendInvoiceEmailUseCase, createPaymentReminderUseCase - Out of scope for Phase 1

  // Controllers
  private invoiceController!: InvoiceController;

  // Middleware
  private errorHandlingMiddleware!: ErrorHandlingMiddleware;
  private authMiddleware!: AuthenticationMiddleware;

  constructor() {
    this.app = express();
  }

  private async initializeDependencies(): Promise<void> {
    loggerInstance.info("Initializing dependencies...");

    // Validate configuration
    if (!config.supabaseUrl || !config.supabaseKey) {
      throw new Error("Missing required environment variables");
    }

    // Initialize EventBus
    this.eventBus = new RabbitMQEventBus({
      rabbitmqUrl: config.rabbitmqUrl,
      exchangeName: config.rabbitmqExchange,
      serviceName: config.serviceName,
    });
    await this.eventBus.connect();
    loggerInstance.info("EventBus initialized");

    // Initialize Supabase
    this.optimizedSupabase = createOptimizedSupabaseClient({
      supabaseUrl: config.supabaseUrl,
      supabaseServiceKey: config.supabaseKey,
      serviceName: config.serviceName,
      schemaName: "billing_schema",
      enableOptimizations: config.nodeEnv !== "test",
    });

    // Initialize Repository
    this.invoiceRepository = new SupabaseInvoiceRepository(this.optimizedSupabase);
    this.patientRepository = new SupabasePatientRepository(
      this.optimizedSupabase,
      loggerInstance
    );

    // Initialize PayOS Service
    this.payosService = new PayOSIntegrationService(
      {
        clientId: config.payosClientId,
        apiKey: config.payosApiKey,
        checksumKey: config.payosChecksumKey,
      },
      loggerInstance
    );

    // Initialize Use Cases
    this.createInvoiceUseCase = new CreateInvoiceUseCase(
      this.invoiceRepository,
      this.eventBus,
      loggerInstance,
    );

    this.getInvoiceUseCase = new GetInvoiceUseCase(
      this.invoiceRepository,
      loggerInstance,
    );

    // REMOVED (Phase 1 Out-of-Scope): finalizeInvoiceUseCase, cancelInvoiceUseCase initialization

    this.processPaymentUseCase = new ProcessPaymentUseCase(
      this.invoiceRepository,
      this.eventBus,
      loggerInstance,
    );

    this.getPatientInvoicesUseCase = new GetPatientInvoicesUseCase(
      this.invoiceRepository,
      loggerInstance,
    );

    // REMOVED (Phase 1 Out-of-Scope): processInsuranceClaimUseCase, refundPaymentUseCase initialization

    this.searchInvoicesUseCase = new SearchInvoicesUseCase(
      this.invoiceRepository,
      loggerInstance,
    );

    this.getOverdueInvoicesUseCase = new GetOverdueInvoicesUseCase(
      this.invoiceRepository,
      loggerInstance,
    );

    this.getPatientBillingSummaryUseCase = new GetPatientBillingSummaryUseCase(
      this.invoiceRepository,
      loggerInstance,
    );

    this.getRevenueReportUseCase = new GetRevenueReportUseCase(
      this.invoiceRepository,
      loggerInstance,
    );

    this.createPayOSPaymentLinkUseCase = new CreatePayOSPaymentLinkUseCase(
      this.invoiceRepository,
      this.payosService,
      loggerInstance,
    );

    this.handlePayOSWebhookUseCase = new HandlePayOSWebhookUseCase(
      this.invoiceRepository,
      this.eventBus,
      this.payosService,
      loggerInstance,
    );

    // REMOVED: sendInvoiceEmailUseCase, createPaymentReminderUseCase initialization - Out of scope for Phase 1

    // Initialize Billing Service
    this.billingService = new BillingService(
      this.invoiceRepository,
      this.patientRepository,
      this.createInvoiceUseCase,
      this.processPaymentUseCase,
      loggerInstance,
    );

    // Initialize Event Consumers
    this.appointmentEventConsumer = new AppointmentEventConsumer(
      {
        rabbitmqUrl: config.rabbitmqUrl,
        queueName: 'billing.appointment.events',
        exchangeName: 'hospital.events',
        routingKeys: [
          'appointment.scheduled',      // Phase 1 (Prepaid): Create invoice when appointment is scheduled
          'appointment.cancelled_late', // Cancel invoice if not paid yet
          'appointment.no_show',        // Future: Apply no-show fee
        ],
        prefetchCount: 10,
        retryAttempts: 3,
        retryDelayMs: 1000,
      },
      loggerInstance,
      this.billingService,
      this.invoiceRepository,
      this.patientRepository,
      this.createPayOSPaymentLinkUseCase, // Inject PayOS use case for automatic payment link creation
      this.eventBus, // Inject EventBus for publishing PaymentLinkCreatedEvent
    );

    // Initialize Clinical Event Consumer (Feature Flag)
    // Phase 1: Disabled by default - only prepaid appointment billing is in scope
    // Set ENABLE_CLINICAL_CONSUMER=true to enable post-service billing features
    if (config.enableClinicalEventConsumer) {
      this.clinicalEventConsumer = new ClinicalEventConsumer(
        {
          rabbitmqUrl: config.rabbitmqUrl,
          queueName: 'billing.clinical.events',
          exchangeName: 'hospital.events',
          routingKeys: [
            'clinical.prescription.created',
            'clinical.lab_result.created',
            'clinical.treatment_plan.created',
            'clinical.medical_record.created',
          ],
          prefetchCount: 10,
          retryAttempts: 3,
          retryDelayMs: 1000,
        },
        loggerInstance,
        this.billingService,
        this.invoiceRepository,
        this.patientRepository,
      );
      loggerInstance.info('Clinical event consumer initialized (feature flag enabled)');
    } else {
      loggerInstance.info('Clinical event consumer disabled (Phase 1 scope - prepaid only)');
    }

    // Initialize Controllers - Phase 1 (Prepaid Model)
    this.invoiceController = new InvoiceController(
      this.createInvoiceUseCase,
      this.getInvoiceUseCase,
      this.processPaymentUseCase,
      this.getPatientInvoicesUseCase,
      this.searchInvoicesUseCase,
      this.getOverdueInvoicesUseCase,
      this.getPatientBillingSummaryUseCase,
      this.getRevenueReportUseCase,
      this.createPayOSPaymentLinkUseCase,
      this.handlePayOSWebhookUseCase
      // REMOVED (Phase 1 Out-of-Scope): finalizeInvoiceUseCase, cancelInvoiceUseCase, processInsuranceClaimUseCase, refundPaymentUseCase, sendInvoiceEmailUseCase, createPaymentReminderUseCase
    );

    // Initialize Middleware
    this.errorHandlingMiddleware = new ErrorHandlingMiddleware(loggerInstance);
    this.authMiddleware = new AuthenticationMiddleware({
      identityServiceUrl: config.identityServiceUrl,
      logger: loggerInstance,
      skipPaths: ["/health"],
    });

    loggerInstance.info("Dependencies initialized successfully");
  }

  private setupMiddleware(): void {
    loggerInstance.info("Setting up middleware...");

    // Security
    this.app.use(helmet());

    // CORS
    this.app.use(
      cors({
        origin: config.allowedOrigins,
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
      }),
    );

    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));

    // Rate limiting
    if (process.env.NODE_ENV !== "test") {
      const limiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: "Too many requests from this IP",
        standardHeaders: true,
        legacyHeaders: false,
      });
      this.app.use("/api/", limiter);
    }

    // Request logging
    this.app.use((req, _res, next) => {
      loggerInstance.info("Incoming request", {
        method: req.method,
        path: req.path,
        ip: req.ip,
      });
      next();
    });

    loggerInstance.info("Middleware setup complete");
  }

  private setupRoutes(): void {
    loggerInstance.info("Setting up routes...");

    // Health routes
    const healthRoutes = createHealthRoutes();
    this.app.use("/", healthRoutes);

    // API routes with authentication
    const invoiceRoutes = createInvoiceRoutes(this.invoiceController);
    this.app.use(
      "/api/v1/invoices",
      this.authMiddleware.authenticate,
      invoiceRoutes
    );

    // 404 handler
    this.app.use(this.errorHandlingMiddleware.notFound());

    // Error handling middleware (must be last)
    this.app.use(this.errorHandlingMiddleware.handle());

    loggerInstance.info("Routes setup complete");
  }

  async start(): Promise<void> {
    try {
      loggerInstance.info(`Starting ${config.serviceName} v${config.version}...`);

      await this.initializeDependencies();
      this.setupMiddleware();
      this.setupRoutes();

      // Connect Event Consumers
      await this.appointmentEventConsumer.connect();
      
      // Only connect clinical consumer if feature flag is enabled
      if (config.enableClinicalEventConsumer && this.clinicalEventConsumer) {
        await this.clinicalEventConsumer.connect();
        loggerInstance.info('Clinical event consumer connected');
      }
      
      loggerInstance.info('Event consumers connected');

      this.app.listen(config.port, () => {
        loggerInstance.info(`${config.serviceName} is running`, {
          port: config.port,
          environment: config.nodeEnv,
          version: config.version,
        });
      });
    } catch (error) {
      loggerInstance.fatal("Failed to start service", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      process.exit(1);
    }
  }

  async shutdown(): Promise<void> {
    loggerInstance.info("Shutting down gracefully...");

    try {
      // Disconnect event consumers first
      if (this.appointmentEventConsumer) {
        await this.appointmentEventConsumer.disconnect();
        loggerInstance.info("Appointment event consumer disconnected");
      }

      if (this.clinicalEventConsumer && config.enableClinicalEventConsumer) {
        await this.clinicalEventConsumer.disconnect();
        loggerInstance.info("Clinical event consumer disconnected");
      }

      if (this.eventBus) {
        await this.eventBus.disconnect();
        loggerInstance.info("EventBus disconnected");
      }

      if (this.optimizedSupabase) {
        await this.optimizedSupabase.close();
        loggerInstance.info("Supabase client closed");
      }

      loggerInstance.info("Graceful shutdown complete");
      process.exit(0);
    } catch (error) {
      loggerInstance.error("Error during shutdown", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      process.exit(1);
    }
  }
}

// Create and start the application
const app = new BillingServiceApp();

// Handle shutdown signals
process.on("SIGTERM", () => app.shutdown());
process.on("SIGINT", () => app.shutdown());

// Start the service
app.start().catch((error) => {
  loggerInstance.fatal("Unhandled error during startup", {
    error: error instanceof Error ? error.message : "Unknown error",
  });
  process.exit(1);
});
