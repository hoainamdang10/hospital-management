/**
 * BillingApplicationService - Application Service Layer
 * V2 Clean Architecture + DDD Implementation
 * Orchestrates billing operations with PayOS integration and Vietnamese healthcare compliance
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS, Vietnamese Healthcare Standards, PayOS Integration
 */
import { CreateInvoiceUseCase, CreateInvoiceRequest, CreateInvoiceResponse } from '../use-cases/CreateInvoiceUseCase';
import { ProcessPaymentUseCase, ProcessPaymentRequest, ProcessPaymentResponse } from '../use-cases/ProcessPaymentUseCase';
import { RefundPaymentUseCase, RefundPaymentRequest, RefundPaymentResponse } from '../use-cases/RefundPaymentUseCase';
import { GetBillingHistoryUseCase, GetBillingHistoryRequest, GetBillingHistoryResponse } from '../use-cases/GetBillingHistoryUseCase';
import { BillingCommandHandlers } from '../handlers/BillingCommandHandlers';
import { BillingQueryHandlers } from '../handlers/BillingQueryHandlers';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
import { PayOSIntegrationService } from './PayOSIntegrationService';
export interface BillingApplicationServiceConfig {
    createInvoiceUseCase: CreateInvoiceUseCase;
    processPaymentUseCase: ProcessPaymentUseCase;
    refundPaymentUseCase: RefundPaymentUseCase;
    getBillingHistoryUseCase: GetBillingHistoryUseCase;
    commandHandlers: BillingCommandHandlers;
    queryHandlers: BillingQueryHandlers;
    payosService: PayOSIntegrationService;
    logger: ILogger;
}
/**
 * Billing Application Service
 * Orchestrates all billing operations with Vietnamese healthcare compliance
 */
export declare class BillingApplicationService {
    private readonly createInvoiceUseCase;
    private readonly processPaymentUseCase;
    private readonly refundPaymentUseCase;
    private readonly getBillingHistoryUseCase;
    private readonly commandHandlers;
    private readonly queryHandlers;
    private readonly payosService;
    private readonly logger;
    constructor(config: BillingApplicationServiceConfig);
    /**
     * Create new invoice
     */
    createInvoice(request: CreateInvoiceRequest, userId?: string): Promise<CreateInvoiceResponse>;
    /**
     * Get invoice details
     */
    getInvoice(invoiceId: string, options?: {
        includePaymentHistory?: boolean;
        includeRefundHistory?: boolean;
    }, userId?: string): Promise<import("../handlers/BillingQueryHandlers").GetInvoiceResponse>;
    /**
     * Cancel invoice
     */
    cancelInvoice(invoiceId: string, reason: string, cancelledBy: string, userId?: string): Promise<import("../handlers/BillingCommandHandlers").CancelInvoiceResponse>;
    /**
     * Process payment with PayOS integration
     */
    processPayment(request: ProcessPaymentRequest, userId?: string): Promise<ProcessPaymentResponse>;
    /**
     * Process refund
     */
    processRefund(request: RefundPaymentRequest, userId?: string): Promise<RefundPaymentResponse>;
    /**
     * Get billing history
     */
    getBillingHistory(request: GetBillingHistoryRequest, userId?: string): Promise<GetBillingHistoryResponse>;
    /**
     * Get overdue invoices
     */
    getOverdueInvoices(options?: {
        daysOverdue?: number;
        minimumAmount?: number;
        patientId?: string;
        doctorId?: string;
        page?: number;
        pageSize?: number;
    }, userId?: string): Promise<import("../handlers/BillingQueryHandlers").GetOverdueInvoicesResponse>;
    /**
     * Create multiple invoices
     */
    createBulkInvoices(invoices: CreateInvoiceRequest[], createdBy: string, userId?: string): Promise<any>;
    /**
     * Process BHYT insurance claim
     */
    processBHYTClaim(invoiceId: string, bhytData: {
        cardNumber: string;
        validFrom: Date;
        validTo: Date;
        hospitalCode: string;
        beneficiaryType: string;
    }, processedBy: string, userId?: string): Promise<ProcessPaymentResponse | {
        success: boolean;
        message: string;
    }>;
    /**
     * Calculate BHYT coverage percentage based on beneficiary type
     */
    private calculateBHYTCoverage;
    /**
     * Get service health status
     */
    getHealthStatus(): Promise<{
        status: 'healthy' | 'unhealthy';
        services: Record<string, boolean>;
        timestamp: Date;
    }>;
}
//# sourceMappingURL=BillingApplicationService.d.ts.map