/**
 * RefundPaymentUseCase - Application Layer
 * V2 Clean Architecture + DDD Implementation
 * Use case for processing payment refunds with Vietnamese healthcare compliance
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS, Vietnamese Healthcare Standards
 */
import { IBillingRepository } from '../../domain/repositories/IBillingRepository';
import { IEventBus } from '../../../../shared/events/event-bus.interface';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
import { PaymentMethod, InvoiceStatus } from '../../domain/aggregates/BillingAggregate';
import { BaseHealthcareUseCase } from '../../../../shared/application/base/BaseHealthcareUseCase';
export interface RefundPaymentRequest {
    invoiceId: string;
    refundAmount: number;
    refundReason: string;
    refundMethod: PaymentMethod;
    processedBy: string;
    notes?: string;
    refundToOriginalMethod?: boolean;
}
export interface RefundPaymentResponse {
    success: boolean;
    data?: {
        invoiceId: string;
        refundId: string;
        refundAmount: number;
        refundMethod: PaymentMethod;
        refundDate: Date;
        remainingBalance: number;
        status: InvoiceStatus;
    };
    message: string;
    errors?: Array<{
        field: string;
        message: string;
        code: string;
    }>;
}
/**
 * Refund Payment Use Case
 * Implements payment refund processing with Vietnamese healthcare compliance
 */
export declare class RefundPaymentUseCase extends BaseHealthcareUseCase<RefundPaymentRequest, RefundPaymentResponse> {
    private readonly billingRepository;
    private readonly eventBus;
    constructor(billingRepository: IBillingRepository, eventBus: IEventBus, logger: ILogger);
    /**
     * Execute payment refund
     */
    protected executeCore(request: RefundPaymentRequest): Promise<RefundPaymentResponse>;
    /**
     * Validate refund payment request
     */
    private validateRequest;
    /**
     * Validate refund eligibility
     */
    private validateRefundEligibility;
    /**
     * Generate unique refund ID
     */
    private generateRefundId;
}
//# sourceMappingURL=RefundPaymentUseCase.d.ts.map