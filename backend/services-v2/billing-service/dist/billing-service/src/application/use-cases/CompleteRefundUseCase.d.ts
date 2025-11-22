import { IInvoiceRepository } from '../../domain/repositories/IInvoiceRepository';
import { IEventBus } from '../../../../shared/infrastructure/event-bus/EventBus';
import { ILogger } from '../../../../shared/application/services/logger.interface';
export interface CompleteRefundRequest {
    invoiceId: string;
    refundPaymentId: string;
    gatewayRefundId?: string;
}
export interface CompleteRefundResponse {
    success: boolean;
    message: string;
    invoiceId?: string;
    refundPaymentId?: string;
    errors?: string[];
}
/**
 * CompleteRefundUseCase
 *
 * Called by:
 * - RefundGatewayWorker (after calling PayOS/VNPAY API)
 * - RefundWebhookHandler (when gateway sends callback)
 *
 * Responsibilities:
 * - Find invoice by ID
 * - Call invoice.completeRefund()
 * - Save invoice (will emit PaymentRefundedEvent)
 * - Publish domain events
 */
export declare class CompleteRefundUseCase {
    private readonly invoiceRepository;
    private readonly eventBus;
    private readonly logger;
    constructor(invoiceRepository: IInvoiceRepository, eventBus: IEventBus, logger: ILogger);
    execute(request: CompleteRefundRequest): Promise<CompleteRefundResponse>;
}
//# sourceMappingURL=CompleteRefundUseCase.d.ts.map