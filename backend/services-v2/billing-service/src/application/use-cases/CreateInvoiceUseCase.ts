/**
 * CreateInvoiceUseCase - Application Layer
 * V2 Clean Architecture + DDD Implementation
 * Use case for creating new invoices with Vietnamese healthcare compliance
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS, Vietnamese Healthcare Standards
 */

import { IBillingRepository } from '../../domain/repositories/IBillingRepository';
import { IEventBus } from '../../../../shared/events/event-bus.interface';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
import { BillingAggregate, BillingItem, InvoiceStatus } from '../../domain/aggregates/BillingAggregate';
import { InvoiceId } from '../../domain/value-objects/InvoiceId';
import { Money } from '../../domain/value-objects/Money';
import { Insurance, InsuranceType } from '../../domain/value-objects/Insurance';
import { BaseHealthcareUseCase } from '../../../../shared/application/base/BaseHealthcareUseCase';

export interface CreateInvoiceRequest {
  patientId: string;
  medicalRecordId?: string;
  doctorId: string;
  appointmentId?: string;
  items: Array<{
    description: string;
    vietnameseDescription: string;
    quantity: number;
    unitPrice: number;
    category: 'consultation' | 'medication' | 'procedure' | 'test' | 'room' | 'other';
    taxable: boolean;
    insuranceCoverable: boolean;
    serviceCode?: string;
  }>;
  insurance?: {
    type: InsuranceType;
    number: string;
    validUntil: Date;
    coverageLevel: number;
    issuedBy?: string;
    beneficiaryType?: string;
    accidentType?: string;
    accidentDate?: Date;
    employerInfo?: string;
    insuranceCompany?: string;
    policyType?: string;
  };
  notes?: string;
  issuedBy: string;
  dueDate?: Date;
}

export interface CreateInvoiceResponse {
  success: boolean;
  data?: {
    invoiceId: string;
    invoiceNumber: string;
    totalAmount: number;
    insuranceCoverage: number;
    patientPayable: number;
    status: InvoiceStatus;
    createdAt: Date;
  };
  message: string;
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

/**
 * Create Invoice Use Case
 * Implements invoice creation with Vietnamese healthcare compliance
 */
export class CreateInvoiceUseCase extends BaseHealthcareUseCase<CreateInvoiceRequest, CreateInvoiceResponse> {
  constructor(
    private readonly billingRepository: IBillingRepository,
    private readonly eventBus: IEventBus,
    logger: ILogger
  ) {
    super(logger);
  }

  /**
   * Execute invoice creation
   */
  protected async executeImpl(request: CreateInvoiceRequest): Promise<CreateInvoiceResponse> {
    try {
      this.logger.info('Creating new invoice', {
        patientId: request.patientId,
        doctorId: request.doctorId,
        itemCount: request.items.length,
        hasInsurance: !!request.insurance
      });

      // 1. Validate request
      const validation = this.validateRequest(request);
      if (!validation.isValid) {
        return {
          success: false,
          message: 'Dữ liệu đầu vào không hợp lệ',
          errors: validation.errors
        };
      }

      // 2. Create billing aggregate
      const billingAggregate = BillingAggregate.create(
        request.patientId,
        request.medicalRecordId || '',
        request.doctorId,
        request.appointmentId || '',
        request.issuedBy
      );

      // 3. Add billing items
      const billingItems = this.createBillingItems(request.items);
      for (const item of billingItems) {
        billingAggregate.addItem(item);
      }

      // 4. Set insurance if provided
      if (request.insurance) {
        const insurance = this.createInsurance(request.insurance);
        billingAggregate.setInsurance(insurance);
      }

      // 5. Finalize invoice (this will calculate totals and apply insurance)
      billingAggregate.finalize();

      // 6. Save to repository
      await this.billingRepository.save(billingAggregate);

      // 7. Publish domain events
      const events = billingAggregate.getUncommittedEvents();
      for (const event of events) {
        await this.eventBus.publish(event);
      }
      billingAggregate.markEventsAsCommitted();

      this.logger.info('Invoice created successfully', {
        invoiceId: billingAggregate.id.value,
        invoiceNumber: billingAggregate.invoiceNumber,
        totalAmount: billingAggregate.totalAmount.amount,
        patientId: request.patientId
      });

      return {
        success: true,
        message: 'Hóa đơn được tạo thành công',
        data: {
          invoiceId: billingAggregate.id.value,
          invoiceNumber: billingAggregate.invoiceNumber,
          totalAmount: billingAggregate.totalAmount.amount,
          insuranceCoverage: billingAggregate.insuranceCoverage?.amount || 0,
          patientPayable: billingAggregate.patientPayment.amount,
          status: billingAggregate.status,
          createdAt: billingAggregate.issuedAt
        }
      };

    } catch (error) {
      this.logger.error('Error creating invoice', {
        patientId: request.patientId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        message: 'Lỗi tạo hóa đơn: ' + (error instanceof Error ? error.message : 'Unknown error')
      };
    }
  }

  /**
   * Validate create invoice request
   */
  private validateRequest(request: CreateInvoiceRequest): { isValid: boolean; errors: any[] } {
    const errors: any[] = [];

    if (!request.patientId) {
      errors.push({
        field: 'patientId',
        message: 'Patient ID là bắt buộc',
        code: 'REQUIRED_FIELD'
      });
    }

    if (!request.doctorId) {
      errors.push({
        field: 'doctorId',
        message: 'Doctor ID là bắt buộc',
        code: 'REQUIRED_FIELD'
      });
    }

    if (!request.items || request.items.length === 0) {
      errors.push({
        field: 'items',
        message: 'Ít nhất một item là bắt buộc',
        code: 'REQUIRED_FIELD'
      });
    }

    if (!request.issuedBy) {
      errors.push({
        field: 'issuedBy',
        message: 'Người tạo hóa đơn là bắt buộc',
        code: 'REQUIRED_FIELD'
      });
    }

    // Validate items
    request.items?.forEach((item, index) => {
      if (!item.description) {
        errors.push({
          field: `items[${index}].description`,
          message: 'Mô tả item là bắt buộc',
          code: 'REQUIRED_FIELD'
        });
      }

      if (item.quantity <= 0) {
        errors.push({
          field: `items[${index}].quantity`,
          message: 'Số lượng phải lớn hơn 0',
          code: 'INVALID_VALUE'
        });
      }

      if (item.unitPrice <= 0) {
        errors.push({
          field: `items[${index}].unitPrice`,
          message: 'Đơn giá phải lớn hơn 0',
          code: 'INVALID_VALUE'
        });
      }
    });

    // Validate insurance if provided
    if (request.insurance) {
      if (!request.insurance.number) {
        errors.push({
          field: 'insurance.number',
          message: 'Số bảo hiểm là bắt buộc',
          code: 'REQUIRED_FIELD'
        });
      }

      if (!request.insurance.validUntil || request.insurance.validUntil < new Date()) {
        errors.push({
          field: 'insurance.validUntil',
          message: 'Bảo hiểm đã hết hạn',
          code: 'EXPIRED_INSURANCE'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate unique invoice ID
   */
  private async generateInvoiceId(): Promise<InvoiceId> {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const sequence = await this.billingRepository.getNextSequenceNumber(year, month);
    return InvoiceId.generateForMonth(year, month, sequence);
  }

  /**
   * Create billing items from request
   */
  private createBillingItems(items: CreateInvoiceRequest['items']): BillingItem[] {
    return items.map((item, index) => ({
      id: `item-${Date.now()}-${index}`,
      description: item.description,
      vietnameseDescription: item.vietnameseDescription,
      quantity: item.quantity,
      unitPrice: Money.create(item.unitPrice, 'VND'),
      totalPrice: Money.create(item.unitPrice * item.quantity, 'VND'),
      category: item.category,
      taxable: item.taxable,
      insuranceCoverable: item.insuranceCoverable,
      serviceCode: item.serviceCode
    }));
  }

  /**
   * Create insurance from request
   */
  private createInsurance(insuranceData: CreateInvoiceRequest['insurance']): Insurance {
    if (!insuranceData) {
      return Insurance.createSelfPay();
    }

    const { type, number, validUntil, coverageLevel } = insuranceData;

    switch (type) {
      case 'BHYT':
        return Insurance.createBHYT(
          number,
          validUntil || new Date(),
          coverageLevel || 100,
          insuranceData.beneficiaryType || 'GENERAL',
          insuranceData.issuedBy || 'BHXH'
        );

      case 'BHTN':
        return Insurance.createBHTN(
          number,
          validUntil || new Date(),
          insuranceData.accidentType || 'WORK_RELATED',
          insuranceData.accidentDate || new Date(),
          insuranceData.employerInfo
        );

      case 'PRIVATE':
        return Insurance.createPrivate(
          number,
          validUntil || new Date(),
          coverageLevel || 80,
          insuranceData.insuranceCompany || 'Unknown',
          insuranceData.policyType || 'STANDARD'
        );

      case 'SELF_PAY':
      default:
        return Insurance.createSelfPay();
    }
  }

  /**
   * Calculate default due date (30 days from now)
   */
  private calculateDefaultDueDate(): Date {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    return dueDate;
  }
}
