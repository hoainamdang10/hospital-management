/**
 * UpdateInvoiceUseCase - Application Layer
 * Use case for updating invoice metadata
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { IBillingRepository } from '../../domain/repositories/IBillingRepository';
import { IEventBus } from '../../../../shared/events/event-bus.interface';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
import { InvoiceId } from '../../domain/value-objects/InvoiceId';
import { BaseHealthcareUseCase } from '../../../../shared/application/base/BaseHealthcareUseCase';

export interface UpdateInvoiceRequest {
  invoiceId: string;
  dueDate?: Date;
  notes?: string;
  updatedBy: string;
}

export interface UpdateInvoiceResponse {
  success: boolean;
  data?: {
    invoiceId: string;
    dueDate?: Date;
    notes?: string;
    updatedAt: Date;
  };
  message: string;
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

export class UpdateInvoiceUseCase extends BaseHealthcareUseCase<UpdateInvoiceRequest, UpdateInvoiceResponse> {
  constructor(
    private readonly billingRepository: IBillingRepository,
    private readonly eventBus: IEventBus,
    logger: ILogger
  ) {
    super(logger);
  }

  protected async executeCore(request: UpdateInvoiceRequest): Promise<UpdateInvoiceResponse> {
    try {
      this.logger.info('Updating invoice', { 
        invoiceId: request.invoiceId,
        updatedBy: request.updatedBy
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
            message: 'Invoice not found',
            code: 'INVOICE_NOT_FOUND'
          }]
        };
      }

      // Check if invoice can be updated
      if (billing.status === 'PAID') {
        return {
          success: false,
          message: 'Không thể cập nhật hóa đơn đã thanh toán',
          errors: [{
            field: 'status',
            message: 'Cannot update paid invoice',
            code: 'INVOICE_PAID'
          }]
        };
      }

      if (billing.status === 'CANCELLED') {
        return {
          success: false,
          message: 'Không thể cập nhật hóa đơn đã hủy',
          errors: [{
            field: 'status',
            message: 'Cannot update cancelled invoice',
            code: 'INVOICE_CANCELLED'
          }]
        };
      }

      // Update fields
      if (request.dueDate) {
        // Validate due date is in the future
        if (request.dueDate < new Date()) {
          return {
            success: false,
            message: 'Ngày đến hạn phải là ngày trong tương lai',
            errors: [{
              field: 'dueDate',
              message: 'Due date must be in the future',
              code: 'INVALID_DUE_DATE'
            }]
          };
        }
        billing.dueDate = request.dueDate;
      }

      if (request.notes !== undefined) {
        billing.notes = request.notes;
      }

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
          dueDate: billing.dueDate,
          notes: billing.notes,
          updatedAt: new Date()
        },
        message: 'Cập nhật hóa đơn thành công'
      };

    } catch (error) {
      this.logger.error('Error updating invoice', { error, request });
      throw error;
    }
  }
}

