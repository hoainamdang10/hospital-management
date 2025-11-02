"use strict";
/**
 * Prescription Aggregate - Clinical EMR Service
 * Core aggregate for managing medication prescriptions
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA, FHIR R4
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrescriptionAggregate = exports.MedicationItemStatus = exports.MedicationRoute = exports.MedicationDosageForm = exports.PrescriptionStatus = void 0;
const aggregate_root_1 = require("@shared/domain/base/aggregate-root");
const PrescriptionCreatedEvent_1 = require("../events/PrescriptionCreatedEvent");
const PrescriptionUpdatedEvent_1 = require("../events/PrescriptionUpdatedEvent");
const PrescriptionDispensedEvent_1 = require("../events/PrescriptionDispensedEvent");
const PrescriptionCompletedEvent_1 = require("../events/PrescriptionCompletedEvent");
var PrescriptionStatus;
(function (PrescriptionStatus) {
    PrescriptionStatus["DRAFT"] = "draft";
    PrescriptionStatus["ACTIVE"] = "active";
    PrescriptionStatus["DISPENSED"] = "dispensed";
    PrescriptionStatus["COMPLETED"] = "completed";
    PrescriptionStatus["CANCELLED"] = "cancelled";
    PrescriptionStatus["EXPIRED"] = "expired";
    PrescriptionStatus["ON_HOLD"] = "on_hold";
    PrescriptionStatus["ARCHIVED"] = "archived";
})(PrescriptionStatus || (exports.PrescriptionStatus = PrescriptionStatus = {}));
var MedicationDosageForm;
(function (MedicationDosageForm) {
    MedicationDosageForm["TABLET"] = "tablet";
    MedicationDosageForm["CAPSULE"] = "capsule";
    MedicationDosageForm["SYRUP"] = "syrup";
    MedicationDosageForm["INJECTION"] = "injection";
    MedicationDosageForm["CREAM"] = "cream";
    MedicationDosageForm["OINTMENT"] = "ointment";
    MedicationDosageForm["DROPS"] = "drops";
    MedicationDosageForm["INHALER"] = "inhaler";
    MedicationDosageForm["PATCH"] = "patch";
    MedicationDosageForm["POWDER"] = "powder";
    MedicationDosageForm["SUPPOSITORY"] = "suppository";
    MedicationDosageForm["OTHER"] = "other";
})(MedicationDosageForm || (exports.MedicationDosageForm = MedicationDosageForm = {}));
var MedicationRoute;
(function (MedicationRoute) {
    MedicationRoute["ORAL"] = "oral";
    MedicationRoute["SUBLINGUAL"] = "sublingual";
    MedicationRoute["TOPICAL"] = "topical";
    MedicationRoute["INJECTION_IV"] = "injection_iv";
    MedicationRoute["INJECTION_IM"] = "injection_im";
    MedicationRoute["INJECTION_SC"] = "injection_sc";
    MedicationRoute["INHALATION"] = "inhalation";
    MedicationRoute["RECTAL"] = "rectal";
    MedicationRoute["VAGINAL"] = "vaginal";
    MedicationRoute["NASAL"] = "nasal";
    MedicationRoute["OPHTHALMIC"] = "ophthalmic";
    MedicationRoute["OTIC"] = "otic";
    MedicationRoute["OTHER"] = "other";
})(MedicationRoute || (exports.MedicationRoute = MedicationRoute = {}));
var MedicationItemStatus;
(function (MedicationItemStatus) {
    MedicationItemStatus["PENDING"] = "pending";
    MedicationItemStatus["DISPENSED"] = "dispensed";
    MedicationItemStatus["DISCONTINUED"] = "discontinued";
    MedicationItemStatus["SUBSTITUTED"] = "substituted";
})(MedicationItemStatus || (exports.MedicationItemStatus = MedicationItemStatus = {}));
class PrescriptionAggregate extends aggregate_root_1.HealthcareAggregateRoot {
    constructor(props, id) {
        super(props, id);
    }
    /**
     * Validate entity (required by Entity base class)
     */
    validate() {
        this.validateInvariants();
    }
    /**
     * Create new prescription
     */
    static create(prescriptionId, medicalRecordId, patientId, prescribedBy, medications, prescribedDate, createdBy, options = {}) {
        // Generate medication item IDs
        const medicationItems = medications.map((med, index) => ({
            ...med,
            itemId: `MED-${Date.now()}-${index}`,
            status: MedicationItemStatus.PENDING,
        }));
        const props = {
            prescriptionId,
            medicalRecordId,
            patientId,
            prescribedBy,
            diagnosis: options.diagnosis,
            diagnosisCode: options.diagnosisCode,
            medications: medicationItems,
            generalInstructions: options.generalInstructions,
            precautions: options.precautions,
            prescribedDate,
            validUntil: options.validUntil,
            refillsAllowed: options.refillsAllowed || 0,
            refillsRemaining: options.refillsAllowed || 0,
            refillHistory: [],
            // FHIR Compliance
            fhirResourceId: `MedicationRequest/${prescriptionId.value}`,
            fhirVersion: '4.0.1',
            fhirProfile: 'http://moh.gov.vn/fhir/StructureDefinition/MedicationRequest',
            // Vietnamese Standards
            vietnamesePrescriptionCode: prescriptionId.value,
            status: options.status || PrescriptionStatus.ACTIVE,
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy,
            updatedBy: createdBy,
            // Initialize access log
            accessLog: [{
                    accessedAt: new Date(),
                    accessedBy: createdBy,
                    accessType: 'write',
                    purpose: 'Tạo đơn thuốc mới',
                }],
            lastAccessedAt: new Date(),
            lastAccessedBy: createdBy,
        };
        const aggregate = new PrescriptionAggregate(props, prescriptionId.value);
        // Validate business invariants
        aggregate.validateInvariants();
        // Add domain event
        aggregate.addDomainEvent(new PrescriptionCreatedEvent_1.PrescriptionCreatedEvent({
            prescriptionId: prescriptionId.value,
            medicalRecordId,
            patientId,
            prescribedBy,
            medicationCount: medicationItems.length,
            prescribedDate,
            createdBy,
            createdAt: props.createdAt,
        }));
        return aggregate;
    }
    /**
     * Reconstitute from database
     */
    static reconstitute(props, id) {
        return new PrescriptionAggregate(props, id || props.prescriptionId.value);
    }
    validateBusinessInvariants() {
        const { prescriptionId, medicalRecordId, patientId, prescribedBy, medications, prescribedDate, createdBy } = this.props;
        // Required fields validation
        if (!prescriptionId) {
            throw new Error('PrescriptionId là bắt buộc');
        }
        if (!medicalRecordId || medicalRecordId.trim() === '') {
            throw new Error('MedicalRecordId là bắt buộc');
        }
        if (!patientId || patientId.trim() === '') {
            throw new Error('PatientId là bắt buộc');
        }
        if (!prescribedBy || prescribedBy.trim() === '') {
            throw new Error('PrescribedBy là bắt buộc');
        }
        if (!medications || medications.length === 0) {
            throw new Error('Đơn thuốc phải có ít nhất một loại thuốc');
        }
        if (!prescribedDate) {
            throw new Error('PrescribedDate là bắt buộc');
        }
        if (!createdBy || createdBy.trim() === '') {
            throw new Error('CreatedBy là bắt buộc');
        }
        // Status validation
        if (!Object.values(PrescriptionStatus).includes(this.props.status)) {
            throw new Error('Trạng thái đơn thuốc không hợp lệ');
        }
        // Patient ID format validation
        const patientIdRegex = /^PAT-\d{6}-\d{3}$/;
        if (!patientIdRegex.test(patientId)) {
            throw new Error('PatientId phải có định dạng PAT-YYYYMM-XXX');
        }
        // Doctor ID format validation
        const doctorIdRegex = /^[A-Z]{2,4}-DOC-\d{6}-\d{3}$/;
        if (!doctorIdRegex.test(prescribedBy)) {
            throw new Error('PrescribedBy phải có định dạng DEPT-DOC-YYYYMM-XXX');
        }
        // Medication validations
        for (const med of medications) {
            if (!med.medicationName || med.medicationName.trim() === '') {
                throw new Error('Tên thuốc là bắt buộc');
            }
            if (!med.dosage || med.dosage.trim() === '') {
                throw new Error('Liều lượng là bắt buộc');
            }
            if (!med.frequency || med.frequency.trim() === '') {
                throw new Error('Tần suất sử dụng là bắt buộc');
            }
            if (!med.duration || med.duration.trim() === '') {
                throw new Error('Thời gian sử dụng là bắt buộc');
            }
            if (med.quantity <= 0) {
                throw new Error('Số lượng thuốc phải lớn hơn 0');
            }
        }
        // Refills validation
        if (this.props.refillsAllowed < 0) {
            throw new Error('Số lần cấp lại không thể âm');
        }
        if (this.props.refillsRemaining < 0) {
            throw new Error('Số lần cấp lại còn lại không thể âm');
        }
        if (this.props.refillsRemaining > this.props.refillsAllowed) {
            throw new Error('Số lần cấp lại còn lại không thể lớn hơn số lần cho phép');
        }
        // Date validations
        if (this.props.validUntil && this.props.validUntil < prescribedDate) {
            throw new Error('Ngày hết hạn phải sau ngày kê đơn');
        }
    }
    toPersistence() {
        return {
            id: this.id,
            prescription_id: this.props.prescriptionId.value,
            medical_record_id: this.props.medicalRecordId,
            patient_id: this.props.patientId,
            prescribed_by: this.props.prescribedBy,
            diagnosis: this.props.diagnosis,
            diagnosis_code: this.props.diagnosisCode,
            medications_json: JSON.stringify(this.props.medications || []),
            general_instructions: this.props.generalInstructions,
            precautions: this.props.precautions,
            prescribed_date: this.props.prescribedDate.toISOString(),
            valid_until: this.props.validUntil?.toISOString(),
            dispensed_by: this.props.dispensedBy,
            dispensed_at: this.props.dispensedAt?.toISOString(),
            pharmacy_id: this.props.pharmacyId,
            refills_allowed: this.props.refillsAllowed,
            refills_remaining: this.props.refillsRemaining,
            refill_history_json: JSON.stringify(this.props.refillHistory || []),
            fhir_resource_id: this.props.fhirResourceId,
            fhir_version: this.props.fhirVersion,
            fhir_profile: this.props.fhirProfile,
            vietnamese_prescription_code: this.props.vietnamesePrescriptionCode,
            status: this.props.status,
            created_at: this.props.createdAt.toISOString(),
            updated_at: this.props.updatedAt.toISOString(),
            created_by: this.props.createdBy,
            updated_by: this.props.updatedBy,
            access_log_json: JSON.stringify(this.props.accessLog || []),
            last_accessed_at: this.props.lastAccessedAt?.toISOString(),
            last_accessed_by: this.props.lastAccessedBy,
            version: this.version || 0,
        };
    }
    applyEvent(event) {
        switch (event.eventType) {
            case 'PrescriptionCreated':
                // Event already applied during creation
                break;
            case 'PrescriptionUpdated':
                this.props.updatedAt = new Date();
                break;
            case 'PrescriptionDispensed':
                this.props.status = PrescriptionStatus.DISPENSED;
                this.props.updatedAt = new Date();
                break;
            case 'PrescriptionCompleted':
                this.props.status = PrescriptionStatus.COMPLETED;
                this.props.updatedAt = new Date();
                break;
            default:
                // Unknown event type
                break;
        }
    }
    getPatientId() {
        return this.props.patientId;
    }
    containsPHI() {
        return true;
    }
    /**
     * Dispense prescription
     */
    dispense(dispensedBy, pharmacyId) {
        if (this.isDispensed() || this.isCompleted()) {
            throw new Error('Đơn thuốc đã được cấp hoặc đã hoàn thành');
        }
        if (this.isCancelled()) {
            throw new Error('Không thể cấp thuốc cho đơn đã hủy');
        }
        if (this.isExpired()) {
            throw new Error('Đơn thuốc đã hết hạn');
        }
        this.logAccess(dispensedBy, 'dispense', 'Cấp thuốc theo đơn');
        this.props.dispensedBy = dispensedBy;
        this.props.dispensedAt = new Date();
        this.props.pharmacyId = pharmacyId;
        this.props.status = PrescriptionStatus.DISPENSED;
        this.props.updatedAt = new Date();
        this.props.updatedBy = dispensedBy;
        // Mark all medications as dispensed
        for (const med of this.props.medications) {
            med.status = MedicationItemStatus.DISPENSED;
            med.dispensedDate = new Date();
            med.dispensedQuantity = med.quantity;
        }
        this.addDomainEvent(new PrescriptionDispensedEvent_1.PrescriptionDispensedEvent({
            prescriptionId: this.props.prescriptionId.value,
            medicalRecordId: this.props.medicalRecordId,
            patientId: this.props.patientId,
            dispensedBy,
            dispensedAt: this.props.dispensedAt,
            pharmacyId,
            medicationCount: this.props.medications.length,
        }));
    }
    /**
     * Refill prescription
     */
    refill(refilledBy, pharmacyId) {
        if (!this.isDispensed()) {
            throw new Error('Chỉ có thể cấp lại đơn thuốc đã được cấp trước đó');
        }
        if (this.props.refillsRemaining <= 0) {
            throw new Error('Đơn thuốc không còn lần cấp lại nào');
        }
        if (this.isExpired()) {
            throw new Error('Đơn thuốc đã hết hạn');
        }
        this.logAccess(refilledBy, 'dispense', 'Cấp lại thuốc theo đơn');
        // Record refill
        const refillNumber = this.props.refillsAllowed - this.props.refillsRemaining + 1;
        if (!this.props.refillHistory) {
            this.props.refillHistory = [];
        }
        this.props.refillHistory.push({
            refillNumber,
            refilledDate: new Date(),
            refilledBy,
            pharmacyId,
        });
        this.props.refillsRemaining--;
        this.props.dispensedBy = refilledBy;
        this.props.dispensedAt = new Date();
        this.props.pharmacyId = pharmacyId;
        this.props.updatedAt = new Date();
        this.props.updatedBy = refilledBy;
        // If no more refills, mark as completed
        if (this.props.refillsRemaining === 0) {
            this.props.status = PrescriptionStatus.COMPLETED;
        }
        this.addDomainEvent(new PrescriptionUpdatedEvent_1.PrescriptionUpdatedEvent({
            prescriptionId: this.props.prescriptionId.value,
            medicalRecordId: this.props.medicalRecordId,
            patientId: this.props.patientId,
            updatedFields: ['refillsRemaining', 'refillHistory'],
            previousValues: { refillsRemaining: this.props.refillsRemaining + 1 },
            newValues: { refillsRemaining: this.props.refillsRemaining },
            updatedBy: refilledBy,
            updatedAt: this.props.updatedAt,
            updateReason: `Cấp lại lần ${refillNumber}`,
        }));
    }
    /**
     * Complete prescription
     */
    complete(completedBy) {
        if (this.isCompleted()) {
            throw new Error('Đơn thuốc đã được hoàn thành');
        }
        if (this.isCancelled()) {
            throw new Error('Không thể hoàn thành đơn thuốc đã hủy');
        }
        this.logAccess(completedBy, 'write', 'Hoàn thành đơn thuốc');
        this.props.status = PrescriptionStatus.COMPLETED;
        this.props.updatedAt = new Date();
        this.props.updatedBy = completedBy;
        this.addDomainEvent(new PrescriptionCompletedEvent_1.PrescriptionCompletedEvent({
            prescriptionId: this.props.prescriptionId.value,
            medicalRecordId: this.props.medicalRecordId,
            patientId: this.props.patientId,
            prescribedBy: this.props.prescribedBy,
            completedBy,
            completedAt: this.props.updatedAt,
        }));
    }
    /**
     * Cancel prescription
     */
    cancel(cancelledBy, reason) {
        if (this.isCompleted()) {
            throw new Error('Không thể hủy đơn thuốc đã hoàn thành');
        }
        if (this.isCancelled()) {
            throw new Error('Đơn thuốc đã bị hủy');
        }
        this.logAccess(cancelledBy, 'write', 'Hủy đơn thuốc');
        const previousStatus = this.props.status;
        this.props.status = PrescriptionStatus.CANCELLED;
        this.props.updatedAt = new Date();
        this.props.updatedBy = cancelledBy;
        this.addDomainEvent(new PrescriptionUpdatedEvent_1.PrescriptionUpdatedEvent({
            prescriptionId: this.props.prescriptionId.value,
            medicalRecordId: this.props.medicalRecordId,
            patientId: this.props.patientId,
            updatedFields: ['status'],
            previousValues: { status: previousStatus },
            newValues: { status: PrescriptionStatus.CANCELLED },
            updatedBy: cancelledBy,
            updatedAt: this.props.updatedAt,
            updateReason: reason,
        }));
    }
    /**
     * Check if prescription is expired
     */
    checkExpiration() {
        if (this.props.validUntil && new Date() > this.props.validUntil) {
            if (this.props.status === PrescriptionStatus.ACTIVE || this.props.status === PrescriptionStatus.DISPENSED) {
                this.props.status = PrescriptionStatus.EXPIRED;
            }
        }
    }
    /**
     * Log access for HIPAA compliance
     */
    logAccess(accessedBy, accessType, purpose, ipAddress, userAgent) {
        if (!this.props.accessLog) {
            this.props.accessLog = [];
        }
        this.props.accessLog.push({
            accessedAt: new Date(),
            accessedBy,
            accessType,
            ipAddress,
            userAgent,
            purpose,
        });
        this.props.lastAccessedAt = new Date();
        this.props.lastAccessedBy = accessedBy;
    }
    /**
     * Record read access (HIPAA compliance)
     */
    recordReadAccess(accessedBy, purpose, ipAddress, userAgent) {
        this.logAccess(accessedBy, 'read', purpose, ipAddress, userAgent);
    }
    // --- Getters ---
    get prescriptionId() {
        return this.props.prescriptionId;
    }
    get medicalRecordId() {
        return this.props.medicalRecordId;
    }
    get patientId() {
        return this.props.patientId;
    }
    get prescribedBy() {
        return this.props.prescribedBy;
    }
    get diagnosis() {
        return this.props.diagnosis;
    }
    get diagnosisCode() {
        return this.props.diagnosisCode;
    }
    get medications() {
        return this.props.medications;
    }
    get generalInstructions() {
        return this.props.generalInstructions;
    }
    get precautions() {
        return this.props.precautions;
    }
    get prescribedDate() {
        return this.props.prescribedDate;
    }
    get validUntil() {
        return this.props.validUntil;
    }
    get dispensedBy() {
        return this.props.dispensedBy;
    }
    get dispensedAt() {
        return this.props.dispensedAt;
    }
    get pharmacyId() {
        return this.props.pharmacyId;
    }
    get refillsAllowed() {
        return this.props.refillsAllowed;
    }
    get refillsRemaining() {
        return this.props.refillsRemaining;
    }
    get refillHistory() {
        return this.props.refillHistory || [];
    }
    get status() {
        return this.props.status;
    }
    get createdAt() {
        return this.props.createdAt;
    }
    get updatedAt() {
        return this.props.updatedAt;
    }
    get createdBy() {
        return this.props.createdBy;
    }
    get updatedBy() {
        return this.props.updatedBy;
    }
    get accessLog() {
        return this.props.accessLog || [];
    }
    get lastAccessedAt() {
        return this.props.lastAccessedAt;
    }
    get lastAccessedBy() {
        return this.props.lastAccessedBy;
    }
    // --- Business Logic Methods ---
    isDraft() {
        return this.props.status === PrescriptionStatus.DRAFT;
    }
    isActive() {
        return this.props.status === PrescriptionStatus.ACTIVE;
    }
    isDispensed() {
        return this.props.status === PrescriptionStatus.DISPENSED;
    }
    isCompleted() {
        return this.props.status === PrescriptionStatus.COMPLETED;
    }
    isCancelled() {
        return this.props.status === PrescriptionStatus.CANCELLED;
    }
    isExpired() {
        return this.props.status === PrescriptionStatus.EXPIRED;
    }
    isOnHold() {
        return this.props.status === PrescriptionStatus.ON_HOLD;
    }
    isArchived() {
        return this.props.status === PrescriptionStatus.ARCHIVED;
    }
    hasRefillsAvailable() {
        return this.props.refillsRemaining > 0;
    }
    /**
     * Get summary information
     */
    getSummary() {
        return {
            prescriptionId: this.props.prescriptionId.value,
            medicalRecordId: this.props.medicalRecordId,
            patientId: this.props.patientId,
            prescribedBy: this.props.prescribedBy,
            medicationCount: this.medications.length,
            status: this.props.status,
            prescribedDate: this.props.prescribedDate,
            validUntil: this.props.validUntil,
            dispensedAt: this.props.dispensedAt,
            refillsAllowed: this.props.refillsAllowed,
            refillsRemaining: this.props.refillsRemaining,
            createdAt: this.props.createdAt,
            updatedAt: this.props.updatedAt,
        };
    }
    /**
     * Convert to JSON
     */
    toJSON() {
        return {
            id: this.id,
            prescriptionId: this.props.prescriptionId.value,
            medicalRecordId: this.props.medicalRecordId,
            patientId: this.props.patientId,
            prescribedBy: this.props.prescribedBy,
            diagnosis: this.props.diagnosis,
            diagnosisCode: this.props.diagnosisCode,
            medications: this.props.medications,
            generalInstructions: this.props.generalInstructions,
            precautions: this.props.precautions,
            prescribedDate: this.props.prescribedDate,
            validUntil: this.props.validUntil,
            dispensedBy: this.props.dispensedBy,
            dispensedAt: this.props.dispensedAt,
            pharmacyId: this.props.pharmacyId,
            refillsAllowed: this.props.refillsAllowed,
            refillsRemaining: this.props.refillsRemaining,
            refillHistory: this.props.refillHistory,
            fhirResourceId: this.props.fhirResourceId,
            fhirVersion: this.props.fhirVersion,
            fhirProfile: this.props.fhirProfile,
            vietnamesePrescriptionCode: this.props.vietnamesePrescriptionCode,
            status: this.props.status,
            createdAt: this.props.createdAt,
            updatedAt: this.props.updatedAt,
            createdBy: this.props.createdBy,
            updatedBy: this.props.updatedBy,
            lastAccessedAt: this.props.lastAccessedAt,
            lastAccessedBy: this.props.lastAccessedBy,
            version: this.version,
        };
    }
}
exports.PrescriptionAggregate = PrescriptionAggregate;
//# sourceMappingURL=Prescription.aggregate.js.map