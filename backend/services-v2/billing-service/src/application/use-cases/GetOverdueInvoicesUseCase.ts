/**
 * GetOverdueInvoicesUseCase - Application Layer
 * Use case for retrieving overdue invoices
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { IBillingRepository } from '../../domain/repositories/IBillingRepository';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
import { BaseHealthcareUseCase } from '../../../../shared/application/base/BaseHealthcareUseCase';

export interface GetOverdueInvoicesRequest {
  page: number;
  limit: number;
  daysOverdue?: number;
  patientId?: string;
  sortBy?: 'dueDate' | 'amount' | 'daysOverdue';
  sortOrder?: 'asc' | 'desc';
}

export interface GetOverdueInvoicesResponse {
  success: boolean;
  data?: Array<{
    invoiceId: string;
    invoiceNumber: string;
    patientId: string;
    doctorId: string;
    totalAmount: number;
    patientPayable: number;
    currency: string;
    dueDate: Date;
    issuedAt: Date;
    daysOverdue: number;
    status: string;
  }>;
  total: number;
  summary?: {
    totalOverdueAmount: number;
    averageDaysOverdue: number;
    oldestOverdueInvoice: number;
  };
  message: string;
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

export class GetOverdueInvoicesUseCase extends BaseHealthcareUseCase<GetOverdueInvoicesRequest, GetOverdueInvoicesResponse> {
  constructor(
    private readonly billingRepository: IBillingRepository,
    logger: ILogger
  ) {
    super(logger);
  }

  protected async executeCore(request: GetOverdueInvoicesRequest): Promise<GetOverdueInvoicesResponse> {
    try {
      this.logger.info('Getting overdue invoices', { 
        page: request.page,
        limit: request.limit,
        daysOverdue: request.daysOverdue
      });

      // Validate pagination
      if (request.page < 1 || request.limit < 1 || request.limit > 100) {
        return {
          success: false,
          total: 0,
          message: 'Tham số phân trang không hợp lệ',
          errors: [{
            field: 'pagination',
            message: 'Page phải >= 1, limit phải từ 1-100',
            code: 'INVALID_PAGINATION'
          }]
        };
      }

      // TODO: Implement repository method findOverdueInvoices()
      const invoices: any[] = [];
      const total = 0;

      const now = new Date();

      // Calculate days overdue and map to response
      const data = invoices.map(billing => {
        const daysOverdue = Math.floor(
          (now.getTime() - billing.dueDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        return {
          invoiceId: billing.invoiceId.value,
          invoiceNumber: billing.vietnameseInvoiceNumber || billing.invoiceId.value,
          patientId: billing.patientId,
          doctorId: billing.doctorId,
          totalAmount: billing.totalAmount.amount,
          patientPayable: billing.patientPaymentAmount.amount,
          currency: billing.totalAmount.currency,
          dueDate: billing.dueDate,
          issuedAt: billing.issuedAt,
          daysOverdue,
          status: billing.status
        };
      });

      // Calculate summary statistics
      const summary = this.calculateSummary(data);

      return {
        success: true,
        data,
        total,
        summary,
        message: `Tìm thấy ${total} hóa đơn quá hạn`
      };

    } catch (error) {
      this.logger.error('Error getting overdue invoices', { error, request });
      throw error;
    }
  }

  private calculateSummary(invoices: any[]): {
    totalOverdueAmount: number;
    averageDaysOverdue: number;
    oldestOverdueInvoice: number;
  } {
    if (invoices.length === 0) {
      return {
        totalOverdueAmount: 0,
        averageDaysOverdue: 0,
        oldestOverdueInvoice: 0
      };
    }

    const totalOverdueAmount = invoices.reduce((sum, inv) => sum + inv.patientPayable, 0);
    const averageDaysOverdue = invoices.reduce((sum, inv) => sum + inv.daysOverdue, 0) / invoices.length;
    const oldestOverdueInvoice = Math.max(...invoices.map(inv => inv.daysOverdue));

    return {
      totalOverdueAmount,
      averageDaysOverdue: Math.round(averageDaysOverdue),
      oldestOverdueInvoice
    };
  }
}

