import { BaseHealthcareUseCase } from '../../../../shared/application/base/base-healthcare-use-case';
import { IInvoiceRepository } from '../../domain/repositories/IInvoiceRepository';
import { IEventBus } from '../../../../shared/application/services/event-bus.interface';
import { ILogger } from '../../../../shared/application/services/logger.interface';
export interface ProcessInsuranceClaimRequest {
    invoiceId: string;
}
export interface ProcessInsuranceClaimResponse {
    invoiceId: string;
    claimAmount: number;
    approved: boolean;
    message: string;
}
export declare class ProcessInsuranceClaimUseCase extends BaseHealthcareUseCase<ProcessInsuranceClaimRequest, ProcessInsuranceClaimResponse> {
    private readonly invoiceRepository;
    private readonly eventBus;
    protected readonly logger: ILogger;
    constructor(invoiceRepository: IInvoiceRepository, eventBus: IEventBus, logger: ILogger);
    protected executeImpl(request: ProcessInsuranceClaimRequest): Promise<ProcessInsuranceClaimResponse>;
}
//# sourceMappingURL=ProcessInsuranceClaimUseCase.d.ts.map