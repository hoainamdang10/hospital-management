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
import cron, { ScheduledTask } from "node-cron";
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
import { SupabaseStaffRepository } from "./infrastructure/repositories/SupabaseStaffRepository";
import { SupabaseWalletRepository } from "./infrastructure/repositories/SupabaseWalletRepository";
import { Patient } from "./domain/entities/Patient";

// Application
import { CreateInvoiceUseCase } from "./application/use-cases/CreateInvoiceUseCase";
import { GetInvoiceUseCase } from "./application/use-cases/GetInvoiceUseCase";
// REMOVED (Phase 1 Out-of-Scope): FinalizeInvoiceUseCase, CancelInvoiceUseCase
import { ProcessPaymentUseCase } from "./application/use-cases/ProcessPaymentUseCase";
import { GetPatientInvoicesUseCase } from "./application/use-cases/GetPatientInvoicesUseCase";
// REMOVED (Phase 1 Out-of-Scope): ProcessInsuranceClaimUseCase
import { RefundPaymentUseCase } from "./application/use-cases/RefundPaymentUseCase";
import { CompleteRefundUseCase } from "./application/use-cases/CompleteRefundUseCase";
import { SearchInvoicesUseCase } from "./application/use-cases/SearchInvoicesUseCase";
import { GetOverdueInvoicesUseCase } from "./application/use-cases/GetOverdueInvoicesUseCase";
import { GetPatientBillingSummaryUseCase } from "./application/use-cases/GetPatientBillingSummaryUseCase";
import { GetRevenueReportUseCase } from "./application/use-cases/GetRevenueReportUseCase";
import { CreateVnpayPaymentLinkUseCase } from "./application/use-cases/CreateVnpayPaymentLinkUseCase";
import { CreateWalletTopUpLinkUseCase } from "./application/use-cases/CreateWalletTopUpLinkUseCase";
import { HandlePayOSWebhookUseCase } from "./application/use-cases/HandlePayOSWebhookUseCase";
import { PayInvoiceWithWalletUseCase } from "./application/use-cases/PayInvoiceWithWalletUseCase";
import { ExpirePendingInvoicesUseCase } from "./application/use-cases/ExpirePendingInvoicesUseCase";
// REMOVED: SendInvoiceEmailUseCase, CreatePaymentReminderUseCase - Out of scope for Phase 1
import { VnpayIntegrationService } from "./infrastructure/services/VnpayIntegrationService";
import { BillingService } from "./application/services/BillingService";
import { WalletService } from "./application/services/WalletService";

// Event Consumers & Workers
import { AppointmentEventConsumer } from "./infrastructure/events/AppointmentEventConsumer";
import { ClinicalEventConsumer } from "./infrastructure/events/ClinicalEventConsumer";
import { RefundGatewayWorker } from "./infrastructure/workers/RefundGatewayWorker";
import { logger as loggerInstance } from "./infrastructure/logging/logger";

// Presentation
import { InvoiceController } from "./presentation/controllers/InvoiceController";
import { WalletController } from "./presentation/controllers/WalletController";
import { createInvoiceRoutes } from "./presentation/routes/invoiceRoutes";
import { createWalletRoutes } from "./presentation/routes/walletRoutes";
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
  vnpayTmnCode: process.env.VNPAY_TMN_CODE || process.env.PAYOS_CLIENT_ID || "",
  vnpayHashSecret:
    process.env.VNPAY_HASH_SECRET || process.env.PAYOS_API_KEY || "",
  vnpayChecksumKey:
    process.env.VNPAY_CHECKSUM_KEY || process.env.PAYOS_CHECKSUM_KEY || "",
  vnpayBaseUrl: process.env.VNPAY_BASE_URL || process.env.PAYOS_BASE_URL,
  vnpayReturnUrl: process.env.VNPAY_RETURN_URL || process.env.PAYOS_RETURN_URL,
  vnpayCancelUrl: process.env.VNPAY_CANCEL_URL || process.env.PAYOS_CANCEL_URL,
  vnpayWebhookUrl:
    process.env.VNPAY_WEBHOOK_URL || process.env.PAYOS_WEBHOOK_URL,
  vnpayTimeZone:
    process.env.VNPAY_TIMEZONE ||
    process.env.PAYOS_TIMEZONE ||
    "Asia/Ho_Chi_Minh",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
  databaseSchema: process.env.DATABASE_SCHEMA || "billing_schema",
  // Feature Flags
  enableClinicalEventConsumer: process.env.ENABLE_CLINICAL_CONSUMER === "true", // Phase 1: Disabled by default
};

// Logger is imported from ./infrastructure/logging/logger

class BillingServiceApp {
  private app: express.Application;
  private eventBus!: IEventBus;
  private invoiceRepository!: SupabaseInvoiceRepository;
  private patientRepository!: SupabasePatientRepository;
  private staffRepository!: SupabaseStaffRepository;
  private walletRepository!: SupabaseWalletRepository;
  private optimizedSupabase!: OptimizedSupabaseClient;
  private paymentGateway!: VnpayIntegrationService;
  private billingService!: BillingService;
  private walletService!: WalletService;

  // Event Consumers & Workers
  private appointmentEventConsumer!: AppointmentEventConsumer;
  private clinicalEventConsumer!: ClinicalEventConsumer;
  private refundGatewayWorker!: RefundGatewayWorker;
  private expirePendingInvoicesUseCase!: ExpirePendingInvoicesUseCase;
  private invoiceExpiryTask?: ScheduledTask;

  // Use Cases - Phase 1 (Prepaid Model)
  private createInvoiceUseCase!: CreateInvoiceUseCase;
  private getInvoiceUseCase!: GetInvoiceUseCase;
  private processPaymentUseCase!: ProcessPaymentUseCase;
  private getPatientInvoicesUseCase!: GetPatientInvoicesUseCase;
  // REMOVED (Phase 1 Out-of-Scope): finalizeInvoiceUseCase, cancelInvoiceUseCase, processInsuranceClaimUseCase
  private refundPaymentUseCase!: RefundPaymentUseCase;
  private completeRefundUseCase!: CompleteRefundUseCase;
  private searchInvoicesUseCase!: SearchInvoicesUseCase;
  private getOverdueInvoicesUseCase!: GetOverdueInvoicesUseCase;
  private getPatientBillingSummaryUseCase!: GetPatientBillingSummaryUseCase;
  private getRevenueReportUseCase!: GetRevenueReportUseCase;
  private createPaymentLinkUseCase!: CreateVnpayPaymentLinkUseCase;
  private createWalletTopUpLinkUseCase!: CreateWalletTopUpLinkUseCase;
  private handlePayOSWebhookUseCase!: HandlePayOSWebhookUseCase;
  private payInvoiceWithWalletUseCase!: PayInvoiceWithWalletUseCase;
  // REMOVED: sendInvoiceEmailUseCase, createPaymentReminderUseCase - Out of scope for Phase 1

  // Controllers
  private invoiceController!: InvoiceController;
  private walletController!: WalletController;

  // Middleware
  private errorHandlingMiddleware!: ErrorHandlingMiddleware;
  private authMiddleware!: AuthenticationMiddleware;

  constructor() {
    this.app = express();
    // khi chạy sau gateway/ngrok, express cần trust proxy để rate-limit đọc đúng X-Forwarded-For
    this.app.set("trust proxy", 1);
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
      schemaName: config.databaseSchema,
      enableOptimizations: config.nodeEnv !== "test",
    });

    // Initialize Repository
    this.invoiceRepository = new SupabaseInvoiceRepository(
      this.optimizedSupabase,
    );
    this.patientRepository = new SupabasePatientRepository(
      this.optimizedSupabase,
      loggerInstance,
    );
    this.staffRepository = new SupabaseStaffRepository(
      this.optimizedSupabase,
      loggerInstance,
    );
    this.walletRepository = new SupabaseWalletRepository(
      this.optimizedSupabase,
      loggerInstance,
    );

    // Initialize VNPAY Service
    this.paymentGateway = new VnpayIntegrationService(
      {
        tmnCode: config.vnpayTmnCode,
        hashSecret: config.vnpayHashSecret,
        baseUrl:
          config.vnpayBaseUrl ||
          "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
        returnUrl: config.vnpayReturnUrl,
        timeZone: config.vnpayTimeZone,
      },
      loggerInstance,
    );

    // Initialize Wallet service early so that use cases can consume it
    this.walletService = new WalletService(
      this.walletRepository,
      loggerInstance,
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

    // REMOVED (Phase 1 Out-of-Scope): processInsuranceClaimUseCase initialization

    this.refundPaymentUseCase = new RefundPaymentUseCase(
      this.invoiceRepository,
      this.eventBus,
      loggerInstance,
      {
        useGatewayRefund:
          (process.env.USE_GATEWAY_REFUND || "").toLowerCase() === "true",
      },
      this.walletService,
    );

    this.completeRefundUseCase = new CompleteRefundUseCase(
      this.invoiceRepository,
      this.eventBus,
      loggerInstance,
    );

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

    this.createPaymentLinkUseCase = new CreateVnpayPaymentLinkUseCase(
      this.invoiceRepository,
      this.paymentGateway,
      loggerInstance,
      config.vnpayReturnUrl || `${config.frontendUrl}/patient/billing/success`,
      config.vnpayCancelUrl || `${config.frontendUrl}/patient/billing/cancel`,
    );

    this.createWalletTopUpLinkUseCase = new CreateWalletTopUpLinkUseCase(
      this.createInvoiceUseCase,
      this.createPaymentLinkUseCase,
    );

    // REMOVED: sendInvoiceEmailUseCase, createPaymentReminderUseCase initialization - Out of scope for Phase 1

    // Initialize Services
    this.billingService = new BillingService(
      this.invoiceRepository,
      this.patientRepository,
      this.createInvoiceUseCase,
      this.processPaymentUseCase,
      loggerInstance,
    );

    this.payInvoiceWithWalletUseCase = new PayInvoiceWithWalletUseCase(
      this.invoiceRepository,
      this.eventBus,
      this.walletService,
      loggerInstance,
    );

    this.expirePendingInvoicesUseCase = new ExpirePendingInvoicesUseCase(
      this.invoiceRepository,
      this.eventBus,
    );

    this.handlePayOSWebhookUseCase = new HandlePayOSWebhookUseCase(
      this.invoiceRepository,
      this.eventBus,
      this.paymentGateway,
      loggerInstance,
      this.walletService,
    );

    // Initialize Event Consumers
    this.appointmentEventConsumer = new AppointmentEventConsumer(
      {
        rabbitmqUrl: config.rabbitmqUrl,
        queueName: "billing.appointment.events",
        exchangeName: "hospital.events",
        routingKeys: [
          "appointment.scheduled",
          "appointment.cancelled",
          "appointment.cancelled_late",
          "appointment.no_show",
          "appointment.rescheduled",
          // Appointments service is publishing `appointments.*` (plural) in outbox
          "appointments.scheduled",
          "appointments.cancelled",
          "appointments.cancelled_late",
          "appointments.no_show",
          "appointments.rescheduled",
        ],
        prefetchCount: 10,
        retryAttempts: 3,
        retryDelayMs: 1000,
      },
      loggerInstance,
      this.billingService,
      this.invoiceRepository,
      this.patientRepository,
      this.staffRepository,
      this.createPaymentLinkUseCase, // Inject payment link use case for automatic payment link creation
      this.eventBus, // Inject EventBus for publishing PaymentLinkCreatedEvent
      this.refundPaymentUseCase, // Inject RefundPaymentUseCase for processing refunds
      this.payInvoiceWithWalletUseCase,
    );

    // Initialize Clinical Event Consumer (Feature Flag)
    // Phase 1: Disabled by default - only prepaid appointment billing is in scope
    // Set ENABLE_CLINICAL_CONSUMER=true to enable post-service billing features
    if (config.enableClinicalEventConsumer) {
      this.clinicalEventConsumer = new ClinicalEventConsumer(
        {
          rabbitmqUrl: config.rabbitmqUrl,
          queueName: "billing.clinical.events",
          exchangeName: "hospital.events",
          routingKeys: [
            "clinical.prescription.created",
            "clinical.lab_result.created",
            "clinical.treatment_plan.created",
            "clinical.medical_record.created",
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
      loggerInstance.info(
        "Clinical event consumer initialized (feature flag enabled)",
      );
    } else {
      loggerInstance.info(
        "Clinical event consumer disabled (Phase 1 scope - prepaid only)",
      );
    }

    // Initialize Refund Gateway Worker (with VNPAY service for real refunds)
    this.refundGatewayWorker = new RefundGatewayWorker(
      this.eventBus,
      this.completeRefundUseCase,
      this.paymentGateway, // VnpayIntegrationService for real refund API calls
      loggerInstance,
      {
        useGatewayRefund:
          (process.env.USE_GATEWAY_REFUND || "").toLowerCase() === "true",
      },
    );
    loggerInstance.info(
      "Refund gateway worker initialized (VNPAY integration)",
    );

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
      this.createPaymentLinkUseCase,
      this.handlePayOSWebhookUseCase,
      this.payInvoiceWithWalletUseCase,
      // REMOVED (Phase 1 Out-of-Scope): finalizeInvoiceUseCase, cancelInvoiceUseCase, processInsuranceClaimUseCase, refundPaymentUseCase, sendInvoiceEmailUseCase, createPaymentReminderUseCase
    );
    this.walletController = new WalletController(
      this.walletService,
      this.createWalletTopUpLinkUseCase,
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

    // Public routes (no auth required)
    const publicInvoiceRoutes = express.Router();
    // VNPAY sends IPN via GET, PayOS via POST - support both
    publicInvoiceRoutes.get(
      "/payos/webhook",
      this.invoiceController.handlePayOSWebhook,
    );
    publicInvoiceRoutes.post(
      "/payos/webhook",
      this.invoiceController.handlePayOSWebhook,
    );
    // Test endpoint to log raw VNPAY webhook data (no auth required)
    publicInvoiceRoutes.get(
      "/payos/webhook-test",
      this.invoiceController.logRawWebhookData,
    );
    publicInvoiceRoutes.post(
      "/payos/webhook-test",
      this.invoiceController.logRawWebhookData,
    );
    this.app.use("/api/v1/invoices", publicInvoiceRoutes);
    // Alias for API Gateway routing (/api/v1/billing/invoices/*)
    this.app.use("/api/v1/billing/invoices", publicInvoiceRoutes);

    // API routes with authentication
    const invoiceRoutes = createInvoiceRoutes(this.invoiceController);
    this.app.use(
      "/api/v1/invoices",
      this.authMiddleware.authenticate,
      invoiceRoutes,
    );
    this.app.use(
      "/api/v1/billing/invoices",
      this.authMiddleware.authenticate,
      invoiceRoutes,
    );

    // Wallet routes (protected)
    const walletRoutes = createWalletRoutes(this.walletController);
    this.app.use(
      "/api/v1/wallet",
      this.authMiddleware.authenticate,
      walletRoutes,
    );
    this.app.use(
      "/api/v1/billing/wallet",
      this.authMiddleware.authenticate,
      walletRoutes,
    );

    // 404 handler
    this.app.use(this.errorHandlingMiddleware.notFound());

    // Error handling middleware (must be last)
    this.app.use(this.errorHandlingMiddleware.handle());

    loggerInstance.info("Routes setup complete");
  }

  private scheduleInvoiceExpiryCron(): void {
    if (this.invoiceExpiryTask) {
      this.invoiceExpiryTask.stop();
    }

    this.invoiceExpiryTask = cron.schedule("*/5 * * * *", async () => {
      try {
        loggerInstance.info("[InvoiceExpiryCron] Starting overdue scan...");
        const result = await this.expirePendingInvoicesUseCase.execute();
        loggerInstance.info(
          `[InvoiceExpiryCron] Completed. Expired: ${result.expiredCount}`,
        );
        if (result.errors.length > 0) {
          loggerInstance.warn("[InvoiceExpiryCron] Errors detected", {
            errors: result.errors,
          });
        }
      } catch (error) {
        loggerInstance.error(
          "[InvoiceExpiryCron] Fatal error during invoice expiry check",
          { error: error instanceof Error ? error.message : "Unknown error" },
        );
      }
    });

    loggerInstance.info(
      "[InvoiceExpiryCron] Scheduled invoice expiry cron (every 5 minutes)",
    );
  }

  async start(): Promise<void> {
    try {
      loggerInstance.info(
        `Starting ${config.serviceName} v${config.version}...`,
      );

      await this.initializeDependencies();
      this.setupMiddleware();
      this.setupRoutes();

      // Connect Event Consumers
      await this.appointmentEventConsumer.connect();

      // Only connect clinical consumer if feature flag is enabled
      if (config.enableClinicalEventConsumer && this.clinicalEventConsumer) {
        await this.clinicalEventConsumer.connect();
        loggerInstance.info("Clinical event consumer connected");
      }

      // Start Refund Gateway Worker
      await this.refundGatewayWorker.start();
      loggerInstance.info("Refund gateway worker started");

      loggerInstance.info("Event consumers and workers connected");
      this.scheduleInvoiceExpiryCron();

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

      if (this.invoiceExpiryTask) {
        this.invoiceExpiryTask.stop();
        loggerInstance.info("Invoice expiry cron stopped");
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
