"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Patient = void 0;
const aggregate_root_1 = require("@shared/domain/base/aggregate-root");
const PatientId_1 = require("../value-objects/PatientId");
const PersonalInfo_1 = require("../value-objects/PersonalInfo");
const ContactInfo_1 = require("../value-objects/ContactInfo");
const MedicalInfo_1 = require("../value-objects/MedicalInfo");
const InsuranceInfo_1 = require("../entities/InsuranceInfo");
const EmergencyContact_1 = require("../entities/EmergencyContact");
const PatientConsent_1 = require("../entities/PatientConsent");
const MedicalHistory_1 = require("../entities/MedicalHistory");
const PatientRegisteredEvent_1 = require("../events/PatientRegisteredEvent");
const PatientUpdatedEvent_1 = require("../events/PatientUpdatedEvent");
const PatientConsentGrantedEvent_1 = require("../events/PatientConsentGrantedEvent");
class Patient extends aggregate_root_1.HealthcareAggregateRoot {
    constructor(props, id) {
        super(props, id);
    }
    // Factory method for creating new patients
    static create(userId, personalInfo, contactInfo, medicalInfo, insuranceInfo) {
        const patientId = PatientId_1.PatientId.generate();
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
        patient.addDomainEvent(new PatientRegisteredEvent_1.PatientRegisteredEvent(patientId, userId, personalInfo));
        return patient;
    }
    // Factory method for reconstituting from persistence
    static reconstitute(props) {
        return new Patient(props);
    }
    // Getters
    get id() {
        return this.props.id;
    }
    get userId() {
        return this.props.userId;
    }
    get personalInfo() {
        return this.props.personalInfo;
    }
    get contactInfo() {
        return this.props.contactInfo;
    }
    get medicalInfo() {
        return this.props.medicalInfo;
    }
    get insuranceInfo() {
        return this.props.insuranceInfo;
    }
    get emergencyContacts() {
        return this.props.emergencyContacts.slice();
    }
    get consents() {
        return this.props.consents.slice();
    }
    get medicalHistory() {
        return this.props.medicalHistory.slice();
    }
    get registrationDate() {
        return this.props.registrationDate;
    }
    get lastVisitDate() {
        return this.props.lastVisitDate;
    }
    get isActive() {
        return this.props.isActive;
    }
    // Business methods
    updatePersonalInfo(personalInfo) {
        this.props.personalInfo = personalInfo;
        this.props.updatedAt = new Date();
        this.addDomainEvent(new PatientUpdatedEvent_1.PatientUpdatedEvent(this.props.id, 'personal_info'));
    }
    updateContactInfo(contactInfo) {
        this.props.contactInfo = contactInfo;
        this.props.updatedAt = new Date();
        this.addDomainEvent(new PatientUpdatedEvent_1.PatientUpdatedEvent(this.props.id, 'contact_info'));
    }
    updateMedicalInfo(medicalInfo) {
        this.props.medicalInfo = medicalInfo;
        this.props.updatedAt = new Date();
        this.addDomainEvent(new PatientUpdatedEvent_1.PatientUpdatedEvent(this.props.id, 'medical_info'));
    }
    updateInsuranceInfo(insuranceInfo) {
        this.props.insuranceInfo = insuranceInfo;
        this.props.updatedAt = new Date();
        this.addDomainEvent(new PatientUpdatedEvent_1.PatientUpdatedEvent(this.props.id, 'insurance_info'));
    }
    addEmergencyContact(emergencyContact) {
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
    removeEmergencyContact(contactId) {
        this.props.emergencyContacts = this.props.emergencyContacts.filter(contact => contact.id !== contactId);
        this.props.updatedAt = new Date();
    }
    grantConsent(consentType, witnessId) {
        // Check if consent already exists
        const existingConsent = this.props.consents.find(consent => consent.consentType === consentType && consent.isActive);
        if (existingConsent) {
            throw new Error(`Đã có sự đồng ý cho ${consentType}`);
        }
        const consent = PatientConsent_1.PatientConsent.grant(this.props.id, consentType, witnessId);
        this.props.consents.push(consent);
        this.props.updatedAt = new Date();
        this.addDomainEvent(new PatientConsentGrantedEvent_1.PatientConsentGrantedEvent(this.props.id, consentType));
    }
    withdrawConsent(consentType) {
        const consent = this.props.consents.find(consent => consent.consentType === consentType && consent.isActive);
        if (!consent) {
            throw new Error(`Không tìm thấy sự đồng ý cho ${consentType}`);
        }
        consent.withdraw();
        this.props.updatedAt = new Date();
    }
    addMedicalHistory(medicalHistory) {
        this.props.medicalHistory.push(medicalHistory);
        this.props.updatedAt = new Date();
    }
    updateLastVisit() {
        this.props.lastVisitDate = new Date();
        this.props.updatedAt = new Date();
    }
    deactivate() {
        this.props.isActive = false;
        this.props.updatedAt = new Date();
    }
    activate() {
        this.props.isActive = true;
        this.props.updatedAt = new Date();
    }
    // Healthcare-specific business methods
    hasValidInsurance() {
        return this.props.insuranceInfo?.isActive &&
            this.props.insuranceInfo?.isNotExpired();
    }
    getPrimaryInsurance() {
        return this.props.insuranceInfo?.isPrimary ? this.props.insuranceInfo : undefined;
    }
    getPrimaryEmergencyContact() {
        return this.props.emergencyContacts.find(contact => contact.isPrimary);
    }
    hasConsentFor(consentType) {
        return this.props.consents.some(consent => consent.consentType === consentType &&
            consent.isActive &&
            !consent.isExpired());
    }
    getActiveConsents() {
        return this.props.consents.filter(consent => consent.isActive && !consent.isExpired());
    }
    getAge() {
        return this.props.personalInfo.getAge();
    }
    isMinor() {
        return this.getAge() < 18;
    }
    requiresGuardianConsent() {
        return this.isMinor();
    }
    // Vietnamese healthcare specific methods
    hasBHYTInsurance() {
        return this.props.insuranceInfo?.coverageType === 'BHYT';
    }
    hasBHTNInsurance() {
        return this.props.insuranceInfo?.coverageType === 'BHTN';
    }
    hasPrivateInsurance() {
        return this.props.insuranceInfo?.coverageType === 'private';
    }
    isSelfPay() {
        return !this.props.insuranceInfo || this.props.insuranceInfo.coverageType === 'self_pay';
    }
    // Medical history methods
    hasCondition(conditionName) {
        return this.props.medicalHistory.some(history => history.conditionName.toLowerCase() === conditionName.toLowerCase() &&
            history.isActive());
    }
    getActiveConditions() {
        return this.props.medicalHistory.filter(history => history.isActive());
    }
    getChronicConditions() {
        return this.props.medicalHistory.filter(history => history.isChronic());
    }
    getCriticalConditions() {
        return this.props.medicalHistory.filter(history => history.isCritical());
    }
    // Validation methods
    canScheduleAppointment() {
        return this.props.isActive && this.hasConsentFor('treatment');
    }
    canAccessMedicalRecords() {
        return this.hasConsentFor('data_sharing');
    }
    canParticipateInResearch() {
        return this.hasConsentFor('research');
    }
    // Audit methods
    getAuditInfo() {
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
    equals(other) {
        return this.props.id.equals(other.props.id);
    }
    // ==================== V2 HEALTHCARE AGGREGATE METHODS ====================
    /**
     * Validate business invariants
     */
    validateBusinessInvariants() {
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
    applyEvent(event) {
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
    getPatientId() {
        return this.props.id.value;
    }
    /**
     * Convert to persistence format
     */
    toPersistence() {
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
    static fromPersistence(data) {
        const props = {
            id: PatientId_1.PatientId.fromString(data.id),
            userId: data.user_id,
            personalInfo: PersonalInfo_1.PersonalInfo.fromPersistence(data.personal_info),
            contactInfo: ContactInfo_1.ContactInfo.fromPersistence(data.contact_info),
            medicalInfo: MedicalInfo_1.MedicalInfo.fromPersistence(data.medical_info),
            insuranceInfo: data.insurance_info ? InsuranceInfo_1.InsuranceInfo.fromPersistence(data.insurance_info) : undefined,
            emergencyContacts: (data.emergency_contacts || []).map((ec) => EmergencyContact_1.EmergencyContact.fromPersistence(ec)),
            consents: (data.consents || []).map((c) => PatientConsent_1.PatientConsent.fromPersistence(c)),
            medicalHistory: (data.medical_history || []).map((mh) => MedicalHistory_1.MedicalHistory.fromPersistence(mh)),
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
    isVietnameseHealthcareCompliant() {
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
    isHIPAACompliant() {
        return (this.props.personalInfo.isHIPAACompliant() &&
            this.props.contactInfo.isHIPAACompliant() &&
            this.props.medicalInfo.isHIPAACompliant() &&
            this.props.consents.some(c => c.isHIPAAConsent() && c.isActive()) &&
            (!this.props.insuranceInfo || this.props.insuranceInfo.isHIPAACompliant()));
    }
    /**
     * Get patient summary for logging (no sensitive data)
     */
    getSummaryForLogging() {
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
    hasVietnameseInsurance() {
        return !!this.props.insuranceInfo && this.props.insuranceInfo.isVietnameseInsurance();
    }
    /**
     * Get Vietnamese insurance number (BHYT)
     */
    getVietnameseInsuranceNumber() {
        return this.props.insuranceInfo?.getVietnameseInsuranceNumber() || null;
    }
}
exports.Patient = Patient;
//# sourceMappingURL=Patient.js.map