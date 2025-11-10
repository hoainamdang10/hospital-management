import { BaseHealthcareUseCase } from '../../../../shared/application/base/base-healthcare-use-case';
import { IInvoiceRepository } from '../../domain/repositories/IInvoiceRepository';
import { ILogger } from '../../../../shared/application/services/logger.interface';
export interface SearchInvoicesRequest {
    patientId?: string;
    status?: string;
    fromDate?: Date;
    toDate?: Date;
    minAmount?: number;
    maxAmount?: number;
    invoiceNumber?: string;
}
export interface InvoiceSummary {
    invoiceId: string;
    invoiceNumber?: string;
    patientId: string;
    totalAmount: number;
    outstandingAmount: number;
    status: string;
    createdAt: Date;
    finalizedAt?: Date;
}
export interface SearchInvoicesResponse {
    invoices: InvoiceSummary[];
    total: number;
}
export declare class SearchInvoicesUseCase extends BaseHealthcareUseCase<SearchInvoicesRequest, SearchInvoicesResponse> {
    private readonly invoiceRepository;
    protected readonly logger: ILogger;
    constructor(invoiceRepository: IInvoiceRepository, logger: ILogger);
    protected executeImpl(request: SearchInvoicesRequest): Promise<SearchInvoicesResponse>;
}
//# sourceMappingURL=SearchInvoicesUseCase.d.ts.map