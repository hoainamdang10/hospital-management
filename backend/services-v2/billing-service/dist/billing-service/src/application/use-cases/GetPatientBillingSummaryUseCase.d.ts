import { BaseHealthcareUseCase } from '../../../../shared/application/base/base-healthcare-use-case';
import { IInvoiceRepository } from '../../domain/repositories/IInvoiceRepository';
import { ILogger } from '../../../../shared/application/services/logger.interface';
export interface GetPatientBillingSummaryRequest {
    patientId: string;
}
export interface PatientBillingSummary {
    patientId: string;
    totalInvoices: number;
    totalAmount: number;
    totalPaid: number;
    totalOutstanding: number;
    overdueAmount: number;
    invoicesByStatus: {
        draft: number;
        pending: number;
        partially_paid: number;
        paid: number;
        cancelled: number;
        overdue: number;
    };
    recentInvoices: Array<{
        invoiceId: string;
        invoiceNumber?: string;
        totalAmount: number;
        outstandingAmount: number;
        status: string;
        createdAt: Date;
    }>;
}
export declare class GetPatientBillingSummaryUseCase extends BaseHealthcareUseCase<GetPatientBillingSummaryRequest, PatientBillingSummary> {
    private readonly invoiceRepository;
    protected readonly logger: ILogger;
    constructor(invoiceRepository: IInvoiceRepository, logger: ILogger);
    protected executeImpl(request: GetPatientBillingSummaryRequest): Promise<PatientBillingSummary>;
}
//# sourceMappingURL=GetPatientBillingSummaryUseCase.d.ts.map