/**
 * CreateInvoiceCommand - Application Layer
 * Command for creating a new invoice
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, DDD
 */

import { InsuranceType } from '../../domain/value-objects/Insurance';

export interface BillingItemInput {
  description: string;
  vietnameseDescription: string;
  quantity: number;
  unitPrice: number;
  category: 'consultation' | 'medication' | 'procedure' | 'test' | 'room' | 'other';
  taxable?: boolean;
  insuranceCoverable?: boolean;
  medicalRecordId?: string;
  serviceCode?: string;
}

export interface InsuranceInput {
  type: InsuranceType;
  number: string;
  validUntil: Date | string;
  coverageLevel: number;
  issuedBy?: string;
  beneficiaryType?: string;
  accidentType?: string;
  accidentDate?: Date | string;
  employerInfo?: string;
  insuranceCompany?: string;
  policyType?: string;
}

export class CreateInvoiceCommand {
  public readonly patientId: string;
  public readonly medicalRecordId: string;
  public readonly doctorId: string;
  public readonly appointmentId: string;
  public readonly items: BillingItemInput[];
  public readonly insurance?: InsuranceInput;
  public readonly notes?: string;
  public readonly issuedBy: string;
  public readonly dueDate?: Date;
  public readonly currency?: string;

  // Metadata
  public readonly correlationId?: string;
  public readonly causationId?: string;
  public readonly userId?: string;
  public readonly tenantId?: string;

  constructor(data: {
    patientId: string;
    medicalRecordId: string;
    doctorId: string;
    appointmentId: string;
    items: BillingItemInput[];
    insurance?: InsuranceInput;
    notes?: string;
    issuedBy: string;
    dueDate?: Date;
    currency?: string;
    correlationId?: string;
    causationId?: string;
    userId?: string;
    tenantId?: string;
  }) {
    this.patientId = data.patientId;
    this.medicalRecordId = data.medicalRecordId;
    this.doctorId = data.doctorId;
    this.appointmentId = data.appointmentId;
    this.items = data.items;
    this.insurance = data.insurance;
    this.notes = data.notes;
    this.issuedBy = data.issuedBy;
    this.dueDate = data.dueDate;
    this.currency = data.currency || 'VND';
    this.correlationId = data.correlationId;
    this.causationId = data.causationId;
    this.userId = data.userId;
    this.tenantId = data.tenantId;
  }

  /**
   * Validate command
   */
  public validate(): void {
    const errors: string[] = [];

    if (!this.patientId || this.patientId.trim() === '') {
      errors.push('Patient ID is required');
    }

    if (!this.medicalRecordId || this.medicalRecordId.trim() === '') {
      errors.push('Medical Record ID is required');
    }

    if (!this.doctorId || this.doctorId.trim() === '') {
      errors.push('Doctor ID is required');
    }

    if (!this.appointmentId || this.appointmentId.trim() === '') {
      errors.push('Appointment ID is required');
    }

    if (!this.issuedBy || this.issuedBy.trim() === '') {
      errors.push('Issued by is required');
    }

    if (!this.items || this.items.length === 0) {
      errors.push('At least one billing item is required');
    }

    // Validate billing items
    if (this.items) {
      this.items.forEach((item, index) => {
        if (!item.description || item.description.trim() === '') {
          errors.push(`Item ${index + 1}: Description is required`);
        }

        if (!item.vietnameseDescription || item.vietnameseDescription.trim() === '') {
          errors.push(`Item ${index + 1}: Vietnamese description is required`);
        }

        if (!item.quantity || item.quantity <= 0) {
          errors.push(`Item ${index + 1}: Quantity must be greater than 0`);
        }

        if (!item.unitPrice || item.unitPrice <= 0) {
          errors.push(`Item ${index + 1}: Unit price must be greater than 0`);
        }

        if (!item.category) {
          errors.push(`Item ${index + 1}: Category is required`);
        }
      });
    }

    // Validate insurance if provided
    if (this.insurance) {
      if (!this.insurance.type) {
        errors.push('Insurance type is required');
      }

      if (!this.insurance.number || this.insurance.number.trim() === '') {
        errors.push('Insurance number is required');
      }

      if (!this.insurance.validUntil) {
        errors.push('Insurance valid until date is required');
      }

      if (this.insurance.coverageLevel === undefined ||
          this.insurance.coverageLevel < 0 ||
          this.insurance.coverageLevel > 100) {
        errors.push('Insurance coverage level must be between 0 and 100');
      }
    }

    // Validate due date if provided
    if (this.dueDate) {
      const dueDate = new Date(this.dueDate);
      const now = new Date();

      if (dueDate < now) {
        errors.push('Due date cannot be in the past');
      }
    }

    if (errors.length > 0) {
      throw new Error(`CreateInvoiceCommand validation failed:\n${errors.join('\n')}`);
    }
  }

  /**
   * Check if invoice has insurance
   */
  public hasInsurance(): boolean {
    return !!this.insurance;
  }

  /**
   * Get total quantity of items
   */
  public getTotalQuantity(): number {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  /**
   * Get estimated total amount (without tax/insurance)
   */
  public getEstimatedTotal(): number {
    return this.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  }

  /**
   * Get taxable items count
   */
  public getTaxableItemsCount(): number {
    return this.items.filter(item => item.taxable !== false).length;
  }

  /**
   * Get insurance coverable items count
   */
  public getInsuranceCoverableItemsCount(): number {
    return this.items.filter(item => item.insuranceCoverable !== false).length;
  }

  /**
   * Convert to plain object for logging/serialization
   */
  public toObject(): Record<string, any> {
    return {
      patientId: this.patientId,
      medicalRecordId: this.medicalRecordId,
      doctorId: this.doctorId,
      appointmentId: this.appointmentId,
      itemsCount: this.items.length,
      hasInsurance: this.hasInsurance(),
      notes: this.notes,
      issuedBy: this.issuedBy,
      dueDate: this.dueDate,
      currency: this.currency,
      estimatedTotal: this.getEstimatedTotal(),
      correlationId: this.correlationId,
      causationId: this.causationId,
      userId: this.userId,
      tenantId: this.tenantId
    };
  }
}
