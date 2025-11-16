"use strict";
/**
 * Billing Service V2 - Main Application
 * Simplified Clean Architecture + DDD + CQRS
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const compression_1 = __importDefault(require("compression"));
// Infrastructure
const optimized_supabase_client_1 = require("../../shared/infrastructure/database/optimized-supabase-client");
const EventBus_1 = require("../../shared/infrastructure/event-bus/EventBus");
const SupabaseInvoiceRepository_1 = require("./infrastructure/repositories/SupabaseInvoiceRepository");
const SupabasePatientRepository_1 = require("./infrastructure/repositories/SupabasePatientRepository");
// Application
const CreateInvoiceUseCase_1 = require("./application/use-cases/CreateInvoiceUseCase");
const GetInvoiceUseCase_1 = require("./application/use-cases/GetInvoiceUseCase");
// REMOVED (Phase 1 Out-of-Scope): FinalizeInvoiceUseCase, CancelInvoiceUseCase
const ProcessPaymentUseCase_1 = require("./application/use-cases/ProcessPaymentUseCase");
const GetPatientInvoicesUseCase_1 = require("./application/use-cases/GetPatientInvoicesUseCase");
// REMOVED (Phase 1 Out-of-Scope): ProcessInsuranceClaimUseCase, RefundPaymentUseCase
const SearchInvoicesUseCase_1 = require("./application/use-cases/SearchInvoicesUseCase");
const GetOverdueInvoicesUseCase_1 = require("./application/use-cases/GetOverdueInvoicesUseCase");
const GetPatientBillingSummaryUseCase_1 = require("./application/use-cases/GetPatientBillingSummaryUseCase");
const GetRevenueReportUseCase_1 = require("./application/use-cases/GetRevenueReportUseCase");
const CreatePayOSPaymentLinkUseCase_1 = require("./application/use-cases/CreatePayOSPaymentLinkUseCase");
const HandlePayOSWebhookUseCase_1 = require("./application/use-cases/HandlePayOSWebhookUseCase");
// REMOVED: SendInvoiceEmailUseCase, CreatePaymentReminderUseCase - Out of scope for Phase 1
const PayOSIntegrationService_1 = require("./infrastructure/services/PayOSIntegrationService");
const BillingService_1 = require("./application/services/BillingService");
// Event Consumers
const AppointmentEventConsumer_1 = require("./infrastructure/events/AppointmentEventConsumer");
const ClinicalEventConsumer_1 = require("./infrastructure/events/ClinicalEventConsumer");
const logger_1 = require("./infrastructure/logging/logger");
// Presentation
const InvoiceController_1 = require("./presentation/controllers/InvoiceController");
const invoiceRoutes_1 = require("./presentation/routes/invoiceRoutes");
const healthRoutes_1 = require("./presentation/routes/healthRoutes");
const ErrorHandlingMiddleware_1 = require("./presentation/middleware/ErrorHandlingMiddleware");
const AuthenticationMiddleware_1 = require("./presentation/middleware/AuthenticationMiddleware");
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
    allowedOrigins: (process.env.ALLOWED_ORIGINS || "http://localhost:3000").split(","),
    identityServiceUrl: process.env.IDENTITY_SERVICE_URL || "http://localhost:3021",
    payosClientId: process.env.PAYOS_CLIENT_ID || "",
    payosApiKey: process.env.PAYOS_API_KEY || "",
    payosChecksumKey: process.env.PAYOS_CHECKSUM_KEY || "",
    // Feature Flags
    enableClinicalEventConsumer: process.env.ENABLE_CLINICAL_CONSUMER === "true", // Phase 1: Disabled by default
};
// Logger is imported from ./infrastructure/logging/logger
class BillingServiceApp {
    constructor() {
        this.app = (0, express_1.default)();
    }
    async initializeDependencies() {
        logger_1.logger.info("Initializing dependencies...");
        // Validate configuration
        if (!config.supabaseUrl || !config.supabaseKey) {
            throw new Error("Missing required environment variables");
        }
        // Initialize EventBus
        this.eventBus = new EventBus_1.RabbitMQEventBus({
            rabbitmqUrl: config.rabbitmqUrl,
            exchangeName: config.rabbitmqExchange,
            serviceName: config.serviceName,
        });
        await this.eventBus.connect();
        logger_1.logger.info("EventBus initialized");
        // Initialize Supabase
        this.optimizedSupabase = (0, optimized_supabase_client_1.createOptimizedSupabaseClient)({
            supabaseUrl: config.supabaseUrl,
            supabaseServiceKey: config.supabaseKey,
            serviceName: config.serviceName,
            schemaName: "billing_schema",
            enableOptimizations: config.nodeEnv !== "test",
        });
        // Initialize Repository
        this.invoiceRepository = new SupabaseInvoiceRepository_1.SupabaseInvoiceRepository(this.optimizedSupabase);
        this.patientRepository = new SupabasePatientRepository_1.SupabasePatientRepository(this.optimizedSupabase, logger_1.logger);
        // Initialize PayOS Service
        this.payosService = new PayOSIntegrationService_1.PayOSIntegrationService({
            clientId: config.payosClientId,
            apiKey: config.payosApiKey,
            checksumKey: config.payosChecksumKey,
        }, logger_1.logger);
        // Initialize Use Cases
        this.createInvoiceUseCase = new CreateInvoiceUseCase_1.CreateInvoiceUseCase(this.invoiceRepository, this.eventBus, logger_1.logger);
        this.getInvoiceUseCase = new GetInvoiceUseCase_1.GetInvoiceUseCase(this.invoiceRepository, logger_1.logger);
        // REMOVED (Phase 1 Out-of-Scope): finalizeInvoiceUseCase, cancelInvoiceUseCase initialization
        this.processPaymentUseCase = new ProcessPaymentUseCase_1.ProcessPaymentUseCase(this.invoiceRepository, this.eventBus, logger_1.logger);
        this.getPatientInvoicesUseCase = new GetPatientInvoicesUseCase_1.GetPatientInvoicesUseCase(this.invoiceRepository, logger_1.logger);
        // REMOVED (Phase 1 Out-of-Scope): processInsuranceClaimUseCase, refundPaymentUseCase initialization
        this.searchInvoicesUseCase = new SearchInvoicesUseCase_1.SearchInvoicesUseCase(this.invoiceRepository, logger_1.logger);
        this.getOverdueInvoicesUseCase = new GetOverdueInvoicesUseCase_1.GetOverdueInvoicesUseCase(this.invoiceRepository, logger_1.logger);
        this.getPatientBillingSummaryUseCase = new GetPatientBillingSummaryUseCase_1.GetPatientBillingSummaryUseCase(this.invoiceRepository, logger_1.logger);
        this.getRevenueReportUseCase = new GetRevenueReportUseCase_1.GetRevenueReportUseCase(this.invoiceRepository, logger_1.logger);
        this.createPayOSPaymentLinkUseCase = new CreatePayOSPaymentLinkUseCase_1.CreatePayOSPaymentLinkUseCase(this.invoiceRepository, this.payosService, logger_1.logger);
        this.handlePayOSWebhookUseCase = new HandlePayOSWebhookUseCase_1.HandlePayOSWebhookUseCase(this.invoiceRepository, this.eventBus, this.payosService, logger_1.logger);
        // REMOVED: sendInvoiceEmailUseCase, createPaymentReminderUseCase initialization - Out of scope for Phase 1
        // Initialize Billing Service
        this.billingService = new BillingService_1.BillingService(this.invoiceRepository, this.patientRepository, this.createInvoiceUseCase, this.processPaymentUseCase, logger_1.logger);
        // Initialize Event Consumers
        this.appointmentEventConsumer = new AppointmentEventConsumer_1.AppointmentEventConsumer({
            rabbitmqUrl: config.rabbitmqUrl,
            queueName: 'billing.appointment.events',
            exchangeName: 'hospital.events',
            routingKeys: [
                'appointment.scheduled', // Phase 1 (Prepaid): Create invoice when appointment is scheduled
                'appointment.cancelled_late', // Cancel invoice if not paid yet
                'appointment.no_show', // Future: Apply no-show fee
            ],
            prefetchCount: 10,
            retryAttempts: 3,
            retryDelayMs: 1000,
        }, logger_1.logger, this.billingService, this.invoiceRepository, this.patientRepository, this.createPayOSPaymentLinkUseCase, // Inject PayOS use case for automatic payment link creation
        this.eventBus);
        // Initialize Clinical Event Consumer (Feature Flag)
        // Phase 1: Disabled by default - only prepaid appointment billing is in scope
        // Set ENABLE_CLINICAL_CONSUMER=true to enable post-service billing features
        if (config.enableClinicalEventConsumer) {
            this.clinicalEventConsumer = new ClinicalEventConsumer_1.ClinicalEventConsumer({
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
            }, logger_1.logger, this.billingService, this.invoiceRepository, this.patientRepository);
            logger_1.logger.info('Clinical event consumer initialized (feature flag enabled)');
        }
        else {
            logger_1.logger.info('Clinical event consumer disabled (Phase 1 scope - prepaid only)');
        }
        // Initialize Controllers - Phase 1 (Prepaid Model)
        this.invoiceController = new InvoiceController_1.InvoiceController(this.createInvoiceUseCase, this.getInvoiceUseCase, this.processPaymentUseCase, this.getPatientInvoicesUseCase, this.searchInvoicesUseCase, this.getOverdueInvoicesUseCase, this.getPatientBillingSummaryUseCase, this.getRevenueReportUseCase, this.createPayOSPaymentLinkUseCase, this.handlePayOSWebhookUseCase
        // REMOVED (Phase 1 Out-of-Scope): finalizeInvoiceUseCase, cancelInvoiceUseCase, processInsuranceClaimUseCase, refundPaymentUseCase, sendInvoiceEmailUseCase, createPaymentReminderUseCase
        );
        // Initialize Middleware
        this.errorHandlingMiddleware = new ErrorHandlingMiddleware_1.ErrorHandlingMiddleware(logger_1.logger);
        this.authMiddleware = new AuthenticationMiddleware_1.AuthenticationMiddleware({
            identityServiceUrl: config.identityServiceUrl,
            logger: logger_1.logger,
            skipPaths: ["/health"],
        });
        logger_1.logger.info("Dependencies initialized successfully");
    }
    setupMiddleware() {
        logger_1.logger.info("Setting up middleware...");
        // Security
        this.app.use((0, helmet_1.default)());
        // CORS
        this.app.use((0, cors_1.default)({
            origin: config.allowedOrigins,
            credentials: true,
            methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            allowedHeaders: ["Content-Type", "Authorization"],
        }));
        // Compression
        this.app.use((0, compression_1.default)());
        // Body parsing
        this.app.use(express_1.default.json({ limit: "10mb" }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
        // Rate limiting
        if (process.env.NODE_ENV !== "test") {
            const limiter = (0, express_rate_limit_1.default)({
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
            logger_1.logger.info("Incoming request", {
                method: req.method,
                path: req.path,
                ip: req.ip,
            });
            next();
        });
        logger_1.logger.info("Middleware setup complete");
    }
    setupRoutes() {
        logger_1.logger.info("Setting up routes...");
        // Health routes
        const healthRoutes = (0, healthRoutes_1.createHealthRoutes)();
        this.app.use("/", healthRoutes);
        // API routes with authentication
        const invoiceRoutes = (0, invoiceRoutes_1.createInvoiceRoutes)(this.invoiceController);
        this.app.use("/api/v1/invoices", this.authMiddleware.authenticate, invoiceRoutes);
        // 404 handler
        this.app.use(this.errorHandlingMiddleware.notFound());
        // Error handling middleware (must be last)
        this.app.use(this.errorHandlingMiddleware.handle());
        logger_1.logger.info("Routes setup complete");
    }
    async start() {
        try {
            logger_1.logger.info(`Starting ${config.serviceName} v${config.version}...`);
            await this.initializeDependencies();
            this.setupMiddleware();
            this.setupRoutes();
            // Connect Event Consumers
            await this.appointmentEventConsumer.connect();
            // Only connect clinical consumer if feature flag is enabled
            if (config.enableClinicalEventConsumer && this.clinicalEventConsumer) {
                await this.clinicalEventConsumer.connect();
                logger_1.logger.info('Clinical event consumer connected');
            }
            logger_1.logger.info('Event consumers connected');
            this.app.listen(config.port, () => {
                logger_1.logger.info(`${config.serviceName} is running`, {
                    port: config.port,
                    environment: config.nodeEnv,
                    version: config.version,
                });
            });
        }
        catch (error) {
            logger_1.logger.fatal("Failed to start service", {
                error: error instanceof Error ? error.message : "Unknown error",
            });
            process.exit(1);
        }
    }
    async shutdown() {
        logger_1.logger.info("Shutting down gracefully...");
        try {
            // Disconnect event consumers first
            if (this.appointmentEventConsumer) {
                await this.appointmentEventConsumer.disconnect();
                logger_1.logger.info("Appointment event consumer disconnected");
            }
            if (this.clinicalEventConsumer && config.enableClinicalEventConsumer) {
                await this.clinicalEventConsumer.disconnect();
                logger_1.logger.info("Clinical event consumer disconnected");
            }
            if (this.eventBus) {
                await this.eventBus.disconnect();
                logger_1.logger.info("EventBus disconnected");
            }
            if (this.optimizedSupabase) {
                await this.optimizedSupabase.close();
                logger_1.logger.info("Supabase client closed");
            }
            logger_1.logger.info("Graceful shutdown complete");
            process.exit(0);
        }
        catch (error) {
            logger_1.logger.error("Error during shutdown", {
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
    logger_1.logger.fatal("Unhandled error during startup", {
        error: error instanceof Error ? error.message : "Unknown error",
    });
    process.exit(1);
});
//# sourceMappingURL=main.js.map