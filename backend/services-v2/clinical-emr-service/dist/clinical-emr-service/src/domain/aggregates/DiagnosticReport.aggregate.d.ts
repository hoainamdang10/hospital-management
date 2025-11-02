/**
 * DiagnosticReport Aggregate - Clinical EMR Service
 * Core aggregate for managing diagnostic reports (Lab, Imaging, Pathology)
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA, FHIR R4
 */
import { HealthcareAggregateRoot } from '@shared/domain/base/aggregate-root';
import { DomainEvent } from '@shared/domain/base/domain-event';
import { DiagnosticReportId } from '../value-objects/DiagnosticReportId';
export interface DiagnosticReportProps {
    reportId: DiagnosticReportId;
    medicalRecordId: string;
    patientId: string;
    orderedBy: string;
    reportType: DiagnosticReportType;
    reportTitle: string;
    testName: string;
    testCode?: string;
    results?: string;
    interpretation?: string;
    conclusion?: string;
    recommendations?: string;
    specimenType?: string;
    specimenCollectedAt?: Date;
    testPerformedAt?: Date;
    reportedBy?: string;
    verifiedBy?: string;
    verifiedAt?: Date;
    attachments?: DiagnosticAttachment[];
    fhirResourceId?: string;
    fhirVersion?: string;
    fhirProfile?: string;
    vietnameseReportCode?: string;
    labCode?: string;
    status: DiagnosticReportStatus;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    updatedBy?: string;
    accessLog?: DiagnosticReportAccess[];
    lastAccessedAt?: Date;
    lastAccessedBy?: string;
}
export declare enum DiagnosticReportType {
    LABORATORY = "laboratory",// Xét nghiệm
    IMAGING = "imaging",// Chẩn đoán hình ảnh
    PATHOLOGY = "pathology",// Giải phẫu bệnh
    MICROBIOLOGY = "microbiology",// Vi sinh
    BIOCHEMISTRY = "biochemistry",// Hóa sinh
    HEMATOLOGY = "hematology",// Huyết học
    CARDIOLOGY = "cardiology",// Điện tim
    ULTRASOUND = "ultrasound",// Siêu âm
    XRAY = "xray",// X-quang
    CT_SCAN = "ct_scan",// CT
    MRI = "mri",// MRI
    ENDOSCOPY = "endoscopy"
}
export declare enum DiagnosticReportStatus {
    ORDERED = "ordered",// Đã chỉ định
    SPECIMEN_COLLECTED = "specimen_collected",// Đã lấy mẫu
    IN_PROGRESS = "in_progress",// Đang thực hiện
    PRELIMINARY = "preliminary",// Kết quả sơ bộ
    FINAL = "final",// Kết quả cuối cùng
    AMENDED = "amended",// Đã sửa đổi
    CANCELLED = "cancelled",// Đã hủy
    ARCHIVED = "archived"
}
export interface DiagnosticAttachment {
    fileName: string;
    fileType: string;
    fileUrl: string;
    fileSize: number;
    uploadedAt: Date;
    uploadedBy: string;
}
export interface DiagnosticReportAccess {
    accessedAt: Date;
    accessedBy: string;
    accessType: 'read' | 'write' | 'print' | 'export';
    ipAddress?: string;
    userAgent?: string;
    purpose?: string;
}
export declare class DiagnosticReportAggregate extends HealthcareAggregateRoot<DiagnosticReportProps> {
    private constructor();
    /**
     * Validate entity (required by Entity base class)
     */
    validate(): void;
    /**
     * Create new diagnostic report
     */
    static create(reportId: DiagnosticReportId, medicalRecordId: string, patientId: string, orderedBy: string, reportType: DiagnosticReportType, reportTitle: string, testName: string, createdBy: string, options?: {
        testCode?: string;
        specimenType?: string;
        labCode?: string;
        status?: DiagnosticReportStatus;
    }): DiagnosticReportAggregate;
    /**
     * Reconstitute from database
     */
    static reconstitute(props: DiagnosticReportProps, id?: string): DiagnosticReportAggregate;
    protected validateBusinessInvariants(): void;
    toPersistence(): any;
    protected applyEvent(event: DomainEvent): void;
    getPatientId(): string | null;
    containsPHI(): boolean;
    /**
     * Update report results
     */
    updateResults(updates: {
        results?: string;
        interpretation?: string;
        conclusion?: string;
        recommendations?: string;
        reportedBy?: string;
        testPerformedAt?: Date;
    }, updatedBy: string, updateReason?: string): void;
    /**
     * Finalize report (mark as final)
     */
    finalize(verifiedBy: string, verificationComment?: string): void;
    /**
     * Add attachment
     */
    addAttachment(attachment: DiagnosticAttachment, addedBy: string): void;
    /**
     * Cancel report
     */
    cancel(cancelledBy: string, reason: string): void;
    /**
     * Log access for HIPAA compliance
     */
    private logAccess;
    /**
     * Record read access (HIPAA compliance)
     */
    recordReadAccess(accessedBy: string, purpose?: string, ipAddress?: string, userAgent?: string): void;
    get reportId(): DiagnosticReportId;
    get medicalRecordId(): string;
    get patientId(): string;
    get orderedBy(): string;
    get reportType(): DiagnosticReportType;
    get reportTitle(): string;
    get testName(): string;
    get testCode(): string | undefined;
    get results(): string | undefined;
    get interpretation(): string | undefined;
    get conclusion(): string | undefined;
    get recommendations(): string | undefined;
    get specimenType(): string | undefined;
    get specimenCollectedAt(): Date | undefined;
    get testPerformedAt(): Date | undefined;
    get reportedBy(): string | undefined;
    get verifiedBy(): string | undefined;
    get verifiedAt(): Date | undefined;
    get attachments(): DiagnosticAttachment[];
    get status(): DiagnosticReportStatus;
    get createdAt(): Date;
    get updatedAt(): Date;
    get createdBy(): string;
    get updatedBy(): string | undefined;
    get accessLog(): DiagnosticReportAccess[];
    get lastAccessedAt(): Date | undefined;
    get lastAccessedBy(): string | undefined;
    isOrdered(): boolean;
    isInProgress(): boolean;
    isPreliminary(): boolean;
    isFinal(): boolean;
    isAmended(): boolean;
    isCancelled(): boolean;
    isArchived(): boolean;
    hasResults(): boolean;
    isVerified(): boolean;
    hasAttachments(): boolean;
    /**
     * Get summary information
     */
    getSummary(): any;
    /**
     * Convert to JSON
     */
    toJSON(): any;
}
//# sourceMappingURL=DiagnosticReport.aggregate.d.ts.map