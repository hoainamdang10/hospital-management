/**
 * FinalizeInvoiceUseCase - Application Layer
 * Use case for finalizing invoice (mark as ready for payment)
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { IBillingRepository } from '../../domain/repositories/IBillingRepository';
import { IEventBus } from '../../../../shared/events/event-bus.interface';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
import { InvoiceId } from '../../domain/value-objects/InvoiceId';
import { BaseHealthcareUseCase } from '../../../../shared/application/base/BaseHealthcareUseCase';

export interface FinalizeInvoiceRequest {
  invoiceId: string;
  finalizedBy: string;
}

export interface FinalizeInvoiceResponse {
  success: boolean;
  data?: {
    invoiceId: string;
    status: string;
    totalAmount: number;
    patientPayable: number;
    finalizedAt: Date;
  };
  message: string;
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

export class FinalizeInvoiceUseCase extends BaseHealthcareUseCase<FinalizeInvoiceRequest, FinalizeInvoiceResponse> {
  constructor(
    private readonly billingRepository: IBillingRepository,
    private readonly eventBus: IEventBus,
    logger: ILogger
  ) {
    super(logger);
  }

  protected async executeCore(request: FinalizeInvoiceRequest): Promise<FinalizeInvoiceResponse> {
    try {
      this.logger.info('Finalizing invoice', { 
        invoiceId: request.invoiceId,
        finalizedBy: request.finalizedBy
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

      // Check if invoice can be finalized
      if (billing.status !== 'DRAFT') {
        return {
          success: false,
          message: 'Chỉ có thể hoàn tất hóa đơn ở trạng thái DRAFT',
          errors: [{
            field: 'status',
            message: `Hóa đơn đang ở trạng thái ${billing.status}`,
            code: 'INVALID_STATUS'
          }]
        };
      }

      // Check if invoice has items
      if (billing.items.length === 0) {
        return {
          success: false,
          message: 'Hóa đơn phải có ít nhất 1 dịch vụ',
          errors: [{
            field: 'items',
            message: 'Danh sách dịch vụ trống',
            code: 'NO_ITEMS'
          }]
        };
      }

      // Finalize invoice
      billing.finalize();

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
          totalAmount: billing.totalAmount.amount,
          patientPayable: billing.patientPaymentAmount.amount,
          finalizedAt: new Date()
        },
        message: 'Hoàn tất hóa đơn thành công'
      };

    } catch (error) {
      this.logger.error('Error finalizing invoice', { error, request });
      throw error;
    }
  }
}

