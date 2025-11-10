import { BaseHealthcareUseCase } from '../../../../shared/application/base/base-healthcare-use-case';
import { IInvoiceRepository } from '../../domain/repositories/IInvoiceRepository';
import { IEventBus } from '../../../../shared/application/services/event-bus.interface';
import { ILogger } from '../../../../shared/application/services/logger.interface';
export interface CancelInvoiceRequest {
    invoiceId: string;
    reason: string;
}
export interface CancelInvoiceResponse {
    invoiceId: string;
    status: string;
    cancelledAt: Date;
}
export declare class CancelInvoiceUseCase extends BaseHealthcareUseCase<CancelInvoiceRequest, CancelInvoiceResponse> {
    private readonly invoiceRepository;
    private readonly eventBus;
    protected readonly logger: ILogger;
    constructor(invoiceRepository: IInvoiceRepository, eventBus: IEventBus, logger: ILogger);
    protected executeImpl(request: CancelInvoiceRequest): Promise<CancelInvoiceResponse>;
}
//# sourceMappingURL=CancelInvoiceUseCase.d.ts.map