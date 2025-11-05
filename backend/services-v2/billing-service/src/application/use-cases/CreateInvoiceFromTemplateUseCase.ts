/**
 * CreateInvoiceFromTemplateUseCase - Application Layer
 * Use case for creating invoice from template
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { IBillingRepository } from '../../domain/repositories/IBillingRepository';
import { IEventBus } from '../../../../shared/events/event-bus.interface';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
import { BillingAggregate } from '../../domain/aggregates/BillingAggregate';
import { InvoiceId } from '../../domain/value-objects/InvoiceId';
import { Money } from '../../domain/value-objects/Money';
import { BaseHealthcareUseCase } from '../../../../shared/application/base/BaseHealthcareUseCase';

export interface CreateInvoiceFromTemplateRequest {
  templateId: string;
  patientId: string;
  doctorId: string;
  medicalRecordId?: string;
  appointmentId?: string;
  insurance?: {
    type: 'BHYT' | 'BHTN' | 'Private';
    number: string;
    validFrom: Date;
    validTo: Date;
  };
  issuedBy: string;
}

export interface CreateInvoiceFromTemplateResponse {
  success: boolean;
  data?: {
    invoiceId: string;
    invoiceNumber: string;
    totalAmount: number;
    itemCount: number;
    status: string;
  };
  message: string;
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

export class CreateInvoiceFromTemplateUseCase extends BaseHealthcareUseCase<CreateInvoiceFromTemplateRequest, CreateInvoiceFromTemplateResponse> {
  constructor(
    private readonly billingRepository: IBillingRepository,
    private readonly eventBus: IEventBus,
    logger: ILogger
  ) {
    super(logger);
  }

  protected async executeCore(request: CreateInvoiceFromTemplateRequest): Promise<CreateInvoiceFromTemplateResponse> {
    try {
      this.logger.info('Creating invoice from template', { 
        templateId: request.templateId,
        patientId: request.patientId
      });

      // Get template
      const template = await this.getTemplate(request.templateId);

      if (!template) {
        return {
          success: false,
          message: 'Không tìm thấy mẫu hóa đơn',
          errors: [{
            field: 'templateId',
            message: 'Template not found',
            code: 'TEMPLATE_NOT_FOUND'
          }]
        };
      }

      if (!template.isActive) {
        return {
          success: false,
          message: 'Mẫu hóa đơn đã bị vô hiệu hóa',
          errors: [{
            field: 'templateId',
            message: 'Template is inactive',
            code: 'TEMPLATE_INACTIVE'
          }]
        };
      }

      // Generate invoice ID
      const invoiceId = InvoiceId.generate();

      // Create billing aggregate from template
      const billing = BillingAggregate.create(
        invoiceId,
        request.patientId,
        request.doctorId,
        template.items,
        request.insurance,
        request.medicalRecordId,
        request.appointmentId,
        request.issuedBy
      );

      // Save invoice
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
          invoiceNumber: billing.vietnameseInvoiceNumber || billing.invoiceId.value,
          totalAmount: billing.totalAmount.amount,
          itemCount: billing.items.length,
          status: billing.status
        },
        message: 'Tạo hóa đơn từ mẫu thành công'
      };

    } catch (error) {
      this.logger.error('Error creating invoice from template', { error, request });
      throw error;
    }
  }

  private async getTemplate(templateId: string): Promise<any> {
    // TODO: Get template from database
    // For now, return predefined template
    const templates: any = {
      'TPL-001': {
        templateId: 'TPL-001',
        name: 'Khám bệnh tổng quát',
        isActive: true,
        items: [
          {
            description: 'General Consultation',
            vietnameseDescription: 'Khám bệnh tổng quát',
            quantity: 1,
            unitPrice: 200000,
            category: 'consultation',
            taxable: true,
            insuranceCoverable: true
          }
        ]
      }
    };

    return templates[templateId] || null;
  }
}

