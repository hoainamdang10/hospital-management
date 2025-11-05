/**
 * GetInvoiceUseCase - Application Layer
 * Use case for retrieving invoice details
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { IBillingRepository } from '../../domain/repositories/IBillingRepository';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
import { InvoiceId } from '../../domain/value-objects/InvoiceId';
import { BaseHealthcareUseCase } from '../../../../shared/application/base/BaseHealthcareUseCase';

export interface GetInvoiceRequest {
  invoiceId: string;
  includePaymentHistory?: boolean;
  includeRefundHistory?: boolean;
}

export interface GetInvoiceResponse {
  success: boolean;
  data?: {
    invoiceId: string;
    invoiceNumber: string;
    patientId: string;
    doctorId: string;
    medicalRecordId?: string;
    appointmentId?: string;
    status: string;
    totalAmount: number;
    taxAmount: number;
    insuranceCoverage: number;
    patientPayable: number;
    currency: string;
    items: Array<{
      id: string;
      description: string;
      vietnameseDescription: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      category: string;
      taxable: boolean;
      insuranceCoverable: boolean;
    }>;
    payments?: Array<{
      paymentId: string;
      amount: number;
      method: string;
      transactionId?: string;
      processedAt: Date;
      processedBy: string;
    }>;
    refunds?: Array<{
      refundId: string;
      amount: number;
      reason: string;
      processedAt: Date;
    }>;
    insurance?: {
      type: string;
      number: string;
      coverageAmount: number;
      claimStatus?: string;
    };
    dueDate?: Date;
    issuedAt: Date;
    issuedBy: string;
    notes?: string;
  };
  message: string;
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

export class GetInvoiceUseCase extends BaseHealthcareUseCase<GetInvoiceRequest, GetInvoiceResponse> {
  constructor(
    private readonly billingRepository: IBillingRepository,
    logger: ILogger
  ) {
    super(logger);
  }

  protected async executeCore(request: GetInvoiceRequest): Promise<GetInvoiceResponse> {
    try {
      this.logger.info('Getting invoice', { invoiceId: request.invoiceId });

      // Validate invoice ID format
      const invoiceId = InvoiceId.create(request.invoiceId);

      // Get invoice from repository
      const billing = await this.billingRepository.findById(invoiceId);

      if (!billing) {
        return {
          success: false,
          message: 'Không tìm thấy hóa đơn',
          errors: [{
            field: 'invoiceId',
            message: 'Hóa đơn không tồn tại',
            code: 'INVOICE_NOT_FOUND'
          }]
        };
      }

      // Build response
      const response: GetInvoiceResponse = {
        success: true,
        message: 'Lấy thông tin hóa đơn thành công',
        data: {
          invoiceId: billing.invoiceId.value,
          invoiceNumber: billing.vietnameseInvoiceNumber || billing.invoiceId.value,
          patientId: billing.patientId,
          doctorId: billing.doctorId,
          medicalRecordId: billing.medicalRecordId,
          appointmentId: billing.appointmentId,
          status: billing.status,
          totalAmount: billing.totalAmount.amount,
          taxAmount: billing.taxAmount.amount,
          insuranceCoverage: billing.insuranceCoverageAmount.amount,
          patientPayable: billing.patientPaymentAmount.amount,
          currency: billing.totalAmount.currency,
          items: billing.items.map(item => ({
            id: item.id,
            description: item.description,
            vietnameseDescription: item.vietnameseDescription,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            category: item.category,
            taxable: item.taxable,
            insuranceCoverable: item.insuranceCoverable
          })),
          insurance: billing.insurance ? {
            type: billing.insurance.type,
            number: billing.insurance.number,
            coverageAmount: billing.insurance.coverageAmount,
            claimStatus: billing.insurance.claimStatus
          } : undefined,
          dueDate: billing.dueDate,
          issuedAt: billing.issuedAt,
          issuedBy: billing.issuedBy,
          notes: billing.notes
        }
      };

      // Include payment history if requested
      if (request.includePaymentHistory && billing.payments) {
        response.data!.payments = billing.payments.map(payment => ({
          paymentId: payment.paymentId,
          amount: payment.amount,
          method: payment.method,
          transactionId: payment.transactionId,
          processedAt: payment.processedAt,
          processedBy: payment.processedBy
        }));
      }

      return response;

    } catch (error) {
      this.logger.error('Error getting invoice', { error, request });
      throw error;
    }
  }
}

