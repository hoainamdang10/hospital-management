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
import { ILogger } from "@shared/application/services/logger.interface";
import { SupabaseInvoiceRepository } from "./infrastructure/repositories/SupabaseInvoiceRepository";

// Application
import { CreateInvoiceUseCase } from "./application/use-cases/CreateInvoiceUseCase";
import { GetInvoiceUseCase } from "./application/use-cases/GetInvoiceUseCase";
import { FinalizeInvoiceUseCase } from "./application/use-cases/FinalizeInvoiceUseCase";
import { CancelInvoiceUseCase } from "./application/use-cases/CancelInvoiceUseCase";
import { ProcessPaymentUseCase } from "./application/use-cases/ProcessPaymentUseCase";
import { GetPatientInvoicesUseCase } from "./application/use-cases/GetPatientInvoicesUseCase";
import { ProcessInsuranceClaimUseCase } from "./application/use-cases/ProcessInsuranceClaimUseCase";
import { RefundPaymentUseCase } from "./application/use-cases/RefundPaymentUseCase";
import { SearchInvoicesUseCase } from "./application/use-cases/SearchInvoicesUseCase";
import { GetOverdueInvoicesUseCase } from "./application/use-cases/GetOverdueInvoicesUseCase";
import { GetPatientBillingSummaryUseCase } from "./application/use-cases/GetPatientBillingSummaryUseCase";
import { GetRevenueReportUseCase } from "./application/use-cases/GetRevenueReportUseCase";
import { CreatePayOSPaymentLinkUseCase } from "./application/use-cases/CreatePayOSPaymentLinkUseCase";
import { HandlePayOSWebhookUseCase } from "./application/use-cases/HandlePayOSWebhookUseCase";
import { PayOSIntegrationService } from "./infrastructure/services/PayOSIntegrationService";

// Presentation
import { InvoiceController } from "./presentation/controllers/InvoiceController";
import { createInvoiceRoutes } from "./presentation/routes/invoiceRoutes";
import { createHealthRoutes } from "./presentation/routes/healthRoutes";
import { ErrorHandlingMiddleware } from "./presentation/middleware/ErrorHandlingMiddleware";
import { AuthenticationMiddleware } from "./presentation/middleware/AuthenticationMiddleware";

// Configuration
const config = {
  port: process.env.PORT || 3009,
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
};

// Simple logger
const logger: ILogger = {
  info: (message: string, meta?: any) =>
    console.log(`[INFO] ${message}`, meta || ""),
  error: (message: string, meta?: any) =>
    console.error(`[ERROR] ${message}`, meta || ""),
  warn: (message: string, meta?: any) =>
    console.warn(`[WARN] ${message}`, meta || ""),
  debug: (message: string, meta?: any) =>
    console.debug(`[DEBUG] ${message}`, meta || ""),
  fatal: (message: string, meta?: any) =>
    console.error(`[FATAL] ${message}`, meta || ""),
};

class BillingServiceApp {
  private app: express.Application;
  private eventBus!: IEventBus;
  private invoiceRepository!: SupabaseInvoiceRepository;
  private optimizedSupabase!: OptimizedSupabaseClient;
  private payosService!: PayOSIntegrationService;

  // Use Cases
  private createInvoiceUseCase!: CreateInvoiceUseCase;
  private getInvoiceUseCase!: GetInvoiceUseCase;
  private finalizeInvoiceUseCase!: FinalizeInvoiceUseCase;
  private cancelInvoiceUseCase!: CancelInvoiceUseCase;
  private processPaymentUseCase!: ProcessPaymentUseCase;
  private getPatientInvoicesUseCase!: GetPatientInvoicesUseCase;
  private processInsuranceClaimUseCase!: ProcessInsuranceClaimUseCase;
  private refundPaymentUseCase!: RefundPaymentUseCase;
  private searchInvoicesUseCase!: SearchInvoicesUseCase;
  private getOverdueInvoicesUseCase!: GetOverdueInvoicesUseCase;
  private getPatientBillingSummaryUseCase!: GetPatientBillingSummaryUseCase;
  private getRevenueReportUseCase!: GetRevenueReportUseCase;
  private createPayOSPaymentLinkUseCase!: CreatePayOSPaymentLinkUseCase;
  private handlePayOSWebhookUseCase!: HandlePayOSWebhookUseCase;

  // Controllers
  private invoiceController!: InvoiceController;

  // Middleware
  private errorHandlingMiddleware!: ErrorHandlingMiddleware;
  private authMiddleware!: AuthenticationMiddleware;

  constructor() {
    this.app = express();
  }

  private async initializeDependencies(): Promise<void> {
    logger.info("Initializing dependencies...");

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
    logger.info("EventBus initialized");

    // Initialize Supabase
    this.optimizedSupabase = createOptimizedSupabaseClient({
      supabaseUrl: config.supabaseUrl,
      supabaseServiceKey: config.supabaseKey,
      serviceName: config.serviceName,
      schemaName: "billing_schema",
      enableOptimizations: config.nodeEnv !== "test",
    });

    // Initialize Repository
    this.invoiceRepository = new SupabaseInvoiceRepository();

    // Initialize PayOS Service
    this.payosService = new PayOSIntegrationService(
      {
        clientId: config.payosClientId,
        apiKey: config.payosApiKey,
        checksumKey: config.payosChecksumKey,
      },
      logger
    );

    // Initialize Use Cases
    this.createInvoiceUseCase = new CreateInvoiceUseCase(
      this.invoiceRepository,
      this.eventBus,
      logger,
    );

    this.getInvoiceUseCase = new GetInvoiceUseCase(
      this.invoiceRepository,
      logger,
    );

    this.finalizeInvoiceUseCase = new FinalizeInvoiceUseCase(
      this.invoiceRepository,
      this.eventBus,
      logger,
    );

    this.cancelInvoiceUseCase = new CancelInvoiceUseCase(
      this.invoiceRepository,
      this.eventBus,
      logger,
    );

    this.processPaymentUseCase = new ProcessPaymentUseCase(
      this.invoiceRepository,
      this.eventBus,
      logger,
    );

    this.getPatientInvoicesUseCase = new GetPatientInvoicesUseCase(
      this.invoiceRepository,
      logger,
    );

    this.processInsuranceClaimUseCase = new ProcessInsuranceClaimUseCase(
      this.invoiceRepository,
      this.eventBus,
      logger,
    );

    this.refundPaymentUseCase = new RefundPaymentUseCase(
      this.invoiceRepository,
      this.eventBus,
      logger,
    );

    this.searchInvoicesUseCase = new SearchInvoicesUseCase(
      this.invoiceRepository,
      logger,
    );

    this.getOverdueInvoicesUseCase = new GetOverdueInvoicesUseCase(
      this.invoiceRepository,
      logger,
    );

    this.getPatientBillingSummaryUseCase = new GetPatientBillingSummaryUseCase(
      this.invoiceRepository,
      logger,
    );

    this.getRevenueReportUseCase = new GetRevenueReportUseCase(
      this.invoiceRepository,
      logger,
    );

    this.createPayOSPaymentLinkUseCase = new CreatePayOSPaymentLinkUseCase(
      this.invoiceRepository,
      this.payosService,
      logger,
    );

    this.handlePayOSWebhookUseCase = new HandlePayOSWebhookUseCase(
      this.invoiceRepository,
      this.eventBus,
      this.payosService,
      logger,
    );

    // Initialize Controllers
    this.invoiceController = new InvoiceController(
      this.createInvoiceUseCase,
      this.getInvoiceUseCase,
      this.finalizeInvoiceUseCase,
      this.cancelInvoiceUseCase,
      this.processPaymentUseCase,
      this.getPatientInvoicesUseCase,
      this.processInsuranceClaimUseCase,
      this.refundPaymentUseCase,
      this.searchInvoicesUseCase,
      this.getOverdueInvoicesUseCase,
      this.getPatientBillingSummaryUseCase,
      this.getRevenueReportUseCase,
      this.createPayOSPaymentLinkUseCase,
      this.handlePayOSWebhookUseCase
    );

    // Initialize Middleware
    this.errorHandlingMiddleware = new ErrorHandlingMiddleware(logger);
    this.authMiddleware = new AuthenticationMiddleware({
      identityServiceUrl: config.identityServiceUrl,
      logger,
      skipPaths: ["/health"],
    });

    logger.info("Dependencies initialized successfully");
  }

  private setupMiddleware(): void {
    logger.info("Setting up middleware...");

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
      logger.info("Incoming request", {
        method: req.method,
        path: req.path,
        ip: req.ip,
      });
      next();
    });

    logger.info("Middleware setup complete");
  }

  private setupRoutes(): void {
    logger.info("Setting up routes...");

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

    logger.info("Routes setup complete");
  }

  async start(): Promise<void> {
    try {
      logger.info(`Starting ${config.serviceName} v${config.version}...`);

      await this.initializeDependencies();
      this.setupMiddleware();
      this.setupRoutes();

      this.app.listen(config.port, () => {
        logger.info(`${config.serviceName} is running`, {
          port: config.port,
          environment: config.nodeEnv,
          version: config.version,
        });
      });
    } catch (error) {
      logger.fatal("Failed to start service", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      process.exit(1);
    }
  }

  async shutdown(): Promise<void> {
    logger.info("Shutting down gracefully...");

    try {
      if (this.eventBus) {
        await this.eventBus.disconnect();
        logger.info("EventBus disconnected");
      }

      if (this.optimizedSupabase) {
        await this.optimizedSupabase.close();
        logger.info("Supabase client closed");
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
}

// Create and start the application
const app = new BillingServiceApp();

// Handle shutdown signals
process.on("SIGTERM", () => app.shutdown());
process.on("SIGINT", () => app.shutdown());

// Start the service
app.start().catch((error) => {
  logger.fatal("Unhandled error during startup", {
    error: error instanceof Error ? error.message : "Unknown error",
  });
  process.exit(1);
});
