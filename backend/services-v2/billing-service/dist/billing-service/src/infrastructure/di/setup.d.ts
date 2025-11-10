/**
 * Dependency Injection Setup - Simplified for Academic Project
 * V2 Clean Architecture + DDD Implementation
 * Billing Service DI Container Configuration
 *
 * @author Hospital Management Team
 * @version 2.0.0 (Simplified)
 * @compliance Clean Architecture, DDD, Dependency Injection
 */
import { DIContainer } from "../../../../shared/infrastructure/di/container";
export declare const ServiceTokens: {
    readonly SUPABASE_CLIENT: "SupabaseClient";
    readonly LOGGER: "Logger";
    readonly AUDIT_SERVICE: "AuditService";
    readonly EVENT_BUS: "EventBus";
    readonly BILLING_REPOSITORY: "BillingRepository";
    readonly PAYOS_GATEWAY_SERVICE: "PayOSGatewayService";
    readonly PAYOS_INTEGRATION_SERVICE: "PayOSIntegrationService";
    readonly CREATE_INVOICE_USE_CASE: "CreateInvoiceUseCase";
    readonly GET_INVOICE_USE_CASE: "GetInvoiceUseCase";
    readonly GET_INVOICES_USE_CASE: "GetInvoicesUseCase";
    readonly FINALIZE_INVOICE_USE_CASE: "FinalizeInvoiceUseCase";
    readonly CANCEL_INVOICE_USE_CASE: "CancelInvoiceUseCase";
    readonly PROCESS_PAYMENT_USE_CASE: "ProcessPaymentUseCase";
    readonly REFUND_PAYMENT_USE_CASE: "RefundPaymentUseCase";
    readonly GET_PATIENT_PAYMENT_HISTORY_USE_CASE: "GetPatientPaymentHistoryUseCase";
    readonly GET_PATIENT_OUTSTANDING_BALANCE_USE_CASE: "GetPatientOutstandingBalanceUseCase";
    readonly VALIDATE_INSURANCE_USE_CASE: "ValidateInsuranceUseCase";
    readonly PROCESS_INSURANCE_CLAIM_USE_CASE: "ProcessInsuranceClaimUseCase";
    readonly CREATE_PAYOS_PAYMENT_LINK_USE_CASE: "CreatePayOSPaymentLinkUseCase";
    readonly HANDLE_PAYOS_WEBHOOK_USE_CASE: "HandlePayOSWebhookUseCase";
    readonly GET_PATIENT_INVOICES_USE_CASE: "GetPatientInvoicesUseCase";
    readonly GET_PATIENT_BILLING_SUMMARY_USE_CASE: "GetPatientBillingSummaryUseCase";
    readonly GET_BILLING_HISTORY_USE_CASE: "GetBillingHistoryUseCase";
    readonly GET_REVENUE_REPORT_USE_CASE: "GetRevenueReportUseCase";
    readonly SEARCH_INVOICES_USE_CASE: "SearchInvoicesUseCase";
    readonly GET_OVERDUE_INVOICES_USE_CASE: "GetOverdueInvoicesUseCase";
    readonly BILLING_COMMAND_HANDLERS: "BillingCommandHandlers";
    readonly BILLING_QUERY_HANDLERS: "BillingQueryHandlers";
    readonly BILLING_DOMAIN_EVENT_HANDLER: "BillingDomainEventHandler";
    readonly BILLING_EVENT_HANDLER: "BillingEventHandler";
    readonly BILLING_APPLICATION_SERVICE: "BillingApplicationService";
    readonly BILLING_CONTROLLER: "BillingController";
};
export declare function setupDependencies(container: DIContainer): void;
//# sourceMappingURL=setup.d.ts.map