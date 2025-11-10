"use strict";
/**
 * Dependency Injection Setup - Simplified for Academic Project
 * V2 Clean Architecture + DDD Implementation
 * Billing Service DI Container Configuration
 *
 * @author Hospital Management Team
 * @version 2.0.0 (Simplified)
 * @compliance Clean Architecture, DDD, Dependency Injection
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceTokens = void 0;
exports.setupDependencies = setupDependencies;
const optimized_supabase_client_1 = require("../../../../shared/infrastructure/database/optimized-supabase-client");
const container_1 = require("../../../../shared/infrastructure/di/container");
const console_logger_1 = require("../../../../shared/infrastructure/logging/console-logger");
const audit_service_1 = require("../../../../shared/infrastructure/services/audit.service");
// Application Layer - Core Use Cases (24 use cases)
const BillingApplicationService_1 = require("../../application/services/BillingApplicationService");
const CreateInvoiceUseCase_1 = require("../../application/use-cases/CreateInvoiceUseCase");
const GetInvoiceUseCase_1 = require("../../application/use-cases/GetInvoiceUseCase");
const GetInvoicesUseCase_1 = require("../../application/use-cases/GetInvoicesUseCase");
const FinalizeInvoiceUseCase_1 = require("../../application/use-cases/FinalizeInvoiceUseCase");
const CancelInvoiceUseCase_1 = require("../../application/use-cases/CancelInvoiceUseCase");
const ProcessPaymentUseCase_1 = require("../../application/use-cases/ProcessPaymentUseCase");
const RefundPaymentUseCase_1 = require("../../application/use-cases/RefundPaymentUseCase");
const GetPatientPaymentHistoryUseCase_1 = require("../../application/use-cases/GetPatientPaymentHistoryUseCase");
const GetPatientOutstandingBalanceUseCase_1 = require("../../application/use-cases/GetPatientOutstandingBalanceUseCase");
const ValidateInsuranceUseCase_1 = require("../../application/use-cases/ValidateInsuranceUseCase");
const ProcessInsuranceClaimUseCase_1 = require("../../application/use-cases/ProcessInsuranceClaimUseCase");
const CreatePayOSPaymentLinkUseCase_1 = require("../../application/use-cases/CreatePayOSPaymentLinkUseCase");
const HandlePayOSWebhookUseCase_1 = require("../../application/use-cases/HandlePayOSWebhookUseCase");
const GetPatientInvoicesUseCase_1 = require("../../application/use-cases/GetPatientInvoicesUseCase");
const GetPatientBillingSummaryUseCase_1 = require("../../application/use-cases/GetPatientBillingSummaryUseCase");
const GetBillingHistoryUseCase_1 = require("../../application/use-cases/GetBillingHistoryUseCase");
const GetRevenueReportUseCase_1 = require("../../application/use-cases/GetRevenueReportUseCase");
const SearchInvoicesUseCase_1 = require("../../application/use-cases/SearchInvoicesUseCase");
const GetOverdueInvoicesUseCase_1 = require("../../application/use-cases/GetOverdueInvoicesUseCase");
// Handlers
const BillingCommandHandlers_1 = require("../../application/handlers/BillingCommandHandlers");
const BillingQueryHandlers_1 = require("../../application/handlers/BillingQueryHandlers");
const PayOSIntegrationService_1 = require("../../application/services/PayOSIntegrationService");
// Infrastructure Layer
const SupabaseBillingRepository_1 = require("../persistence/SupabaseBillingRepository");
const PayOSGatewayService_1 = require("../external/PayOSGatewayService");
const SupabaseEventBus_1 = require("../messaging/SupabaseEventBus");
const BillingDomainEventHandler_1 = require("../events/BillingDomainEventHandler");
const BillingEventHandler_1 = require("../events/BillingEventHandler");
// Service Tokens (Simplified - 24 core use cases)
exports.ServiceTokens = {
    // Infrastructure
    SUPABASE_CLIENT: "SupabaseClient",
    LOGGER: "Logger",
    AUDIT_SERVICE: "AuditService",
    EVENT_BUS: "EventBus",
    // Repositories
    BILLING_REPOSITORY: "BillingRepository",
    // External Services
    PAYOS_GATEWAY_SERVICE: "PayOSGatewayService",
    PAYOS_INTEGRATION_SERVICE: "PayOSIntegrationService",
    // Invoice Management Use Cases (5)
    CREATE_INVOICE_USE_CASE: "CreateInvoiceUseCase",
    GET_INVOICE_USE_CASE: "GetInvoiceUseCase",
    GET_INVOICES_USE_CASE: "GetInvoicesUseCase",
    FINALIZE_INVOICE_USE_CASE: "FinalizeInvoiceUseCase",
    CANCEL_INVOICE_USE_CASE: "CancelInvoiceUseCase",
    // Payment Processing Use Cases (4)
    PROCESS_PAYMENT_USE_CASE: "ProcessPaymentUseCase",
    REFUND_PAYMENT_USE_CASE: "RefundPaymentUseCase",
    GET_PATIENT_PAYMENT_HISTORY_USE_CASE: "GetPatientPaymentHistoryUseCase",
    GET_PATIENT_OUTSTANDING_BALANCE_USE_CASE: "GetPatientOutstandingBalanceUseCase",
    // Insurance Use Cases (2)
    VALIDATE_INSURANCE_USE_CASE: "ValidateInsuranceUseCase",
    PROCESS_INSURANCE_CLAIM_USE_CASE: "ProcessInsuranceClaimUseCase",
    // PayOS Integration Use Cases (2)
    CREATE_PAYOS_PAYMENT_LINK_USE_CASE: "CreatePayOSPaymentLinkUseCase",
    HANDLE_PAYOS_WEBHOOK_USE_CASE: "HandlePayOSWebhookUseCase",
    // Patient Billing Use Cases (2)
    GET_PATIENT_INVOICES_USE_CASE: "GetPatientInvoicesUseCase",
    GET_PATIENT_BILLING_SUMMARY_USE_CASE: "GetPatientBillingSummaryUseCase",
    // Reports Use Cases (2)
    GET_BILLING_HISTORY_USE_CASE: "GetBillingHistoryUseCase",
    GET_REVENUE_REPORT_USE_CASE: "GetRevenueReportUseCase",
    // Search & Filters Use Cases (2)
    SEARCH_INVOICES_USE_CASE: "SearchInvoicesUseCase",
    GET_OVERDUE_INVOICES_USE_CASE: "GetOverdueInvoicesUseCase",
    // Handlers
    BILLING_COMMAND_HANDLERS: "BillingCommandHandlers",
    BILLING_QUERY_HANDLERS: "BillingQueryHandlers",
    // Event Handlers
    BILLING_DOMAIN_EVENT_HANDLER: "BillingDomainEventHandler",
    BILLING_EVENT_HANDLER: "BillingEventHandler",
    // Application Services
    BILLING_APPLICATION_SERVICE: "BillingApplicationService",
    // Controllers
    BILLING_CONTROLLER: "BillingController",
};
function setupDependencies(container) {
    // =====================================================
    // INFRASTRUCTURE SERVICES
    // =====================================================
    container.register(exports.ServiceTokens.LOGGER, () => new console_logger_1.ConsoleLogger('billing-service'), container_1.ServiceLifetime.SINGLETON);
    container.register(exports.ServiceTokens.AUDIT_SERVICE, (container) => {
        const logger = container.resolve(exports.ServiceTokens.LOGGER);
        return new audit_service_1.AuditService({ logger });
    }, container_1.ServiceLifetime.SINGLETON);
    container.register(exports.ServiceTokens.SUPABASE_CLIENT, () => {
        const config = {
            supabaseUrl: process.env.SUPABASE_URL || "",
            supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
            serviceName: "billing-service",
            schemaName: "billing_schema",
            enableOptimizations: true,
        };
        return new optimized_supabase_client_1.OptimizedSupabaseClient(config);
    }, container_1.ServiceLifetime.SINGLETON);
    container.register(exports.ServiceTokens.EVENT_BUS, (container) => {
        const supabaseClient = container.resolve(exports.ServiceTokens.SUPABASE_CLIENT);
        const logger = container.resolve(exports.ServiceTokens.LOGGER);
        return new SupabaseEventBus_1.SupabaseEventBus({ supabase: supabaseClient, logger });
    }, container_1.ServiceLifetime.SCOPED);
    // =====================================================
    // REPOSITORIES
    // =====================================================
    container.register(exports.ServiceTokens.BILLING_REPOSITORY, (container) => {
        const supabaseClient = container.resolve(exports.ServiceTokens.SUPABASE_CLIENT);
        const logger = container.resolve(exports.ServiceTokens.LOGGER);
        const auditService = container.resolve(exports.ServiceTokens.AUDIT_SERVICE);
        return new SupabaseBillingRepository_1.SupabaseBillingRepository({
            supabase: supabaseClient,
            logger,
            auditService,
            schema: 'billing_schema',
            tableName: 'invoices'
        });
    }, container_1.ServiceLifetime.SCOPED);
    // =====================================================
    // EXTERNAL SERVICES
    // =====================================================
    container.register(exports.ServiceTokens.PAYOS_INTEGRATION_SERVICE, (container) => {
        const logger = container.resolve(exports.ServiceTokens.LOGGER);
        return new PayOSIntegrationService_1.PayOSIntegrationService(process.env.PAYOS_API_URL || 'https://api-merchant.payos.vn', process.env.PAYOS_CLIENT_ID || '', process.env.PAYOS_API_KEY || '', process.env.PAYOS_CHECKSUM_KEY || '');
    }, container_1.ServiceLifetime.SINGLETON);
    container.register(exports.ServiceTokens.PAYOS_GATEWAY_SERVICE, (container) => {
        const logger = container.resolve(exports.ServiceTokens.LOGGER);
        const auditService = container.resolve(exports.ServiceTokens.AUDIT_SERVICE);
        return new PayOSGatewayService_1.PayOSGatewayService({
            payosConfig: {
                apiUrl: process.env.PAYOS_API_URL || 'https://api-merchant.payos.vn',
                clientId: process.env.PAYOS_CLIENT_ID || '',
                apiKey: process.env.PAYOS_API_KEY || '',
                checksumKey: process.env.PAYOS_CHECKSUM_KEY || '',
                environment: (process.env.NODE_ENV === 'production' ? 'production' : 'sandbox'),
                webhookUrl: process.env.PAYOS_WEBHOOK_URL || '',
                returnUrl: process.env.PAYOS_RETURN_URL || '',
                cancelUrl: process.env.PAYOS_CANCEL_URL || ''
            },
            logger,
            auditService
        });
    }, container_1.ServiceLifetime.SCOPED);
    // =====================================================
    // INVOICE MANAGEMENT USE CASES (5)
    // =====================================================
    container.register(exports.ServiceTokens.CREATE_INVOICE_USE_CASE, (container) => {
        const repository = container.resolve(exports.ServiceTokens.BILLING_REPOSITORY);
        const eventBus = container.resolve(exports.ServiceTokens.EVENT_BUS);
        const logger = container.resolve(exports.ServiceTokens.LOGGER);
        return new CreateInvoiceUseCase_1.CreateInvoiceUseCase(repository, eventBus, logger);
    }, container_1.ServiceLifetime.TRANSIENT);
    container.register(exports.ServiceTokens.GET_INVOICE_USE_CASE, (container) => {
        const repository = container.resolve(exports.ServiceTokens.BILLING_REPOSITORY);
        const logger = container.resolve(exports.ServiceTokens.LOGGER);
        return new GetInvoiceUseCase_1.GetInvoiceUseCase(repository, logger);
    }, container_1.ServiceLifetime.TRANSIENT);
    container.register(exports.ServiceTokens.GET_INVOICES_USE_CASE, (container) => {
        const repository = container.resolve(exports.ServiceTokens.BILLING_REPOSITORY);
        const logger = container.resolve(exports.ServiceTokens.LOGGER);
        return new GetInvoicesUseCase_1.GetInvoicesUseCase(repository, logger);
    }, container_1.ServiceLifetime.TRANSIENT);
    container.register(exports.ServiceTokens.FINALIZE_INVOICE_USE_CASE, (container) => {
        const repository = container.resolve(exports.ServiceTokens.BILLING_REPOSITORY);
        const eventBus = container.resolve(exports.ServiceTokens.EVENT_BUS);
        const logger = container.resolve(exports.ServiceTokens.LOGGER);
        return new FinalizeInvoiceUseCase_1.FinalizeInvoiceUseCase(repository, eventBus, logger);
    }, container_1.ServiceLifetime.TRANSIENT);
    container.register(exports.ServiceTokens.CANCEL_INVOICE_USE_CASE, (container) => {
        const repository = container.resolve(exports.ServiceTokens.BILLING_REPOSITORY);
        const eventBus = container.resolve(exports.ServiceTokens.EVENT_BUS);
        const logger = container.resolve(exports.ServiceTokens.LOGGER);
        return new CancelInvoiceUseCase_1.CancelInvoiceUseCase(repository, eventBus, logger);
    }, container_1.ServiceLifetime.TRANSIENT);
    // =====================================================
    // PAYMENT PROCESSING USE CASES (4)
    // =====================================================
    container.register(exports.ServiceTokens.PROCESS_PAYMENT_USE_CASE, (container) => {
        const repository = container.resolve(exports.ServiceTokens.BILLING_REPOSITORY);
        const eventBus = container.resolve(exports.ServiceTokens.EVENT_BUS);
        const logger = container.resolve(exports.ServiceTokens.LOGGER);
        return new ProcessPaymentUseCase_1.ProcessPaymentUseCase(repository, eventBus, logger);
    }, container_1.ServiceLifetime.TRANSIENT);
    container.register(exports.ServiceTokens.REFUND_PAYMENT_USE_CASE, (container) => {
        const repository = container.resolve(exports.ServiceTokens.BILLING_REPOSITORY);
        const eventBus = container.resolve(exports.ServiceTokens.EVENT_BUS);
        const logger = container.resolve(exports.ServiceTokens.LOGGER);
        return new RefundPaymentUseCase_1.RefundPaymentUseCase(repository, eventBus, logger);
    }, container_1.ServiceLifetime.TRANSIENT);
    container.register(exports.ServiceTokens.GET_PATIENT_PAYMENT_HISTORY_USE_CASE, (container) => {
        const repository = container.resolve(exports.ServiceTokens.BILLING_REPOSITORY);
        const logger = container.resolve(exports.ServiceTokens.LOGGER);
        return new GetPatientPaymentHistoryUseCase_1.GetPatientPaymentHistoryUseCase(repository, logger);
    }, container_1.ServiceLifetime.TRANSIENT);
    container.register(exports.ServiceTokens.GET_PATIENT_OUTSTANDING_BALANCE_USE_CASE, (container) => {
        const repository = container.resolve(exports.ServiceTokens.BILLING_REPOSITORY);
        const logger = container.resolve(exports.ServiceTokens.LOGGER);
        return new GetPatientOutstandingBalanceUseCase_1.GetPatientOutstandingBalanceUseCase(repository, logger);
    }, container_1.ServiceLifetime.TRANSIENT);
    // =====================================================
    // INSURANCE USE CASES (2)
    // =====================================================
    container.register(exports.ServiceTokens.VALIDATE_INSURANCE_USE_CASE, (container) => {
        const logger = container.resolve(exports.ServiceTokens.LOGGER);
        return new ValidateInsuranceUseCase_1.ValidateInsuranceUseCase(logger);
    }, container_1.ServiceLifetime.TRANSIENT);
    container.register(exports.ServiceTokens.PROCESS_INSURANCE_CLAIM_USE_CASE, (container) => {
        const repository = container.resolve(exports.ServiceTokens.BILLING_REPOSITORY);
        const eventBus = container.resolve(exports.ServiceTokens.EVENT_BUS);
        const logger = container.resolve(exports.ServiceTokens.LOGGER);
        return new ProcessInsuranceClaimUseCase_1.ProcessInsuranceClaimUseCase(repository, eventBus, logger);
    }, container_1.ServiceLifetime.TRANSIENT);
    // =====================================================
    // PAYOS INTEGRATION USE CASES (2)
    // =====================================================
    container.register(exports.ServiceTokens.CREATE_PAYOS_PAYMENT_LINK_USE_CASE, (container) => {
        const repository = container.resolve(exports.ServiceTokens.BILLING_REPOSITORY);
        const logger = container.resolve(exports.ServiceTokens.LOGGER);
        return new CreatePayOSPaymentLinkUseCase_1.CreatePayOSPaymentLinkUseCase(repository, logger);
    }, container_1.ServiceLifetime.TRANSIENT);
    container.register(exports.ServiceTokens.HANDLE_PAYOS_WEBHOOK_USE_CASE, (container) => {
        const repository = container.resolve(exports.ServiceTokens.BILLING_REPOSITORY);
        const eventBus = container.resolve(exports.ServiceTokens.EVENT_BUS);
        const logger = container.resolve(exports.ServiceTokens.LOGGER);
        return new HandlePayOSWebhookUseCase_1.HandlePayOSWebhookUseCase(repository, eventBus, logger);
    }, container_1.ServiceLifetime.TRANSIENT);
    // =====================================================
    // PATIENT BILLING USE CASES (2)
    // =====================================================
    container.register(exports.ServiceTokens.GET_PATIENT_INVOICES_USE_CASE, (container) => {
        const repository = container.resolve(exports.ServiceTokens.BILLING_REPOSITORY);
        const logger = container.resolve(exports.ServiceTokens.LOGGER);
        return new GetPatientInvoicesUseCase_1.GetPatientInvoicesUseCase(repository, logger);
    }, container_1.ServiceLifetime.TRANSIENT);
    container.register(exports.ServiceTokens.GET_PATIENT_BILLING_SUMMARY_USE_CASE, (container) => {
        const repository = container.resolve(exports.ServiceTokens.BILLING_REPOSITORY);
        const logger = container.resolve(exports.ServiceTokens.LOGGER);
        return new GetPatientBillingSummaryUseCase_1.GetPatientBillingSummaryUseCase(repository, logger);
    }, container_1.ServiceLifetime.TRANSIENT);
    // =====================================================
    // REPORTS USE CASES (2)
    // =====================================================
    container.register(exports.ServiceTokens.GET_BILLING_HISTORY_USE_CASE, (container) => {
        const repository = container.resolve(exports.ServiceTokens.BILLING_REPOSITORY);
        const logger = container.resolve(exports.ServiceTokens.LOGGER);
        return new GetBillingHistoryUseCase_1.GetBillingHistoryUseCase(repository, logger);
    }, container_1.ServiceLifetime.TRANSIENT);
    container.register(exports.ServiceTokens.GET_REVENUE_REPORT_USE_CASE, (container) => {
        const repository = container.resolve(exports.ServiceTokens.BILLING_REPOSITORY);
        const logger = container.resolve(exports.ServiceTokens.LOGGER);
        return new GetRevenueReportUseCase_1.GetRevenueReportUseCase(repository, logger);
    }, container_1.ServiceLifetime.TRANSIENT);
    // =====================================================
    // SEARCH & FILTERS USE CASES (2)
    // =====================================================
    container.register(exports.ServiceTokens.SEARCH_INVOICES_USE_CASE, (container) => {
        const repository = container.resolve(exports.ServiceTokens.BILLING_REPOSITORY);
        const logger = container.resolve(exports.ServiceTokens.LOGGER);
        return new SearchInvoicesUseCase_1.SearchInvoicesUseCase(repository, logger);
    }, container_1.ServiceLifetime.TRANSIENT);
    container.register(exports.ServiceTokens.GET_OVERDUE_INVOICES_USE_CASE, (container) => {
        const repository = container.resolve(exports.ServiceTokens.BILLING_REPOSITORY);
        const logger = container.resolve(exports.ServiceTokens.LOGGER);
        return new GetOverdueInvoicesUseCase_1.GetOverdueInvoicesUseCase(repository, logger);
    }, container_1.ServiceLifetime.TRANSIENT);
    // =====================================================
    // HANDLERS
    // =====================================================
    container.register(exports.ServiceTokens.BILLING_COMMAND_HANDLERS, (container) => {
        const createUseCase = container.resolve(exports.ServiceTokens.CREATE_INVOICE_USE_CASE);
        const processPaymentUseCase = container.resolve(exports.ServiceTokens.PROCESS_PAYMENT_USE_CASE);
        const refundUseCase = container.resolve(exports.ServiceTokens.REFUND_PAYMENT_USE_CASE);
        const repository = container.resolve(exports.ServiceTokens.BILLING_REPOSITORY);
        const eventBus = container.resolve(exports.ServiceTokens.EVENT_BUS);
        const logger = container.resolve(exports.ServiceTokens.LOGGER);
        return new BillingCommandHandlers_1.BillingCommandHandlers(createUseCase, processPaymentUseCase, refundUseCase, repository, eventBus, logger);
    }, container_1.ServiceLifetime.SCOPED);
    container.register(exports.ServiceTokens.BILLING_QUERY_HANDLERS, (container) => {
        const getBillingHistoryUseCase = container.resolve(exports.ServiceTokens.GET_BILLING_HISTORY_USE_CASE);
        const repository = container.resolve(exports.ServiceTokens.BILLING_REPOSITORY);
        const logger = container.resolve(exports.ServiceTokens.LOGGER);
        return new BillingQueryHandlers_1.BillingQueryHandlers(getBillingHistoryUseCase, repository, logger);
    }, container_1.ServiceLifetime.SCOPED);
    // =====================================================
    // EVENT HANDLERS
    // =====================================================
    container.register(exports.ServiceTokens.BILLING_DOMAIN_EVENT_HANDLER, (container) => {
        const logger = container.resolve(exports.ServiceTokens.LOGGER);
        const auditService = container.resolve(exports.ServiceTokens.AUDIT_SERVICE);
        const eventBus = container.resolve(exports.ServiceTokens.EVENT_BUS);
        return new BillingDomainEventHandler_1.BillingDomainEventHandler({
            logger,
            auditService,
            eventBus
        });
    }, container_1.ServiceLifetime.SCOPED);
    container.register(exports.ServiceTokens.BILLING_EVENT_HANDLER, (container) => {
        const processPaymentUseCase = container.resolve(exports.ServiceTokens.PROCESS_PAYMENT_USE_CASE);
        const validateInsuranceUseCase = container.resolve(exports.ServiceTokens.VALIDATE_INSURANCE_USE_CASE);
        const logger = container.resolve(exports.ServiceTokens.LOGGER);
        return new BillingEventHandler_1.BillingEventHandler(null, // generateInvoiceUseCase removed
        processPaymentUseCase, validateInsuranceUseCase, logger);
    }, container_1.ServiceLifetime.SCOPED);
    // =====================================================
    // APPLICATION SERVICES
    // =====================================================
    container.register(exports.ServiceTokens.BILLING_APPLICATION_SERVICE, (container) => {
        const createUseCase = container.resolve(exports.ServiceTokens.CREATE_INVOICE_USE_CASE);
        const processPaymentUseCase = container.resolve(exports.ServiceTokens.PROCESS_PAYMENT_USE_CASE);
        const refundUseCase = container.resolve(exports.ServiceTokens.REFUND_PAYMENT_USE_CASE);
        const getBillingHistoryUseCase = container.resolve(exports.ServiceTokens.GET_BILLING_HISTORY_USE_CASE);
        const commandHandlers = container.resolve(exports.ServiceTokens.BILLING_COMMAND_HANDLERS);
        const queryHandlers = container.resolve(exports.ServiceTokens.BILLING_QUERY_HANDLERS);
        const payosService = container.resolve(exports.ServiceTokens.PAYOS_INTEGRATION_SERVICE);
        const logger = container.resolve(exports.ServiceTokens.LOGGER);
        return new BillingApplicationService_1.BillingApplicationService({
            createInvoiceUseCase: createUseCase,
            processPaymentUseCase,
            refundPaymentUseCase: refundUseCase,
            getBillingHistoryUseCase,
            commandHandlers,
            queryHandlers,
            payosService,
            logger
        });
    }, container_1.ServiceLifetime.SCOPED);
    // =====================================================
    // CONTROLLERS
    // =====================================================
    container.register(exports.ServiceTokens.BILLING_CONTROLLER, (container) => {
        const { BillingController } = require('../../presentation/controllers/BillingController');
        // Resolve all 19 use cases for controller
        const createInvoiceUseCase = container.resolve(exports.ServiceTokens.CREATE_INVOICE_USE_CASE);
        const processPaymentUseCase = container.resolve(exports.ServiceTokens.PROCESS_PAYMENT_USE_CASE);
        const refundPaymentUseCase = container.resolve(exports.ServiceTokens.REFUND_PAYMENT_USE_CASE);
        const getInvoiceUseCase = container.resolve(exports.ServiceTokens.GET_INVOICE_USE_CASE);
        const getInvoicesUseCase = container.resolve(exports.ServiceTokens.GET_INVOICES_USE_CASE);
        const finalizeInvoiceUseCase = container.resolve(exports.ServiceTokens.FINALIZE_INVOICE_USE_CASE);
        const cancelInvoiceUseCase = container.resolve(exports.ServiceTokens.CANCEL_INVOICE_USE_CASE);
        const searchInvoicesUseCase = container.resolve(exports.ServiceTokens.SEARCH_INVOICES_USE_CASE);
        const getOverdueInvoicesUseCase = container.resolve(exports.ServiceTokens.GET_OVERDUE_INVOICES_USE_CASE);
        const getBillingHistoryUseCase = container.resolve(exports.ServiceTokens.GET_BILLING_HISTORY_USE_CASE);
        const getPatientInvoicesUseCase = container.resolve(exports.ServiceTokens.GET_PATIENT_INVOICES_USE_CASE);
        const getPatientBillingSummaryUseCase = container.resolve(exports.ServiceTokens.GET_PATIENT_BILLING_SUMMARY_USE_CASE);
        const getPatientPaymentHistoryUseCase = container.resolve(exports.ServiceTokens.GET_PATIENT_PAYMENT_HISTORY_USE_CASE);
        const getPatientOutstandingBalanceUseCase = container.resolve(exports.ServiceTokens.GET_PATIENT_OUTSTANDING_BALANCE_USE_CASE);
        const validateInsuranceUseCase = container.resolve(exports.ServiceTokens.VALIDATE_INSURANCE_USE_CASE);
        const processInsuranceClaimUseCase = container.resolve(exports.ServiceTokens.PROCESS_INSURANCE_CLAIM_USE_CASE);
        const createPayOSPaymentLinkUseCase = container.resolve(exports.ServiceTokens.CREATE_PAYOS_PAYMENT_LINK_USE_CASE);
        const handlePayOSWebhookUseCase = container.resolve(exports.ServiceTokens.HANDLE_PAYOS_WEBHOOK_USE_CASE);
        const getRevenueReportUseCase = container.resolve(exports.ServiceTokens.GET_REVENUE_REPORT_USE_CASE);
        const logger = container.resolve(exports.ServiceTokens.LOGGER);
        return new BillingController({
            createInvoiceUseCase,
            processPaymentUseCase,
            refundPaymentUseCase,
            getInvoiceUseCase,
            getInvoicesUseCase,
            finalizeInvoiceUseCase,
            cancelInvoiceUseCase,
            searchInvoicesUseCase,
            getOverdueInvoicesUseCase,
            getBillingHistoryUseCase,
            getPatientInvoicesUseCase,
            getPatientBillingSummaryUseCase,
            getPatientPaymentHistoryUseCase,
            getPatientOutstandingBalanceUseCase,
            validateInsuranceUseCase,
            processInsuranceClaimUseCase,
            createPayOSPaymentLinkUseCase,
            handlePayOSWebhookUseCase,
            getRevenueReportUseCase,
            logger
        });
    }, container_1.ServiceLifetime.SCOPED);
}
//# sourceMappingURL=setup.js.map