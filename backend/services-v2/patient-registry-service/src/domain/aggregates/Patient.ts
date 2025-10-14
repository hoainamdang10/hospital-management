/**
 * Patient Aggregate Root - Patient Registry V2
 *
 * Manages patient master data and enforces business invariants
 * Based on HL7 FHIR Patient Resource specification
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, HL7 FHIR, Vietnamese Healthcare Standards, HIPAA
 */

import { HealthcareAggregateRoot } from '@shared/domain/base/aggregate-root';
import { DomainEvent } from '@shared/domain/base/domain-event';
import { PatientId } from '../value-objects/PatientId';
import { PersonalInfo } from '../value-objects/PersonalInfo';
import { ContactInfo } from '../value-objects/ContactInfo';
import { BasicMedicalInfo } from '../value-objects/BasicMedicalInfo';
import { PatientLink } from '../value-objects/PatientLink';
import { PatientStatus } from '../value-objects/PatientStatus';
import { InsuranceInfo } from '../entities/InsuranceInfo';
import { EmergencyContact } from '../entities/EmergencyContact';
import { PatientConsent } from '../entities/PatientConsent';
import { PatientRegisteredEvent } from '../events/PatientRegisteredEvent';
import { PatientUpdatedEvent } from '../events/PatientUpdatedEvent';
import { PatientMergedEvent } from '../events/PatientMergedEvent';
import { PatientLinkedEvent } from '../events/PatientLinkedEvent';
import { PatientDeactivatedEvent } from '../events/PatientDeactivatedEvent';
import { PatientConsentGrantedEvent } from '../events/PatientConsentGrantedEvent';

export interface PatientProps {
  // Identity
  id: PatientId;
  userId: string; // Reference to Identity Service (auth_schema.user_profiles)

  // Demographics
  personalInfo: PersonalInfo;
  contactInfo: ContactInfo;

  // Basic Medical (Emergency only)
  basicMedicalInfo: BasicMedicalInfo;

  // Insurance
  insuranceInfo?: InsuranceInfo;

  // Contacts
  emergencyContacts: EmergencyContact[];

  // Consent
  consents: PatientConsent[];

  // Status
  status: PatientStatus;
  mergedInto?: PatientId; // If merged, reference to master patient

  // Linking (FHIR-style)
  links: PatientLink[];

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export class Patient extends HealthcareAggregateRoot<PatientProps> {
  private constructor(props: PatientProps, id?: string) {
    super(props, id);
  }

  /**
   * Factory method: Register new patient
   */
  public static register(
    userId: string,
    personalInfo: PersonalInfo,
    contactInfo: ContactInfo,
    basicMedicalInfo: BasicMedicalInfo,
    insuranceInfo: InsuranceInfo | undefined,
    emergencyContacts: EmergencyContact[],
    createdBy: string
  ): Patient {
    const patientId = PatientId.generate();
    const now = new Date();

    const patient = new Patient({
      id: patientId,
      userId,
      personalInfo,
      contactInfo,
      basicMedicalInfo,
      insuranceInfo,
      emergencyContacts,
      consents: [],
      status: PatientStatus.ACTIVE,
      links: [],
      createdAt: now,
      updatedAt: now,
      createdBy,
      updatedBy: createdBy
    });

    // Publish domain event
    patient.addDomainEvent(new PatientRegisteredEvent(
      patientId.value,
      userId,
      personalInfo.fullName,
      personalInfo.dateOfBirth,
      personalInfo.gender,
      personalInfo.nationalId
    ));

    return patient;
  }

  /**
   * Factory method: Reconstitute from persistence
   */
  public static reconstitute(props: PatientProps): Patient {
    return new Patient(props);
  }

  // ==================== Business Methods ====================

  /**
   * Update personal information
   */
  public updatePersonalInfo(personalInfo: PersonalInfo, updatedBy: string): void {
    this.ensureCanUpdate();

    this.props.personalInfo = personalInfo;
    this.props.updatedAt = new Date();
    this.props.updatedBy = updatedBy;

    const patientId = this.props.id.value;
    this.addDomainEvent(new PatientUpdatedEvent(patientId, 'personal_info', updatedBy));
  }

  /**
   * Update contact information
   */
  public updateContactInfo(contactInfo: ContactInfo, updatedBy: string): void {
    this.ensureCanUpdate();

    this.props.contactInfo = contactInfo;
    this.props.updatedAt = new Date();
    this.props.updatedBy = updatedBy;

    const patientId = this.props.id.value;
    this.addDomainEvent(new PatientUpdatedEvent(patientId, 'contact_info', updatedBy));
  }

  /**
   * Update basic medical information
   */
  public updateBasicMedicalInfo(basicMedicalInfo: BasicMedicalInfo, updatedBy: string): void {
    this.ensureCanUpdate();

    this.props.basicMedicalInfo = basicMedicalInfo;
    this.props.updatedAt = new Date();
    this.props.updatedBy = updatedBy;

    const patientId = this.props.id.value;
    this.addDomainEvent(new PatientUpdatedEvent(patientId, 'basic_medical_info', updatedBy));
  }

  /**
   * Update insurance information
   */
  public updateInsuranceInfo(insuranceInfo: InsuranceInfo | undefined, updatedBy: string): void {
    this.ensureCanUpdate();

    this.props.insuranceInfo = insuranceInfo;
    this.props.updatedAt = new Date();
    this.props.updatedBy = updatedBy;

    const patientId = this.props.id.value;
    this.addDomainEvent(new PatientUpdatedEvent(patientId, 'insurance_info', updatedBy));
  }

  /**
   * Add emergency contact
   */
  public addEmergencyContact(contact: EmergencyContact, updatedBy: string): void {
    this.ensureCanUpdate();

    this.props.emergencyContacts.push(contact);
    this.props.updatedAt = new Date();
    this.props.updatedBy = updatedBy;

    const patientId = this.props.id.value;
    this.addDomainEvent(new PatientUpdatedEvent(patientId, 'emergency_contact', updatedBy));
  }

  /**
   * Remove emergency contact
   */
  public removeEmergencyContact(contactId: string, updatedBy: string): void {
    this.ensureCanUpdate();

    this.props.emergencyContacts = this.props.emergencyContacts.filter(
      contact => contact.id !== contactId
    );
    this.props.updatedAt = new Date();
    this.props.updatedBy = updatedBy;

    const patientId = this.props.id.value;
    this.addDomainEvent(new PatientUpdatedEvent(patientId, 'emergency_contact', updatedBy));
  }

  /**
   * Grant consent
   */
  public grantConsent(consent: PatientConsent, updatedBy: string): void {
    this.ensureCanUpdate();

    this.props.consents.push(consent);
    this.props.updatedAt = new Date();
    this.props.updatedBy = updatedBy;

    const patientId = this.props.id.value;
    this.addDomainEvent(new PatientConsentGrantedEvent(
      patientId,
      consent.getId(),
      consent.consentType,
      updatedBy
    ));
  }

  /**
   * Merge into master patient (mark as duplicate)
   */
  public mergeInto(masterPatientId: PatientId, reason: string, performedBy: string): void {
    if (this.props.status === PatientStatus.MERGED) {
      throw new Error('Bệnh nhân đã được gộp trước đó');
    }

    if (this.props.status === PatientStatus.DECEASED) {
      throw new Error('Không thể gộp bệnh nhân đã qua đời');
    }

    if (this.props.id.equals(masterPatientId)) {
      throw new Error('Không thể gộp bệnh nhân vào chính nó');
    }

    this.props.status = PatientStatus.MERGED;
    this.props.mergedInto = masterPatientId;
    this.props.updatedAt = new Date();
    this.props.updatedBy = performedBy;

    // Create "replaced-by" link
    const link = PatientLink.createReplacedBy(masterPatientId, performedBy);
    this.props.links.push(link);

    const duplicatePatientId = this.props.id.value;
    this.addDomainEvent(new PatientMergedEvent(
      duplicatePatientId,
      masterPatientId.value,
      reason,
      performedBy
    ));
  }

  /**
   * Link to another patient
   */
  public linkTo(otherPatientId: PatientId, linkType: 'refer' | 'seealso', performedBy: string): void {
    if (this.props.id.equals(otherPatientId)) {
      throw new Error('Không thể liên kết bệnh nhân với chính nó');
    }

    // Check if link already exists
    const existingLink = this.props.links.find(
      link => link.otherPatientId.equals(otherPatientId) && link.linkType === linkType
    );

    if (existingLink) {
      throw new Error(`Liên kết ${linkType} đã tồn tại với bệnh nhân ${otherPatientId.getValue()}`);
    }

    const link = PatientLink.create(otherPatientId, linkType, performedBy);
    this.props.links.push(link);
    this.props.updatedAt = new Date();
    this.props.updatedBy = performedBy;

    const patientId = this.props.id.value;
    this.addDomainEvent(new PatientLinkedEvent(
      patientId,
      otherPatientId.value,
      linkType,
      performedBy
    ));
  }

  /**
   * Deactivate patient
   */
  public deactivate(reason: string, performedBy: string): void {
    if (this.props.status === PatientStatus.INACTIVE) {
      throw new Error('Bệnh nhân đã bị vô hiệu hóa');
    }

    if (this.props.status === PatientStatus.MERGED) {
      throw new Error('Không thể vô hiệu hóa bệnh nhân đã được gộp');
    }

    if (this.props.status === PatientStatus.DECEASED) {
      throw new Error('Không thể vô hiệu hóa bệnh nhân đã qua đời');
    }

    this.props.status = PatientStatus.INACTIVE;
    this.props.updatedAt = new Date();
    this.props.updatedBy = performedBy;

    const patientId = this.props.id.value;
    this.addDomainEvent(new PatientDeactivatedEvent(patientId, reason, performedBy));
  }

  /**
   * Mark patient as deceased
   */
  public markAsDeceased(performedBy: string): void {
    if (this.props.status === PatientStatus.DECEASED) {
      throw new Error('Bệnh nhân đã được đánh dấu qua đời');
    }

    this.props.status = PatientStatus.DECEASED;
    this.props.updatedAt = new Date();
    this.props.updatedBy = performedBy;

    const patientId = this.props.id.value;
    this.addDomainEvent(new PatientUpdatedEvent(patientId, 'status', performedBy));
  }

  /**
   * Reactivate patient (from INACTIVE status)
   */
  public reactivate(_reason: string, performedBy: string): void {
    if (this.props.status !== PatientStatus.INACTIVE) {
      throw new Error('Chỉ có thể kích hoạt lại bệnh nhân đã bị vô hiệu hóa');
    }

    this.props.status = PatientStatus.ACTIVE;
    this.props.updatedAt = new Date();
    this.props.updatedBy = performedBy;

    const patientId = this.props.id.value;
    this.addDomainEvent(new PatientUpdatedEvent(patientId, 'status', performedBy));
  }

  // ==================== Getters ====================

  override getPatientId(): string | null {
    return this.props.id.value;
  }

  public getPatientIdObject(): PatientId {
    return this.props.id;
  }

  public getUserId(): string {
    return this.props.userId;
  }

  public getPersonalInfo(): PersonalInfo {
    return this.props.personalInfo;
  }

  public getContactInfo(): ContactInfo {
    return this.props.contactInfo;
  }

  public getBasicMedicalInfo(): BasicMedicalInfo {
    return this.props.basicMedicalInfo;
  }

  public getInsuranceInfo(): InsuranceInfo | undefined {
    return this.props.insuranceInfo;
  }

  public getEmergencyContacts(): EmergencyContact[] {
    return this.props.emergencyContacts.slice(); // Return copy
  }

  public getConsents(): PatientConsent[] {
    return this.props.consents.slice(); // Return copy
  }

  public getStatus(): PatientStatus {
    return this.props.status;
  }

  public getMergedInto(): PatientId | undefined {
    return this.props.mergedInto;
  }

  public getLinks(): PatientLink[] {
    return this.props.links.slice(); // Return copy
  }

  override getProps(): PatientProps {
    // Deep clone to prevent external mutation of nested collections
    return {
      ...this.props,
      emergencyContacts: this.props.emergencyContacts.slice(),
      consents: this.props.consents.slice(),
      links: this.props.links.slice()
    };
  }

  // ==================== Required Abstract Methods ====================

  /**
   * Validate entity state (required by Entity base class)
   */
  validate(): void {
    this.validateInvariants();
  }

  /**
   * Convert to persistence format (required by Entity base class)
   * Note: This is a minimal stub. Use PatientMapper.toPersistence() for actual persistence.
   */
  toPersistence(): { id: string; patient_id: string } {
    return {
      id: this.id,
      patient_id: this.props.id.value
    };
  }

  /**
   * Apply domain event (required by AggregateRoot base class)
   */
  protected applyEvent(_event: DomainEvent): void {
    // Event sourcing: Apply event to rebuild state
    // For now, we use state-based persistence, so this is a no-op
    // In future, implement event sourcing logic here
  }

  // ==================== Business Queries ====================

  public isActive(): boolean {
    return this.props.status === PatientStatus.ACTIVE;
  }

  public isInactive(): boolean {
    return this.props.status === PatientStatus.INACTIVE;
  }

  public isMerged(): boolean {
    return this.props.status === PatientStatus.MERGED;
  }

  public isDeceased(): boolean {
    return this.props.status === PatientStatus.DECEASED;
  }

  public hasBHYTInsurance(): boolean {
    return this.props.insuranceInfo?.isBHYT() ?? false;
  }

  public hasValidInsurance(): boolean {
    return this.props.insuranceInfo?.isValid() ?? false;
  }

  public hasEmergencyContacts(): boolean {
    return this.props.emergencyContacts.length > 0;
  }

  public hasActiveConsents(): boolean {
    return this.props.consents.some(consent => consent.isActive);
  }

  public hasLinks(): boolean {
    return this.props.links.length > 0;
  }

  // ==================== Business Invariants ====================

  protected validateBusinessInvariants(): void {
    if (!this.props.personalInfo) {
      throw new Error('Thông tin cá nhân không được để trống');
    }

    if (!this.props.contactInfo) {
      throw new Error('Thông tin liên hệ không được để trống');
    }

    if (!this.props.basicMedicalInfo) {
      throw new Error('Thông tin y tế cơ bản không được để trống');
    }

    if (this.props.status === PatientStatus.MERGED && !this.props.mergedInto) {
      throw new Error('Bệnh nhân đã gộp phải có tham chiếu đến bệnh nhân chính');
    }
  }

  private ensureCanUpdate(): void {
    if (this.props.status !== PatientStatus.ACTIVE) {
      throw new Error(`Không thể cập nhật bệnh nhân với trạng thái: ${this.props.status}`);
    }
  }
}

