import { BaseHealthcareUseCase } from '../../../../shared/application/base/base-healthcare-use-case';
import { IInvoiceRepository } from '../../domain/repositories/IInvoiceRepository';
import { IEventBus } from '../../../../shared/application/services/event-bus.interface';
import { ILogger } from '../../../../shared/application/services/logger.interface';
export interface RefundPaymentRequest {
    invoiceId: string;
    paymentId: string;
    reason: string;
}
export interface RefundPaymentResponse {
    success: boolean;
    invoiceId: string;
    paymentId: string;
    refundedAmount: number;
    outstandingAmount: number;
}
export declare class RefundPaymentUseCase extends BaseHealthcareUseCase<RefundPaymentRequest, RefundPaymentResponse> {
    private readonly invoiceRepository;
    private readonly eventBus;
    protected readonly logger: ILogger;
    constructor(invoiceRepository: IInvoiceRepository, eventBus: IEventBus, logger: ILogger);
    protected executeImpl(request: RefundPaymentRequest): Promise<RefundPaymentResponse>;
}
//# sourceMappingURL=RefundPaymentUseCase.d.ts.map