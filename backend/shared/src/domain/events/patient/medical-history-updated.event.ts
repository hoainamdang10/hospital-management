/**
 * Medical History Updated Domain Event
 * Raised when patient medical history is updated
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance DDD, Event Sourcing, HIPAA, FHIR
 */

import { DomainEvent } from '../domain-event';

export interface MedicalHistoryUpdatedEventData {
  patientId: string;
  medicalInfo: {
    old: {
      bloodType?: string;
      allergies: string[];
      chronicConditions: string[];
      currentMedications: any[];
      medicalHistory?: string;
      familyMedicalHistory?: string;
      smokingStatus?: string;
      alcoholConsumption?: string;
      exerciseFrequency?: string;
    };
    new: {
      bloodType?: string;
      allergies: string[];
      chronicConditions: string[];
      currentMedications: any[];
      medicalHistory?: string;
      familyMedicalHistory?: string;
      smokingStatus?: string;
      alcoholConsumption?: string;
      exerciseFrequency?: string;
    };
  };
  updatedAt: Date;
  updatedBy?: string;
  updateReason?: string;
  clinicalSignificance?: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Medical History Updated Domain Event
 * Contains detailed information about medical history changes
 */
export class MedicalHistoryUpdatedEvent extends DomainEvent {
  private readonly eventData: MedicalHistoryUpdatedEventData;

  constructor(
    eventData: MedicalHistoryUpdatedEventData,
    correlationId?: string,
    causationId?: string,
    userId?: string
  ) {
    super(
      'MedicalHistoryUpdated',
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
  public getEventData(): MedicalHistoryUpdatedEventData {
    return this.eventData;
  }

  /**
   * Check if event contains PHI (Protected Health Information)
   */
  public containsPHI(): boolean {
    return true; // Medical history always contains PHI
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
    const changes = this.getMedicalChanges();
    const changeDescriptions = changes.map(change => change.field).join(', ');
    return `Tiền sử y tế của bệnh nhân ${this.eventData.patientId} đã được cập nhật: ${changeDescriptions}`;
  }

  /**
   * Get detailed medical changes
   */
  public getMedicalChanges(): { field: string; oldValue: any; newValue: any; significance: string }[] {
    const changes: { field: string; oldValue: any; newValue: any; significance: string }[] = [];
    const oldInfo = this.eventData.medicalInfo.old;
    const newInfo = this.eventData.medicalInfo.new;

    // Blood type change (critical)
    if (oldInfo.bloodType !== newInfo.bloodType) {
      changes.push({
        field: 'Nhóm máu',
        oldValue: oldInfo.bloodType,
        newValue: newInfo.bloodType,
        significance: 'critical'
      });
    }

    // Allergies changes (high significance)
    if (JSON.stringify(oldInfo.allergies) !== JSON.stringify(newInfo.allergies)) {
      changes.push({
        field: 'Dị ứng',
        oldValue: oldInfo.allergies,
        newValue: newInfo.allergies,
        significance: 'high'
      });
    }

    // Chronic conditions changes (high significance)
    if (JSON.stringify(oldInfo.chronicConditions) !== JSON.stringify(newInfo.chronicConditions)) {
      changes.push({
        field: 'Bệnh mãn tính',
        oldValue: oldInfo.chronicConditions,
        newValue: newInfo.chronicConditions,
        significance: 'high'
      });
    }

    // Current medications changes (high significance)
    if (JSON.stringify(oldInfo.currentMedications) !== JSON.stringify(newInfo.currentMedications)) {
      changes.push({
        field: 'Thuốc đang sử dụng',
        oldValue: oldInfo.currentMedications,
        newValue: newInfo.currentMedications,
        significance: 'high'
      });
    }

    // Medical history changes (medium significance)
    if (oldInfo.medicalHistory !== newInfo.medicalHistory) {
      changes.push({
        field: 'Tiền sử bệnh',
        oldValue: oldInfo.medicalHistory,
        newValue: newInfo.medicalHistory,
        significance: 'medium'
      });
    }

    // Family medical history changes (medium significance)
    if (oldInfo.familyMedicalHistory !== newInfo.familyMedicalHistory) {
      changes.push({
        field: 'Tiền sử gia đình',
        oldValue: oldInfo.familyMedicalHistory,
        newValue: newInfo.familyMedicalHistory,
        significance: 'medium'
      });
    }

    // Lifestyle changes (low to medium significance)
    const lifestyleFields = [
      { key: 'smokingStatus', label: 'Tình trạng hút thuốc', significance: 'medium' },
      { key: 'alcoholConsumption', label: 'Sử dụng rượu bia', significance: 'medium' },
      { key: 'exerciseFrequency', label: 'Tần suất tập thể dục', significance: 'low' }
    ];

    for (const field of lifestyleFields) {
      if (oldInfo[field.key as keyof typeof oldInfo] !== newInfo[field.key as keyof typeof newInfo]) {
        changes.push({
          field: field.label,
          oldValue: oldInfo[field.key as keyof typeof oldInfo],
          newValue: newInfo[field.key as keyof typeof newInfo],
          significance: field.significance
        });
      }
    }

    return changes;
  }

  /**
   * Get clinical significance of the update
   */
  public getClinicalSignificance(): 'low' | 'medium' | 'high' | 'critical' {
    if (this.eventData.clinicalSignificance) {
      return this.eventData.clinicalSignificance;
    }

    const changes = this.getMedicalChanges();
    
    // Determine significance based on changes
    if (changes.some(change => change.significance === 'critical')) {
      return 'critical';
    }
    if (changes.some(change => change.significance === 'high')) {
      return 'high';
    }
    if (changes.some(change => change.significance === 'medium')) {
      return 'medium';
    }
    
    return 'low';
  }

  /**
   * Get new allergies added
   */
  public getNewAllergies(): string[] {
    const oldAllergies = this.eventData.medicalInfo.old.allergies || [];
    const newAllergies = this.eventData.medicalInfo.new.allergies || [];
    
    return newAllergies.filter(allergy => !oldAllergies.includes(allergy));
  }

  /**
   * Get removed allergies
   */
  public getRemovedAllergies(): string[] {
    const oldAllergies = this.eventData.medicalInfo.old.allergies || [];
    const newAllergies = this.eventData.medicalInfo.new.allergies || [];
    
    return oldAllergies.filter(allergy => !newAllergies.includes(allergy));
  }

  /**
   * Get new chronic conditions added
   */
  public getNewChronicConditions(): string[] {
    const oldConditions = this.eventData.medicalInfo.old.chronicConditions || [];
    const newConditions = this.eventData.medicalInfo.new.chronicConditions || [];
    
    return newConditions.filter(condition => !oldConditions.includes(condition));
  }

  /**
   * Get removed chronic conditions
   */
  public getRemovedChronicConditions(): string[] {
    const oldConditions = this.eventData.medicalInfo.old.chronicConditions || [];
    const newConditions = this.eventData.medicalInfo.new.chronicConditions || [];
    
    return oldConditions.filter(condition => !newConditions.includes(condition));
  }

  /**
   * Get medication changes
   */
  public getMedicationChanges(): {
    added: any[];
    removed: any[];
    modified: any[];
  } {
    const oldMeds = this.eventData.medicalInfo.old.currentMedications || [];
    const newMeds = this.eventData.medicalInfo.new.currentMedications || [];

    const added = newMeds.filter(newMed => 
      !oldMeds.some(oldMed => oldMed.name === newMed.name)
    );

    const removed = oldMeds.filter(oldMed => 
      !newMeds.some(newMed => newMed.name === oldMed.name)
    );

    const modified = newMeds.filter(newMed => {
      const oldMed = oldMeds.find(old => old.name === newMed.name);
      return oldMed && (
        oldMed.dosage !== newMed.dosage || 
        oldMed.frequency !== newMed.frequency
      );
    });

    return { added, removed, modified };
  }

  /**
   * Check if update requires immediate clinical attention
   */
  public requiresImmediateClinicalAttention(): boolean {
    const significance = this.getClinicalSignificance();
    
    if (significance === 'critical') return true;
    
    // Check for specific high-risk changes
    const newAllergies = this.getNewAllergies();
    const newConditions = this.getNewChronicConditions();
    const medicationChanges = this.getMedicationChanges();
    
    // New severe allergies
    const severeAllergies = ['penicillin', 'latex', 'shellfish', 'nuts'];
    if (newAllergies.some(allergy => 
      severeAllergies.some(severe => allergy.toLowerCase().includes(severe))
    )) {
      return true;
    }

    // New critical conditions
    const criticalConditions = ['diabetes', 'heart disease', 'kidney disease', 'liver disease'];
    if (newConditions.some(condition => 
      criticalConditions.some(critical => condition.toLowerCase().includes(critical))
    )) {
      return true;
    }

    // High-risk medication changes
    if (medicationChanges.added.length > 3 || medicationChanges.removed.length > 2) {
      return true;
    }

    return false;
  }

  /**
   * Get required notifications
   */
  public getRequiredNotifications(): {
    recipient: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    message: string;
  }[] {
    const notifications: {
      recipient: string;
      priority: 'low' | 'medium' | 'high' | 'urgent';
      message: string;
    }[] = [];

    const significance = this.getClinicalSignificance();
    const changes = this.getMedicalChanges();

    // Primary care physician notification
    if (significance === 'critical' || significance === 'high') {
      notifications.push({
        recipient: 'primary_care_physician',
        priority: significance === 'critical' ? 'urgent' : 'high',
        message: `Tiền sử y tế của bệnh nhân ${this.eventData.patientId} đã được cập nhật với thông tin quan trọng`
      });
    }

    // Pharmacy notification for medication changes
    const medicationChanges = this.getMedicationChanges();
    if (medicationChanges.added.length > 0 || medicationChanges.removed.length > 0 || medicationChanges.modified.length > 0) {
      notifications.push({
        recipient: 'pharmacy',
        priority: 'medium',
        message: `Danh sách thuốc của bệnh nhân ${this.eventData.patientId} đã được cập nhật`
      });
    }

    // Allergy alert for new allergies
    const newAllergies = this.getNewAllergies();
    if (newAllergies.length > 0) {
      notifications.push({
        recipient: 'clinical_staff',
        priority: 'high',
        message: `Bệnh nhân ${this.eventData.patientId} có dị ứng mới: ${newAllergies.join(', ')}`
      });
    }

    // Patient notification for significant changes
    if (significance === 'high' || significance === 'critical') {
      notifications.push({
        recipient: 'patient',
        priority: 'medium',
        message: 'Thông tin y tế của bạn đã được cập nhật. Vui lòng xem lại và liên hệ nếu có thắc mắc.'
      });
    }

    return notifications;
  }

  /**
   * Get FHIR resource updates required
   */
  public getFHIRResourceUpdates(): {
    resourceType: string;
    action: 'create' | 'update' | 'delete';
    data: any;
  }[] {
    const updates: {
      resourceType: string;
      action: 'create' | 'update' | 'delete';
      data: any;
    }[] = [];

    const changes = this.getMedicalChanges();

    // Update Patient resource
    updates.push({
      resourceType: 'Patient',
      action: 'update',
      data: {
        patientId: this.eventData.patientId,
        medicalInfo: this.eventData.medicalInfo.new
      }
    });

    // Create AllergyIntolerance resources for new allergies
    const newAllergies = this.getNewAllergies();
    for (const allergy of newAllergies) {
      updates.push({
        resourceType: 'AllergyIntolerance',
        action: 'create',
        data: {
          patient: this.eventData.patientId,
          substance: allergy,
          recordedDate: this.eventData.updatedAt
        }
      });
    }

    // Create Condition resources for new chronic conditions
    const newConditions = this.getNewChronicConditions();
    for (const condition of newConditions) {
      updates.push({
        resourceType: 'Condition',
        action: 'create',
        data: {
          patient: this.eventData.patientId,
          code: condition,
          recordedDate: this.eventData.updatedAt
        }
      });
    }

    return updates;
  }
}
