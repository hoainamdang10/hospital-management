/**
 * GetOutstandingInvoicesReportUseCase - Application Layer
 * Use case for generating outstanding invoices report
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { IBillingRepository } from '../../domain/repositories/IBillingRepository';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
import { BaseHealthcareUseCase } from '../../../../shared/application/base/BaseHealthcareUseCase';

export interface GetOutstandingInvoicesReportRequest {
  asOfDate?: Date;
}

export interface GetOutstandingInvoicesReportResponse {
  success: boolean;
  data?: {
    asOfDate: Date;
    summary: {
      totalOutstanding: number;
      totalInvoices: number;
      averageOutstanding: number;
      overdueAmount: number;
      overdueInvoices: number;
      currency: string;
    };
    agingAnalysis: {
      current: { amount: number; count: number };
      days1to30: { amount: number; count: number };
      days31to60: { amount: number; count: number };
      days61to90: { amount: number; count: number };
      over90Days: { amount: number; count: number };
    };
    topDebtors: Array<{
      patientId: string;
      patientName?: string;
      outstandingAmount: number;
      invoiceCount: number;
      oldestInvoiceDate: Date;
    }>;
    byStatus: {
      pending: { amount: number; count: number };
      partiallyPaid: { amount: number; count: number };
      overdue: { amount: number; count: number };
    };
  };
  message: string;
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

export class GetOutstandingInvoicesReportUseCase extends BaseHealthcareUseCase<GetOutstandingInvoicesReportRequest, GetOutstandingInvoicesReportResponse> {
  constructor(
    private readonly billingRepository: IBillingRepository,
    logger: ILogger
  ) {
    super(logger);
  }

  protected async executeCore(request: GetOutstandingInvoicesReportRequest): Promise<GetOutstandingInvoicesReportResponse> {
    try {
      const asOfDate = request.asOfDate || new Date();

      this.logger.info('Generating outstanding invoices report', { asOfDate });

      // TODO: Implement repository method findOutstandingInvoices()
      const invoices: any[] = [];

      // Calculate summary
      const summary = this.calculateSummary(invoices, asOfDate);

      // Calculate aging analysis
      const agingAnalysis = this.calculateAgingAnalysis(invoices, asOfDate);

      // Get top debtors
      const topDebtors = this.getTopDebtors(invoices);

      // Calculate by status
      const byStatus = this.calculateByStatus(invoices);

      return {
        success: true,
        data: {
          asOfDate,
          summary,
          agingAnalysis,
          topDebtors,
          byStatus
        },
        message: 'Tạo báo cáo công nợ thành công'
      };

    } catch (error) {
      this.logger.error('Error generating outstanding invoices report', { error, request });
      throw error;
    }
  }

  private calculateSummary(invoices: any[], asOfDate: Date) {
    const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.patientPaymentAmount.amount, 0);
    const overdueInvoices = invoices.filter(inv => inv.dueDate && inv.dueDate < asOfDate);
    const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + inv.patientPaymentAmount.amount, 0);

    return {
      totalOutstanding,
      totalInvoices: invoices.length,
      averageOutstanding: invoices.length > 0 ? totalOutstanding / invoices.length : 0,
      overdueAmount,
      overdueInvoices: overdueInvoices.length,
      currency: 'VND'
    };
  }

  private calculateAgingAnalysis(invoices: any[], asOfDate: Date) {
    const aging = {
      current: { amount: 0, count: 0 },
      days1to30: { amount: 0, count: 0 },
      days31to60: { amount: 0, count: 0 },
      days61to90: { amount: 0, count: 0 },
      over90Days: { amount: 0, count: 0 }
    };

    for (const inv of invoices) {
      if (!inv.dueDate) {
        aging.current.amount += inv.patientPaymentAmount.amount;
        aging.current.count++;
        continue;
      }

      const daysOverdue = Math.floor((asOfDate.getTime() - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysOverdue <= 0) {
        aging.current.amount += inv.patientPaymentAmount.amount;
        aging.current.count++;
      } else if (daysOverdue <= 30) {
        aging.days1to30.amount += inv.patientPaymentAmount.amount;
        aging.days1to30.count++;
      } else if (daysOverdue <= 60) {
        aging.days31to60.amount += inv.patientPaymentAmount.amount;
        aging.days31to60.count++;
      } else if (daysOverdue <= 90) {
        aging.days61to90.amount += inv.patientPaymentAmount.amount;
        aging.days61to90.count++;
      } else {
        aging.over90Days.amount += inv.patientPaymentAmount.amount;
        aging.over90Days.count++;
      }
    }

    return aging;
  }

  private getTopDebtors(invoices: any[]) {
    // TODO: Group by patient and calculate totals
    return [];
  }

  private calculateByStatus(invoices: any[]) {
    return {
      pending: {
        amount: invoices.filter(inv => inv.status === 'PENDING').reduce((sum, inv) => sum + inv.patientPaymentAmount.amount, 0),
        count: invoices.filter(inv => inv.status === 'PENDING').length
      },
      partiallyPaid: {
        amount: invoices.filter(inv => inv.status === 'PARTIALLY_PAID').reduce((sum, inv) => sum + inv.patientPaymentAmount.amount, 0),
        count: invoices.filter(inv => inv.status === 'PARTIALLY_PAID').length
      },
      overdue: {
        amount: invoices.filter(inv => inv.dueDate && inv.dueDate < new Date()).reduce((sum, inv) => sum + inv.patientPaymentAmount.amount, 0),
        count: invoices.filter(inv => inv.dueDate && inv.dueDate < new Date()).length
      }
    };
  }
}

