/**
 * AddInvoiceItemUseCase - Application Layer
 * Use case for adding items to existing invoice
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { IBillingRepository } from '../../domain/repositories/IBillingRepository';
import { IEventBus } from '../../../../shared/events/event-bus.interface';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
import { InvoiceId } from '../../domain/value-objects/InvoiceId';
import { BillingItem } from '../../domain/aggregates/BillingAggregate';
import { BaseHealthcareUseCase } from '../../../../shared/application/base/BaseHealthcareUseCase';

export interface AddInvoiceItemRequest {
  invoiceId: string;
  description: string;
  vietnameseDescription: string;
  quantity: number;
  unitPrice: number;
  category: 'consultation' | 'medication' | 'procedure' | 'test' | 'room' | 'other';
  taxable: boolean;
  insuranceCoverable: boolean;
  serviceCode?: string;
}

export interface AddInvoiceItemResponse {
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

export class AddInvoiceItemUseCase extends BaseHealthcareUseCase<AddInvoiceItemRequest, AddInvoiceItemResponse> {
  constructor(
    private readonly billingRepository: IBillingRepository,
    private readonly eventBus: IEventBus,
    logger: ILogger
  ) {
    super(logger);
  }

  protected async executeCore(request: AddInvoiceItemRequest): Promise<AddInvoiceItemResponse> {
    try {
      this.logger.info('Adding item to invoice', { 
        invoiceId: request.invoiceId,
        description: request.description,
        quantity: request.quantity,
        unitPrice: request.unitPrice
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
          message: 'Không thể thêm dịch vụ vào hóa đơn đã thanh toán hoặc đã hủy',
          errors: [{
            field: 'status',
            message: `Hóa đơn đang ở trạng thái ${billing.status}`,
            code: 'INVALID_STATUS'
          }]
        };
      }

      // Create new item
      const newItem: BillingItem = {
        id: `item-${Date.now()}`,
        description: request.description,
        vietnameseDescription: request.vietnameseDescription,
        quantity: request.quantity,
        unitPrice: request.unitPrice,
        totalPrice: request.quantity * request.unitPrice,
        category: request.category,
        taxable: request.taxable,
        insuranceCoverable: request.insuranceCoverable,
        serviceCode: request.serviceCode
      };

      // Add item to invoice
      billing.addItem(newItem);

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
          itemId: newItem.id,
          totalAmount: billing.totalAmount.amount,
          itemCount: billing.items.length
        },
        message: 'Thêm dịch vụ vào hóa đơn thành công'
      };

    } catch (error) {
      this.logger.error('Error adding invoice item', { error, request });
      throw error;
    }
  }
}

