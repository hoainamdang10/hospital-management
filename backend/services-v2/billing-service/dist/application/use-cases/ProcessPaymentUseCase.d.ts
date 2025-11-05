/**
 * ProcessPaymentUseCase - Application Layer
 * V2 Clean Architecture + DDD Implementation
 * Use case for processing payments for invoices with PayOS integration
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS, PayOS Integration, Vietnamese Healthcare Standards
 */
import { IBillingRepository } from '../../domain/repositories/IBillingRepository';
import { IEventBus } from '../../../../shared/events/event-bus.interface';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
import { PaymentMethod } from '../../domain/aggregates/BillingAggregate';
import { BaseHealthcareUseCase } from '../../../../shared/application/base/BaseHealthcareUseCase';
export interface ProcessPaymentRequest {
    invoiceId: string;
    amount: number;
    currency?: string;
    paymentMethod: PaymentMethod;
    transactionId?: string;
    notes?: string;
    processedBy: string;
    payosData?: {
        orderCode: string;
        paymentLinkId: string;
        checkoutUrl?: string;
        qrCode?: string;
        deepLink?: string;
        deepLinkWebApp?: string;
    };
    cardData?: {
        cardNumber?: string;
        cardType?: string;
        bankName?: string;
        authorizationCode?: string;
    };
    bankTransferData?: {
        bankCode?: string;
        bankName?: string;
        accountNumber?: string;
        transferReference?: string;
    };
}
export interface ProcessPaymentResponse {
    success: boolean;
    data?: {
        paymentId: string;
        invoiceId: string;
        amount: number;
        currency: string;
        paymentMethod: string;
        vietnamesePaymentMethod: string;
        transactionId?: string;
        processedAt: Date;
        processedBy: string;
        invoiceStatus: string;
        vietnameseInvoiceStatus: string;
        remainingAmount: number;
        totalPaidAmount: number;
        isFullyPaid: boolean;
        paymentBreakdown: {
            totalAmount: number;
            totalPaid: number;
            remainingAmount: number;
            paymentCount: number;
        };
        vietnameseSummary: string;
    };
    errors?: Array<{
        field: string;
        message: string;
    }>;
    message: string;
}
/**
 * Process Payment Use Case
 * Implements payment processing with PayOS integration and Vietnamese healthcare compliance
 */
export declare class ProcessPaymentUseCase extends BaseHealthcareUseCase<ProcessPaymentRequest, ProcessPaymentResponse> {
    private readonly billingRepository;
    private readonly eventBus;
    constructor(billingRepository: IBillingRepository, eventBus: IEventBus, logger: ILogger);
    /**
     * Execute payment processing
     */
    protected executeCore(request: ProcessPaymentRequest): Promise<ProcessPaymentResponse>;
    /**
     * Validate request
     */
    private validateRequest;
    /**
     * Get Vietnamese payment method display
     */
    private getVietnamesePaymentMethod;
    /**
     * Generate Vietnamese summary
     */
    private generateVietnameseSummary;
    /**
     * Validate PayOS data
     */
    private validatePayOSData;
    /**
     * Mask sensitive data
     */
    private maskCardNumber;
    /**
     * Mask account number
     */
    private maskAccountNumber;
    /**
     * Get payment category for analytics
     */
    private getPaymentCategory;
    /**
     * Generate payment receipt data
     */
    private generateReceiptData;
}
//# sourceMappingURL=ProcessPaymentUseCase.d.ts.map