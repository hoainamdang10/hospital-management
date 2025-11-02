"use strict";
/**
 * ClinicalNote Aggregate - Clinical EMR Service
 * Core aggregate for managing clinical notes with cosigning support
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClinicalNoteAggregate = exports.ClinicalNoteStatus = exports.ClinicalNoteType = void 0;
const aggregate_root_1 = require("@shared/domain/base/aggregate-root");
const ClinicalNoteCreatedEvent_1 = require("../events/ClinicalNoteCreatedEvent");
const ClinicalNoteUpdatedEvent_1 = require("../events/ClinicalNoteUpdatedEvent");
const ClinicalNoteCosignedEvent_1 = require("../events/ClinicalNoteCosignedEvent");
var ClinicalNoteType;
(function (ClinicalNoteType) {
    ClinicalNoteType["PROGRESS_NOTE"] = "progress_note";
    ClinicalNoteType["ADMISSION_NOTE"] = "admission_note";
    ClinicalNoteType["DISCHARGE_NOTE"] = "discharge_note";
    ClinicalNoteType["CONSULTATION_NOTE"] = "consultation_note";
    ClinicalNoteType["PROCEDURE_NOTE"] = "procedure_note";
    ClinicalNoteType["OPERATIVE_NOTE"] = "operative_note";
    ClinicalNoteType["EMERGENCY_NOTE"] = "emergency_note";
    ClinicalNoteType["FOLLOW_UP_NOTE"] = "follow_up_note";
    ClinicalNoteType["SOAP_NOTE"] = "soap_note";
    ClinicalNoteType["NURSING_NOTE"] = "nursing_note";
})(ClinicalNoteType || (exports.ClinicalNoteType = ClinicalNoteType = {}));
var ClinicalNoteStatus;
(function (ClinicalNoteStatus) {
    ClinicalNoteStatus["DRAFT"] = "draft";
    ClinicalNoteStatus["PENDING_COSIGN"] = "pending_cosign";
    ClinicalNoteStatus["COMPLETED"] = "completed";
    ClinicalNoteStatus["AMENDED"] = "amended";
    ClinicalNoteStatus["ARCHIVED"] = "archived";
    ClinicalNoteStatus["DELETED"] = "deleted";
})(ClinicalNoteStatus || (exports.ClinicalNoteStatus = ClinicalNoteStatus = {}));
class ClinicalNoteAggregate extends aggregate_root_1.HealthcareAggregateRoot {
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
     * Create new clinical note
     */
    static create(noteId, medicalRecordId, patientId, authorId, noteType, noteTitle, noteContent, createdBy, options = {}) {
        const props = {
            noteId,
            medicalRecordId,
            patientId,
            authorId,
            noteType,
            noteTitle,
            noteContent,
            clinicalFindings: options.clinicalFindings,
            assessment: options.assessment,
            plan: options.plan,
            requiresCosign: options.requiresCosign || false,
            // FHIR Compliance
            fhirResourceId: `ClinicalNote/${noteId.value}`,
            fhirVersion: '4.0.1',
            fhirProfile: 'http://moh.gov.vn/fhir/StructureDefinition/ClinicalNote',
            // Vietnamese Standards
            vietnameseNoteCode: noteId.value,
            specialtyCode: options.specialtyCode,
            status: options.status || (options.requiresCosign ? ClinicalNoteStatus.PENDING_COSIGN : ClinicalNoteStatus.COMPLETED),
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy,
            updatedBy: createdBy,
            // Initialize access log
            accessLog: [{
                    accessedAt: new Date(),
                    accessedBy: createdBy,
                    accessType: 'write',
                    purpose: 'Tạo ghi chú lâm sàng mới',
                }],
            lastAccessedAt: new Date(),
            lastAccessedBy: createdBy,
        };
        const aggregate = new ClinicalNoteAggregate(props, noteId.value);
        // Validate business invariants
        aggregate.validateInvariants();
        // Add domain event
        aggregate.addDomainEvent(new ClinicalNoteCreatedEvent_1.ClinicalNoteCreatedEvent({
            noteId: noteId.value,
            medicalRecordId,
            patientId,
            authorId,
            noteType,
            noteTitle,
            requiresCosign: options.requiresCosign || false,
            createdBy,
            createdAt: props.createdAt,
        }));
        return aggregate;
    }
    /**
     * Reconstitute from database
     */
    static reconstitute(props, id) {
        return new ClinicalNoteAggregate(props, id || props.noteId.value);
    }
    validateBusinessInvariants() {
        const { noteId, medicalRecordId, patientId, authorId, noteType, noteTitle, noteContent, createdBy } = this.props;
        // Required fields validation
        if (!noteId) {
            throw new Error('NoteId là bắt buộc');
        }
        if (!medicalRecordId || medicalRecordId.trim() === '') {
            throw new Error('MedicalRecordId là bắt buộc');
        }
        if (!patientId || patientId.trim() === '') {
            throw new Error('PatientId là bắt buộc');
        }
        if (!authorId || authorId.trim() === '') {
            throw new Error('AuthorId là bắt buộc');
        }
        if (!noteType) {
            throw new Error('NoteType là bắt buộc');
        }
        if (!noteTitle || noteTitle.trim() === '') {
            throw new Error('Tiêu đề ghi chú là bắt buộc');
        }
        if (!noteContent || noteContent.trim() === '') {
            throw new Error('Nội dung ghi chú là bắt buộc');
        }
        if (!createdBy || createdBy.trim() === '') {
            throw new Error('CreatedBy là bắt buộc');
        }
        // Note title length validation
        if (noteTitle.length > 200) {
            throw new Error('Tiêu đề ghi chú không được vượt quá 200 ký tự');
        }
        // Note content length validation
        if (noteContent.length > 50000) {
            throw new Error('Nội dung ghi chú không được vượt quá 50,000 ký tự');
        }
        // Status validation
        if (!Object.values(ClinicalNoteStatus).includes(this.props.status)) {
            throw new Error('Trạng thái ghi chú không hợp lệ');
        }
        // Note type validation
        if (!Object.values(ClinicalNoteType).includes(noteType)) {
            throw new Error('Loại ghi chú không hợp lệ');
        }
        // Cosign validation
        if (this.props.requiresCosign && this.props.status === ClinicalNoteStatus.COMPLETED && !this.props.cosignedBy) {
            throw new Error('Ghi chú yêu cầu ký tên phải có người ký tên trước khi hoàn thành');
        }
        // Patient ID format validation
        const patientIdRegex = /^PAT-\d{6}-\d{3}$/;
        if (!patientIdRegex.test(patientId)) {
            throw new Error('PatientId phải có định dạng PAT-YYYYMM-XXX');
        }
        // Author ID format validation (doctor)
        const authorIdRegex = /^[A-Z]{2,4}-DOC-\d{6}-\d{3}$/;
        if (!authorIdRegex.test(authorId)) {
            throw new Error('AuthorId phải có định dạng DEPT-DOC-YYYYMM-XXX');
        }
    }
    toPersistence() {
        return {
            id: this.id,
            note_id: this.props.noteId.value,
            medical_record_id: this.props.medicalRecordId,
            patient_id: this.props.patientId,
            author_id: this.props.authorId,
            note_type: this.props.noteType,
            note_title: this.props.noteTitle,
            note_content: this.props.noteContent,
            clinical_findings: this.props.clinicalFindings,
            assessment: this.props.assessment,
            plan: this.props.plan,
            requires_cosign: this.props.requiresCosign,
            cosigned_by: this.props.cosignedBy,
            cosigned_at: this.props.cosignedAt?.toISOString(),
            cosign_comment: this.props.cosignComment,
            fhir_resource_id: this.props.fhirResourceId,
            fhir_version: this.props.fhirVersion,
            fhir_profile: this.props.fhirProfile,
            vietnamese_note_code: this.props.vietnameseNoteCode,
            specialty_code: this.props.specialtyCode,
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
            case 'ClinicalNoteCreated':
                // Event already applied during creation
                break;
            case 'ClinicalNoteUpdated':
                this.props.updatedAt = new Date();
                break;
            case 'ClinicalNoteCosigned':
                this.props.status = ClinicalNoteStatus.COMPLETED;
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
     * Update clinical note content
     */
    updateContent(updates, updatedBy, updateReason) {
        // Cannot update if cosigned
        if (this.isCosigned()) {
            throw new Error('Không thể cập nhật ghi chú đã được ký tên');
        }
        // Cannot update if deleted or archived
        if (this.isDeleted()) {
            throw new Error('Không thể cập nhật ghi chú đã bị xóa');
        }
        if (this.isArchived()) {
            throw new Error('Không thể cập nhật ghi chú đã được lưu trữ');
        }
        this.logAccess(updatedBy, 'write', 'Cập nhật nội dung ghi chú');
        const previousValues = {};
        const newValues = {};
        const updatedFields = [];
        // Track changes
        Object.entries(updates).forEach(([key, value]) => {
            if (value !== undefined && this.props[key] !== value) {
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
            this.addDomainEvent(new ClinicalNoteUpdatedEvent_1.ClinicalNoteUpdatedEvent({
                noteId: this.props.noteId.value,
                medicalRecordId: this.props.medicalRecordId,
                patientId: this.props.patientId,
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
     * Cosign clinical note
     */
    cosign(cosignedBy, cosignComment) {
        if (!this.props.requiresCosign) {
            throw new Error('Ghi chú này không yêu cầu ký tên');
        }
        if (this.isCosigned()) {
            throw new Error('Ghi chú đã được ký tên');
        }
        if (this.props.status !== ClinicalNoteStatus.PENDING_COSIGN) {
            throw new Error('Chỉ có thể ký tên ghi chú ở trạng thái "Chờ ký tên"');
        }
        if (cosignedBy === this.props.authorId) {
            throw new Error('Người ký tên không thể là tác giả ghi chú');
        }
        this.logAccess(cosignedBy, 'write', 'Ký tên ghi chú');
        this.props.cosignedBy = cosignedBy;
        this.props.cosignedAt = new Date();
        this.props.cosignComment = cosignComment;
        this.props.status = ClinicalNoteStatus.COMPLETED;
        this.props.updatedAt = new Date();
        this.props.updatedBy = cosignedBy;
        // Add domain event
        this.addDomainEvent(new ClinicalNoteCosignedEvent_1.ClinicalNoteCosignedEvent({
            noteId: this.props.noteId.value,
            medicalRecordId: this.props.medicalRecordId,
            patientId: this.props.patientId,
            authorId: this.props.authorId,
            cosignedBy,
            cosignedAt: this.props.cosignedAt,
            cosignComment,
        }));
    }
    /**
     * Archive clinical note
     */
    archive(archivedBy, reason) {
        if (this.props.status === ClinicalNoteStatus.ARCHIVED) {
            throw new Error('Ghi chú đã được lưu trữ');
        }
        if (this.props.status === ClinicalNoteStatus.DELETED) {
            throw new Error('Không thể lưu trữ ghi chú đã bị xóa');
        }
        this.logAccess(archivedBy, 'write', 'Lưu trữ ghi chú');
        const previousStatus = this.props.status;
        this.props.status = ClinicalNoteStatus.ARCHIVED;
        this.props.updatedAt = new Date();
        this.props.updatedBy = archivedBy;
        this.addDomainEvent(new ClinicalNoteUpdatedEvent_1.ClinicalNoteUpdatedEvent({
            noteId: this.props.noteId.value,
            medicalRecordId: this.props.medicalRecordId,
            patientId: this.props.patientId,
            updatedFields: ['status'],
            previousValues: { status: previousStatus },
            newValues: { status: ClinicalNoteStatus.ARCHIVED },
            updatedBy: archivedBy,
            updatedAt: this.props.updatedAt,
            updateReason: reason || 'Lưu trữ ghi chú',
        }));
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
        // Keep only last 100 access logs
        if (this.props.accessLog.length > 100) {
            this.props.accessLog = this.props.accessLog.slice(-100);
        }
    }
    /**
     * Record read access
     */
    recordReadAccess(accessedBy, purpose, ipAddress, userAgent) {
        this.logAccess(accessedBy, 'read', purpose, ipAddress, userAgent);
    }
    // Getters
    get noteId() {
        return this.props.noteId;
    }
    get medicalRecordId() {
        return this.props.medicalRecordId;
    }
    get patientId() {
        return this.props.patientId;
    }
    get authorId() {
        return this.props.authorId;
    }
    get noteType() {
        return this.props.noteType;
    }
    get noteTitle() {
        return this.props.noteTitle;
    }
    get noteContent() {
        return this.props.noteContent;
    }
    get clinicalFindings() {
        return this.props.clinicalFindings;
    }
    get assessment() {
        return this.props.assessment;
    }
    get plan() {
        return this.props.plan;
    }
    get requiresCosign() {
        return this.props.requiresCosign;
    }
    get cosignedBy() {
        return this.props.cosignedBy;
    }
    get cosignedAt() {
        return this.props.cosignedAt;
    }
    get cosignComment() {
        return this.props.cosignComment;
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
    isDraft() {
        return this.props.status === ClinicalNoteStatus.DRAFT;
    }
    isPendingCosign() {
        return this.props.status === ClinicalNoteStatus.PENDING_COSIGN;
    }
    isCompleted() {
        return this.props.status === ClinicalNoteStatus.COMPLETED;
    }
    isArchived() {
        return this.props.status === ClinicalNoteStatus.ARCHIVED;
    }
    isDeleted() {
        return this.props.status === ClinicalNoteStatus.DELETED;
    }
    isCosigned() {
        return !!this.props.cosignedBy && !!this.props.cosignedAt;
    }
    hasSOAPFormat() {
        return !!(this.props.clinicalFindings && this.props.assessment && this.props.plan);
    }
    /**
     * Get note summary
     */
    getSummary() {
        const parts = [];
        parts.push(`Mã ghi chú: ${this.props.noteId.value}`);
        parts.push(`Loại: ${this.getNoteTypeDisplay()}`);
        parts.push(`Tiêu đề: ${this.props.noteTitle}`);
        if (this.props.requiresCosign) {
            if (this.isCosigned()) {
                parts.push(`Đã ký tên: ${this.props.cosignedAt?.toLocaleDateString('vi-VN')}`);
            }
            else {
                parts.push('Chờ ký tên');
            }
        }
        parts.push(`Trạng thái: ${this.getStatusDisplay()}`);
        return parts.join(' | ');
    }
    /**
     * Get note type display in Vietnamese
     */
    getNoteTypeDisplay() {
        const typeMap = {
            [ClinicalNoteType.PROGRESS_NOTE]: 'Ghi chú tiến triển',
            [ClinicalNoteType.ADMISSION_NOTE]: 'Ghi chú nhập viện',
            [ClinicalNoteType.DISCHARGE_NOTE]: 'Ghi chú xuất viện',
            [ClinicalNoteType.CONSULTATION_NOTE]: 'Ghi chú hội chẩn',
            [ClinicalNoteType.PROCEDURE_NOTE]: 'Ghi chú thủ thuật',
            [ClinicalNoteType.OPERATIVE_NOTE]: 'Ghi chú phẫu thuật',
            [ClinicalNoteType.EMERGENCY_NOTE]: 'Ghi chú cấp cứu',
            [ClinicalNoteType.FOLLOW_UP_NOTE]: 'Ghi chú tái khám',
            [ClinicalNoteType.SOAP_NOTE]: 'Ghi chú SOAP',
            [ClinicalNoteType.NURSING_NOTE]: 'Ghi chú điều dưỡng',
        };
        return typeMap[this.props.noteType] || this.props.noteType;
    }
    /**
     * Get status display in Vietnamese
     */
    getStatusDisplay() {
        const statusMap = {
            [ClinicalNoteStatus.DRAFT]: 'Bản nháp',
            [ClinicalNoteStatus.PENDING_COSIGN]: 'Chờ ký tên',
            [ClinicalNoteStatus.COMPLETED]: 'Hoàn thành',
            [ClinicalNoteStatus.AMENDED]: 'Đã sửa đổi',
            [ClinicalNoteStatus.ARCHIVED]: 'Lưu trữ',
            [ClinicalNoteStatus.DELETED]: 'Đã xóa',
        };
        return statusMap[this.props.status] || this.props.status;
    }
    /**
     * Convert to JSON
     */
    toJSON() {
        return {
            ...this.props,
            createdAt: this.props.createdAt.toISOString(),
            updatedAt: this.props.updatedAt.toISOString(),
            cosignedAt: this.props.cosignedAt?.toISOString(),
            lastAccessedAt: this.props.lastAccessedAt?.toISOString(),
            noteId: this.props.noteId.toJSON(),
        };
    }
}
exports.ClinicalNoteAggregate = ClinicalNoteAggregate;
//# sourceMappingURL=ClinicalNote.aggregate.js.map