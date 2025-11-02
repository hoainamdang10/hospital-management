/**
 * MedicalRecordUpdatedEvent - Domain Event
 * Published when a medical record is updated
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */

import { DomainEvent } from '@shared/domain/base/domain-event';

export interface MedicalRecordUpdatedEventData {
  recordId: string;
  patientId: string;
  doctorId: string;
  updatedFields: string[];
  previousValues?: Record<string, any>;
  newValues?: Record<string, any>;
  updatedBy: string;
  updatedAt: Date;
  updateReason?: string;
}

export class MedicalRecordUpdatedEvent extends DomainEvent {
  public readonly recordId: string;
  public readonly patientId: string;
  public readonly doctorId: string;
  public readonly updatedFields: string[];
  public readonly previousValues?: Record<string, any>;
  public readonly newValues?: Record<string, any>;
  public readonly updatedBy: string;
  public readonly updateReason?: string;

  constructor(data: MedicalRecordUpdatedEventData) {
    super(
      'MedicalRecordUpdated',
      data.recordId,
      'MedicalRecord',
      {
        recordId: data.recordId,
        patientId: data.patientId,
        doctorId: data.doctorId,
        updatedFields: data.updatedFields,
        previousValues: data.previousValues,
        newValues: data.newValues,
        updatedBy: data.updatedBy,
        updatedAt: data.updatedAt.toISOString(),
        updateReason: data.updateReason
      },
      1, // eventVersion
      undefined, // correlationId
      undefined, // causationId
      data.updatedBy, // userId
      {
        priority: 'normal',
        source: 'healthcare-domain',
        complianceLevel: 'HIPAA',
        retryable: true
      }
    );

    this.recordId = data.recordId;
    this.patientId = data.patientId;
    this.doctorId = data.doctorId;
    this.updatedFields = data.updatedFields;
    this.previousValues = data.previousValues;
    this.newValues = data.newValues;
    this.updatedBy = data.updatedBy;
    this.updateReason = data.updateReason;
  }

  getEventData(): any {
    return {
      recordId: this.recordId,
      patientId: this.patientId,
      doctorId: this.doctorId,
      updatedFields: this.updatedFields,
      previousValues: this.previousValues,
      newValues: this.newValues,
      updatedBy: this.updatedBy,
      updateReason: this.updateReason
    };
  }

  containsPHI(): boolean {
    return true;
  }

  getPatientId(): string | null {
    return this.patientId;
  }

  /**
   * Get event summary in Vietnamese
   */
  public getVietnameseSummary(): string {
    const fieldsText = this.getUpdatedFieldsInVietnamese().join(', ');
    return `Hồ sơ bệnh án ${this.recordId} đã được cập nhật: ${fieldsText}`;
  }

  /**
   * Get updated fields in Vietnamese
   */
  public getUpdatedFieldsInVietnamese(): string[] {
    const fieldTranslations: Record<string, string> = {
      symptoms: 'triệu chứng',
      examinationNotes: 'ghi chú khám bệnh',
      diagnosis: 'chẩn đoán',
      treatment: 'điều trị',
      medications: 'thuốc',
      notes: 'ghi chú',
      vitalSigns: 'sinh hiệu',
      temperature: 'nhiệt độ',
      bloodPressure: 'huyết áp',
      heartRate: 'nhịp tim',
      weight: 'cân nặng',
      height: 'chiều cao'
    };

    return this.updatedFields.map(field => 
      fieldTranslations[field] || field
    );
  }

  /**
   * Check if critical fields were updated
   */
  public hasCriticalUpdates(): boolean {
    const criticalFields = ['diagnosis', 'treatment', 'medications'];
    return this.updatedFields.some(field => criticalFields.includes(field));
  }

  /**
   * Check if vital signs were updated
   */
  public hasVitalSignsUpdates(): boolean {
    const vitalSignsFields = ['vitalSigns', 'temperature', 'bloodPressure', 'heartRate', 'weight', 'height'];
    return this.updatedFields.some(field => vitalSignsFields.includes(field));
  }

  /**
   * Get notification message for patient
   */
  public getPatientNotificationMessage(): string {
    if (this.hasCriticalUpdates()) {
      return `Hồ sơ khám bệnh của bạn đã được cập nhật với thông tin quan trọng. Mã hồ sơ: ${this.recordId}`;
    }
    return `Hồ sơ khám bệnh của bạn đã được cập nhật. Mã hồ sơ: ${this.recordId}`;
  }

  /**
   * Get notification message for doctor
   */
  public getDoctorNotificationMessage(): string {
    const fieldsText = this.getUpdatedFieldsInVietnamese().join(', ');
    return `Bạn đã cập nhật hồ sơ bệnh án ${this.recordId}: ${fieldsText}`;
  }

  /**
   * Check if event should trigger notifications
   */
  public shouldTriggerNotifications(): boolean {
    return this.hasCriticalUpdates(); // Only notify for critical updates
  }

  /**
   * Check if event should trigger audit log
   */
  public shouldTriggerAuditLog(): boolean {
    return true; // Always audit medical record updates
  }

  /**
   * Get change summary
   */
  public getChangeSummary(): string {
    const changes: string[] = [];
    
    for (const field of this.updatedFields) {
      const previousValue = this.previousValues?.[field];
      const newValue = this.newValues?.[field];
      
      if (previousValue !== undefined && newValue !== undefined) {
        changes.push(`${field}: "${previousValue}" → "${newValue}"`);
      } else if (newValue !== undefined) {
        changes.push(`${field}: được thêm "${newValue}"`);
      } else if (previousValue !== undefined) {
        changes.push(`${field}: "${previousValue}" được xóa`);
      }
    }
    
    return changes.join('; ');
  }

  /**
   * Get integration event data for other services
   */
  public getIntegrationEventData(): any {
    return {
      eventType: 'clinical.medical_record_updated',
      eventVersion: '1.0',
      eventId: this.eventId,
      aggregateId: this.aggregateId,
      aggregateType: this.aggregateType,
      occurredAt: this.occurredAt.toISOString(),
      data: {
        recordId: this.recordId,
        patientId: this.patientId,
        doctorId: this.doctorId,
        updatedFields: this.updatedFields,
        hasCriticalUpdates: this.hasCriticalUpdates(),
        hasVitalSignsUpdates: this.hasVitalSignsUpdates(),
        updatedBy: this.updatedBy,
        updateReason: this.updateReason,
        changeSummary: this.getChangeSummary()
      },
      metadata: {
        priority: this.hasCriticalUpdates() ? 'high' : 'medium',
        complianceLevel: 'hipaa',
        containsPHI: true,
        patientId: this.patientId,
        eventCategory: 'clinical',
        eventSubcategory: 'medical_record_update',
        vietnameseDescription: 'Hồ sơ bệnh án được cập nhật',
        correlationId: this.correlationId,
        causationId: this.causationId
      }
    };
  }

  /**
   * Get audit trail data
   */
  public getAuditTrailData(): any {
    return {
      eventType: 'MEDICAL_RECORD_UPDATED',
      eventId: this.eventId,
      aggregateId: this.aggregateId,
      aggregateType: this.aggregateType,
      occurredAt: this.occurredAt,
      userId: this.updatedBy,
      patientId: this.patientId,
      action: 'UPDATE',
      resource: 'MedicalRecord',
      resourceId: this.recordId,
      details: {
        doctorId: this.doctorId,
        updatedFields: this.updatedFields,
        previousValues: this.previousValues,
        newValues: this.newValues,
        updateReason: this.updateReason,
        hasCriticalUpdates: this.hasCriticalUpdates(),
        changeSummary: this.getChangeSummary()
      },
      complianceLevel: 'HIPAA',
      vietnameseDescription: 'Cập nhật hồ sơ bệnh án'
    };
  }

  /**
   * Serialize event for message queue
   */
  public serialize(): string {
    return JSON.stringify(this.getIntegrationEventData());
  }

  /**
   * Deserialize event from message queue
   */
  public static deserialize(data: string): MedicalRecordUpdatedEvent {
    const eventData = JSON.parse(data);
    return new MedicalRecordUpdatedEvent({
      recordId: eventData.data.recordId,
      patientId: eventData.data.patientId,
      doctorId: eventData.data.doctorId,
      updatedFields: eventData.data.updatedFields,
      updatedBy: eventData.data.updatedBy,
      updatedAt: new Date(eventData.occurredAt),
      updateReason: eventData.data.updateReason
    });
  }

}
