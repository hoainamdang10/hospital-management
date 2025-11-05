/**
 * CancelInvoiceUseCase - Application Layer
 * Use case for cancelling invoice
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { IBillingRepository } from '../../domain/repositories/IBillingRepository';
import { IEventBus } from '../../../../shared/events/event-bus.interface';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
import { InvoiceId } from '../../domain/value-objects/InvoiceId';
import { BaseHealthcareUseCase } from '../../../../shared/application/base/BaseHealthcareUseCase';

export interface CancelInvoiceRequest {
  invoiceId: string;
  reason: string;
  cancelledBy: string;
}

export interface CancelInvoiceResponse {
  success: boolean;
  data?: {
    invoiceId: string;
    status: string;
    cancelledAt: Date;
    reason: string;
  };
  message: string;
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

export class CancelInvoiceUseCase extends BaseHealthcareUseCase<CancelInvoiceRequest, CancelInvoiceResponse> {
  constructor(
    private readonly billingRepository: IBillingRepository,
    private readonly eventBus: IEventBus,
    logger: ILogger
  ) {
    super(logger);
  }

  protected async executeCore(request: CancelInvoiceRequest): Promise<CancelInvoiceResponse> {
    try {
      this.logger.info('Cancelling invoice', { 
        invoiceId: request.invoiceId,
        reason: request.reason,
        cancelledBy: request.cancelledBy
      });

      // Validate invoice ID
      const invoiceId = InvoiceId.create(request.invoiceId);

      // Get invoice
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

      // Check if invoice can be cancelled
      if (billing.status === 'PAID') {
        return {
          success: false,
          message: 'Không thể hủy hóa đơn đã thanh toán. Vui lòng tạo yêu cầu hoàn tiền.',
          errors: [{
            field: 'status',
            message: 'Hóa đơn đã được thanh toán',
            code: 'ALREADY_PAID'
          }]
        };
      }

      if (billing.status === 'CANCELLED') {
        return {
          success: false,
          message: 'Hóa đơn đã được hủy trước đó',
          errors: [{
            field: 'status',
            message: 'Hóa đơn đã ở trạng thái CANCELLED',
            code: 'ALREADY_CANCELLED'
          }]
        };
      }

      // Validate reason
      if (!request.reason || request.reason.trim().length < 10) {
        return {
          success: false,
          message: 'Lý do hủy phải có ít nhất 10 ký tự',
          errors: [{
            field: 'reason',
            message: 'Lý do hủy không hợp lệ',
            code: 'INVALID_REASON'
          }]
        };
      }

      // Cancel invoice
      billing.cancel(request.reason, request.cancelledBy);

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
          status: billing.status,
          cancelledAt: new Date(),
          reason: request.reason
        },
        message: 'Hủy hóa đơn thành công'
      };

    } catch (error) {
      this.logger.error('Error cancelling invoice', { error, request });
      throw error;
    }
  }
}

