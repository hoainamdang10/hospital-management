"use strict";
/**
 * MedicalRecord Aggregate - Clinical EMR Service
 * Core aggregate for managing medical records with simplified scope
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MedicalRecordAggregate = exports.MedicalRecordStatus = void 0;
const aggregate_root_1 = require("@shared/domain/base/aggregate-root");
const MedicalRecordCreatedEvent_1 = require("../events/MedicalRecordCreatedEvent");
const MedicalRecordUpdatedEvent_1 = require("../events/MedicalRecordUpdatedEvent");
var MedicalRecordStatus;
(function (MedicalRecordStatus) {
    MedicalRecordStatus["ACTIVE"] = "active";
    MedicalRecordStatus["ARCHIVED"] = "archived";
    MedicalRecordStatus["DELETED"] = "deleted";
    MedicalRecordStatus["DRAFT"] = "draft";
    MedicalRecordStatus["PENDING_REVIEW"] = "pending-review";
    MedicalRecordStatus["REVIEWED"] = "reviewed";
    MedicalRecordStatus["AMENDED"] = "amended";
})(MedicalRecordStatus || (exports.MedicalRecordStatus = MedicalRecordStatus = {}));
class MedicalRecordAggregate extends aggregate_root_1.HealthcareAggregateRoot {
    constructor(props, id) {
        super(props, id);
    }
    /**
     * Create new medical record with enhanced features
     */
    static create(recordId, patientId, doctorId, visitDate, createdBy, options = {}) {
        const props = {
            recordId,
            patientId,
            doctorId,
            appointmentId: options.appointmentId,
            visitDate,
            symptoms: options.symptoms,
            examinationNotes: options.examinationNotes,
            // Enhanced with Value Objects
            diagnoses: options.diagnoses || [],
            medications: options.medications || [],
            // Legacy fields for backward compatibility
            diagnosis: options.diagnosis,
            treatment: options.treatment,
            medicationsLegacy: options.medicationsLegacy,
            notes: options.notes,
            vitalSigns: options.vitalSigns,
            // FHIR Compliance
            fhirResourceId: `MedicalRecord/${recordId.value}`,
            fhirVersion: "4.0.1",
            fhirProfile: options.fhirProfile ||
                "http://moh.gov.vn/fhir/StructureDefinition/MedicalRecord",
            // Vietnamese Medical Standards
            vietnameseMedicalCode: recordId.value,
            specialtyCode: options.specialtyCode,
            hospitalCode: options.hospitalCode,
            status: options.status || MedicalRecordStatus.ACTIVE,
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy,
            updatedBy: createdBy,
            // Initialize access log
            accessLog: [
                {
                    accessedAt: new Date(),
                    accessedBy: createdBy,
                    accessType: "write",
                    purpose: "Tạo hồ sơ bệnh án mới",
                },
            ],
            lastAccessedAt: new Date(),
            lastAccessedBy: createdBy,
        };
        const aggregate = new MedicalRecordAggregate(props, recordId.value);
        // Validate business invariants
        aggregate.validateInvariants();
        // Add domain event
        aggregate.addDomainEvent(new MedicalRecordCreatedEvent_1.MedicalRecordCreatedEvent({
            recordId: recordId.value,
            patientId,
            doctorId,
            appointmentId: options.appointmentId,
            visitDate,
            symptoms: options.symptoms,
            diagnosis: options.diagnosis,
            createdBy,
            createdAt: props.createdAt
        }));
        return aggregate;
    }
    /**
     * Reconstitute from database
     */
    static reconstitute(props, id) {
        return new MedicalRecordAggregate(props, id || props.recordId.value);
    }
    validateBusinessInvariants() {
        const { recordId, patientId, doctorId, visitDate, createdBy } = this.props;
        // Required fields validation
        if (!recordId) {
            throw new Error("RecordId là bắt buộc");
        }
        if (!patientId || patientId.trim() === "") {
            throw new Error("PatientId là bắt buộc");
        }
        if (!doctorId || doctorId.trim() === "") {
            throw new Error("DoctorId là bắt buộc");
        }
        if (!visitDate) {
            throw new Error("Ngày khám là bắt buộc");
        }
        if (!createdBy || createdBy.trim() === "") {
            throw new Error("CreatedBy là bắt buộc");
        }
        // Visit date validation
        const now = new Date();
        const maxFutureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days in future
        const minPastDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); // 1 year in past
        if (visitDate > maxFutureDate) {
            throw new Error("Ngày khám không được quá 7 ngày trong tương lai");
        }
        if (visitDate < minPastDate) {
            throw new Error("Ngày khám không được quá 1 năm trong quá khứ");
        }
        // Status validation
        if (!Object.values(MedicalRecordStatus).includes(this.props.status)) {
            throw new Error("Trạng thái hồ sơ không hợp lệ");
        }
        // Patient ID format validation (Vietnamese format)
        const patientIdRegex = /^PAT-\d{6}-\d{3}$/;
        if (!patientIdRegex.test(patientId)) {
            throw new Error("PatientId phải có định dạng PAT-YYYYMM-XXX");
        }
        // Doctor ID format validation (Vietnamese format)
        const doctorIdRegex = /^[A-Z]{2,4}-DOC-\d{6}-\d{3}$/;
        if (!doctorIdRegex.test(doctorId)) {
            throw new Error("DoctorId phải có định dạng DEPT-DOC-YYYYMM-XXX");
        }
    }
    toPersistence() {
        return {
            id: this.id,
            record_id: this.props.recordId.value,
            patient_id: this.props.patientId,
            doctor_id: this.props.doctorId,
            appointment_id: this.props.appointmentId,
            visit_date: this.props.visitDate.toISOString(),
            symptoms: this.props.symptoms,
            examination_notes: this.props.examinationNotes,
            diagnosis: this.props.diagnosis,
            treatment: this.props.treatment,
            medications: this.props.medicationsLegacy,
            notes: this.props.notes,
            diagnoses_json: JSON.stringify(this.props.diagnoses.map(d => d.toJSON())),
            medications_json: JSON.stringify(this.props.medications.map(m => m.toJSON())),
            vital_signs_json: this.props.vitalSigns ? JSON.stringify(this.props.vitalSigns.toJSON()) : null,
            fhir_resource_id: this.props.fhirResourceId,
            fhir_version: this.props.fhirVersion,
            fhir_profile: this.props.fhirProfile,
            vietnamese_medical_code: this.props.vietnameseMedicalCode,
            specialty_code: this.props.specialtyCode,
            hospital_code: this.props.hospitalCode,
            status: this.props.status,
            created_at: this.props.createdAt.toISOString(),
            updated_at: this.props.updatedAt.toISOString(),
            created_by: this.props.createdBy,
            updated_by: this.props.updatedBy,
            access_log_json: JSON.stringify(this.props.accessLog || []),
            last_accessed_at: this.props.lastAccessedAt?.toISOString(),
            last_accessed_by: this.props.lastAccessedBy,
            version: this.version || 0
        };
    }
    applyEvent(event) {
        switch (event.eventType) {
            case "MedicalRecordCreated":
                // Event already applied during creation
                break;
            case "MedicalRecordUpdated":
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
     * Update medical record information
     */
    updateMedicalInformation(updates, updatedBy, updateReason) {
        const previousValues = {};
        const newValues = {};
        const updatedFields = [];
        // Track changes
        Object.entries(updates).forEach(([key, value]) => {
            if (value !== undefined &&
                this.props[key] !== value) {
                previousValues[key] = this.props[key];
                newValues[key] = value;
                updatedFields.push(key);
                this.props[key] = value;
            }
        });
        if (updatedFields.length > 0) {
            this.props.updatedAt = new Date();
            this.props.updatedBy = updatedBy;
            // Add domain event
            this.addDomainEvent(new MedicalRecordUpdatedEvent_1.MedicalRecordUpdatedEvent({
                recordId: this.props.recordId.value,
                patientId: this.props.patientId,
                doctorId: this.props.doctorId,
                updatedFields,
                previousValues,
                newValues,
                updatedBy,
                updatedAt: this.props.updatedAt,
                updateReason,
            }));
        }
    }
    /**
     * Update vital signs
     */
    updateVitalSigns(vitalSigns, updatedBy) {
        this.logAccess(updatedBy, "write", "Cập nhật sinh hiệu");
        const previousVitalSigns = this.props.vitalSigns;
        this.props.vitalSigns = vitalSigns;
        this.props.updatedAt = new Date();
        this.props.updatedBy = updatedBy;
        // Add domain event
        this.addDomainEvent(new MedicalRecordUpdatedEvent_1.MedicalRecordUpdatedEvent({
            recordId: this.props.recordId.value,
            patientId: this.props.patientId,
            doctorId: this.props.doctorId,
            updatedFields: ["vitalSigns"],
            previousValues: { vitalSigns: previousVitalSigns?.toJSON() },
            newValues: { vitalSigns: vitalSigns.toJSON() },
            updatedBy,
            updatedAt: this.props.updatedAt,
            updateReason: "Cập nhật sinh hiệu",
        }));
    }
    /**
     * Add diagnosis to medical record
     */
    addDiagnosis(diagnosis, updatedBy) {
        this.logAccess(updatedBy, "write", "Thêm chẩn đoán");
        // Check for duplicate diagnoses
        const existingDiagnosis = this.props.diagnoses.find((d) => d.code === diagnosis.code);
        if (existingDiagnosis) {
            throw new Error(`Chẩn đoán với mã ${diagnosis.code} đã tồn tại`);
        }
        this.props.diagnoses.push(diagnosis);
        this.props.updatedAt = new Date();
        this.props.updatedBy = updatedBy;
        // Add domain event
        this.addDomainEvent(new MedicalRecordUpdatedEvent_1.MedicalRecordUpdatedEvent({
            recordId: this.props.recordId.value,
            patientId: this.props.patientId,
            doctorId: this.props.doctorId,
            updatedFields: ["diagnoses"],
            previousValues: { diagnosesCount: this.props.diagnoses.length - 1 },
            newValues: {
                diagnosesCount: this.props.diagnoses.length,
                newDiagnosis: diagnosis.toJSON(),
            },
            updatedBy,
            updatedAt: this.props.updatedAt,
            updateReason: `Thêm chẩn đoán: ${diagnosis.display}`,
        }));
    }
    /**
     * Remove diagnosis from medical record
     */
    removeDiagnosis(diagnosisCode, updatedBy, reason) {
        this.logAccess(updatedBy, "write", "Xóa chẩn đoán");
        const diagnosisIndex = this.props.diagnoses.findIndex((d) => d.code === diagnosisCode);
        if (diagnosisIndex === -1) {
            throw new Error(`Không tìm thấy chẩn đoán với mã ${diagnosisCode}`);
        }
        const removedDiagnosis = this.props.diagnoses[diagnosisIndex];
        this.props.diagnoses.splice(diagnosisIndex, 1);
        this.props.updatedAt = new Date();
        this.props.updatedBy = updatedBy;
        // Add domain event
        this.addDomainEvent(new MedicalRecordUpdatedEvent_1.MedicalRecordUpdatedEvent({
            recordId: this.props.recordId.value,
            patientId: this.props.patientId,
            doctorId: this.props.doctorId,
            updatedFields: ["diagnoses"],
            previousValues: {
                diagnosesCount: this.props.diagnoses.length + 1,
                removedDiagnosis: removedDiagnosis.toJSON(),
            },
            newValues: { diagnosesCount: this.props.diagnoses.length },
            updatedBy,
            updatedAt: this.props.updatedAt,
            updateReason: reason || `Xóa chẩn đoán: ${removedDiagnosis.display}`,
        }));
    }
    /**
     * Add medication to medical record
     */
    addMedication(medication, updatedBy) {
        this.logAccess(updatedBy, "write", "Thêm thuốc");
        // Check for duplicate medications
        const existingMedication = this.props.medications.find((m) => m.code === medication.code);
        if (existingMedication && existingMedication.isActive()) {
            throw new Error(`Thuốc với mã ${medication.code} đang được sử dụng`);
        }
        this.props.medications.push(medication);
        this.props.updatedAt = new Date();
        this.props.updatedBy = updatedBy;
        // Add domain event
        this.addDomainEvent(new MedicalRecordUpdatedEvent_1.MedicalRecordUpdatedEvent({
            recordId: this.props.recordId.value,
            patientId: this.props.patientId,
            doctorId: this.props.doctorId,
            updatedFields: ["medications"],
            previousValues: { medicationsCount: this.props.medications.length - 1 },
            newValues: {
                medicationsCount: this.props.medications.length,
                newMedication: medication.toJSON(),
            },
            updatedBy,
            updatedAt: this.props.updatedAt,
            updateReason: `Thêm thuốc: ${medication.name}`,
        }));
    }
    /**
     * Remove medication from medical record
     */
    removeMedication(medicationCode, updatedBy, reason) {
        this.logAccess(updatedBy, "write", "Xóa thuốc");
        const medicationIndex = this.props.medications.findIndex((m) => m.code === medicationCode);
        if (medicationIndex === -1) {
            throw new Error(`Không tìm thấy thuốc với mã ${medicationCode}`);
        }
        const removedMedication = this.props.medications[medicationIndex];
        this.props.medications.splice(medicationIndex, 1);
        this.props.updatedAt = new Date();
        this.props.updatedBy = updatedBy;
        // Add domain event
        this.addDomainEvent(new MedicalRecordUpdatedEvent_1.MedicalRecordUpdatedEvent({
            recordId: this.props.recordId.value,
            patientId: this.props.patientId,
            doctorId: this.props.doctorId,
            updatedFields: ["medications"],
            previousValues: {
                medicationsCount: this.props.medications.length + 1,
                removedMedication: removedMedication.toJSON(),
            },
            newValues: { medicationsCount: this.props.medications.length },
            updatedBy,
            updatedAt: this.props.updatedAt,
            updateReason: reason || `Xóa thuốc: ${removedMedication.name}`,
        }));
    }
    /**
     * Archive medical record
     */
    archive(archivedBy, reason) {
        if (this.props.status === MedicalRecordStatus.ARCHIVED) {
            throw new Error("Hồ sơ bệnh án đã được lưu trữ");
        }
        if (this.props.status === MedicalRecordStatus.DELETED) {
            throw new Error("Không thể lưu trữ hồ sơ bệnh án đã bị xóa");
        }
        this.props.status = MedicalRecordStatus.ARCHIVED;
        this.props.updatedAt = new Date();
        this.props.updatedBy = archivedBy;
        this.addDomainEvent(new MedicalRecordUpdatedEvent_1.MedicalRecordUpdatedEvent({
            recordId: this.props.recordId.value,
            patientId: this.props.patientId,
            doctorId: this.props.doctorId,
            updatedFields: ["status"],
            previousValues: { status: MedicalRecordStatus.ACTIVE },
            newValues: { status: MedicalRecordStatus.ARCHIVED },
            updatedBy: archivedBy,
            updatedAt: this.props.updatedAt,
            updateReason: reason || "Lưu trữ hồ sơ bệnh án",
        }));
    }
    /**
     * Restore archived medical record
     */
    restore(restoredBy, reason) {
        if (this.props.status !== MedicalRecordStatus.ARCHIVED) {
            throw new Error("Chỉ có thể khôi phục hồ sơ bệnh án đã được lưu trữ");
        }
        this.props.status = MedicalRecordStatus.ACTIVE;
        this.props.updatedAt = new Date();
        this.props.updatedBy = restoredBy;
        this.addDomainEvent(new MedicalRecordUpdatedEvent_1.MedicalRecordUpdatedEvent({
            recordId: this.props.recordId.value,
            patientId: this.props.patientId,
            doctorId: this.props.doctorId,
            updatedFields: ["status"],
            previousValues: { status: MedicalRecordStatus.ARCHIVED },
            newValues: { status: MedicalRecordStatus.ACTIVE },
            updatedBy: restoredBy,
            updatedAt: this.props.updatedAt,
            updateReason: reason || "Khôi phục hồ sơ bệnh án",
        }));
    }
    // Getters
    get recordId() {
        return this.props.recordId;
    }
    get patientId() {
        return this.props.patientId;
    }
    get doctorId() {
        return this.props.doctorId;
    }
    get appointmentId() {
        return this.props.appointmentId;
    }
    get visitDate() {
        return this.props.visitDate;
    }
    get symptoms() {
        return this.props.symptoms;
    }
    get examinationNotes() {
        return this.props.examinationNotes;
    }
    get diagnosis() {
        return this.props.diagnosis;
    }
    get treatment() {
        return this.props.treatment;
    }
    get medicationsLegacy() {
        return this.props.medicationsLegacy;
    }
    get notes() {
        return this.props.notes;
    }
    get vitalSigns() {
        return this.props.vitalSigns;
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
    // Business logic methods
    isActive() {
        return this.props.status === MedicalRecordStatus.ACTIVE;
    }
    isArchived() {
        return this.props.status === MedicalRecordStatus.ARCHIVED;
    }
    isDeleted() {
        return this.props.status === MedicalRecordStatus.DELETED;
    }
    hasVitalSigns() {
        return !!this.props.vitalSigns && !this.props.vitalSigns.isEmpty();
    }
    hasCompleteVitalSigns() {
        return !!this.props.vitalSigns && this.props.vitalSigns.isComplete();
    }
    hasDiagnosis() {
        return !!this.props.diagnosis && this.props.diagnosis.trim() !== "";
    }
    hasTreatment() {
        return !!this.props.treatment && this.props.treatment.trim() !== "";
    }
    hasMedications() {
        return !!this.props.medicationsLegacy && this.props.medicationsLegacy.trim() !== "";
    }
    isFromCurrentMonth() {
        return this.props.recordId.isCurrentMonth();
    }
    isFromCurrentYear() {
        return this.props.recordId.isCurrentYear();
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
        // Keep only last 100 access logs to prevent excessive growth
        if (this.props.accessLog.length > 100) {
            this.props.accessLog = this.props.accessLog.slice(-100);
        }
    }
    /**
     * Record read access
     */
    recordReadAccess(accessedBy, purpose, ipAddress, userAgent) {
        this.logAccess(accessedBy, "read", purpose, ipAddress, userAgent);
    }
    /**
     * Get FHIR-compliant medical record
     */
    toFHIR() {
        this.logAccess(this.props.lastAccessedBy || "system", "export", "FHIR export");
        return {
            resourceType: "Composition",
            id: this.props.fhirResourceId,
            meta: {
                versionId: "1",
                lastUpdated: this.props.updatedAt.toISOString(),
                profile: [
                    this.props.fhirProfile ||
                        "http://moh.gov.vn/fhir/StructureDefinition/MedicalRecord",
                ],
            },
            identifier: [
                {
                    system: "http://moh.gov.vn/fhir/NamingSystem/medical-record-id",
                    value: this.props.recordId.value,
                },
            ],
            status: this.getFHIRStatus(),
            type: {
                coding: [
                    {
                        system: "http://loinc.org",
                        code: "11503-0",
                        display: "Medical records",
                    },
                ],
                text: "Hồ sơ bệnh án",
            },
            subject: {
                reference: `Patient/${this.props.patientId}`,
                display: "Bệnh nhân",
            },
            encounter: this.props.appointmentId
                ? {
                    reference: `Encounter/${this.props.appointmentId}`,
                    display: "Cuộc khám",
                }
                : undefined,
            date: this.props.visitDate.toISOString(),
            author: [
                {
                    reference: `Practitioner/${this.props.doctorId}`,
                    display: "Bác sĩ khám",
                },
            ],
            title: "Hồ sơ bệnh án",
            section: this.getFHIRSections(),
        };
    }
    /**
     * Get FHIR status mapping
     */
    getFHIRStatus() {
        const statusMap = {
            [MedicalRecordStatus.ACTIVE]: "final",
            [MedicalRecordStatus.DRAFT]: "preliminary",
            [MedicalRecordStatus.PENDING_REVIEW]: "preliminary",
            [MedicalRecordStatus.REVIEWED]: "final",
            [MedicalRecordStatus.AMENDED]: "amended",
            [MedicalRecordStatus.ARCHIVED]: "final",
            [MedicalRecordStatus.DELETED]: "entered-in-error",
        };
        return statusMap[this.props.status] || "final";
    }
    /**
     * Get FHIR sections
     */
    getFHIRSections() {
        const sections = [];
        // Symptoms section
        if (this.props.symptoms) {
            sections.push({
                title: "Triệu chứng",
                code: {
                    coding: [
                        {
                            system: "http://loinc.org",
                            code: "10154-3",
                            display: "Chief complaint",
                        },
                    ],
                },
                text: {
                    status: "generated",
                    div: `<div xmlns="http://www.w3.org/1999/xhtml">${this.props.symptoms}</div>`,
                },
            });
        }
        // Diagnoses section
        if (this.props.diagnoses.length > 0) {
            sections.push({
                title: "Chẩn đoán",
                code: {
                    coding: [
                        {
                            system: "http://loinc.org",
                            code: "29308-4",
                            display: "Diagnosis",
                        },
                    ],
                },
                entry: this.props.diagnoses.map((diagnosis) => ({
                    reference: `Condition/${diagnosis.code}`,
                    display: diagnosis.display,
                })),
            });
        }
        // Medications section
        if (this.props.medications.length > 0) {
            sections.push({
                title: "Thuốc",
                code: {
                    coding: [
                        {
                            system: "http://loinc.org",
                            code: "10160-0",
                            display: "History of medication use",
                        },
                    ],
                },
                entry: this.props.medications.map((medication) => ({
                    reference: `MedicationRequest/${medication.code}`,
                    display: medication.name,
                })),
            });
        }
        // Vital signs section
        if (this.props.vitalSigns && !this.props.vitalSigns.isEmpty()) {
            sections.push({
                title: "Sinh hiệu",
                code: {
                    coding: [
                        {
                            system: "http://loinc.org",
                            code: "8716-3",
                            display: "Vital signs",
                        },
                    ],
                },
                text: {
                    status: "generated",
                    div: `<div xmlns="http://www.w3.org/1999/xhtml">${this.props.vitalSigns.getSummary()}</div>`,
                },
            });
        }
        return sections;
    }
    /**
     * Validate FHIR compliance
     */
    validateFHIRCompliance() {
        const errors = [];
        // Required FHIR fields validation
        if (!this.props.fhirResourceId) {
            errors.push("FHIR Resource ID là bắt buộc");
        }
        if (!this.props.fhirVersion) {
            errors.push("FHIR Version là bắt buộc");
        }
        if (!this.props.patientId) {
            errors.push("Patient reference là bắt buộc cho FHIR");
        }
        if (!this.props.doctorId) {
            errors.push("Practitioner reference là bắt buộc cho FHIR");
        }
        // Validate diagnoses FHIR compliance
        this.props.diagnoses.forEach((diagnosis, index) => {
            try {
                diagnosis.toFHIR();
            }
            catch (error) {
                errors.push(`Chẩn đoán ${index + 1} không tuân thủ FHIR: ${error.message}`);
            }
        });
        // Validate medications FHIR compliance
        this.props.medications.forEach((medication, index) => {
            try {
                medication.toFHIR();
            }
            catch (error) {
                errors.push(`Thuốc ${index + 1} không tuân thủ FHIR: ${error.message}`);
            }
        });
        return {
            isValid: errors.length === 0,
            errors,
        };
    }
    /**
     * Get medical record summary in Vietnamese
     */
    getSummary() {
        const parts = [];
        parts.push(`Mã hồ sơ: ${this.props.recordId.value}`);
        parts.push(`Ngày khám: ${this.props.visitDate.toLocaleDateString("vi-VN")}`);
        if (this.props.symptoms) {
            parts.push(`Triệu chứng: ${this.props.symptoms}`);
        }
        // Enhanced with value objects
        if (this.props.diagnoses.length > 0) {
            const primaryDiagnosis = this.props.diagnoses.find((d) => d.isPrimary());
            if (primaryDiagnosis) {
                parts.push(`Chẩn đoán chính: ${primaryDiagnosis.display}`);
            }
            if (this.props.diagnoses.length > 1) {
                parts.push(`Số chẩn đoán: ${this.props.diagnoses.length}`);
            }
        }
        else if (this.props.diagnosis) {
            // Legacy support
            parts.push(`Chẩn đoán: ${this.props.diagnosis}`);
        }
        if (this.props.medications.length > 0) {
            const activeMedications = this.props.medications.filter((m) => m.isActive());
            parts.push(`Số thuốc: ${activeMedications.length}`);
        }
        if (this.props.treatment) {
            parts.push(`Điều trị: ${this.props.treatment}`);
        }
        if (this.props.vitalSigns && !this.props.vitalSigns.isEmpty()) {
            parts.push(`Sinh hiệu: ${this.props.vitalSigns.getSummary()}`);
        }
        return parts.join(" | ");
    }
    // Enhanced getters for new properties
    get diagnoses() {
        return [...this.props.diagnoses]; // Return copy to prevent mutation
    }
    get medications() {
        return [...this.props.medications]; // Return copy to prevent mutation
    }
    get fhirResourceId() {
        return this.props.fhirResourceId;
    }
    get fhirVersion() {
        return this.props.fhirVersion;
    }
    get fhirProfile() {
        return this.props.fhirProfile;
    }
    get vietnameseMedicalCode() {
        return this.props.vietnameseMedicalCode;
    }
    get specialtyCode() {
        return this.props.specialtyCode;
    }
    get hospitalCode() {
        return this.props.hospitalCode;
    }
    get accessLog() {
        return this.props.accessLog ? [...this.props.accessLog] : undefined;
    }
    get lastAccessedAt() {
        return this.props.lastAccessedAt;
    }
    get lastAccessedBy() {
        return this.props.lastAccessedBy;
    }
    // Enhanced business logic methods
    hasPrimaryDiagnosis() {
        return this.props.diagnoses.some((d) => d.isPrimary());
    }
    hasActiveMedications() {
        return this.props.medications.some((m) => m.isActive());
    }
    getCriticalDiagnoses() {
        return this.props.diagnoses.filter((d) => d.isCritical());
    }
    getHighPriorityMedications() {
        return this.props.medications.filter((m) => m.isHighPriority());
    }
    isFHIRCompliant() {
        return this.validateFHIRCompliance().isValid;
    }
    hasBeenAccessed() {
        return !!this.props.accessLog && this.props.accessLog.length > 0;
    }
    getLastAccessInfo() {
        if (!this.props.lastAccessedAt || !this.props.lastAccessedBy) {
            return null;
        }
        return {
            date: this.props.lastAccessedAt,
            by: this.props.lastAccessedBy,
        };
    }
    /**
     * Convert to JSON with enhanced properties
     */
    toJSON() {
        return {
            ...this.props,
            visitDate: this.props.visitDate.toISOString(),
            createdAt: this.props.createdAt.toISOString(),
            updatedAt: this.props.updatedAt.toISOString(),
            lastAccessedAt: this.props.lastAccessedAt?.toISOString(),
            diagnoses: this.props.diagnoses.map((d) => d.toJSON()),
            medications: this.props.medications.map((m) => m.toJSON()),
            vitalSigns: this.props.vitalSigns?.toJSON(),
            recordId: this.props.recordId.toJSON(),
        };
    }
}
exports.MedicalRecordAggregate = MedicalRecordAggregate;
//# sourceMappingURL=clinical.aggregate.js.map