/**
 * Patient Aggregate - Domain-Driven Design Implementation
 * Rich domain model with business logic and healthcare-specific invariants
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance HIPAA, DDD, FHIR
 */

import { AggregateRoot } from '../base/aggregate-root';
import { DomainEvent } from '../events/domain-event';
import { PatientId } from '../value-objects/patient-id';
import { PersonalInfo } from '../value-objects/personal-info';
import { ContactInfo } from '../value-objects/contact-info';
import { MedicalInfo } from '../value-objects/medical-info';
import { EmergencyContact } from '../value-objects/emergency-contact';
import { InsuranceInfo } from '../value-objects/insurance-info';
import { PatientRegisteredEvent } from '../events/patient/patient-registered.event';
import { PatientUpdatedEvent } from '../events/patient/patient-updated.event';
import { PatientDeactivatedEvent } from '../events/patient/patient-deactivated.event';
import { MedicalHistoryUpdatedEvent } from '../events/patient/medical-history-updated.event';

export enum PatientStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive', 
  SUSPENDED = 'suspended',
  DECEASED = 'deceased'
}

export interface PatientProps {
  patientId: PatientId;
  personalInfo: PersonalInfo;
  contactInfo: ContactInfo;
  medicalInfo: MedicalInfo;
  emergencyContact?: EmergencyContact;
  insuranceInfo?: InsuranceInfo;
  status: PatientStatus;
  registrationDate: Date;
  lastVisitDate?: Date;
  notes?: string;
}

/**
 * Patient Aggregate Root
 * Encapsulates patient business logic and healthcare invariants
 */
export class Patient extends AggregateRoot<PatientProps> {
  
  private constructor(props: PatientProps, id?: string) {
    super(props, id);
  }

  /**
   * Factory method to create new patient
   */
  public static create(
    personalInfo: PersonalInfo,
    contactInfo: ContactInfo,
    medicalInfo: MedicalInfo,
    emergencyContact?: EmergencyContact,
    insuranceInfo?: InsuranceInfo
  ): Patient {
    // Generate patient ID with healthcare format
    const patientId = PatientId.create();
    
    // Validate business rules
    this.validatePatientCreation(personalInfo, contactInfo, medicalInfo);
    
    const props: PatientProps = {
      patientId,
      personalInfo,
      contactInfo,
      medicalInfo,
      emergencyContact,
      insuranceInfo,
      status: PatientStatus.ACTIVE,
      registrationDate: new Date(),
    };

    const patient = new Patient(props);
    
    // Raise domain event
    patient.addDomainEvent(new PatientRegisteredEvent({
      patientId: patientId.value,
      personalInfo: personalInfo.toPlainObject(),
      contactInfo: contactInfo.toPlainObject(),
      medicalInfo: medicalInfo.toPlainObject(),
      registrationDate: props.registrationDate,
    }));

    return patient;
  }

  /**
   * Factory method to reconstitute patient from persistence
   */
  public static fromPersistence(props: PatientProps, id: string): Patient {
    return new Patient(props, id);
  }

  // =====================================================
  // BUSINESS METHODS
  // =====================================================

  /**
   * Update patient personal information
   */
  public updatePersonalInfo(newPersonalInfo: PersonalInfo): void {
    this.validatePatientIsActive();
    
    // Business rule: Cannot change date of birth after registration
    if (!this.props.personalInfo.dateOfBirth.equals(newPersonalInfo.dateOfBirth)) {
      throw new Error('Ngày sinh không thể thay đổi sau khi đăng ký');
    }

    const oldPersonalInfo = this.props.personalInfo;
    this.props.personalInfo = newPersonalInfo;

    this.addDomainEvent(new PatientUpdatedEvent({
      patientId: this.props.patientId.value,
      updatedFields: {
        personalInfo: {
          old: oldPersonalInfo.toPlainObject(),
          new: newPersonalInfo.toPlainObject()
        }
      },
      updatedAt: new Date(),
    }));
  }

  /**
   * Update contact information
   */
  public updateContactInfo(newContactInfo: ContactInfo): void {
    this.validatePatientIsActive();
    
    const oldContactInfo = this.props.contactInfo;
    this.props.contactInfo = newContactInfo;

    this.addDomainEvent(new PatientUpdatedEvent({
      patientId: this.props.patientId.value,
      updatedFields: {
        contactInfo: {
          old: oldContactInfo.toPlainObject(),
          new: newContactInfo.toPlainObject()
        }
      },
      updatedAt: new Date(),
    }));
  }

  /**
   * Update medical information
   */
  public updateMedicalInfo(newMedicalInfo: MedicalInfo): void {
    this.validatePatientIsActive();
    this.validateMedicalInfoUpdate(newMedicalInfo);
    
    const oldMedicalInfo = this.props.medicalInfo;
    this.props.medicalInfo = newMedicalInfo;

    this.addDomainEvent(new MedicalHistoryUpdatedEvent({
      patientId: this.props.patientId.value,
      medicalInfo: {
        old: oldMedicalInfo.toPlainObject(),
        new: newMedicalInfo.toPlainObject()
      },
      updatedAt: new Date(),
    }));
  }

  /**
   * Add emergency contact
   */
  public setEmergencyContact(emergencyContact: EmergencyContact): void {
    this.validatePatientIsActive();
    
    this.props.emergencyContact = emergencyContact;

    this.addDomainEvent(new PatientUpdatedEvent({
      patientId: this.props.patientId.value,
      updatedFields: {
        emergencyContact: emergencyContact.toPlainObject()
      },
      updatedAt: new Date(),
    }));
  }

  /**
   * Update insurance information
   */
  public updateInsuranceInfo(insuranceInfo: InsuranceInfo): void {
    this.validatePatientIsActive();
    
    this.props.insuranceInfo = insuranceInfo;

    this.addDomainEvent(new PatientUpdatedEvent({
      patientId: this.props.patientId.value,
      updatedFields: {
        insuranceInfo: insuranceInfo.toPlainObject()
      },
      updatedAt: new Date(),
    }));
  }

  /**
   * Deactivate patient account
   */
  public deactivate(reason: string): void {
    if (this.props.status === PatientStatus.INACTIVE) {
      throw new Error('Bệnh nhân đã bị vô hiệu hóa');
    }

    this.props.status = PatientStatus.INACTIVE;

    this.addDomainEvent(new PatientDeactivatedEvent({
      patientId: this.props.patientId.value,
      reason,
      deactivatedAt: new Date(),
    }));
  }

  /**
   * Record patient visit
   */
  public recordVisit(visitDate: Date): void {
    this.validatePatientIsActive();
    
    this.props.lastVisitDate = visitDate;
  }

  /**
   * Check if patient has valid insurance
   */
  public hasValidInsurance(): boolean {
    return this.props.insuranceInfo?.isValid() ?? false;
  }

  /**
   * Check if patient has emergency contact
   */
  public hasEmergencyContact(): boolean {
    return this.props.emergencyContact !== undefined;
  }

  /**
   * Get patient age
   */
  public getAge(): number {
    return this.props.personalInfo.getAge();
  }

  /**
   * Check if patient is minor (under 18)
   */
  public isMinor(): boolean {
    return this.getAge() < 18;
  }

  /**
   * Get FHIR compliance score
   */
  public getFHIRComplianceScore(): number {
    let score = 100;
    
    // Required fields for FHIR compliance
    if (!this.props.personalInfo.fullName) score -= 20;
    if (!this.props.personalInfo.dateOfBirth) score -= 20;
    if (!this.props.personalInfo.gender) score -= 10;
    if (!this.props.contactInfo.phoneNumber) score -= 10;
    if (!this.props.contactInfo.email) score -= 10;
    if (!this.props.medicalInfo.bloodType) score -= 5;
    if (!this.hasEmergencyContact()) score -= 15;
    if (!this.hasValidInsurance()) score -= 10;

    return Math.max(0, score);
  }

  // =====================================================
  // GETTERS
  // =====================================================

  get patientId(): PatientId {
    return this.props.patientId;
  }

  get personalInfo(): PersonalInfo {
    return this.props.personalInfo;
  }

  get contactInfo(): ContactInfo {
    return this.props.contactInfo;
  }

  get medicalInfo(): MedicalInfo {
    return this.props.medicalInfo;
  }

  get emergencyContact(): EmergencyContact | undefined {
    return this.props.emergencyContact;
  }

  get insuranceInfo(): InsuranceInfo | undefined {
    return this.props.insuranceInfo;
  }

  get status(): PatientStatus {
    return this.props.status;
  }

  get registrationDate(): Date {
    return this.props.registrationDate;
  }

  get lastVisitDate(): Date | undefined {
    return this.props.lastVisitDate;
  }

  get notes(): string | undefined {
    return this.props.notes;
  }

  // =====================================================
  // PRIVATE VALIDATION METHODS
  // =====================================================

  private static validatePatientCreation(
    personalInfo: PersonalInfo,
    contactInfo: ContactInfo,
    medicalInfo: MedicalInfo
  ): void {
    if (!personalInfo.isValid()) {
      throw new Error('Thông tin cá nhân không hợp lệ');
    }
    
    if (!contactInfo.isValid()) {
      throw new Error('Thông tin liên hệ không hợp lệ');
    }
    
    if (!medicalInfo.isValid()) {
      throw new Error('Thông tin y tế không hợp lệ');
    }
  }

  private validatePatientIsActive(): void {
    if (this.props.status !== PatientStatus.ACTIVE) {
      throw new Error('Chỉ có thể cập nhật thông tin bệnh nhân đang hoạt động');
    }
  }

  private validateMedicalInfoUpdate(newMedicalInfo: MedicalInfo): void {
    // Business rule: Blood type cannot be changed once set
    if (this.props.medicalInfo.bloodType && 
        this.props.medicalInfo.bloodType !== newMedicalInfo.bloodType) {
      throw new Error('Nhóm máu không thể thay đổi sau khi đã được thiết lập');
    }
  }
}
