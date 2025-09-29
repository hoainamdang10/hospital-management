/**
 * Patient Aggregate Root - Patient Registry Management
 * V2 Clean Architecture + DDD Implementation
 * Consolidated from Patient.ts and patient.aggregate.ts
 * Schema: patient_schema
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */

import { HealthcareAggregateRoot } from '../../../shared/domain/base/aggregate-root';
import { DomainEvent } from '../../../shared/domain/base/domain-event';
import { PatientId } from '../value-objects/PatientId';
import { PersonalInfo } from '../value-objects/PersonalInfo';
import { ContactInfo } from '../value-objects/ContactInfo';
import { MedicalInfo } from '../value-objects/MedicalInfo';
import { InsuranceInfo } from '../entities/InsuranceInfo';
import { EmergencyContact } from '../entities/EmergencyContact';
import { PatientConsent } from '../entities/PatientConsent';
import { MedicalHistory } from '../entities/MedicalHistory';
import { PatientRegisteredEvent } from '../events/PatientRegisteredEvent';
import { PatientUpdatedEvent } from '../events/PatientUpdatedEvent';
import { PatientConsentGrantedEvent } from '../events/PatientConsentGrantedEvent';

export interface PatientProps {
  id: PatientId;
  userId: string; // Reference to auth_schema.user_profiles
  personalInfo: PersonalInfo;
  contactInfo: ContactInfo;
  medicalInfo: MedicalInfo;
  insuranceInfo?: InsuranceInfo;
  emergencyContacts: EmergencyContact[];
  consents: PatientConsent[];
  medicalHistory: MedicalHistory[];
  registrationDate: Date;
  lastVisitDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Patient extends HealthcareAggregateRoot<PatientProps> {
  private constructor(props: PatientProps) {
    super(props);
  }

  // Factory method for creating new patients
  public static create(
    userId: string,
    personalInfo: PersonalInfo,
    contactInfo: ContactInfo,
    medicalInfo: MedicalInfo,
    insuranceInfo?: InsuranceInfo
  ): Patient {
    const patientId = PatientId.generate();
    const now = new Date();

    const patient = new Patient({
      id: patientId,
      userId,
      personalInfo,
      contactInfo,
      medicalInfo,
      insuranceInfo,
      emergencyContacts: [],
      consents: [],
      medicalHistory: [],
      registrationDate: now,
      isActive: true,
      createdAt: now,
      updatedAt: now
    });

    // Domain event for patient registration
    patient.addDomainEvent(new PatientRegisteredEvent(patientId, userId, personalInfo));

    return patient;
  }

  // Factory method for reconstituting from persistence
  public static reconstitute(props: PatientProps): Patient {
    return new Patient(props);
  }

  // Getters
  public get id(): PatientId {
    return this.props.id;
  }

  public get userId(): string {
    return this.props.userId;
  }

  public get personalInfo(): PersonalInfo {
    return this.props.personalInfo;
  }

  public get contactInfo(): ContactInfo {
    return this.props.contactInfo;
  }

  public get medicalInfo(): MedicalInfo {
    return this.props.medicalInfo;
  }

  public get insuranceInfo(): InsuranceInfo | undefined {
    return this.props.insuranceInfo;
  }

  public get emergencyContacts(): EmergencyContact[] {
    return this.props.emergencyContacts.slice();
  }

  public get consents(): PatientConsent[] {
    return this.props.consents.slice();
  }

  public get medicalHistory(): MedicalHistory[] {
    return this.props.medicalHistory.slice();
  }

  public get registrationDate(): Date {
    return this.props.registrationDate;
  }

  public get lastVisitDate(): Date | undefined {
    return this.props.lastVisitDate;
  }

  public get isActive(): boolean {
    return this.props.isActive;
  }

  // Business methods
  public updatePersonalInfo(personalInfo: PersonalInfo): void {
    this.props.personalInfo = personalInfo;
    this.props.updatedAt = new Date();

    this.addDomainEvent(new PatientUpdatedEvent(this.props.id, 'personal_info'));
  }

  public updateContactInfo(contactInfo: ContactInfo): void {
    this.props.contactInfo = contactInfo;
    this.props.updatedAt = new Date();

    this.addDomainEvent(new PatientUpdatedEvent(this.props.id, 'contact_info'));
  }

  public updateMedicalInfo(medicalInfo: MedicalInfo): void {
    this.props.medicalInfo = medicalInfo;
    this.props.updatedAt = new Date();

    this.addDomainEvent(new PatientUpdatedEvent(this.props.id, 'medical_info'));
  }

  public updateInsuranceInfo(insuranceInfo: InsuranceInfo): void {
    this.props.insuranceInfo = insuranceInfo;
    this.props.updatedAt = new Date();

    this.addDomainEvent(new PatientUpdatedEvent(this.props.id, 'insurance_info'));
  }

  public addEmergencyContact(emergencyContact: EmergencyContact): void {
    // Validate maximum emergency contacts (e.g., 5)
    if (this.props.emergencyContacts.length >= 5) {
      throw new Error('Không thể thêm quá 5 người liên hệ khẩn cấp');
    }

    // If this is primary contact, remove primary from others
    if (emergencyContact.isPrimary) {
      this.props.emergencyContacts.forEach(contact => contact.removePrimary());
    }

    this.props.emergencyContacts.push(emergencyContact);
    this.props.updatedAt = new Date();
  }

  public removeEmergencyContact(contactId: string): void {
    this.props.emergencyContacts = this.props.emergencyContacts.filter(
      contact => contact.id !== contactId
    );
    this.props.updatedAt = new Date();
  }

  public grantConsent(consentType: string, witnessId?: string): void {
    // Check if consent already exists
    const existingConsent = this.props.consents.find(
      consent => consent.consentType === consentType && consent.isActive
    );

    if (existingConsent) {
      throw new Error(`Đã có sự đồng ý cho ${consentType}`);
    }

    const consent = PatientConsent.grant(this.props.id, consentType, witnessId);
    this.props.consents.push(consent);
    this.props.updatedAt = new Date();

    this.addDomainEvent(new PatientConsentGrantedEvent(this.props.id, consentType));
  }

  public withdrawConsent(consentType: string): void {
    const consent = this.props.consents.find(
      consent => consent.consentType === consentType && consent.isActive
    );

    if (!consent) {
      throw new Error(`Không tìm thấy sự đồng ý cho ${consentType}`);
    }

    consent.withdraw();
    this.props.updatedAt = new Date();
  }

  public addMedicalHistory(medicalHistory: MedicalHistory): void {
    this.props.medicalHistory.push(medicalHistory);
    this.props.updatedAt = new Date();
  }

  public updateLastVisit(): void {
    this.props.lastVisitDate = new Date();
    this.props.updatedAt = new Date();
  }

  public deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  public activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  // Healthcare-specific business methods
  public hasValidInsurance(): boolean {
    return this.props.insuranceInfo?.isActive && 
           this.props.insuranceInfo?.isNotExpired();
  }

  public getPrimaryInsurance(): InsuranceInfo | undefined {
    return this.props.insuranceInfo?.isPrimary ? this.props.insuranceInfo : undefined;
  }

  public getPrimaryEmergencyContact(): EmergencyContact | undefined {
    return this.props.emergencyContacts.find(contact => contact.isPrimary);
  }

  public hasConsentFor(consentType: string): boolean {
    return this.props.consents.some(
      consent => consent.consentType === consentType && 
                consent.isActive && 
                !consent.isExpired()
    );
  }

  public getActiveConsents(): PatientConsent[] {
    return this.props.consents.filter(consent => consent.isActive && !consent.isExpired());
  }

  public getAge(): number {
    return this.props.personalInfo.getAge();
  }

  public isMinor(): boolean {
    return this.getAge() < 18;
  }

  public requiresGuardianConsent(): boolean {
    return this.isMinor();
  }

  // Vietnamese healthcare specific methods
  public hasBHYTInsurance(): boolean {
    return this.props.insuranceInfo?.coverageType === 'BHYT';
  }

  public hasBHTNInsurance(): boolean {
    return this.props.insuranceInfo?.coverageType === 'BHTN';
  }

  public hasPrivateInsurance(): boolean {
    return this.props.insuranceInfo?.coverageType === 'private';
  }

  public isSelfPay(): boolean {
    return !this.props.insuranceInfo || this.props.insuranceInfo.coverageType === 'self_pay';
  }

  // Medical history methods
  public hasCondition(conditionName: string): boolean {
    return this.props.medicalHistory.some(
      history => history.conditionName.toLowerCase() === conditionName.toLowerCase() &&
                history.isActive()
    );
  }

  public getActiveConditions(): MedicalHistory[] {
    return this.props.medicalHistory.filter(history => history.isActive());
  }

  public getChronicConditions(): MedicalHistory[] {
    return this.props.medicalHistory.filter(history => history.isChronic());
  }

  public getCriticalConditions(): MedicalHistory[] {
    return this.props.medicalHistory.filter(history => history.isCritical());
  }

  // Validation methods
  public canScheduleAppointment(): boolean {
    return this.props.isActive && this.hasConsentFor('treatment');
  }

  public canAccessMedicalRecords(): boolean {
    return this.hasConsentFor('data_sharing');
  }

  public canParticipateInResearch(): boolean {
    return this.hasConsentFor('research');
  }

  // Audit methods
  public getAuditInfo(): object {
    return {
      patientId: this.props.id.value,
      userId: this.props.userId,
      fullName: this.props.personalInfo.fullName,
      dateOfBirth: this.props.personalInfo.dateOfBirth,
      registrationDate: this.props.registrationDate,
      lastVisitDate: this.props.lastVisitDate,
      isActive: this.props.isActive,
      hasInsurance: !!this.props.insuranceInfo,
      emergencyContactsCount: this.props.emergencyContacts.length,
      activeConsentsCount: this.getActiveConsents().length,
      medicalHistoryCount: this.props.medicalHistory.length
    };
  }

  public equals(other: Patient): boolean {
    return this.props.id.equals(other.props.id);
  }

  // ==================== V2 HEALTHCARE AGGREGATE METHODS ====================

  /**
   * Validate business invariants
   */
  protected validateBusinessInvariants(): void {
    // Personal info must be valid
    if (!this.props.personalInfo || !this.props.personalInfo.isValid()) {
      throw new Error('Thông tin cá nhân bệnh nhân không hợp lệ');
    }

    // Contact info must be valid
    if (!this.props.contactInfo || !this.props.contactInfo.isValid()) {
      throw new Error('Thông tin liên hệ bệnh nhân không hợp lệ');
    }

    // Medical info must be valid
    if (!this.props.medicalInfo || !this.props.medicalInfo.isValid()) {
      throw new Error('Thông tin y tế bệnh nhân không hợp lệ');
    }

    // Must have valid user ID
    if (!this.props.userId || this.props.userId.trim().length === 0) {
      throw new Error('ID người dùng không được để trống');
    }

    // Registration date must be valid
    if (!this.props.registrationDate || this.props.registrationDate > new Date()) {
      throw new Error('Ngày đăng ký không hợp lệ');
    }

    // Last visit date must be after registration date
    if (this.props.lastVisitDate && this.props.lastVisitDate < this.props.registrationDate) {
      throw new Error('Ngày khám cuối phải sau ngày đăng ký');
    }

    // Emergency contacts validation
    if (this.props.emergencyContacts.length === 0) {
      throw new Error('Phải có ít nhất một liên hệ khẩn cấp');
    }

    // Insurance validation for Vietnamese healthcare
    if (this.props.insuranceInfo && !this.props.insuranceInfo.isValid()) {
      throw new Error('Thông tin bảo hiểm không hợp lệ');
    }
  }

  /**
   * Apply domain event
   */
  protected applyEvent(event: DomainEvent): void {
    switch (event.eventType) {
      case 'PatientRegistered':
        this.props.isActive = true;
        this.props.updatedAt = new Date();
        break;

      case 'PatientUpdated':
        this.props.updatedAt = new Date();
        break;

      case 'PatientConsentGranted':
        this.props.updatedAt = new Date();
        break;

      case 'PatientDeactivated':
        this.props.isActive = false;
        this.props.updatedAt = new Date();
        break;

      case 'PatientVisitRecorded':
        this.props.lastVisitDate = new Date();
        this.props.updatedAt = new Date();
        break;

      default:
        // Unknown event type - log but don't throw
        console.warn(`Unknown event type: ${event.eventType}`);
    }
  }

  /**
   * Get patient ID (required by HealthcareAggregateRoot)
   */
  getPatientId(): string | null {
    return this.props.id.value;
  }

  /**
   * Convert to persistence format
   */
  toPersistence(): any {
    return {
      id: this.props.id.value,
      user_id: this.props.userId,
      personal_info: this.props.personalInfo.toPersistence(),
      contact_info: this.props.contactInfo.toPersistence(),
      medical_info: this.props.medicalInfo.toPersistence(),
      insurance_info: this.props.insuranceInfo?.toPersistence(),
      emergency_contacts: this.props.emergencyContacts.map(ec => ec.toPersistence()),
      consents: this.props.consents.map(c => c.toPersistence()),
      medical_history: this.props.medicalHistory.map(mh => mh.toPersistence()),
      registration_date: this.props.registrationDate.toISOString(),
      last_visit_date: this.props.lastVisitDate?.toISOString(),
      is_active: this.props.isActive,
      created_at: this.props.createdAt.toISOString(),
      updated_at: this.props.updatedAt.toISOString()
    };
  }

  /**
   * Create from persistence data
   */
  static fromPersistence(data: any): Patient {
    const props: PatientProps = {
      id: PatientId.fromString(data.id),
      userId: data.user_id,
      personalInfo: PersonalInfo.fromPersistence(data.personal_info),
      contactInfo: ContactInfo.fromPersistence(data.contact_info),
      medicalInfo: MedicalInfo.fromPersistence(data.medical_info),
      insuranceInfo: data.insurance_info ? InsuranceInfo.fromPersistence(data.insurance_info) : undefined,
      emergencyContacts: (data.emergency_contacts || []).map((ec: any) => EmergencyContact.fromPersistence(ec)),
      consents: (data.consents || []).map((c: any) => PatientConsent.fromPersistence(c)),
      medicalHistory: (data.medical_history || []).map((mh: any) => MedicalHistory.fromPersistence(mh)),
      registrationDate: new Date(data.registration_date),
      lastVisitDate: data.last_visit_date ? new Date(data.last_visit_date) : undefined,
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };

    return new Patient(props);
  }

  /**
   * Vietnamese healthcare compliance check
   */
  public isVietnameseHealthcareCompliant(): boolean {
    // Check if patient has required Vietnamese healthcare information
    const hasValidPersonalInfo = this.props.personalInfo.isVietnameseCompliant();
    const hasValidContactInfo = this.props.contactInfo.isVietnameseCompliant();
    const hasValidMedicalInfo = this.props.medicalInfo.isVietnameseCompliant();
    const hasValidInsurance = !this.props.insuranceInfo || this.props.insuranceInfo.isVietnameseCompliant();

    return hasValidPersonalInfo && hasValidContactInfo && hasValidMedicalInfo && hasValidInsurance;
  }

  /**
   * HIPAA compliance check
   */
  public isHIPAACompliant(): boolean {
    return (
      this.props.personalInfo.isHIPAACompliant() &&
      this.props.contactInfo.isHIPAACompliant() &&
      this.props.medicalInfo.isHIPAACompliant() &&
      this.props.consents.some(c => c.isHIPAAConsent() && c.isActive()) &&
      (!this.props.insuranceInfo || this.props.insuranceInfo.isHIPAACompliant())
    );
  }

  /**
   * Get patient summary for logging (no sensitive data)
   */
  public getSummaryForLogging(): object {
    return {
      patientId: this.props.id.value,
      userId: this.props.userId,
      age: this.getAge(),
      gender: this.props.personalInfo.gender,
      registrationDate: this.props.registrationDate.toISOString(),
      lastVisitDate: this.props.lastVisitDate?.toISOString(),
      isActive: this.props.isActive,
      hasInsurance: !!this.props.insuranceInfo,
      emergencyContactsCount: this.props.emergencyContacts.length,
      activeConsentsCount: this.getActiveConsents().length,
      medicalHistoryCount: this.props.medicalHistory.length,
      createdAt: this.props.createdAt.toISOString()
    };
  }

  /**
   * Check if patient has valid Vietnamese insurance
   */
  public hasVietnameseInsurance(): boolean {
    return !!this.props.insuranceInfo && this.props.insuranceInfo.isVietnameseInsurance();
  }

  /**
   * Get Vietnamese insurance number (BHYT)
   */
  public getVietnameseInsuranceNumber(): string | null {
    return this.props.insuranceInfo?.getVietnameseInsuranceNumber() || null;
  }
}
