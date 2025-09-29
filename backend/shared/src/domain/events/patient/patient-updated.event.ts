/**
 * Patient Updated Domain Event
 * Raised when patient information is updated
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance DDD, Event Sourcing, HIPAA
 */

import { DomainEvent } from '../domain-event';

export interface PatientUpdatedEventData {
  patientId: string;
  updatedFields: {
    personalInfo?: {
      old: any;
      new: any;
    };
    contactInfo?: {
      old: any;
      new: any;
    };
    medicalInfo?: {
      old: any;
      new: any;
    };
    emergencyContact?: any;
    insuranceInfo?: any;
  };
  updatedAt: Date;
  updatedBy?: string;
  updateReason?: string;
}

/**
 * Patient Updated Domain Event
 * Contains information about what fields were updated
 */
export class PatientUpdatedEvent extends DomainEvent {
  private readonly eventData: PatientUpdatedEventData;

  constructor(
    eventData: PatientUpdatedEventData,
    correlationId?: string,
    causationId?: string,
    userId?: string
  ) {
    super(
      'PatientUpdated',
      eventData.patientId,
      'Patient',
      eventData,
      1,
      correlationId,
      causationId,
      userId
    );
    this.eventData = eventData;
  }

  /**
   * Get event data payload
   */
  public getEventData(): PatientUpdatedEventData {
    return this.eventData;
  }

  /**
   * Check if event contains PHI (Protected Health Information)
   */
  public containsPHI(): boolean {
    return true; // Patient updates always contain PHI
  }

  /**
   * Get patient ID from event
   */
  public getPatientId(): string {
    return this.eventData.patientId;
  }

  /**
   * Get event description for audit logs
   */
  public getEventDescription(): string {
    const updatedFields = this.getUpdatedFieldNames();
    return `Thông tin bệnh nhân ${this.eventData.patientId} đã được cập nhật: ${updatedFields.join(', ')}`;
  }

  /**
   * Get list of updated field names
   */
  public getUpdatedFieldNames(): string[] {
    const fieldNames: string[] = [];
    
    if (this.eventData.updatedFields.personalInfo) {
      fieldNames.push('Thông tin cá nhân');
    }
    if (this.eventData.updatedFields.contactInfo) {
      fieldNames.push('Thông tin liên hệ');
    }
    if (this.eventData.updatedFields.medicalInfo) {
      fieldNames.push('Thông tin y tế');
    }
    if (this.eventData.updatedFields.emergencyContact) {
      fieldNames.push('Người liên hệ khẩn cấp');
    }
    if (this.eventData.updatedFields.insuranceInfo) {
      fieldNames.push('Thông tin bảo hiểm');
    }

    return fieldNames;
  }

  /**
   * Check if personal information was updated
   */
  public isPersonalInfoUpdated(): boolean {
    return !!this.eventData.updatedFields.personalInfo;
  }

  /**
   * Check if contact information was updated
   */
  public isContactInfoUpdated(): boolean {
    return !!this.eventData.updatedFields.contactInfo;
  }

  /**
   * Check if medical information was updated
   */
  public isMedicalInfoUpdated(): boolean {
    return !!this.eventData.updatedFields.medicalInfo;
  }

  /**
   * Check if emergency contact was updated
   */
  public isEmergencyContactUpdated(): boolean {
    return !!this.eventData.updatedFields.emergencyContact;
  }

  /**
   * Check if insurance information was updated
   */
  public isInsuranceInfoUpdated(): boolean {
    return !!this.eventData.updatedFields.insuranceInfo;
  }

  /**
   * Get detailed changes for personal info
   */
  public getPersonalInfoChanges(): { field: string; oldValue: any; newValue: any }[] {
    if (!this.eventData.updatedFields.personalInfo) return [];

    const changes: { field: string; oldValue: any; newValue: any }[] = [];
    const oldInfo = this.eventData.updatedFields.personalInfo.old;
    const newInfo = this.eventData.updatedFields.personalInfo.new;

    // Compare each field
    const fieldsToCheck = [
      { key: 'fullName', label: 'Họ tên' },
      { key: 'dateOfBirth', label: 'Ngày sinh' },
      { key: 'gender', label: 'Giới tính' },
      { key: 'nationalId', label: 'CMND/CCCD' },
      { key: 'nationality', label: 'Quốc tịch' },
      { key: 'occupation', label: 'Nghề nghiệp' },
      { key: 'maritalStatus', label: 'Tình trạng hôn nhân' }
    ];

    for (const field of fieldsToCheck) {
      if (oldInfo[field.key] !== newInfo[field.key]) {
        changes.push({
          field: field.label,
          oldValue: oldInfo[field.key],
          newValue: newInfo[field.key]
        });
      }
    }

    return changes;
  }

  /**
   * Get detailed changes for contact info
   */
  public getContactInfoChanges(): { field: string; oldValue: any; newValue: any }[] {
    if (!this.eventData.updatedFields.contactInfo) return [];

    const changes: { field: string; oldValue: any; newValue: any }[] = [];
    const oldInfo = this.eventData.updatedFields.contactInfo.old;
    const newInfo = this.eventData.updatedFields.contactInfo.new;

    const fieldsToCheck = [
      { key: 'phoneNumber', label: 'Số điện thoại' },
      { key: 'email', label: 'Email' },
      { key: 'preferredContactMethod', label: 'Phương thức liên hệ ưa thích' }
    ];

    for (const field of fieldsToCheck) {
      if (oldInfo[field.key] !== newInfo[field.key]) {
        changes.push({
          field: field.label,
          oldValue: oldInfo[field.key],
          newValue: newInfo[field.key]
        });
      }
    }

    // Check address changes
    if (JSON.stringify(oldInfo.address) !== JSON.stringify(newInfo.address)) {
      changes.push({
        field: 'Địa chỉ',
        oldValue: oldInfo.address,
        newValue: newInfo.address
      });
    }

    return changes;
  }

  /**
   * Get detailed changes for medical info
   */
  public getMedicalInfoChanges(): { field: string; oldValue: any; newValue: any }[] {
    if (!this.eventData.updatedFields.medicalInfo) return [];

    const changes: { field: string; oldValue: any; newValue: any }[] = [];
    const oldInfo = this.eventData.updatedFields.medicalInfo.old;
    const newInfo = this.eventData.updatedFields.medicalInfo.new;

    const fieldsToCheck = [
      { key: 'bloodType', label: 'Nhóm máu' },
      { key: 'medicalHistory', label: 'Tiền sử bệnh' },
      { key: 'familyMedicalHistory', label: 'Tiền sử gia đình' },
      { key: 'smokingStatus', label: 'Tình trạng hút thuốc' },
      { key: 'alcoholConsumption', label: 'Sử dụng rượu bia' },
      { key: 'exerciseFrequency', label: 'Tần suất tập thể dục' }
    ];

    for (const field of fieldsToCheck) {
      if (oldInfo[field.key] !== newInfo[field.key]) {
        changes.push({
          field: field.label,
          oldValue: oldInfo[field.key],
          newValue: newInfo[field.key]
        });
      }
    }

    // Check array fields
    const arrayFields = [
      { key: 'allergies', label: 'Dị ứng' },
      { key: 'chronicConditions', label: 'Bệnh mãn tính' },
      { key: 'currentMedications', label: 'Thuốc đang sử dụng' }
    ];

    for (const field of arrayFields) {
      if (JSON.stringify(oldInfo[field.key]) !== JSON.stringify(newInfo[field.key])) {
        changes.push({
          field: field.label,
          oldValue: oldInfo[field.key],
          newValue: newInfo[field.key]
        });
      }
    }

    return changes;
  }

  /**
   * Get update summary for notifications
   */
  public getUpdateSummary(): {
    patientId: string;
    updatedFields: string[];
    totalChanges: number;
    updatedAt: Date;
    updatedBy?: string;
    hasSignificantChanges: boolean;
  } {
    const personalChanges = this.getPersonalInfoChanges();
    const contactChanges = this.getContactInfoChanges();
    const medicalChanges = this.getMedicalInfoChanges();
    
    const totalChanges = personalChanges.length + contactChanges.length + medicalChanges.length;
    
    // Significant changes include medical info or personal identification
    const hasSignificantChanges = this.isMedicalInfoUpdated() || 
      personalChanges.some(change => ['Họ tên', 'Ngày sinh', 'CMND/CCCD'].includes(change.field));

    return {
      patientId: this.eventData.patientId,
      updatedFields: this.getUpdatedFieldNames(),
      totalChanges,
      updatedAt: this.eventData.updatedAt,
      updatedBy: this.eventData.updatedBy,
      hasSignificantChanges,
    };
  }

  /**
   * Check if update requires additional verification
   */
  public requiresAdditionalVerification(): boolean {
    // Critical fields that require verification
    const personalChanges = this.getPersonalInfoChanges();
    const criticalFields = ['Họ tên', 'Ngày sinh', 'CMND/CCCD'];
    
    return personalChanges.some(change => criticalFields.includes(change.field));
  }

  /**
   * Get HIPAA audit information
   */
  public getHIPAAAuditInfo(): {
    accessReason: string;
    dataModified: string[];
    requiresPatientNotification: boolean;
  } {
    const dataModified = this.getUpdatedFieldNames();
    
    // Patient should be notified of significant changes
    const requiresPatientNotification = this.requiresAdditionalVerification() || 
      this.isMedicalInfoUpdated();

    return {
      accessReason: this.eventData.updateReason || 'Cập nhật thông tin bệnh nhân',
      dataModified,
      requiresPatientNotification,
    };
  }
}
