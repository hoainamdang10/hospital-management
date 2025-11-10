import { BaseHealthcareUseCase } from '../../../../shared/application/base/base-healthcare-use-case';
import { IInvoiceRepository } from '../../domain/repositories/IInvoiceRepository';
import { IEventBus } from '../../../../shared/application/services/event-bus.interface';
import { ILogger } from '../../../../shared/application/services/logger.interface';
export interface FinalizeInvoiceRequest {
    invoiceId: string;
}
export interface FinalizeInvoiceResponse {
    invoiceId: string;
    invoiceNumber: string;
    status: string;
}
export declare class FinalizeInvoiceUseCase extends BaseHealthcareUseCase<FinalizeInvoiceRequest, FinalizeInvoiceResponse> {
    private readonly invoiceRepository;
    private readonly eventBus;
    protected readonly logger: ILogger;
    constructor(invoiceRepository: IInvoiceRepository, eventBus: IEventBus, logger: ILogger);
    protected executeImpl(request: FinalizeInvoiceRequest): Promise<FinalizeInvoiceResponse>;
}
//# sourceMappingURL=FinalizeInvoiceUseCase.d.ts.map