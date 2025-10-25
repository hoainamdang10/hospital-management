/**
 * BillingIntegrationEvents - Application Layer
 * Integration events for billing service communication
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture, HIPAA
 */

import { IntegrationEvent } from '@shared/domain/base/domain-event';

/**
 * Medical Record Completed Event
 * Triggered when a medical record is completed and ready for billing
 */
export class MedicalRecordCompletedEvent extends IntegrationEvent {
  constructor(
    public readonly recordId: string,
    public readonly patientId: string,
    public readonly doctorId: string,
    public readonly appointmentId: string,
    public readonly visitDate: Date,
    public readonly diagnoses: Array<{
      code: string;
      display: string;
      category: string;
      severity: string;
      isPrimary: boolean;
    }>,
    public readonly medications: Array<{
      code: string;
      name: string;
      dosage: string;
      frequency: string;
      isHighPriority: boolean;
    }>,
    public readonly procedures: Array<{
      code: string;
      display: string;
      performedDate: Date;
      cost?: number;
    }>,
    public readonly billingInfo: {
      insuranceType?: 'BHYT' | 'BHTN' | 'Private' | 'Self-pay';
      insuranceNumber?: string;
      insuranceValidUntil?: Date;
      estimatedCost?: number;
      priority: 'routine' | 'urgent' | 'emergency';
      specialtyCode?: string;
      hospitalCode?: string;
    },
    public readonly completedBy: string,
    public readonly completedAt: Date = new Date()
  ) {
    super(
      'medical-record.completed',
      'clinical-emr-service',
      recordId,
      'MedicalRecord',
      {
        recordId,
        patientId,
        doctorId,
        appointmentId,
        visitDate: visitDate.toISOString(),
        diagnoses,
        medications,
        procedures,
        billingInfo,
        completedBy,
        completedAt: completedAt.toISOString(),
        vietnameseMetadata: {
          recordType: 'Hồ sơ bệnh án',
          status: 'Hoàn thành',
          billingRequired: 'Cần thanh toán'
        }
      },
      'billing-service',
      undefined,
      completedBy
    );
  }

  getEventData(): any {
    return {
      recordId: this.recordId,
      patientId: this.patientId,
      doctorId: this.doctorId,
      appointmentId: this.appointmentId,
      visitDate: this.visitDate,
      diagnoses: this.diagnoses,
      medications: this.medications,
      procedures: this.procedures,
      billingInfo: this.billingInfo,
      completedBy: this.completedBy,
      completedAt: this.completedAt
    };
  }

  containsPHI(): boolean {
    return true;
  }

  getPatientId(): string | null {
    return this.patientId;
  }

  /**
   * Get billing priority
   */
  getBillingPriority(): 'low' | 'medium' | 'high' | 'critical' {
    if (this.billingInfo.priority === 'emergency') return 'critical';
    if (this.billingInfo.priority === 'urgent') return 'high';
    if (this.diagnoses.some(d => d.severity === 'critical')) return 'high';
    if (this.medications.some(m => m.isHighPriority)) return 'medium';
    return 'low';
  }

  /**
   * Get estimated billing amount
   */
  getEstimatedBillingAmount(): number {
    let total = this.billingInfo.estimatedCost || 0;
    
    // Add procedure costs
    total += this.procedures.reduce((sum, proc) => sum + (proc.cost || 0), 0);
    
    // Add medication costs (estimated)
    total += this.medications.length * 50000; // 50k VND per medication (estimated)
    
    // Add consultation fee based on specialty
    const consultationFee = this.billingInfo.specialtyCode ? 200000 : 150000; // VND
    total += consultationFee;
    
    return total;
  }

  /**
   * Check if insurance coverage applies
   */
  hasInsuranceCoverage(): boolean {
    return !!(this.billingInfo.insuranceType && 
             this.billingInfo.insuranceNumber &&
             this.billingInfo.insuranceValidUntil &&
             this.billingInfo.insuranceValidUntil > new Date());
  }

  /**
   * Get Vietnamese summary
   */
  getVietnameseSummary(): string {
    const diagnosisCount = this.diagnoses.length;
    const medicationCount = this.medications.length;
    const procedureCount = this.procedures.length;
    
    return `Hồ sơ bệnh án ${this.recordId} đã hoàn thành với ${diagnosisCount} chẩn đoán, ${medicationCount} thuốc, và ${procedureCount} thủ thuật. Cần tạo hóa đơn thanh toán.`;
  }
}

/**
 * Medical Record Updated Event
 * Triggered when a medical record is updated and may affect billing
 */
export class MedicalRecordUpdatedForBillingEvent extends IntegrationEvent {
  constructor(
    public readonly recordId: string,
    public readonly patientId: string,
    public readonly changes: {
      addedDiagnoses?: Array<{ code: string; display: string; cost?: number }>;
      removedDiagnoses?: Array<{ code: string; display: string }>;
      addedMedications?: Array<{ code: string; name: string; cost?: number }>;
      removedMedications?: Array<{ code: string; name: string }>;
      addedProcedures?: Array<{ code: string; display: string; cost?: number }>;
      removedProcedures?: Array<{ code: string; display: string }>;
      statusChange?: { from: string; to: string };
    },
    public readonly billingImpact: {
      costChange: number; // Positive = increase, Negative = decrease
      requiresNewInvoice: boolean;
      requiresInvoiceUpdate: boolean;
      affectsInsuranceClaim: boolean;
    },
    public readonly updatedBy: string,
    public readonly updatedAt: Date = new Date()
  ) {
    super(
      'medical-record.updated-for-billing',
      'clinical-emr-service',
      recordId,
      'MedicalRecord',
      {
        recordId,
        patientId,
        changes,
        billingImpact,
        updatedBy,
        updatedAt: updatedAt.toISOString(),
        vietnameseMetadata: {
          changeType: 'Cập nhật hồ sơ',
          billingImpact: billingImpact.costChange > 0 ? 'Tăng chi phí' : 
                        billingImpact.costChange < 0 ? 'Giảm chi phí' : 'Không thay đổi chi phí'
        }
      },
      'billing-service',
      undefined,
      updatedBy
    );
  }

  getEventData(): any {
    return {
      recordId: this.recordId,
      patientId: this.patientId,
      changes: this.changes,
      billingImpact: this.billingImpact,
      updatedBy: this.updatedBy,
      updatedAt: this.updatedAt
    };
  }

  containsPHI(): boolean {
    return true;
  }

  getPatientId(): string | null {
    return this.patientId;
  }

  /**
   * Get change summary
   */
  getChangeSummary(): string {
    const changes: string[] = [];
    
    if (this.changes.addedDiagnoses?.length) {
      changes.push(`${this.changes.addedDiagnoses.length} chẩn đoán mới`);
    }
    if (this.changes.addedMedications?.length) {
      changes.push(`${this.changes.addedMedications.length} thuốc mới`);
    }
    if (this.changes.addedProcedures?.length) {
      changes.push(`${this.changes.addedProcedures.length} thủ thuật mới`);
    }
    
    return changes.join(', ') || 'Không có thay đổi đáng kể';
  }

  /**
   * Check if requires immediate billing action
   */
  requiresImmediateBillingAction(): boolean {
    return this.billingImpact.requiresNewInvoice || 
           (this.billingImpact.costChange > 100000) || // > 100k VND
           this.billingImpact.affectsInsuranceClaim;
  }
}

/**
 * Insurance Verification Required Event
 * Triggered when insurance verification is needed for billing
 */
export class InsuranceVerificationRequiredEvent extends IntegrationEvent {
  constructor(
    public readonly recordId: string,
    public readonly patientId: string,
    public readonly insuranceInfo: {
      type: 'BHYT' | 'BHTN' | 'Private';
      number: string;
      validUntil: Date;
      issuer?: string;
      coverageLevel?: string;
    },
    public readonly verificationReason: 'new_record' | 'expired_coverage' | 'coverage_dispute' | 'high_cost_treatment',
    public readonly estimatedCost: number,
    public readonly urgency: 'low' | 'medium' | 'high' | 'critical',
    public readonly requestedBy: string,
    public readonly requestedAt: Date = new Date()
  ) {
    // Calculate Vietnamese metadata before super() call
    const vietnameseInsuranceType = (() => {
      switch (insuranceInfo.type) {
        case 'BHYT': return 'Bảo hiểm y tế';
        case 'BHTN': return 'Bảo hiểm tai nạn';
        case 'Private': return 'Bảo hiểm tư nhân';
        default: return 'Không xác định';
      }
    })();
    
    const vietnameseVerificationReason = (() => {
      switch (verificationReason) {
        case 'new_record': return 'Hồ sơ mới';
        case 'expired_coverage': return 'Hết hạn bảo hiểm';
        case 'coverage_dispute': return 'Tranh chấp bảo hiểm';
        case 'high_cost_treatment': return 'Điều trị chi phí cao';
        default: return 'Không xác định';
      }
    })();
    
    const vietnameseUrgency = (() => {
      switch (urgency) {
        case 'critical': return 'Khẩn cấp';
        case 'high': return 'Cao';
        case 'medium': return 'Trung bình';
        case 'low': return 'Thấp';
        default: return 'Không xác định';
      }
    })();
    
    super(
      'clinical-emr.insurance.verification-required',
      `${recordId}-${insuranceInfo.number}`,
      {
        recordId,
        patientId,
        insuranceInfo: {
          ...insuranceInfo,
          validUntil: insuranceInfo.validUntil.toISOString()
        },
        verificationReason,
        estimatedCost,
        urgency,
        requestedBy,
        requestedAt: requestedAt.toISOString(),
        vietnameseMetadata: {
          insuranceType: vietnameseInsuranceType,
          verificationReason: vietnameseVerificationReason,
          urgencyLevel: vietnameseUrgency
        }
      }
    );
  }

  /**
   * Get Vietnamese insurance type
   */
  private getVietnameseInsuranceType(): string {
    switch (this.insuranceInfo.type) {
      case 'BHYT': return 'Bảo hiểm y tế';
      case 'BHTN': return 'Bảo hiểm tai nạn';
      case 'Private': return 'Bảo hiểm tư nhân';
      default: return 'Không xác định';
    }
  }

  /**
   * Get Vietnamese verification reason
   */
  private getVietnameseVerificationReason(): string {
    switch (this.verificationReason) {
      case 'new_record': return 'Hồ sơ mới';
      case 'expired_coverage': return 'Bảo hiểm hết hạn';
      case 'coverage_dispute': return 'Tranh chấp bảo hiểm';
      case 'high_cost_treatment': return 'Điều trị chi phí cao';
      default: return 'Không xác định';
    }
  }

  /**
   * Get Vietnamese urgency
   */
  private getVietnameseUrgency(): string {
    switch (this.urgency) {
      case 'critical': return 'Khẩn cấp';
      case 'high': return 'Cao';
      case 'medium': return 'Trung bình';
      case 'low': return 'Thấp';
      default: return 'Không xác định';
    }
  }

  /**
   * Check if verification is time-sensitive
   */
  isTimeSensitive(): boolean {
    return this.urgency === 'critical' || 
           this.urgency === 'high' ||
           this.verificationReason === 'expired_coverage';
  }

  /**
   * Get maximum verification time (in hours)
   */
  getMaxVerificationTime(): number {
    switch (this.urgency) {
      case 'critical': return 1; // 1 hour
      case 'high': return 4; // 4 hours
      case 'medium': return 24; // 24 hours
      case 'low': return 72; // 72 hours
      default: return 24;
    }
  }
}

/**
 * Payment Required Event
 * Triggered when payment is required for a medical record
 */
export class PaymentRequiredEvent extends IntegrationEvent {
  constructor(
    public readonly recordId: string,
    public readonly patientId: string,
    public readonly paymentInfo: {
      totalAmount: number;
      insuranceCovered: number;
      patientResponsible: number;
      currency: 'VND';
      dueDate: Date;
      paymentMethods: Array<'cash' | 'card' | 'bank_transfer' | 'insurance_direct'>;
      invoiceNumber?: string;
    },
    public readonly itemizedCharges: Array<{
      description: string;
      code?: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      category: 'consultation' | 'medication' | 'procedure' | 'test' | 'other';
    }>,
    public readonly priority: 'routine' | 'urgent' | 'immediate',
    public readonly generatedBy: string,
    public readonly generatedAt: Date = new Date()
  ) {
    // Calculate Vietnamese metadata before super() call
    const formatVietnameseCurrency = (amount: number): string => {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(amount);
    };
    
    const vietnamesePriority = (() => {
      switch (priority) {
        case 'immediate': return 'Ngay lập tức';
        case 'urgent': return 'Khẩn cấp';
        case 'routine': return 'Thường quy';
        default: return 'Không xác định';
      }
    })();
    
    super(
      'clinical-emr.payment.required',
      `${recordId}-payment`,
      {
        recordId,
        patientId,
        paymentInfo: {
          ...paymentInfo,
          dueDate: paymentInfo.dueDate.toISOString()
        },
        itemizedCharges,
        priority,
        generatedBy,
        generatedAt: generatedAt.toISOString(),
        vietnameseMetadata: {
          totalAmountVND: formatVietnameseCurrency(paymentInfo.totalAmount),
          patientResponsibleVND: formatVietnameseCurrency(paymentInfo.patientResponsible),
          paymentStatus: 'Cần thanh toán',
          priority: vietnamesePriority
        }
      }
    );
  }

  /**
   * Format Vietnamese currency
   */
  private formatVietnameseCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }

  /**
   * Get Vietnamese priority
   */
  private getVietnamesePriority(): string {
    switch (this.priority) {
      case 'immediate': return 'Ngay lập tức';
      case 'urgent': return 'Khẩn cấp';
      case 'routine': return 'Thường quy';
      default: return 'Không xác định';
    }
  }

  /**
   * Check if payment is overdue
   */
  isOverdue(): boolean {
    return new Date() > this.paymentInfo.dueDate;
  }

  /**
   * Get days until due
   */
  getDaysUntilDue(): number {
    const now = new Date();
    const due = this.paymentInfo.dueDate;
    const diffTime = due.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Get payment summary
   */
  getPaymentSummary(): string {
    const total = this.formatVietnameseCurrency(this.paymentInfo.totalAmount);
    const patient = this.formatVietnameseCurrency(this.paymentInfo.patientResponsible);
    const daysUntilDue = this.getDaysUntilDue();
    
    return `Tổng chi phí: ${total}, Bệnh nhân cần trả: ${patient}, Hạn thanh toán: ${daysUntilDue} ngày`;
  }

  /**
   * Get charge breakdown by category
   */
  getChargeBreakdown(): Record<string, { count: number; total: number }> {
    const breakdown: Record<string, { count: number; total: number }> = {};
    
    this.itemizedCharges.forEach(charge => {
      if (!breakdown[charge.category]) {
        breakdown[charge.category] = { count: 0, total: 0 };
      }
      breakdown[charge.category].count += charge.quantity;
      breakdown[charge.category].total += charge.totalPrice;
    });
    
    return breakdown;
  }
}
