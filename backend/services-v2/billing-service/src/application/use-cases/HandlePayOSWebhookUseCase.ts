/**
 * HandlePayOSWebhookUseCase - Application Layer
 * Use case for handling PayOS webhook callbacks
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { IBillingRepository } from '../../domain/repositories/IBillingRepository';
import { IEventBus } from '../../../../shared/events/event-bus.interface';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
import { InvoiceId } from '../../domain/value-objects/InvoiceId';
import { BaseHealthcareUseCase } from '../../../../shared/application/base/BaseHealthcareUseCase';
import * as crypto from 'crypto';

export interface HandlePayOSWebhookRequest {
  data: {
    orderCode: string;
    amount: number;
    description: string;
    accountNumber: string;
    reference: string;
    transactionDateTime: string;
    currency: string;
    paymentLinkId: string;
    code: string;
    desc: string;
    counterAccountBankId?: string;
    counterAccountBankName?: string;
    counterAccountName?: string;
    counterAccountNumber?: string;
    virtualAccountName?: string;
    virtualAccountNumber?: string;
  };
  signature: string;
}

export interface HandlePayOSWebhookResponse {
  success: boolean;
  data?: {
    invoiceId: string;
    paymentId: string;
    amount: number;
    status: string;
    processedAt: Date;
  };
  message: string;
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

export class HandlePayOSWebhookUseCase extends BaseHealthcareUseCase<HandlePayOSWebhookRequest, HandlePayOSWebhookResponse> {
  private readonly PAYOS_CHECKSUM_KEY = process.env.PAYOS_CHECKSUM_KEY || '';

  constructor(
    private readonly billingRepository: IBillingRepository,
    private readonly eventBus: IEventBus,
    logger: ILogger
  ) {
    super(logger);
  }

  protected async executeCore(request: HandlePayOSWebhookRequest): Promise<HandlePayOSWebhookResponse> {
    try {
      this.logger.info('Handling PayOS webhook', { 
        orderCode: request.data.orderCode,
        amount: request.data.amount
      });

      // Verify signature
      const isValid = this.verifySignature(request.data, request.signature);

      if (!isValid) {
        return {
          success: false,
          message: 'Chữ ký webhook không hợp lệ',
          errors: [{
            field: 'signature',
            message: 'Signature verification failed',
            code: 'INVALID_SIGNATURE'
          }]
        };
      }

      // Extract invoice ID from order code
      const invoiceIdStr = this.extractInvoiceId(request.data.orderCode);

      if (!invoiceIdStr) {
        return {
          success: false,
          message: 'Không thể trích xuất invoice ID từ order code',
          errors: [{
            field: 'orderCode',
            message: 'Invalid order code format',
            code: 'INVALID_ORDER_CODE'
          }]
        };
      }

      // Get invoice
      const invoiceId = InvoiceId.create(invoiceIdStr);
      const billing = await this.billingRepository.findById(invoiceId);

      if (!billing) {
        return {
          success: false,
          message: 'Không tìm thấy hóa đơn',
          errors: [{
            field: 'invoiceId',
            message: 'Invoice not found',
            code: 'INVOICE_NOT_FOUND'
          }]
        };
      }

      // Check payment status from webhook
      if (request.data.code !== '00') {
        this.logger.warn('PayOS payment failed', { 
          orderCode: request.data.orderCode,
          code: request.data.code,
          desc: request.data.desc
        });

        return {
          success: false,
          message: `Thanh toán thất bại: ${request.data.desc}`,
          errors: [{
            field: 'payment',
            message: request.data.desc,
            code: request.data.code
          }]
        };
      }

      // Process payment
      billing.processPayment(
        request.data.amount,
        'PAYOS',
        request.data.reference,
        'SYSTEM',
        {
          orderCode: request.data.orderCode,
          paymentLinkId: request.data.paymentLinkId,
          transactionDateTime: request.data.transactionDateTime,
          accountNumber: request.data.accountNumber,
          counterAccountBankName: request.data.counterAccountBankName,
          counterAccountName: request.data.counterAccountName,
          counterAccountNumber: request.data.counterAccountNumber
        }
      );

      // Save updated invoice
      await this.billingRepository.save(billing);

      // Publish events
      const events = billing.getUncommittedEvents();
      for (const event of events) {
        await this.eventBus.publish(event);
      }
      billing.markEventsAsCommitted();

      return {
        success: true,
        data: {
          invoiceId: billing.invoiceId.value,
          paymentId: `PAY-${Date.now()}`,
          amount: request.data.amount,
          status: billing.status,
          processedAt: new Date()
        },
        message: 'Xử lý webhook PayOS thành công'
      };

    } catch (error) {
      this.logger.error('Error handling PayOS webhook', { error, request });
      throw error;
    }
  }

  private verifySignature(data: any, signature: string): boolean {
    try {
      const sortedData = this.sortObject(data);
      const dataString = JSON.stringify(sortedData);
      const expectedSignature = crypto
        .createHmac('sha256', this.PAYOS_CHECKSUM_KEY)
        .update(dataString)
        .digest('hex');

      return signature === expectedSignature;
    } catch (error) {
      this.logger.error('Error verifying signature', { error });
      return false;
    }
  }

  private sortObject(obj: any): any {
    return Object.keys(obj)
      .sort()
      .reduce((result: any, key) => {
        result[key] = obj[key];
        return result;
      }, {});
  }

  private extractInvoiceId(orderCode: string): string | null {
    // Order code format: INV-YYYYMM-XXXXXX-timestamp
    const parts = orderCode.split('-');
    if (parts.length >= 3) {
      return `${parts[0]}-${parts[1]}-${parts[2]}`;
    }
    return null;
  }
}

