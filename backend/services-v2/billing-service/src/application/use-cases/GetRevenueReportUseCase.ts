import { BaseHealthcareUseCase } from '@shared/application/base/base-healthcare-use-case';
import { IInvoiceRepository } from '../../domain/repositories/IInvoiceRepository';
import { ILogger } from '@shared/application/services/logger.interface';

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

export class GetRevenueReportUseCase extends BaseHealthcareUseCase<GetRevenueReportRequest, RevenueReport> {
  protected readonly logger: ILogger;

  constructor(
    private readonly invoiceRepository: IInvoiceRepository,
    logger: ILogger
  ) {
    super();
    this.logger = logger;
  }

  protected async executeImpl(request: GetRevenueReportRequest): Promise<RevenueReport> {
    this.logger.info('Generating revenue report', { 
      fromDate: request.fromDate,
      toDate: request.toDate 
    });

    const invoices = await this.invoiceRepository.search({
      fromDate: request.fromDate,
      toDate: request.toDate
    });

    const paidInvoices = invoices.filter(inv => inv.status.value === 'paid');
    const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.totalAmount.amount, 0);

    const summary = {
      totalRevenue,
      totalInvoices: invoices.length,
      averageInvoiceAmount: paidInvoices.length > 0 ? totalRevenue / paidInvoices.length : 0,
      paidInvoices: paidInvoices.length,
      pendingInvoices: invoices.filter(inv => inv.status.value === 'pending').length
    };

    const breakdown = this.groupByPeriod(paidInvoices, request.groupBy || 'month');

    const byPaymentMethod: { [method: string]: number } = {};
    paidInvoices.forEach(invoice => {
      invoice.payments.forEach(payment => {
        if (payment.status === 'completed') {
          byPaymentMethod[payment.method] = (byPaymentMethod[payment.method] || 0) + payment.amount.amount;
        }
      });
    });

    // REMOVED (Phase 1 Prepaid Model): Insurance breakdown - no insurance coverage in MVP
    const byInsuranceType: { [type: string]: number } = {};

    this.logger.info('Revenue report generated', { 
      totalRevenue,
      totalInvoices: invoices.length 
    });

    return {
      period: {
        from: request.fromDate,
        to: request.toDate
      },
      summary,
      breakdown,
      byPaymentMethod,
      byInsuranceType
    };
  }

  private groupByPeriod(invoices: any[], groupBy: 'day' | 'week' | 'month'): RevenueBreakdown[] {
    const groups: { [key: string]: any[] } = {};

    invoices.forEach(invoice => {
      const date = new Date(invoice.createdAt);
      let key: string;

      if (groupBy === 'day') {
        key = date.toISOString().split('T')[0];
      } else if (groupBy === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(invoice);
    });

    return Object.entries(groups).map(([period, periodInvoices]) => {
      const totalRevenue = periodInvoices.reduce((sum, inv) => sum + inv.totalAmount.amount, 0);
      return {
        period,
        totalRevenue,
        invoiceCount: periodInvoices.length,
        averageInvoiceAmount: totalRevenue / periodInvoices.length
      };
    }).sort((a, b) => a.period.localeCompare(b.period));
  }
}
