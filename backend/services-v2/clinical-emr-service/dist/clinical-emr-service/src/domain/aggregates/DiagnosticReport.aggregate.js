"use strict";
/**
 * DiagnosticReport Aggregate - Clinical EMR Service
 * Core aggregate for managing diagnostic reports (Lab, Imaging, Pathology)
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA, FHIR R4
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiagnosticReportAggregate = exports.DiagnosticReportStatus = exports.DiagnosticReportType = void 0;
const aggregate_root_1 = require("@shared/domain/base/aggregate-root");
const DiagnosticReportCreatedEvent_1 = require("../events/DiagnosticReportCreatedEvent");
const DiagnosticReportUpdatedEvent_1 = require("../events/DiagnosticReportUpdatedEvent");
const DiagnosticReportFinalizedEvent_1 = require("../events/DiagnosticReportFinalizedEvent");
var DiagnosticReportType;
(function (DiagnosticReportType) {
    DiagnosticReportType["LABORATORY"] = "laboratory";
    DiagnosticReportType["IMAGING"] = "imaging";
    DiagnosticReportType["PATHOLOGY"] = "pathology";
    DiagnosticReportType["MICROBIOLOGY"] = "microbiology";
    DiagnosticReportType["BIOCHEMISTRY"] = "biochemistry";
    DiagnosticReportType["HEMATOLOGY"] = "hematology";
    DiagnosticReportType["CARDIOLOGY"] = "cardiology";
    DiagnosticReportType["ULTRASOUND"] = "ultrasound";
    DiagnosticReportType["XRAY"] = "xray";
    DiagnosticReportType["CT_SCAN"] = "ct_scan";
    DiagnosticReportType["MRI"] = "mri";
    DiagnosticReportType["ENDOSCOPY"] = "endoscopy";
})(DiagnosticReportType || (exports.DiagnosticReportType = DiagnosticReportType = {}));
var DiagnosticReportStatus;
(function (DiagnosticReportStatus) {
    DiagnosticReportStatus["ORDERED"] = "ordered";
    DiagnosticReportStatus["SPECIMEN_COLLECTED"] = "specimen_collected";
    DiagnosticReportStatus["IN_PROGRESS"] = "in_progress";
    DiagnosticReportStatus["PRELIMINARY"] = "preliminary";
    DiagnosticReportStatus["FINAL"] = "final";
    DiagnosticReportStatus["AMENDED"] = "amended";
    DiagnosticReportStatus["CANCELLED"] = "cancelled";
    DiagnosticReportStatus["ARCHIVED"] = "archived";
})(DiagnosticReportStatus || (exports.DiagnosticReportStatus = DiagnosticReportStatus = {}));
class DiagnosticReportAggregate extends aggregate_root_1.HealthcareAggregateRoot {
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
     * Create new diagnostic report
     */
    static create(reportId, medicalRecordId, patientId, orderedBy, reportType, reportTitle, testName, createdBy, options = {}) {
        const props = {
            reportId,
            medicalRecordId,
            patientId,
            orderedBy,
            reportType,
            reportTitle,
            testName,
            testCode: options.testCode,
            specimenType: options.specimenType,
            attachments: [],
            // FHIR Compliance
            fhirResourceId: `DiagnosticReport/${reportId.value}`,
            fhirVersion: '4.0.1',
            fhirProfile: 'http://moh.gov.vn/fhir/StructureDefinition/DiagnosticReport',
            // Vietnamese Standards
            vietnameseReportCode: reportId.value,
            labCode: options.labCode,
            status: options.status || DiagnosticReportStatus.ORDERED,
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy,
            updatedBy: createdBy,
            // Initialize access log
            accessLog: [{
                    accessedAt: new Date(),
                    accessedBy: createdBy,
                    accessType: 'write',
                    purpose: 'Tạo báo cáo chẩn đoán mới',
                }],
            lastAccessedAt: new Date(),
            lastAccessedBy: createdBy,
        };
        const aggregate = new DiagnosticReportAggregate(props, reportId.value);
        // Validate business invariants
        aggregate.validateInvariants();
        // Add domain event
        aggregate.addDomainEvent(new DiagnosticReportCreatedEvent_1.DiagnosticReportCreatedEvent({
            reportId: reportId.value,
            medicalRecordId,
            patientId,
            orderedBy,
            reportType,
            testName,
            createdBy,
            createdAt: props.createdAt,
        }));
        return aggregate;
    }
    /**
     * Reconstitute from database
     */
    static reconstitute(props, id) {
        return new DiagnosticReportAggregate(props, id || props.reportId.value);
    }
    validateBusinessInvariants() {
        const { reportId, medicalRecordId, patientId, orderedBy, reportType, reportTitle, testName, createdBy } = this.props;
        // Required fields validation
        if (!reportId) {
            throw new Error('ReportId là bắt buộc');
        }
        if (!medicalRecordId || medicalRecordId.trim() === '') {
            throw new Error('MedicalRecordId là bắt buộc');
        }
        if (!patientId || patientId.trim() === '') {
            throw new Error('PatientId là bắt buộc');
        }
        if (!orderedBy || orderedBy.trim() === '') {
            throw new Error('OrderedBy là bắt buộc');
        }
        if (!reportType) {
            throw new Error('ReportType là bắt buộc');
        }
        if (!reportTitle || reportTitle.trim() === '') {
            throw new Error('Tiêu đề báo cáo là bắt buộc');
        }
        if (!testName || testName.trim() === '') {
            throw new Error('Tên xét nghiệm là bắt buộc');
        }
        if (!createdBy || createdBy.trim() === '') {
            throw new Error('CreatedBy là bắt buộc');
        }
        // Report title length validation
        if (reportTitle.length > 200) {
            throw new Error('Tiêu đề báo cáo không được vượt quá 200 ký tự');
        }
        // Status validation
        if (!Object.values(DiagnosticReportStatus).includes(this.props.status)) {
            throw new Error('Trạng thái báo cáo không hợp lệ');
        }
        // Report type validation
        if (!Object.values(DiagnosticReportType).includes(reportType)) {
            throw new Error('Loại báo cáo không hợp lệ');
        }
        // Patient ID format validation
        const patientIdRegex = /^PAT-\d{6}-\d{3}$/;
        if (!patientIdRegex.test(patientId)) {
            throw new Error('PatientId phải có định dạng PAT-YYYYMM-XXX');
        }
        // Ordered by ID format validation (doctor)
        const doctorIdRegex = /^[A-Z]{2,4}-DOC-\d{6}-\d{3}$/;
        if (!doctorIdRegex.test(orderedBy)) {
            throw new Error('OrderedBy phải có định dạng DEPT-DOC-YYYYMM-XXX');
        }
        // Verification validation
        if (this.props.status === DiagnosticReportStatus.FINAL && !this.props.verifiedBy) {
            throw new Error('Báo cáo cuối cùng phải được xác minh bởi bác sĩ');
        }
    }
    toPersistence() {
        return {
            id: this.id,
            report_id: this.props.reportId.value,
            medical_record_id: this.props.medicalRecordId,
            patient_id: this.props.patientId,
            ordered_by: this.props.orderedBy,
            report_type: this.props.reportType,
            report_title: this.props.reportTitle,
            test_name: this.props.testName,
            test_code: this.props.testCode,
            results: this.props.results,
            interpretation: this.props.interpretation,
            conclusion: this.props.conclusion,
            recommendations: this.props.recommendations,
            specimen_type: this.props.specimenType,
            specimen_collected_at: this.props.specimenCollectedAt?.toISOString(),
            test_performed_at: this.props.testPerformedAt?.toISOString(),
            reported_by: this.props.reportedBy,
            verified_by: this.props.verifiedBy,
            verified_at: this.props.verifiedAt?.toISOString(),
            attachments_json: JSON.stringify(this.props.attachments || []),
            fhir_resource_id: this.props.fhirResourceId,
            fhir_version: this.props.fhirVersion,
            fhir_profile: this.props.fhirProfile,
            vietnamese_report_code: this.props.vietnameseReportCode,
            lab_code: this.props.labCode,
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
            case 'DiagnosticReportCreated':
                // Event already applied during creation
                break;
            case 'DiagnosticReportUpdated':
                this.props.updatedAt = new Date();
                break;
            case 'DiagnosticReportFinalized':
                this.props.status = DiagnosticReportStatus.FINAL;
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
     * Update report results
     */
    updateResults(updates, updatedBy, updateReason) {
        // Cannot update if finalized without creating amendment
        if (this.isFinal()) {
            throw new Error('Không thể cập nhật báo cáo đã hoàn thành. Sử dụng chức năng sửa đổi (amend).');
        }
        // Cannot update if cancelled
        if (this.isCancelled()) {
            throw new Error('Không thể cập nhật báo cáo đã bị hủy');
        }
        this.logAccess(updatedBy, 'write', 'Cập nhật kết quả báo cáo');
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
            this.addDomainEvent(new DiagnosticReportUpdatedEvent_1.DiagnosticReportUpdatedEvent({
                reportId: this.props.reportId.value,
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
     * Finalize report (mark as final)
     */
    finalize(verifiedBy, verificationComment) {
        if (this.isFinal()) {
            throw new Error('Báo cáo đã được hoàn thành');
        }
        if (this.isCancelled()) {
            throw new Error('Không thể hoàn thành báo cáo đã bị hủy');
        }
        if (!this.props.results || this.props.results.trim() === '') {
            throw new Error('Phải có kết quả trước khi hoàn thành báo cáo');
        }
        this.logAccess(verifiedBy, 'write', 'Hoàn thành báo cáo chẩn đoán');
        this.props.verifiedBy = verifiedBy;
        this.props.verifiedAt = new Date();
        this.props.status = DiagnosticReportStatus.FINAL;
        this.props.updatedAt = new Date();
        this.props.updatedBy = verifiedBy;
        // Add domain event
        this.addDomainEvent(new DiagnosticReportFinalizedEvent_1.DiagnosticReportFinalizedEvent({
            reportId: this.props.reportId.value,
            medicalRecordId: this.props.medicalRecordId,
            patientId: this.props.patientId,
            orderedBy: this.props.orderedBy,
            verifiedBy,
            verifiedAt: this.props.verifiedAt,
            verificationComment,
        }));
    }
    /**
     * Add attachment
     */
    addAttachment(attachment, addedBy) {
        this.logAccess(addedBy, 'write', 'Thêm file đính kèm');
        if (!this.props.attachments) {
            this.props.attachments = [];
        }
        this.props.attachments.push(attachment);
        this.props.updatedAt = new Date();
        this.props.updatedBy = addedBy;
    }
    /**
     * Cancel report
     */
    cancel(cancelledBy, reason) {
        if (this.isFinal()) {
            throw new Error('Không thể hủy báo cáo đã hoàn thành');
        }
        if (this.isCancelled()) {
            throw new Error('Báo cáo đã bị hủy');
        }
        this.logAccess(cancelledBy, 'write', 'Hủy báo cáo chẩn đoán');
        const previousStatus = this.props.status;
        this.props.status = DiagnosticReportStatus.CANCELLED;
        this.props.updatedAt = new Date();
        this.props.updatedBy = cancelledBy;
        this.addDomainEvent(new DiagnosticReportUpdatedEvent_1.DiagnosticReportUpdatedEvent({
            reportId: this.props.reportId.value,
            medicalRecordId: this.props.medicalRecordId,
            patientId: this.props.patientId,
            updatedFields: ['status'],
            previousValues: { status: previousStatus },
            newValues: { status: DiagnosticReportStatus.CANCELLED },
            updatedBy: cancelledBy,
            updatedAt: this.props.updatedAt,
            updateReason: reason,
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
    }
    /**
     * Record read access (HIPAA compliance)
     */
    recordReadAccess(accessedBy, purpose, ipAddress, userAgent) {
        this.logAccess(accessedBy, 'read', purpose, ipAddress, userAgent);
    }
    // --- Getters ---
    get reportId() {
        return this.props.reportId;
    }
    get medicalRecordId() {
        return this.props.medicalRecordId;
    }
    get patientId() {
        return this.props.patientId;
    }
    get orderedBy() {
        return this.props.orderedBy;
    }
    get reportType() {
        return this.props.reportType;
    }
    get reportTitle() {
        return this.props.reportTitle;
    }
    get testName() {
        return this.props.testName;
    }
    get testCode() {
        return this.props.testCode;
    }
    get results() {
        return this.props.results;
    }
    get interpretation() {
        return this.props.interpretation;
    }
    get conclusion() {
        return this.props.conclusion;
    }
    get recommendations() {
        return this.props.recommendations;
    }
    get specimenType() {
        return this.props.specimenType;
    }
    get specimenCollectedAt() {
        return this.props.specimenCollectedAt;
    }
    get testPerformedAt() {
        return this.props.testPerformedAt;
    }
    get reportedBy() {
        return this.props.reportedBy;
    }
    get verifiedBy() {
        return this.props.verifiedBy;
    }
    get verifiedAt() {
        return this.props.verifiedAt;
    }
    get attachments() {
        return this.props.attachments || [];
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
    isOrdered() {
        return this.props.status === DiagnosticReportStatus.ORDERED;
    }
    isInProgress() {
        return this.props.status === DiagnosticReportStatus.IN_PROGRESS;
    }
    isPreliminary() {
        return this.props.status === DiagnosticReportStatus.PRELIMINARY;
    }
    isFinal() {
        return this.props.status === DiagnosticReportStatus.FINAL;
    }
    isAmended() {
        return this.props.status === DiagnosticReportStatus.AMENDED;
    }
    isCancelled() {
        return this.props.status === DiagnosticReportStatus.CANCELLED;
    }
    isArchived() {
        return this.props.status === DiagnosticReportStatus.ARCHIVED;
    }
    hasResults() {
        return !!this.props.results && this.props.results.trim() !== '';
    }
    isVerified() {
        return !!this.props.verifiedBy && !!this.props.verifiedAt;
    }
    hasAttachments() {
        return !!this.props.attachments && this.props.attachments.length > 0;
    }
    /**
     * Get summary information
     */
    getSummary() {
        return {
            reportId: this.props.reportId.value,
            medicalRecordId: this.props.medicalRecordId,
            patientId: this.props.patientId,
            reportType: this.props.reportType,
            reportTitle: this.props.reportTitle,
            testName: this.props.testName,
            status: this.props.status,
            orderedBy: this.props.orderedBy,
            reportedBy: this.props.reportedBy,
            verifiedBy: this.props.verifiedBy,
            verifiedAt: this.props.verifiedAt,
            hasResults: this.hasResults(),
            hasAttachments: this.hasAttachments(),
            attachmentCount: this.attachments.length,
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
            reportId: this.props.reportId.value,
            medicalRecordId: this.props.medicalRecordId,
            patientId: this.props.patientId,
            orderedBy: this.props.orderedBy,
            reportType: this.props.reportType,
            reportTitle: this.props.reportTitle,
            testName: this.props.testName,
            testCode: this.props.testCode,
            results: this.props.results,
            interpretation: this.props.interpretation,
            conclusion: this.props.conclusion,
            recommendations: this.props.recommendations,
            specimenType: this.props.specimenType,
            specimenCollectedAt: this.props.specimenCollectedAt,
            testPerformedAt: this.props.testPerformedAt,
            reportedBy: this.props.reportedBy,
            verifiedBy: this.props.verifiedBy,
            verifiedAt: this.props.verifiedAt,
            attachments: this.props.attachments,
            fhirResourceId: this.props.fhirResourceId,
            fhirVersion: this.props.fhirVersion,
            fhirProfile: this.props.fhirProfile,
            vietnameseReportCode: this.props.vietnameseReportCode,
            labCode: this.props.labCode,
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
exports.DiagnosticReportAggregate = DiagnosticReportAggregate;
//# sourceMappingURL=DiagnosticReport.aggregate.js.map