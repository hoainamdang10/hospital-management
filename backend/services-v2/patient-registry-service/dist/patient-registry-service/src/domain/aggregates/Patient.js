"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Patient = void 0;
const aggregate_root_1 = require("../../../../shared/domain/base/aggregate-root");
const PatientId_1 = require("../value-objects/PatientId");
const PatientStatus_1 = require("../value-objects/PatientStatus");
const PatientRegisteredEvent_1 = require("../events/PatientRegisteredEvent");
const PatientUpdatedEvent_1 = require("../events/PatientUpdatedEvent");
class Patient extends aggregate_root_1.HealthcareAggregateRoot {
    constructor(props, id) {
        super(props, id);
    }
    /**
     * Factory method: Register new patient
     * @deprecated Use registerWithId() instead to pass pre-generated PatientId from database
     */
    static register(userId, personalInfo, contactInfo, basicMedicalInfo, insuranceInfo, emergencyContacts, createdBy) {
        const patientId = PatientId_1.PatientId.generate();
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
            status: PatientStatus_1.PatientStatus.ACTIVE,
            links: [],
            createdAt: now,
            updatedAt: now,
            createdBy,
            updatedBy: createdBy,
        });
        // Publish domain event
        patient.addDomainEvent(new PatientRegisteredEvent_1.PatientRegisteredEvent(patientId.value, userId, personalInfo.fullName, personalInfo.dateOfBirth, personalInfo.gender, personalInfo.nationalId, Patient.buildRegisteredEventData(contactInfo, insuranceInfo, emergencyContacts)));
        return patient;
    }
    /**
     * Factory method: Register new patient with pre-generated ID from database
     * This is the recommended method to avoid ID collisions
     */
    static registerWithId(patientId, userId, personalInfo, contactInfo, basicMedicalInfo, insuranceInfo, emergencyContacts, createdBy) {
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
            status: PatientStatus_1.PatientStatus.ACTIVE,
            links: [],
            createdAt: now,
            updatedAt: now,
            createdBy,
            updatedBy: createdBy,
        });
        // Publish domain event
        patient.addDomainEvent(new PatientRegisteredEvent_1.PatientRegisteredEvent(patientId.value, userId, personalInfo.fullName, personalInfo.dateOfBirth, personalInfo.gender, personalInfo.nationalId, Patient.buildRegisteredEventData(contactInfo, insuranceInfo, emergencyContacts)));
        return patient;
    }
    /**
     * Factory method: Reconstitute from persistence
     */
    static reconstitute(props) {
        return new Patient(props);
    }
    static buildRegisteredEventData(contactInfo, insuranceInfo, emergencyContacts) {
        return {
            contactInfo: Patient.mapContactInfo(contactInfo),
            insurance: Patient.mapInsuranceInfo(insuranceInfo) ?? null,
            emergencyContacts: Patient.mapEmergencyContacts(emergencyContacts),
        };
    }
    static mapContactInfo(contactInfo) {
        if (!contactInfo) {
            return undefined;
        }
        const address = contactInfo.address;
        return {
            primaryPhone: contactInfo.primaryPhone,
            secondaryPhone: contactInfo.secondaryPhone,
            email: contactInfo.email,
            address: address
                ? {
                    street: address.street,
                    ward: address.ward,
                    district: address.district,
                    city: address.city,
                    province: address.province,
                    postalCode: address.postalCode,
                    country: address.country,
                }
                : undefined,
            preferredContactMethod: contactInfo.preferredContactMethod,
        };
    }
    static mapInsuranceInfo(insuranceInfo) {
        if (!insuranceInfo) {
            return undefined;
        }
        return {
            provider: insuranceInfo.provider,
            policyNumber: insuranceInfo.policyNumber,
            groupNumber: insuranceInfo.groupNumber,
            coverageType: insuranceInfo.coverageType,
            validFrom: insuranceInfo.validFrom,
            validTo: insuranceInfo.validTo,
            bhytNumber: insuranceInfo.bhytNumber ?? undefined,
            isPrimary: insuranceInfo.isPrimary,
            isActive: insuranceInfo.isActive,
            isVietnameseInsurance: insuranceInfo.isVietnameseInsurance,
        };
    }
    static mapEmergencyContacts(contacts) {
        if (!contacts || contacts.length === 0) {
            return undefined;
        }
        return contacts.map((contact) => ({
            id: contact.getId(),
            name: contact.name,
            relationship: contact.relationship,
            primaryPhone: contact.primaryPhone,
            secondaryPhone: contact.secondaryPhone,
            email: contact.email,
            address: contact.address,
            isPrimary: contact.isPrimary,
            isActive: contact.isActive,
        }));
    }
    // ==================== Business Methods ====================
    /**
     * Update personal information
     */
    updatePersonalInfo(personalInfo, updatedBy) {
        this.ensureCanUpdate();
        this.props.personalInfo = personalInfo;
        this.props.updatedAt = new Date();
        this.props.updatedBy = updatedBy;
        const patientId = this.props.id.value;
        this.addDomainEvent(new PatientUpdatedEvent_1.PatientUpdatedEvent(patientId, this.props.userId, // Identity Service user ID
        'personal_info', updatedBy, {
            fullName: personalInfo.fullName,
            dateOfBirth: personalInfo.dateOfBirth,
            gender: personalInfo.gender,
            citizenId: personalInfo.nationalId
        }));
    }
    /**
     * Update contact information
     */
    updateContactInfo(contactInfo, updatedBy) {
        this.ensureCanUpdate();
        this.props.contactInfo = contactInfo;
        this.props.updatedAt = new Date();
        this.props.updatedBy = updatedBy;
        const patientId = this.props.id.value;
        this.addDomainEvent(new PatientUpdatedEvent_1.PatientUpdatedEvent(patientId, this.props.userId, // Identity Service user ID
        'contact_info', updatedBy, undefined, {
            phoneNumber: contactInfo.primaryPhone,
            email: contactInfo.email,
            address: contactInfo.address
        }));
    }
    /**
     * Update basic medical information
     */
    updateBasicMedicalInfo(basicMedicalInfo, updatedBy) {
        this.ensureCanUpdate();
        this.props.basicMedicalInfo = basicMedicalInfo;
        this.props.updatedAt = new Date();
        this.props.updatedBy = updatedBy;
        const patientId = this.props.id.value;
        this.addDomainEvent(new PatientUpdatedEvent_1.PatientUpdatedEvent(patientId, this.props.userId, // Identity Service user ID
        'basic_medical_info', updatedBy));
    }
    /**
     * Update insurance information
     */
    updateInsuranceInfo(insuranceInfo, updatedBy) {
        this.ensureCanUpdate();
        this.props.insuranceInfo = insuranceInfo;
        this.props.updatedAt = new Date();
        this.props.updatedBy = updatedBy;
        const patientId = this.props.id.value;
        this.addDomainEvent(new PatientUpdatedEvent_1.PatientUpdatedEvent(patientId, this.props.userId, // Identity Service user ID
        'insurance_info', updatedBy));
    }
    /**
     * Add emergency contact
     */
    addEmergencyContact(contact, updatedBy) {
        this.ensureCanUpdate();
        this.props.emergencyContacts.push(contact);
        this.props.updatedAt = new Date();
        this.props.updatedBy = updatedBy;
        const patientId = this.props.id.value;
        this.addDomainEvent(new PatientUpdatedEvent_1.PatientUpdatedEvent(patientId, this.props.userId, // Identity Service user ID
        'emergency_contact', updatedBy));
    }
    /* POST-MVP: Advanced Emergency Contact Management - Not required for graduation project
    /**
     * Remove emergency contact
     *
    public removeEmergencyContact(contactId: string, updatedBy: string): void {
      this.ensureCanUpdate();
  
      this.props.emergencyContacts = this.props.emergencyContacts.filter(
        (contact) => contact.id !== contactId,
      );
      this.props.updatedAt = new Date();
      this.props.updatedBy = updatedBy;
  
      const patientId = this.props.id.value;
      this.addDomainEvent(
        new PatientUpdatedEvent(
          patientId,
          this.props.userId, // Identity Service user ID
          'emergency_contact',
          updatedBy
        ),
      );
    }
    END POST-MVP: Advanced Emergency Contact Management */
    /* POST-MVP: HIPAA Consent Management - Not required for graduation project
    /**
     * Grant consent
     *
    public grantConsent(consent: PatientConsent, updatedBy: string): void {
      this.ensureCanUpdate();
  
      this.props.consents.push(consent);
      this.props.updatedAt = new Date();
      this.props.updatedBy = updatedBy;
  
      // Event removed in scope reduction
      // const patientId = this.props.id.value;
      // this.addDomainEvent(
      //   new PatientConsentGrantedEvent(
      //     patientId,
      //     consent.getId(),
      //     consent.consentType,
      //     updatedBy,
      //   ),
      // );
    }
    END POST-MVP: HIPAA Consent Management */
    /* POST-MVP: PMI Features (Patient Master Index) - Not required for graduation project
    /**
     * Merge into master patient (mark as duplicate)
     *
    public mergeInto(
      masterPatientId: PatientId,
      reason: string,
      performedBy: string,
    ): void {
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
  
      // Event removed in scope reduction
      // const duplicatePatientId = this.props.id.value;
      // this.addDomainEvent(
      //   new PatientMergedEvent(
      //     duplicatePatientId,
      //     masterPatientId.value,
      //     reason,
      //     performedBy,
      //   ),
      // );
    }
    END POST-MVP: PMI Features */
    /* POST-MVP: FHIR Advanced - Patient Linking not required for graduation project
    /**
     * Link to another patient
     *
    public linkTo(
      otherPatientId: PatientId,
      linkType: 'refer' | 'seealso',
      performedBy: string,
    ): void {
      if (this.props.id.equals(otherPatientId)) {
        throw new Error('Không thể liên kết bệnh nhân với chính nó');
      }
  
      // Check if link already exists
      const existingLink = this.props.links.find(
        (link) =>
          link.otherPatientId.equals(otherPatientId) &&
          link.linkType === linkType,
      );
  
      if (existingLink) {
        throw new Error(
          `Liên kết ${linkType} đã tồn tại với bệnh nhân ${otherPatientId.getValue()}`,
        );
      }
  
      const link = PatientLink.create(otherPatientId, linkType, performedBy);
      this.props.links.push(link);
      this.props.updatedAt = new Date();
      this.props.updatedBy = performedBy;
  
      // Event removed in scope reduction
      // const patientId = this.props.id.value;
      // this.addDomainEvent(
      //   new PatientLinkedEvent(
      //     patientId,
      //     otherPatientId.value,
      //     linkType,
      //     performedBy,
      //   ),
      // );
    }
    END POST-MVP: FHIR Advanced - Patient Linking */
    /* POST-MVP: Patient Lifecycle - Deactivation/Deceased/Reactivation not required for graduation project
    /**
     * Deactivate patient
     *
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
      this.addDomainEvent(
        new PatientDeactivatedEvent(patientId, reason, performedBy),
      );
    }
  
    /**
     * Mark patient as deceased
     *
    public markAsDeceased(performedBy: string): void {
      if (this.props.status === PatientStatus.DECEASED) {
        throw new Error('Bệnh nhân đã được đánh dấu qua đời');
      }
  
      this.props.status = PatientStatus.DECEASED;
      this.props.updatedAt = new Date();
      this.props.updatedBy = performedBy;
  
      const patientId = this.props.id.value;
      this.addDomainEvent(
        new PatientUpdatedEvent(
          patientId,
          this.props.userId, // Identity Service user ID
          'status',
          performedBy
        ),
      );
    }
  
    /**
     * Reactivate patient (from INACTIVE status or, when allowed, DECEASED)
     *
    public reactivate(
      _reason: string,
      performedBy: string,
      options?: { allowDeceased?: boolean },
    ): void {
      if (this.props.status === PatientStatus.MERGED) {
        throw new Error('Không thể kích hoạt lại bệnh nhân đã được gộp');
      }
  
      if (this.props.status === PatientStatus.ACTIVE) {
        throw new Error('Bệnh nhân đang ở trạng thái hoạt động');
      }
  
      if (
        this.props.status === PatientStatus.DECEASED &&
        !options?.allowDeceased
      ) {
        throw new Error('Chỉ có thể kích hoạt lại bệnh nhân đã bị vô hiệu hóa');
      }
  
      if (
        this.props.status !== PatientStatus.INACTIVE &&
        this.props.status !== PatientStatus.DECEASED
      ) {
        throw new Error(
          'Không thể kích hoạt lại bệnh nhân ở trạng thái hiện tại',
        );
      }
  
      this.props.status = PatientStatus.ACTIVE;
      this.props.updatedAt = new Date();
      this.props.updatedBy = performedBy;
  
      const patientId = this.props.id.value;
      this.addDomainEvent(
        new PatientUpdatedEvent(
          patientId,
          this.props.userId, // Identity Service user ID
          'status',
          performedBy
        ),
      );
    }
    END POST-MVP: Patient Lifecycle */
    // ==================== Getters ====================
    getPatientId() {
        return this.props.id.value;
    }
    getPatientIdObject() {
        return this.props.id;
    }
    getUserId() {
        return this.props.userId;
    }
    getPersonalInfo() {
        return this.props.personalInfo;
    }
    getContactInfo() {
        return this.props.contactInfo;
    }
    getBasicMedicalInfo() {
        return this.props.basicMedicalInfo;
    }
    getInsuranceInfo() {
        return this.props.insuranceInfo;
    }
    getEmergencyContacts() {
        return this.props.emergencyContacts.slice(); // Return copy
    }
    /* POST-MVP: HIPAA Consent Management - Getter not required for graduation project
    public getConsents(): PatientConsent[] {
      return this.props.consents.slice(); // Return copy
    }
    END POST-MVP: HIPAA Consent Management */
    getStatus() {
        return this.props.status;
    }
    /* POST-MVP: PMI Features - Getter not required for graduation project
    public getMergedInto(): PatientId | undefined {
      return this.props.mergedInto;
    }
    END POST-MVP: PMI Features */
    /* POST-MVP: FHIR Advanced - Getter not required for graduation project
    public getLinks(): PatientLink[] {
      return this.props.links.slice(); // Return copy
    }
    END POST-MVP: FHIR Advanced */
    getProps() {
        // Deep clone to prevent external mutation of nested collections
        return {
            ...this.props,
            emergencyContacts: this.props.emergencyContacts.slice(),
            consents: this.props.consents.slice(),
            links: this.props.links.slice(),
        };
    }
    // ==================== Required Abstract Methods ====================
    /**
     * Validate entity state (required by Entity base class)
     */
    validate() {
        this.validateInvariants();
    }
    /**
     * Convert to persistence format (required by Entity base class)
     * Note: This is a minimal stub. Use PatientMapper.toPersistence() for actual persistence.
     */
    toPersistence() {
        return {
            id: this.id,
            patient_id: this.props.id.value,
        };
    }
    /**
     * Apply domain event (required by AggregateRoot base class)
     */
    applyEvent(_event) {
        // Event sourcing: Apply event to rebuild state
        // For now, we use state-based persistence, so this is a no-op
        // In future, implement event sourcing logic here
    }
    // ==================== Business Queries ====================
    isActive() {
        return this.props.status === PatientStatus_1.PatientStatus.ACTIVE;
    }
    /* POST-MVP: Patient Lifecycle - Helper not required for graduation project
    public isInactive(): boolean {
      return this.props.status === PatientStatus.INACTIVE;
    }
    END POST-MVP: Patient Lifecycle */
    /* POST-MVP: PMI Features - Helper not required for graduation project
    public isMerged(): boolean {
      return this.props.status === PatientStatus.MERGED;
    }
    END POST-MVP: PMI Features */
    /* POST-MVP: Patient Lifecycle - Helper not required for graduation project
    public isDeceased(): boolean {
      return this.props.status === PatientStatus.DECEASED;
    }
    END POST-MVP: Patient Lifecycle */
    hasBHYTInsurance() {
        return this.props.insuranceInfo?.isBHYT() ?? false;
    }
    hasValidInsurance() {
        return this.props.insuranceInfo?.isValid() ?? false;
    }
    hasEmergencyContacts() {
        return this.props.emergencyContacts.length > 0;
    }
    /* POST-MVP: HIPAA Consent Management - Helper not required for graduation project
    public hasActiveConsents(): boolean {
      return this.props.consents.some((consent) => consent.isActive);
    }
    END POST-MVP: HIPAA Consent Management */
    /* POST-MVP: FHIR Advanced - Helper not required for graduation project
    public hasLinks(): boolean {
      return this.props.links.length > 0;
    }
    END POST-MVP: FHIR Advanced */
    // ==================== Business Invariants ====================
    validateBusinessInvariants() {
        if (!this.props.personalInfo) {
            throw new Error('Thông tin cá nhân không được để trống');
        }
        if (!this.props.contactInfo) {
            throw new Error('Thông tin liên hệ không được để trống');
        }
        if (!this.props.basicMedicalInfo) {
            throw new Error('Thông tin y tế cơ bản không được để trống');
        }
        if (this.props.status === PatientStatus_1.PatientStatus.MERGED && !this.props.mergedInto) {
            throw new Error('Bệnh nhân đã gộp phải có tham chiếu đến bệnh nhân chính');
        }
    }
    ensureCanUpdate() {
        if (this.props.status !== PatientStatus_1.PatientStatus.ACTIVE) {
            throw new Error(`Không thể cập nhật bệnh nhân với trạng thái: ${this.props.status}`);
        }
    }
}
exports.Patient = Patient;
//# sourceMappingURL=Patient.js.map