/**
 * BulkSendPaymentRemindersUseCase - Application Layer
 * Use case for bulk sending payment reminders
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { IBillingRepository } from '../../domain/repositories/IBillingRepository';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
import { InvoiceId } from '../../domain/value-objects/InvoiceId';
import { BaseHealthcareUseCase } from '../../../../shared/application/base/BaseHealthcareUseCase';

export interface BulkSendPaymentRemindersRequest {
  invoiceIds: string[];
  reminderType: 'email' | 'sms' | 'both';
  customMessage?: string;
}

export interface BulkSendPaymentRemindersResponse {
  success: boolean;
  data?: {
    total: number;
    sent: number;
    failed: number;
    results: Array<{
      invoiceId: string;
      status: 'sent' | 'failed';
      error?: string;
    }>;
  };
  message: string;
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

export class BulkSendPaymentRemindersUseCase extends BaseHealthcareUseCase<BulkSendPaymentRemindersRequest, BulkSendPaymentRemindersResponse> {
  constructor(
    private readonly billingRepository: IBillingRepository,
    logger: ILogger
  ) {
    super(logger);
  }

  protected async executeCore(request: BulkSendPaymentRemindersRequest): Promise<BulkSendPaymentRemindersResponse> {
    try {
      this.logger.info('Bulk sending payment reminders', { 
        count: request.invoiceIds.length,
        type: request.reminderType
      });

      // Validate
      if (!request.invoiceIds || request.invoiceIds.length === 0) {
        return {
          success: false,
          message: 'Danh sách hóa đơn trống',
          errors: [{
            field: 'invoiceIds',
            message: 'At least one invoice ID is required',
            code: 'EMPTY_INVOICE_LIST'
          }]
        };
      }

      if (request.invoiceIds.length > 500) {
        return {
          success: false,
          message: 'Không thể gửi nhắc nhở cho quá 500 hóa đơn cùng lúc',
          errors: [{
            field: 'invoiceIds',
            message: 'Maximum 500 invoices allowed',
            code: 'TOO_MANY_INVOICES'
          }]
        };
      }

      // Get invoices
      const invoiceIdObjects = request.invoiceIds.map(id => InvoiceId.create(id));
      const invoices = await this.billingRepository.findByIds(invoiceIdObjects);

      if (invoices.length === 0) {
        return {
          success: false,
          message: 'Không tìm thấy hóa đơn nào',
          errors: [{
            field: 'invoiceIds',
            message: 'No invoices found',
            code: 'NO_INVOICES_FOUND'
          }]
        };
      }

      // Send reminders
      const results: Array<{ invoiceId: string; status: 'sent' | 'failed'; error?: string }> = [];
      let sent = 0;
      let failed = 0;

      for (const invoice of invoices) {
        try {
          // Check if invoice is eligible for reminder
          if (invoice.status === 'PAID' || invoice.status === 'CANCELLED') {
            results.push({
              invoiceId: invoice.invoiceId.value,
              status: 'failed',
              error: 'Invoice already paid or cancelled'
            });
            failed++;
            continue;
          }

          // Send reminder
          await this.sendReminder(invoice, request.reminderType, request.customMessage);

          results.push({
            invoiceId: invoice.invoiceId.value,
            status: 'sent'
          });
          sent++;

        } catch (error) {
          this.logger.error('Error sending reminder', { 
            invoiceId: invoice.invoiceId.value, 
            error 
          });

          results.push({
            invoiceId: invoice.invoiceId.value,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          failed++;
        }
      }

      return {
        success: true,
        data: {
          total: invoices.length,
          sent,
          failed,
          results
        },
        message: `Đã gửi ${sent}/${invoices.length} nhắc nhở thanh toán`
      };

    } catch (error) {
      this.logger.error('Error bulk sending payment reminders', { error, request });
      throw error;
    }
  }

  private async sendReminder(invoice: any, type: string, customMessage?: string): Promise<void> {
    // TODO: Integrate with notification service
    // For now, just log
    this.logger.info('Sending payment reminder', {
      invoiceId: invoice.invoiceId.value,
      patientId: invoice.patientId,
      amount: invoice.patientPaymentAmount.amount,
      type,
      customMessage
    });

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

