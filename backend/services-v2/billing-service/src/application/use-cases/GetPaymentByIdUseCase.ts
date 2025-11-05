/**
 * GetPaymentByIdUseCase - Application Layer
 * Use case for retrieving payment by ID
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { IBillingRepository } from '../../domain/repositories/IBillingRepository';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
import { BaseHealthcareUseCase } from '../../../../shared/application/base/BaseHealthcareUseCase';

export interface GetPaymentByIdRequest {
  paymentId: string;
}

export interface GetPaymentByIdResponse {
  success: boolean;
  data?: {
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
    notes?: string;
    payosData?: any;
  };
  message: string;
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

export class GetPaymentByIdUseCase extends BaseHealthcareUseCase<GetPaymentByIdRequest, GetPaymentByIdResponse> {
  constructor(
    private readonly billingRepository: IBillingRepository,
    logger: ILogger
  ) {
    super(logger);
  }

  protected async executeCore(request: GetPaymentByIdRequest): Promise<GetPaymentByIdResponse> {
    try {
      this.logger.info('Getting payment by ID', { 
        paymentId: request.paymentId
      });

      // Get all invoices and search for payment
      const allInvoices = await this.billingRepository.findAll();

      for (const invoice of allInvoices) {
        if (invoice.payments && invoice.payments.length > 0) {
          const payment = invoice.payments.find(p => p.paymentId === request.paymentId);
          
          if (payment) {
            return {
              success: true,
              data: {
                paymentId: payment.paymentId,
                invoiceId: invoice.invoiceId.value,
                invoiceNumber: invoice.vietnameseInvoiceNumber || invoice.invoiceId.value,
                amount: payment.amount,
                currency: payment.currency || 'VND',
                method: payment.method,
                transactionId: payment.transactionId,
                processedAt: new Date(payment.processedAt),
                processedBy: payment.processedBy,
                status: 'COMPLETED',
                notes: payment.notes,
                payosData: payment.payosData
              },
              message: 'Lấy thông tin giao dịch thành công'
            };
          }
        }
      }

      // Payment not found
      return {
        success: false,
        message: 'Không tìm thấy giao dịch thanh toán',
        errors: [{
          field: 'paymentId',
          message: 'Payment not found',
          code: 'PAYMENT_NOT_FOUND'
        }]
      };

    } catch (error) {
      this.logger.error('Error getting payment by ID', { error, request });
      throw error;
    }
  }
}

