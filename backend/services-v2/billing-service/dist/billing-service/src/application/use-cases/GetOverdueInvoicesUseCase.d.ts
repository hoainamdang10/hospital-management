import { BaseHealthcareUseCase } from '../../../../shared/application/base/base-healthcare-use-case';
import { IInvoiceRepository } from '../../domain/repositories/IInvoiceRepository';
import { ILogger } from '../../../../shared/application/services/logger.interface';
export interface GetOverdueInvoicesRequest {
    patientId?: string;
    daysOverdue?: number;
}
export interface OverdueInvoice {
    invoiceId: string;
    invoiceNumber?: string;
    patientId: string;
    totalAmount: number;
    outstandingAmount: number;
    daysOverdue: number;
    createdAt: Date;
    finalizedAt?: Date;
}
export interface GetOverdueInvoicesResponse {
    invoices: OverdueInvoice[];
    totalOverdue: number;
    totalAmount: number;
}
export declare class GetOverdueInvoicesUseCase extends BaseHealthcareUseCase<GetOverdueInvoicesRequest, GetOverdueInvoicesResponse> {
    private readonly invoiceRepository;
    protected readonly logger: ILogger;
    constructor(invoiceRepository: IInvoiceRepository, logger: ILogger);
    protected executeImpl(request: GetOverdueInvoicesRequest): Promise<GetOverdueInvoicesResponse>;
}
//# sourceMappingURL=GetOverdueInvoicesUseCase.d.ts.map