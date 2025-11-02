/**
 * ClinicalNote Aggregate - Clinical EMR Service
 * Core aggregate for managing clinical notes with cosigning support
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */
import { HealthcareAggregateRoot } from '@shared/domain/base/aggregate-root';
import { DomainEvent } from '@shared/domain/base/domain-event';
import { NoteId } from '../value-objects/NoteId';
export interface ClinicalNoteProps {
    noteId: NoteId;
    medicalRecordId: string;
    patientId: string;
    authorId: string;
    noteType: ClinicalNoteType;
    noteTitle: string;
    noteContent: string;
    clinicalFindings?: string;
    assessment?: string;
    plan?: string;
    requiresCosign: boolean;
    cosignedBy?: string;
    cosignedAt?: Date;
    cosignComment?: string;
    fhirResourceId?: string;
    fhirVersion?: string;
    fhirProfile?: string;
    vietnameseNoteCode?: string;
    specialtyCode?: string;
    status: ClinicalNoteStatus;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    updatedBy?: string;
    accessLog?: ClinicalNoteAccess[];
    lastAccessedAt?: Date;
    lastAccessedBy?: string;
}
export declare enum ClinicalNoteType {
    PROGRESS_NOTE = "progress_note",// Ghi chú tiến triển
    ADMISSION_NOTE = "admission_note",// Ghi chú nhập viện
    DISCHARGE_NOTE = "discharge_note",// Ghi chú xuất viện
    CONSULTATION_NOTE = "consultation_note",// Ghi chú hội chẩn
    PROCEDURE_NOTE = "procedure_note",// Ghi chú thủ thuật
    OPERATIVE_NOTE = "operative_note",// Ghi chú phẫu thuật
    EMERGENCY_NOTE = "emergency_note",// Ghi chú cấp cứu
    FOLLOW_UP_NOTE = "follow_up_note",// Ghi chú tái khám
    SOAP_NOTE = "soap_note",// Ghi chú SOAP
    NURSING_NOTE = "nursing_note"
}
export declare enum ClinicalNoteStatus {
    DRAFT = "draft",// Bản nháp
    PENDING_COSIGN = "pending_cosign",// Chờ ký tên
    COMPLETED = "completed",// Hoàn thành
    AMENDED = "amended",// Đã sửa đổi
    ARCHIVED = "archived",// Lưu trữ
    DELETED = "deleted"
}
/**
 * Clinical Note Access Log for HIPAA Compliance
 */
export interface ClinicalNoteAccess {
    accessedAt: Date;
    accessedBy: string;
    accessType: 'read' | 'write' | 'print' | 'export';
    ipAddress?: string;
    userAgent?: string;
    purpose?: string;
}
export declare class ClinicalNoteAggregate extends HealthcareAggregateRoot<ClinicalNoteProps> {
    private constructor();
    /**
     * Validate entity (required by Entity base class)
     */
    validate(): void;
    /**
     * Create new clinical note
     */
    static create(noteId: NoteId, medicalRecordId: string, patientId: string, authorId: string, noteType: ClinicalNoteType, noteTitle: string, noteContent: string, createdBy: string, options?: {
        clinicalFindings?: string;
        assessment?: string;
        plan?: string;
        requiresCosign?: boolean;
        specialtyCode?: string;
        status?: ClinicalNoteStatus;
    }): ClinicalNoteAggregate;
    /**
     * Reconstitute from database
     */
    static reconstitute(props: ClinicalNoteProps, id?: string): ClinicalNoteAggregate;
    protected validateBusinessInvariants(): void;
    toPersistence(): any;
    protected applyEvent(event: DomainEvent): void;
    getPatientId(): string | null;
    containsPHI(): boolean;
    /**
     * Update clinical note content
     */
    updateContent(updates: {
        noteTitle?: string;
        noteContent?: string;
        clinicalFindings?: string;
        assessment?: string;
        plan?: string;
    }, updatedBy: string, updateReason?: string): void;
    /**
     * Cosign clinical note
     */
    cosign(cosignedBy: string, cosignComment?: string): void;
    /**
     * Archive clinical note
     */
    archive(archivedBy: string, reason?: string): void;
    /**
     * Log access for HIPAA compliance
     */
    private logAccess;
    /**
     * Record read access
     */
    recordReadAccess(accessedBy: string, purpose?: string, ipAddress?: string, userAgent?: string): void;
    get noteId(): NoteId;
    get medicalRecordId(): string;
    get patientId(): string;
    get authorId(): string;
    get noteType(): ClinicalNoteType;
    get noteTitle(): string;
    get noteContent(): string;
    get clinicalFindings(): string | undefined;
    get assessment(): string | undefined;
    get plan(): string | undefined;
    get requiresCosign(): boolean;
    get cosignedBy(): string | undefined;
    get cosignedAt(): Date | undefined;
    get cosignComment(): string | undefined;
    get status(): ClinicalNoteStatus;
    get createdAt(): Date;
    get updatedAt(): Date;
    get createdBy(): string;
    get updatedBy(): string | undefined;
    isDraft(): boolean;
    isPendingCosign(): boolean;
    isCompleted(): boolean;
    isArchived(): boolean;
    isDeleted(): boolean;
    isCosigned(): boolean;
    hasSOAPFormat(): boolean;
    /**
     * Get note summary
     */
    getSummary(): string;
    /**
     * Get note type display in Vietnamese
     */
    private getNoteTypeDisplay;
    /**
     * Get status display in Vietnamese
     */
    private getStatusDisplay;
    /**
     * Convert to JSON
     */
    toJSON(): any;
}
//# sourceMappingURL=ClinicalNote.aggregate.d.ts.map