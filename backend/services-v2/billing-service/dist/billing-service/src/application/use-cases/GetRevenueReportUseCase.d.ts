import { BaseHealthcareUseCase } from '../../../../shared/application/base/base-healthcare-use-case';
import { IInvoiceRepository } from '../../domain/repositories/IInvoiceRepository';
import { ILogger } from '../../../../shared/application/services/logger.interface';
export interface GetRevenueReportRequest {
    fromDate: Date;
    toDate: Date;
    groupBy?: 'day' | 'week' | 'month';
}
export interface RevenueBreakdown {
    period: string;
    totalRevenue: number;
    invoiceCount: number;
    averageInvoiceAmount: number;
}
export interface RevenueReport {
    period: {
        from: Date;
        to: Date;
    };
    summary: {
        totalRevenue: number;
        totalInvoices: number;
        averageInvoiceAmount: number;
        paidInvoices: number;
        pendingInvoices: number;
    };
    breakdown: RevenueBreakdown[];
    byPaymentMethod: {
        [method: string]: number;
    };
    byInsuranceType: {
        [type: string]: number;
    };
}
export declare class GetRevenueReportUseCase extends BaseHealthcareUseCase<GetRevenueReportRequest, RevenueReport> {
    private readonly invoiceRepository;
    protected readonly logger: ILogger;
    constructor(invoiceRepository: IInvoiceRepository, logger: ILogger);
    protected executeImpl(request: GetRevenueReportRequest): Promise<RevenueReport>;
    private groupByPeriod;
}
//# sourceMappingURL=GetRevenueReportUseCase.d.ts.map