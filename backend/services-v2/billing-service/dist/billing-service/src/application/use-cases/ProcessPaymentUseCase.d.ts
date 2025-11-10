import { BaseHealthcareUseCase } from '../../../../shared/application/base/base-healthcare-use-case';
import { IInvoiceRepository } from '../../domain/repositories/IInvoiceRepository';
import { IEventBus } from '../../../../shared/application/services/event-bus.interface';
import { ILogger } from '../../../../shared/application/services/logger.interface';
import { PaymentMethod } from '../../domain/entities/Payment';
export interface ProcessPaymentRequest {
    invoiceId: string;
    amount: number;
    method: PaymentMethod;
    transactionId?: string;
}
export interface ProcessPaymentResponse {
    paymentId: string;
    invoiceId: string;
    amount: number;
    status: string;
    outstandingAmount: number;
}
export declare class ProcessPaymentUseCase extends BaseHealthcareUseCase<ProcessPaymentRequest, ProcessPaymentResponse> {
    private readonly invoiceRepository;
    private readonly eventBus;
    protected readonly logger: ILogger;
    constructor(invoiceRepository: IInvoiceRepository, eventBus: IEventBus, logger: ILogger);
    protected executeImpl(request: ProcessPaymentRequest): Promise<ProcessPaymentResponse>;
}
//# sourceMappingURL=ProcessPaymentUseCase.d.ts.map