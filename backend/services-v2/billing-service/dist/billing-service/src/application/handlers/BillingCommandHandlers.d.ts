/**
 * BillingCommandHandlers - Simplified for Academic Project
 * CQRS command handlers for billing operations
 * Reduced from 40+ handlers to 15 core handlers
 *
 * @author Hospital Management Team
 * @version 2.0.0 (Simplified)
 * @compliance Clean Architecture, CQRS, DDD, Vietnamese Healthcare Standards
 */
import { CreateInvoiceUseCase, CreateInvoiceRequest, CreateInvoiceResponse } from '../use-cases/CreateInvoiceUseCase';
import { ProcessPaymentUseCase, ProcessPaymentRequest, ProcessPaymentResponse } from '../use-cases/ProcessPaymentUseCase';
import { RefundPaymentUseCase, RefundPaymentRequest, RefundPaymentResponse } from '../use-cases/RefundPaymentUseCase';
import { IBillingRepository } from '../../domain/repositories/IBillingRepository';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
import { IEventBus } from '../../../../shared/events/event-bus.interface';
export interface CreateInvoiceCommand extends CreateInvoiceRequest {
    commandId?: string;
    timestamp?: Date;
    userId?: string;
}
export interface ProcessPaymentCommand extends ProcessPaymentRequest {
    commandId?: string;
    timestamp?: Date;
    userId?: string;
}
export interface RefundPaymentCommand extends RefundPaymentRequest {
    commandId?: string;
    timestamp?: Date;
    userId?: string;
}
export interface CancelInvoiceCommand {
    invoiceId: string;
    reason: string;
    cancelledBy: string;
    commandId?: string;
    timestamp?: Date;
    userId?: string;
}
export interface ProcessInsuranceClaimCommand {
    invoiceId: string;
    action: 'submit' | 'approve' | 'reject';
    processedBy: string;
    approvedAmount?: number;
    rejectionReason?: string;
    notes?: string;
    commandId?: string;
    timestamp?: Date;
    userId?: string;
}
export interface CancelInvoiceResponse {
    success: boolean;
    message: string;
    data?: {
        invoiceId: string;
        cancelledAt: Date;
        reason: string;
    };
    errors?: Array<{
        field: string;
        message: string;
        code: string;
    }>;
}
/**
 * Billing Command Handlers (Simplified)
 * 15 core handlers for academic project
 */
export declare class BillingCommandHandlers {
    private readonly createInvoiceUseCase;
    private readonly processPaymentUseCase;
    private readonly refundPaymentUseCase;
    private readonly billingRepository;
    private readonly eventBus;
    private readonly logger;
    private readonly getInvoiceUseCase;
    private readonly getInvoicesUseCase;
    private readonly finalizeInvoiceUseCase;
    private readonly cancelInvoiceUseCase;
    private readonly searchInvoicesUseCase;
    private readonly getOverdueInvoicesUseCase;
    private readonly getPatientBillingSummaryUseCase;
    private readonly processInsuranceClaimUseCase;
    private readonly validateInsuranceUseCase;
    private readonly getRevenueReportUseCase;
    private readonly getBillingHistoryUseCase;
    private readonly getPatientInvoicesUseCase;
    private readonly getPatientPaymentHistoryUseCase;
    private readonly getPatientOutstandingBalanceUseCase;
    private readonly createPayOSPaymentLinkUseCase;
    private readonly handlePayOSWebhookUseCase;
    constructor(createInvoiceUseCase: CreateInvoiceUseCase, processPaymentUseCase: ProcessPaymentUseCase, refundPaymentUseCase: RefundPaymentUseCase, billingRepository: IBillingRepository, eventBus: IEventBus, logger: ILogger);
    /**
     * 1. Create invoice
     */
    handleCreateInvoice(command: CreateInvoiceCommand): Promise<CreateInvoiceResponse>;
    /**
     * 2. Get invoice by ID
     */
    getInvoice(invoiceId: string): Promise<any>;
    /**
     * 3. Get invoices with filters
     */
    getInvoices(filters: any): Promise<any>;
    /**
     * 4. Finalize invoice
     */
    finalizeInvoice(invoiceId: string, finalizedBy: string): Promise<any>;
    /**
     * 5. Cancel invoice
     */
    handleCancelInvoice(command: CancelInvoiceCommand): Promise<CancelInvoiceResponse>;
    /**
     * 6. Process payment
     */
    handleProcessPayment(command: ProcessPaymentCommand): Promise<ProcessPaymentResponse>;
    /**
     * 7. Process refund
     */
    handleRefundPayment(command: RefundPaymentCommand): Promise<RefundPaymentResponse>;
    /**
     * 8. Get patient payment history
     */
    getPatientPaymentHistory(filters: any): Promise<any>;
    /**
     * 9. Get patient outstanding balance
     */
    getPatientOutstandingBalance(patientId: string): Promise<any>;
    /**
     * 10. Validate insurance
     */
    validateInsurance(data: any): Promise<any>;
    /**
     * 11. Process insurance claim (submit/approve/reject)
     */
    handleProcessInsuranceClaim(command: ProcessInsuranceClaimCommand): Promise<any>;
    /**
     * 12. Create PayOS payment link
     */
    createPayOSPaymentLink(data: {
        invoiceId: string;
        returnUrl: string;
        cancelUrl: string;
    }): Promise<any>;
    /**
     * 13. Handle PayOS webhook
     */
    handlePayOSWebhook(webhookData: any): Promise<any>;
    /**
     * 14. Get patient invoices
     */
    getPatientInvoices(filters: any): Promise<any>;
    /**
     * 15. Get patient billing summary
     */
    getPatientBillingSummary(patientId: string): Promise<any>;
    /**
     * 16. Get revenue report
     */
    getRevenueReport(filters: any): Promise<any>;
    /**
     * 17. Get billing history
     */
    getBillingHistory(filters: any): Promise<any>;
    /**
     * 18. Search invoices
     */
    searchInvoices(criteria: any): Promise<any>;
    /**
     * 19. Get overdue invoices
     */
    getOverdueInvoices(filters: any): Promise<any>;
}
//# sourceMappingURL=BillingCommandHandlers.d.ts.map