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
const aggregate_root_1 = require("../../../shared/domain/base/aggregate-root");
const PatientId_1 = require("../value-objects/PatientId");
const PatientLink_1 = require("../value-objects/PatientLink");
const PatientStatus_1 = require("../value-objects/PatientStatus");
const PatientRegisteredEvent_1 = require("../events/PatientRegisteredEvent");
const PatientUpdatedEvent_1 = require("../events/PatientUpdatedEvent");
const PatientMergedEvent_1 = require("../events/PatientMergedEvent");
const PatientLinkedEvent_1 = require("../events/PatientLinkedEvent");
const PatientDeactivatedEvent_1 = require("../events/PatientDeactivatedEvent");
const PatientConsentGrantedEvent_1 = require("../events/PatientConsentGrantedEvent");
class Patient extends aggregate_root_1.HealthcareAggregateRoot {
    constructor(props, id) {
        super(props, id);
    }
    /**
     * Factory method: Register new patient
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
            updatedBy: createdBy
        });
        // Publish domain event
        patient.addDomainEvent(new PatientRegisteredEvent_1.PatientRegisteredEvent(patient));
        return patient;
    }
    /**
     * Factory method: Reconstitute from persistence
     */
    static reconstitute(props) {
        return new Patient(props);
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
        this.addDomainEvent(new PatientUpdatedEvent_1.PatientUpdatedEvent(this, 'personal_info', updatedBy));
    }
    /**
     * Update contact information
     */
    updateContactInfo(contactInfo, updatedBy) {
        this.ensureCanUpdate();
        this.props.contactInfo = contactInfo;
        this.props.updatedAt = new Date();
        this.props.updatedBy = updatedBy;
        this.addDomainEvent(new PatientUpdatedEvent_1.PatientUpdatedEvent(this, 'contact_info', updatedBy));
    }
    /**
     * Update basic medical information
     */
    updateBasicMedicalInfo(basicMedicalInfo, updatedBy) {
        this.ensureCanUpdate();
        this.props.basicMedicalInfo = basicMedicalInfo;
        this.props.updatedAt = new Date();
        this.props.updatedBy = updatedBy;
        this.addDomainEvent(new PatientUpdatedEvent_1.PatientUpdatedEvent(this, 'basic_medical_info', updatedBy));
    }
    /**
     * Update insurance information
     */
    updateInsuranceInfo(insuranceInfo, updatedBy) {
        this.ensureCanUpdate();
        this.props.insuranceInfo = insuranceInfo;
        this.props.updatedAt = new Date();
        this.props.updatedBy = updatedBy;
        this.addDomainEvent(new PatientUpdatedEvent_1.PatientUpdatedEvent(this, 'insurance_info', updatedBy));
    }
    /**
     * Add emergency contact
     */
    addEmergencyContact(contact, updatedBy) {
        this.ensureCanUpdate();
        this.props.emergencyContacts.push(contact);
        this.props.updatedAt = new Date();
        this.props.updatedBy = updatedBy;
        this.addDomainEvent(new PatientUpdatedEvent_1.PatientUpdatedEvent(this, 'emergency_contact', updatedBy));
    }
    /**
     * Remove emergency contact
     */
    removeEmergencyContact(contactId, updatedBy) {
        this.ensureCanUpdate();
        this.props.emergencyContacts = this.props.emergencyContacts.filter(contact => contact.id !== contactId);
        this.props.updatedAt = new Date();
        this.props.updatedBy = updatedBy;
        this.addDomainEvent(new PatientUpdatedEvent_1.PatientUpdatedEvent(this, 'emergency_contact', updatedBy));
    }
    /**
     * Grant consent
     */
    grantConsent(consent, updatedBy) {
        this.ensureCanUpdate();
        this.props.consents.push(consent);
        this.props.updatedAt = new Date();
        this.props.updatedBy = updatedBy;
        this.addDomainEvent(new PatientConsentGrantedEvent_1.PatientConsentGrantedEvent(this, consent, updatedBy));
    }
    /**
     * Merge into master patient (mark as duplicate)
     */
    mergeInto(masterPatientId, reason, performedBy) {
        if (this.props.status === PatientStatus_1.PatientStatus.MERGED) {
            throw new Error('Bệnh nhân đã được gộp trước đó');
        }
        if (this.props.status === PatientStatus_1.PatientStatus.DECEASED) {
            throw new Error('Không thể gộp bệnh nhân đã qua đời');
        }
        if (this.props.id.equals(masterPatientId)) {
            throw new Error('Không thể gộp bệnh nhân vào chính nó');
        }
        this.props.status = PatientStatus_1.PatientStatus.MERGED;
        this.props.mergedInto = masterPatientId;
        this.props.updatedAt = new Date();
        this.props.updatedBy = performedBy;
        // Create "replaced-by" link
        const link = PatientLink_1.PatientLink.createReplacedBy(masterPatientId, performedBy);
        this.props.links.push(link);
        this.addDomainEvent(new PatientMergedEvent_1.PatientMergedEvent(this, masterPatientId, reason, performedBy));
    }
    /**
     * Link to another patient
     */
    linkTo(otherPatientId, linkType, performedBy) {
        if (this.props.id.equals(otherPatientId)) {
            throw new Error('Không thể liên kết bệnh nhân với chính nó');
        }
        // Check if link already exists
        const existingLink = this.props.links.find(link => link.otherPatientId.equals(otherPatientId) && link.linkType === linkType);
        if (existingLink) {
            throw new Error(`Liên kết ${linkType} đã tồn tại với bệnh nhân ${otherPatientId.getValue()}`);
        }
        const link = PatientLink_1.PatientLink.create(otherPatientId, linkType, performedBy);
        this.props.links.push(link);
        this.props.updatedAt = new Date();
        this.props.updatedBy = performedBy;
        this.addDomainEvent(new PatientLinkedEvent_1.PatientLinkedEvent(this, otherPatientId, linkType, performedBy));
    }
    /**
     * Deactivate patient
     */
    deactivate(reason, performedBy) {
        if (this.props.status === PatientStatus_1.PatientStatus.INACTIVE) {
            throw new Error('Bệnh nhân đã bị vô hiệu hóa');
        }
        if (this.props.status === PatientStatus_1.PatientStatus.MERGED) {
            throw new Error('Không thể vô hiệu hóa bệnh nhân đã được gộp');
        }
        if (this.props.status === PatientStatus_1.PatientStatus.DECEASED) {
            throw new Error('Không thể vô hiệu hóa bệnh nhân đã qua đời');
        }
        this.props.status = PatientStatus_1.PatientStatus.INACTIVE;
        this.props.updatedAt = new Date();
        this.props.updatedBy = performedBy;
        this.addDomainEvent(new PatientDeactivatedEvent_1.PatientDeactivatedEvent(this, reason, performedBy));
    }
    /**
     * Mark patient as deceased
     */
    markAsDeceased(performedBy) {
        if (this.props.status === PatientStatus_1.PatientStatus.DECEASED) {
            throw new Error('Bệnh nhân đã được đánh dấu qua đời');
        }
        this.props.status = PatientStatus_1.PatientStatus.DECEASED;
        this.props.updatedAt = new Date();
        this.props.updatedBy = performedBy;
        this.addDomainEvent(new PatientUpdatedEvent_1.PatientUpdatedEvent(this, 'status', performedBy));
    }
    // ==================== Getters ====================
    getPatientId() {
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
    getConsents() {
        return this.props.consents.slice(); // Return copy
    }
    getStatus() {
        return this.props.status;
    }
    getMergedInto() {
        return this.props.mergedInto;
    }
    getLinks() {
        return this.props.links.slice(); // Return copy
    }
    getProps() {
        return { ...this.props };
    }
    // ==================== Business Queries ====================
    isActive() {
        return this.props.status === PatientStatus_1.PatientStatus.ACTIVE;
    }
    isInactive() {
        return this.props.status === PatientStatus_1.PatientStatus.INACTIVE;
    }
    isMerged() {
        return this.props.status === PatientStatus_1.PatientStatus.MERGED;
    }
    isDeceased() {
        return this.props.status === PatientStatus_1.PatientStatus.DECEASED;
    }
    hasBHYTInsurance() {
        return this.props.insuranceInfo?.isBHYT() ?? false;
    }
    hasValidInsurance() {
        return this.props.insuranceInfo?.isValid() ?? false;
    }
    hasEmergencyContacts() {
        return this.props.emergencyContacts.length > 0;
    }
    hasActiveConsents() {
        return this.props.consents.some(consent => consent.isActive);
    }
    hasLinks() {
        return this.props.links.length > 0;
    }
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