/**
 * GetAllPaymentsUseCase - Application Layer
 * Use case for retrieving all payments with filters
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { IBillingRepository } from '../../domain/repositories/IBillingRepository';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
import { BaseHealthcareUseCase } from '../../../../shared/application/base/BaseHealthcareUseCase';

export interface GetAllPaymentsRequest {
  page: number;
  limit: number;
  dateFrom?: Date;
  dateTo?: Date;
  paymentMethod?: string;
  status?: string;
}

export interface GetAllPaymentsResponse {
  success: boolean;
  data?: Array<{
    paymentId: string;
    invoiceId: string;
    invoiceNumber: string;
    amount: number;
    currency: string;
    method: string;
    transactionId?: string;
    processedAt: Date;
    processedBy: string;
    status: string;
  }>;
  total: number;
  summary: {
    totalAmount: number;
    paymentCount: number;
    byMethod: Record<string, number>;
  };
  message: string;
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

export class GetAllPaymentsUseCase extends BaseHealthcareUseCase<GetAllPaymentsRequest, GetAllPaymentsResponse> {
  constructor(
    private readonly billingRepository: IBillingRepository,
    logger: ILogger
  ) {
    super(logger);
  }

  protected async executeCore(request: GetAllPaymentsRequest): Promise<GetAllPaymentsResponse> {
    try {
      this.logger.info('Getting all payments', { 
        page: request.page,
        limit: request.limit
      });

      // Validate pagination
      if (request.page < 1 || request.limit < 1 || request.limit > 100) {
        return {
          success: false,
          total: 0,
          summary: { totalAmount: 0, paymentCount: 0, byMethod: {} },
          message: 'Tham số phân trang không hợp lệ',
          errors: [{
            field: 'pagination',
            message: 'Page must be >= 1, limit must be 1-100',
            code: 'INVALID_PAGINATION'
          }]
        };
      }

      // Get all invoices
      const allInvoices = await this.billingRepository.findAll();

      // Extract all payments
      const allPayments: any[] = [];
      for (const invoice of allInvoices) {
        if (invoice.payments && invoice.payments.length > 0) {
          for (const payment of invoice.payments) {
            allPayments.push({
              ...payment,
              invoiceId: invoice.invoiceId.value,
              invoiceNumber: invoice.vietnameseInvoiceNumber || invoice.invoiceId.value
            });
          }
        }
      }

      // Apply filters
      let filteredPayments = allPayments;

      if (request.dateFrom) {
        filteredPayments = filteredPayments.filter(p => 
          new Date(p.processedAt) >= request.dateFrom!
        );
      }

      if (request.dateTo) {
        filteredPayments = filteredPayments.filter(p => 
          new Date(p.processedAt) <= request.dateTo!
        );
      }

      if (request.paymentMethod) {
        filteredPayments = filteredPayments.filter(p => 
          p.method === request.paymentMethod
        );
      }

      // Sort by processed date (newest first)
      filteredPayments.sort((a, b) => 
        new Date(b.processedAt).getTime() - new Date(a.processedAt).getTime()
      );

      // Apply pagination
      const offset = (request.page - 1) * request.limit;
      const paginatedPayments = filteredPayments.slice(offset, offset + request.limit);

      // Calculate summary
      const totalAmount = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
      const byMethod: Record<string, number> = {};
      
      for (const payment of filteredPayments) {
        byMethod[payment.method] = (byMethod[payment.method] || 0) + payment.amount;
      }

      return {
        success: true,
        data: paginatedPayments.map(p => ({
          paymentId: p.paymentId,
          invoiceId: p.invoiceId,
          invoiceNumber: p.invoiceNumber,
          amount: p.amount,
          currency: p.currency || 'VND',
          method: p.method,
          transactionId: p.transactionId,
          processedAt: new Date(p.processedAt),
          processedBy: p.processedBy,
          status: 'COMPLETED'
        })),
        total: filteredPayments.length,
        summary: {
          totalAmount,
          paymentCount: filteredPayments.length,
          byMethod
        },
        message: `Tìm thấy ${filteredPayments.length} giao dịch thanh toán`
      };

    } catch (error) {
      this.logger.error('Error getting all payments', { error, request });
      throw error;
    }
  }
}

