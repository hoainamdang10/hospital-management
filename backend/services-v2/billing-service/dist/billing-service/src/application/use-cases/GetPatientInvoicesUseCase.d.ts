import { BaseHealthcareUseCase } from '../../../../shared/application/base/base-healthcare-use-case';
import { IInvoiceRepository } from '../../domain/repositories/IInvoiceRepository';
import { ILogger } from '../../../../shared/application/services/logger.interface';
export interface GetPatientInvoicesRequest {
    patientId: string;
}
export interface GetPatientInvoicesResponse {
    invoices: Array<{
        invoiceId: string;
        invoiceNumber?: string;
        totalAmount: number;
        outstandingAmount: number;
        status: string;
        createdAt: Date;
    }>;
    totalCount: number;
}
export declare class GetPatientInvoicesUseCase extends BaseHealthcareUseCase<GetPatientInvoicesRequest, GetPatientInvoicesResponse> {
    private readonly invoiceRepository;
    protected readonly logger: ILogger;
    constructor(invoiceRepository: IInvoiceRepository, logger: ILogger);
    protected executeImpl(request: GetPatientInvoicesRequest): Promise<GetPatientInvoicesResponse>;
}
//# sourceMappingURL=GetPatientInvoicesUseCase.d.ts.map