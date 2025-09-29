/**
 * Patient Aggregate Root - Domain Layer
 * Healthcare patient aggregate with business rules and HIPAA compliance
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, HIPAA, FHIR R4
 */

import { HealthcareAggregateRoot } from '../../../shared/domain/base/aggregate-root';
import { DomainEvent } from '../../../shared/domain/base/domain-event';
import { PatientId } from '../value-objects/patient-id';
import { PersonalInfo, Gender, MaritalStatus } from '../value-objects/personal-info';
import { ContactInfo } from '../value-objects/contact-info';
import { PatientRegisteredEvent } from '../events/patient-registered.event';

export enum PatientStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  DECEASED = 'deceased'
}

export enum RegistrationSource {
  WALK_IN = 'WALK_IN',
  ONLINE = 'ONLINE',
  REFERRAL = 'REFERRAL',
  EMERGENCY = 'EMERGENCY'
}

export interface InsuranceInfo {
  provider: string;
  policyNumber: string;
  subscriberName: string;
  subscriberDateOfBirth: Date;
  relationshipToSubscriber: 'self' | 'spouse' | 'child' | 'other';
  effectiveDate: Date;
  expirationDate?: Date;
  groupNumber?: string;
  copayAmount?: number;
  deductibleAmount?: number;
}

export interface MedicalInfo {
  bloodType?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  allergies: string[];
  chronicConditions: string[];
  currentMedications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    prescribedBy?: string;
    startDate?: Date;
  }>;
  familyHistory?: string[];
  surgicalHistory?: string[];
  vaccinationHistory?: Array<{
    vaccine: string;
    date: Date;
    provider?: string;
  }>;
}

export interface PatientProps {
  patientId: PatientId;
  personalInfo: PersonalInfo;
  contactInfo: ContactInfo;
  medicalInfo?: MedicalInfo;
  insuranceInfo?: InsuranceInfo;
  status: PatientStatus;
  registrationDate: Date;
  registrationSource: RegistrationSource;
  registeredBy: string;
  lastVisitDate?: Date;
  notes?: string;
  preferredLanguage: string;
  consentToTreatment: boolean;
  consentToDataSharing: boolean;
  fhirComplianceScore: number;
}

/**
 * Patient Aggregate Root
 * Encapsulates patient business logic and healthcare invariants
 */
export class Patient extends HealthcareAggregateRoot<PatientProps> {
  
  private constructor(props: PatientProps, id?: string) {
    super(props, id);
    this.validateInvariants();
  }

  /**
   * Create new patient (Factory Method)
   */
  public static create(
    personalInfo: PersonalInfo,
    contactInfo: ContactInfo,
    registeredBy: string,
    registrationSource: RegistrationSource = RegistrationSource.WALK_IN,
    medicalInfo?: MedicalInfo,
    insuranceInfo?: InsuranceInfo,
    notes?: string,
    preferredLanguage: string = 'vi',
    consentToTreatment: boolean = true,
    consentToDataSharing: boolean = false
  ): Patient {
    const patientId = PatientId.create();
    const registrationDate = new Date();
    
    const props: PatientProps = {
      patientId,
      personalInfo,
      contactInfo,
      medicalInfo,
      insuranceInfo,
      status: PatientStatus.ACTIVE,
      registrationDate,
      registrationSource,
      registeredBy,
      notes,
      preferredLanguage,
      consentToTreatment,
      consentToDataSharing,
      fhirComplianceScore: Patient.calculateFHIRCompliance(personalInfo, contactInfo, medicalInfo, insuranceInfo)
    };

    const patient = new Patient(props);

    // Raise domain event
    const registeredEvent = PatientRegisteredEvent.create(
      patientId,
      personalInfo,
      contactInfo,
      registeredBy,
      registrationSource,
      insuranceInfo,
      medicalInfo
    );

    patient.addDomainEvent(registeredEvent);

    return patient;
  }

  /**
   * Create from persistence data
   */
  public static fromPersistence(data: any): Patient {
    const patientId = PatientId.fromString(data.patient_id);
    const personalInfo = PersonalInfo.create(
      data.full_name,
      new Date(data.date_of_birth),
      data.gender as Gender,
      data.national_id,
      data.ethnicity,
      data.religion,
      data.occupation,
      data.marital_status as MaritalStatus
    );

    const contactInfo = ContactInfo.create(
      data.phone,
      data.email,
      data.address ? {
        street: data.address.street,
        ward: data.address.ward,
        district: data.address.district,
        city: data.address.city,
        province: data.address.province,
        postalCode: data.address.postal_code,
        country: data.address.country
      } : undefined,
      data.emergency_contact ? {
        name: data.emergency_contact.name,
        relationship: data.emergency_contact.relationship,
        phone: data.emergency_contact.phone,
        email: data.emergency_contact.email,
        address: data.emergency_contact.address
      } : undefined
    );

    const props: PatientProps = {
      patientId,
      personalInfo,
      contactInfo,
      medicalInfo: data.medical_info,
      insuranceInfo: data.insurance_info ? {
        ...data.insurance_info,
        subscriberDateOfBirth: new Date(data.insurance_info.subscriber_date_of_birth),
        effectiveDate: new Date(data.insurance_info.effective_date),
        expirationDate: data.insurance_info.expiration_date ? new Date(data.insurance_info.expiration_date) : undefined
      } : undefined,
      status: data.status as PatientStatus,
      registrationDate: new Date(data.registration_date),
      registrationSource: data.registration_source as RegistrationSource,
      registeredBy: data.registered_by,
      lastVisitDate: data.last_visit_date ? new Date(data.last_visit_date) : undefined,
      notes: data.notes,
      preferredLanguage: data.preferred_language || 'vi',
      consentToTreatment: data.consent_to_treatment ?? true,
      consentToDataSharing: data.consent_to_data_sharing ?? false,
      fhirComplianceScore: data.fhir_compliance_score || 0
    };

    return new Patient(props, data.id);
  }

  /**
   * Getters
   */
  get patientId(): PatientId {
    return this.props.patientId;
  }

  get personalInfo(): PersonalInfo {
    return this.props.personalInfo;
  }

  get contactInfo(): ContactInfo {
    return this.props.contactInfo;
  }

  get medicalInfo(): MedicalInfo | undefined {
    return this.props.medicalInfo;
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

  get registrationSource(): RegistrationSource {
    return this.props.registrationSource;
  }

  get registeredBy(): string {
    return this.props.registeredBy;
  }

  get lastVisitDate(): Date | undefined {
    return this.props.lastVisitDate;
  }

  get notes(): string | undefined {
    return this.props.notes;
  }

  get preferredLanguage(): string {
    return this.props.preferredLanguage;
  }

  get consentToTreatment(): boolean {
    return this.props.consentToTreatment;
  }

  get consentToDataSharing(): boolean {
    return this.props.consentToDataSharing;
  }

  get fhirComplianceScore(): number {
    return this.props.fhirComplianceScore;
  }

  /**
   * Business methods
   */

  /**
   * Update personal information
   */
  public updatePersonalInfo(
    personalInfo: PersonalInfo,
    updatedBy: string
  ): void {
    this.ensurePatientIsActive();
    
    const oldPersonalInfo = this.props.personalInfo;
    this.props.personalInfo = personalInfo;
    this.setModifiedBy(updatedBy);
    
    // Recalculate FHIR compliance
    this.props.fhirComplianceScore = Patient.calculateFHIRCompliance(
      personalInfo,
      this.props.contactInfo,
      this.props.medicalInfo,
      this.props.insuranceInfo
    );

    // Raise domain event if significant changes
    if (oldPersonalInfo.fullName !== personalInfo.fullName ||
        oldPersonalInfo.nationalId !== personalInfo.nationalId) {
      // Would raise PatientPersonalInfoUpdatedEvent
    }
  }

  /**
   * Update contact information
   */
  public updateContactInfo(
    contactInfo: ContactInfo,
    updatedBy: string
  ): void {
    this.ensurePatientIsActive();
    
    this.props.contactInfo = contactInfo;
    this.setModifiedBy(updatedBy);
    
    // Recalculate FHIR compliance
    this.props.fhirComplianceScore = Patient.calculateFHIRCompliance(
      this.props.personalInfo,
      contactInfo,
      this.props.medicalInfo,
      this.props.insuranceInfo
    );
  }

  /**
   * Update medical information
   */
  public updateMedicalInfo(
    medicalInfo: MedicalInfo,
    updatedBy: string
  ): void {
    this.ensurePatientIsActive();
    
    this.props.medicalInfo = medicalInfo;
    this.setModifiedBy(updatedBy);
    
    // Recalculate FHIR compliance
    this.props.fhirComplianceScore = Patient.calculateFHIRCompliance(
      this.props.personalInfo,
      this.props.contactInfo,
      medicalInfo,
      this.props.insuranceInfo
    );
  }

  /**
   * Update insurance information
   */
  public updateInsuranceInfo(
    insuranceInfo: InsuranceInfo,
    updatedBy: string
  ): void {
    this.ensurePatientIsActive();
    
    // Validate insurance dates
    if (insuranceInfo.expirationDate && insuranceInfo.expirationDate <= insuranceInfo.effectiveDate) {
      throw new Error('Ngày hết hạn bảo hiểm phải sau ngày có hiệu lực');
    }

    this.props.insuranceInfo = insuranceInfo;
    this.setModifiedBy(updatedBy);
    
    // Recalculate FHIR compliance
    this.props.fhirComplianceScore = Patient.calculateFHIRCompliance(
      this.props.personalInfo,
      this.props.contactInfo,
      this.props.medicalInfo,
      insuranceInfo
    );
  }

  /**
   * Record patient visit
   */
  public recordVisit(visitDate: Date = new Date()): void {
    this.ensurePatientIsActive();
    
    if (visitDate > new Date()) {
      throw new Error('Ngày khám không thể là ngày trong tương lai');
    }

    this.props.lastVisitDate = visitDate;
    this.touch();
  }

  /**
   * Deactivate patient
   */
  public deactivate(reason: string, deactivatedBy: string): void {
    if (this.props.status === PatientStatus.DECEASED) {
      throw new Error('Không thể hủy kích hoạt bệnh nhân đã qua đời');
    }

    this.props.status = PatientStatus.INACTIVE;
    this.props.notes = (this.props.notes || '') + `\nHủy kích hoạt: ${reason} (${new Date().toISOString()})`;
    this.setModifiedBy(deactivatedBy);
    
    // Would raise PatientDeactivatedEvent
  }

  /**
   * Reactivate patient
   */
  public reactivate(reactivatedBy: string): void {
    if (this.props.status === PatientStatus.DECEASED) {
      throw new Error('Không thể kích hoạt lại bệnh nhân đã qua đời');
    }

    this.props.status = PatientStatus.ACTIVE;
    this.props.notes = (this.props.notes || '') + `\nKích hoạt lại: ${new Date().toISOString()}`;
    this.setModifiedBy(reactivatedBy);
  }

  /**
   * Mark patient as deceased
   */
  public markAsDeceased(dateOfDeath: Date, deathCause?: string, reportedBy?: string): void {
    if (dateOfDeath > new Date()) {
      throw new Error('Ngày qua đời không thể là ngày trong tương lai');
    }

    if (dateOfDeath < this.props.personalInfo.dateOfBirth) {
      throw new Error('Ngày qua đời không thể trước ngày sinh');
    }

    this.props.status = PatientStatus.DECEASED;
    this.props.notes = (this.props.notes || '') + 
      `\nQua đời: ${dateOfDeath.toISOString()}${deathCause ? `, Nguyên nhân: ${deathCause}` : ''}`;
    
    if (reportedBy) {
      this.setModifiedBy(reportedBy);
    }
  }

  /**
   * Check if patient is active
   */
  public isActive(): boolean {
    return this.props.status === PatientStatus.ACTIVE;
  }

  /**
   * Check if patient is pediatric
   */
  public isPediatric(): boolean {
    return this.props.personalInfo.isPediatric;
  }

  /**
   * Check if patient is elderly
   */
  public isElderly(): boolean {
    return this.props.personalInfo.isElderly;
  }

  /**
   * Check if patient has valid insurance
   */
  public hasValidInsurance(): boolean {
    if (!this.props.insuranceInfo) return false;
    
    const now = new Date();
    const isEffective = this.props.insuranceInfo.effectiveDate <= now;
    const notExpired = !this.props.insuranceInfo.expirationDate || 
                      this.props.insuranceInfo.expirationDate > now;
    
    return isEffective && notExpired;
  }

  /**
   * Healthcare-specific methods
   */
  
  getPatientId(): string {
    return this.props.patientId.value;
  }

  protected validateBusinessInvariants(): void {
    // Patient must have consent to treatment
    if (!this.props.consentToTreatment) {
      throw new Error('Bệnh nhân phải đồng ý điều trị để được đăng ký');
    }

    // Pediatric patients must have emergency contact
    if (this.isPediatric() && !this.props.contactInfo.emergencyContact) {
      throw new Error('Bệnh nhân dưới 18 tuổi phải có thông tin người liên hệ khẩn cấp');
    }

    // Insurance validation
    if (this.props.insuranceInfo) {
      this.validateInsuranceInfo(this.props.insuranceInfo);
    }

    // FHIR compliance minimum threshold
    if (this.props.fhirComplianceScore < 60) {
      throw new Error(`Điểm tuân thủ FHIR quá thấp: ${this.props.fhirComplianceScore}%. Tối thiểu 60%`);
    }
  }

  protected applyEvent(event: DomainEvent): void {
    switch (event.eventType) {
      case 'PatientRegistered':
        // Event already applied during creation
        break;
      // Handle other events...
    }
  }

  /**
   * Private helper methods
   */
  
  private ensurePatientIsActive(): void {
    if (!this.isActive()) {
      throw new Error(`Không thể cập nhật thông tin bệnh nhân có trạng thái: ${this.props.status}`);
    }
  }

  private validateInsuranceInfo(insuranceInfo: InsuranceInfo): void {
    if (insuranceInfo.expirationDate && insuranceInfo.expirationDate <= insuranceInfo.effectiveDate) {
      throw new Error('Ngày hết hạn bảo hiểm phải sau ngày có hiệu lực');
    }

    if (insuranceInfo.subscriberDateOfBirth > new Date()) {
      throw new Error('Ngày sinh của người được bảo hiểm không thể là ngày trong tương lai');
    }
  }

  /**
   * Calculate FHIR R4 compliance score
   */
  private static calculateFHIRCompliance(
    personalInfo: PersonalInfo,
    contactInfo: ContactInfo,
    medicalInfo?: MedicalInfo,
    insuranceInfo?: InsuranceInfo
  ): number {
    let score = 0;

    // Required fields (60 points)
    if (personalInfo.fullName) score += 15;
    if (personalInfo.gender) score += 15;
    if (personalInfo.dateOfBirth) score += 15;
    if (personalInfo.nationalId) score += 15;

    // Contact information (25 points)
    if (contactInfo.phone || contactInfo.email) score += 15;
    if (contactInfo.hasCompleteAddress) score += 10;

    // Medical information (10 points)
    if (medicalInfo?.bloodType) score += 3;
    if (medicalInfo?.allergies && medicalInfo.allergies.length > 0) score += 3;
    if (medicalInfo?.chronicConditions && medicalInfo.chronicConditions.length > 0) score += 4;

    // Insurance information (5 points)
    if (insuranceInfo) score += 5;

    return Math.min(score, 100);
  }

  /**
   * Convert to persistence format
   */
  public toPersistence(): any {
    return {
      id: this.id,
      patient_id: this.props.patientId.value,
      full_name: this.props.personalInfo.fullName,
      date_of_birth: this.props.personalInfo.dateOfBirth.toISOString(),
      gender: this.props.personalInfo.gender,
      national_id: this.props.personalInfo.nationalId,
      ethnicity: this.props.personalInfo.ethnicity,
      religion: this.props.personalInfo.religion,
      occupation: this.props.personalInfo.occupation,
      marital_status: this.props.personalInfo.maritalStatus,
      phone: this.props.contactInfo.phone,
      email: this.props.contactInfo.email,
      address: this.props.contactInfo.address,
      emergency_contact: this.props.contactInfo.emergencyContact,
      medical_info: this.props.medicalInfo,
      insurance_info: this.props.insuranceInfo ? {
        ...this.props.insuranceInfo,
        subscriber_date_of_birth: this.props.insuranceInfo.subscriberDateOfBirth.toISOString(),
        effective_date: this.props.insuranceInfo.effectiveDate.toISOString(),
        expiration_date: this.props.insuranceInfo.expirationDate?.toISOString()
      } : null,
      status: this.props.status,
      registration_date: this.props.registrationDate.toISOString(),
      registration_source: this.props.registrationSource,
      registered_by: this.props.registeredBy,
      last_visit_date: this.props.lastVisitDate?.toISOString(),
      notes: this.props.notes,
      preferred_language: this.props.preferredLanguage,
      consent_to_treatment: this.props.consentToTreatment,
      consent_to_data_sharing: this.props.consentToDataSharing,
      fhir_compliance_score: this.props.fhirComplianceScore,
      created_at: this.createdAt.toISOString(),
      updated_at: this.updatedAt.toISOString(),
      version: this.version
    };
  }
}
