/**
 * Dependency Injection Setup - Infrastructure Layer
 * V2 Clean Architecture + DDD Implementation
 * Billing Service DI Container Configuration
 *
 * @author Hospital Management Team
 * @version 2.0.0
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
    readonly PROCESS_PAYMENT_USE_CASE: "ProcessPaymentUseCase";
    readonly REFUND_PAYMENT_USE_CASE: "RefundPaymentUseCase";
    readonly GET_BILLING_HISTORY_USE_CASE: "GetBillingHistoryUseCase";
    readonly BILLING_COMMAND_HANDLERS: "BillingCommandHandlers";
    readonly BILLING_QUERY_HANDLERS: "BillingQueryHandlers";
    readonly BILLING_DOMAIN_EVENT_HANDLER: "BillingDomainEventHandler";
    readonly BILLING_EVENT_HANDLER: "BillingEventHandler";
    readonly BILLING_APPLICATION_SERVICE: "BillingApplicationService";
};
export declare function setupDependencies(container: DIContainer): void;
//# sourceMappingURL=setup.d.ts.map