/**
 * RemoveInvoiceItemUseCase - Application Layer
 * Use case for removing items from invoice
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { IBillingRepository } from '../../domain/repositories/IBillingRepository';
import { IEventBus } from '../../../../shared/events/event-bus.interface';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
import { InvoiceId } from '../../domain/value-objects/InvoiceId';
import { BaseHealthcareUseCase } from '../../../../shared/application/base/BaseHealthcareUseCase';

export interface RemoveInvoiceItemRequest {
  invoiceId: string;
  itemId: string;
  removedBy: string;
}

export interface RemoveInvoiceItemResponse {
  success: boolean;
  data?: {
    invoiceId: string;
    itemId: string;
    totalAmount: number;
    itemCount: number;
  };
  message: string;
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

export class RemoveInvoiceItemUseCase extends BaseHealthcareUseCase<RemoveInvoiceItemRequest, RemoveInvoiceItemResponse> {
  constructor(
    private readonly billingRepository: IBillingRepository,
    private readonly eventBus: IEventBus,
    logger: ILogger
  ) {
    super(logger);
  }

  protected async executeCore(request: RemoveInvoiceItemRequest): Promise<RemoveInvoiceItemResponse> {
    try {
      this.logger.info('Removing item from invoice', { 
        invoiceId: request.invoiceId,
        itemId: request.itemId,
        removedBy: request.removedBy
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

      // Check if invoice can be modified
      if (billing.status === 'PAID' || billing.status === 'CANCELLED') {
        return {
          success: false,
          message: 'Không thể xóa dịch vụ khỏi hóa đơn đã thanh toán hoặc đã hủy',
          errors: [{
            field: 'status',
            message: `Hóa đơn đang ở trạng thái ${billing.status}`,
            code: 'INVALID_STATUS'
          }]
        };
      }

      // Check if item exists
      const itemExists = billing.items.some(item => item.id === request.itemId);
      if (!itemExists) {
        return {
          success: false,
          message: 'Không tìm thấy dịch vụ trong hóa đơn',
          errors: [{
            field: 'itemId',
            message: 'Dịch vụ không tồn tại',
            code: 'ITEM_NOT_FOUND'
          }]
        };
      }

      // Check if this is the last item
      if (billing.items.length === 1) {
        return {
          success: false,
          message: 'Không thể xóa dịch vụ cuối cùng. Hãy hủy hóa đơn thay vì xóa dịch vụ.',
          errors: [{
            field: 'items',
            message: 'Hóa đơn phải có ít nhất 1 dịch vụ',
            code: 'LAST_ITEM'
          }]
        };
      }

      // Remove item from invoice
      billing.removeItem(request.itemId);

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
          itemId: request.itemId,
          totalAmount: billing.totalAmount.amount,
          itemCount: billing.items.length
        },
        message: 'Xóa dịch vụ khỏi hóa đơn thành công'
      };

    } catch (error) {
      this.logger.error('Error removing invoice item', { error, request });
      throw error;
    }
  }
}

