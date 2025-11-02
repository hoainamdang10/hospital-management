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
import { ClinicalNoteCreatedEvent } from '../events/ClinicalNoteCreatedEvent';
import { ClinicalNoteUpdatedEvent } from '../events/ClinicalNoteUpdatedEvent';
import { ClinicalNoteCosignedEvent } from '../events/ClinicalNoteCosignedEvent';
import { NoteId } from '../value-objects/NoteId';

export interface ClinicalNoteProps {
  noteId: NoteId;
  medicalRecordId: string;
  patientId: string;
  authorId: string; // Doctor who wrote the note
  
  // Note Information
  noteType: ClinicalNoteType;
  noteTitle: string;
  noteContent: string;
  
  // Clinical Assessment (SOAP format)
  clinicalFindings?: string; // Subjective + Objective
  assessment?: string; // Assessment
  plan?: string; // Plan
  
  // Cosigning (for residents/medical students)
  requiresCosign: boolean;
  cosignedBy?: string; // Attending physician who cosigned
  cosignedAt?: Date;
  cosignComment?: string;
  
  // FHIR Compliance
  fhirResourceId?: string;
  fhirVersion?: string;
  fhirProfile?: string;
  
  // Vietnamese Standards
  vietnameseNoteCode?: string;
  specialtyCode?: string;
  
  // Status and Audit
  status: ClinicalNoteStatus;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;
  
  // Audit trail for HIPAA compliance
  accessLog?: ClinicalNoteAccess[];
  lastAccessedAt?: Date;
  lastAccessedBy?: string;
}

export enum ClinicalNoteType {
  PROGRESS_NOTE = 'progress_note', // Ghi chú tiến triển
  ADMISSION_NOTE = 'admission_note', // Ghi chú nhập viện
  DISCHARGE_NOTE = 'discharge_note', // Ghi chú xuất viện
  CONSULTATION_NOTE = 'consultation_note', // Ghi chú hội chẩn
  PROCEDURE_NOTE = 'procedure_note', // Ghi chú thủ thuật
  OPERATIVE_NOTE = 'operative_note', // Ghi chú phẫu thuật
  EMERGENCY_NOTE = 'emergency_note', // Ghi chú cấp cứu
  FOLLOW_UP_NOTE = 'follow_up_note', // Ghi chú tái khám
  SOAP_NOTE = 'soap_note', // Ghi chú SOAP
  NURSING_NOTE = 'nursing_note', // Ghi chú điều dưỡng
}

export enum ClinicalNoteStatus {
  DRAFT = 'draft', // Bản nháp
  PENDING_COSIGN = 'pending_cosign', // Chờ ký tên
  COMPLETED = 'completed', // Hoàn thành
  AMENDED = 'amended', // Đã sửa đổi
  ARCHIVED = 'archived', // Lưu trữ
  DELETED = 'deleted', // Đã xóa
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

export class ClinicalNoteAggregate extends HealthcareAggregateRoot<ClinicalNoteProps> {
  private constructor(props: ClinicalNoteProps, id?: string) {
    super(props, id);
  }

  /**
   * Validate entity (required by Entity base class)
   */
  override validate(): void {
    this.validateInvariants();
  }

  /**
   * Create new clinical note
   */
  public static create(
    noteId: NoteId,
    medicalRecordId: string,
    patientId: string,
    authorId: string,
    noteType: ClinicalNoteType,
    noteTitle: string,
    noteContent: string,
    createdBy: string,
    options: {
      clinicalFindings?: string;
      assessment?: string;
      plan?: string;
      requiresCosign?: boolean;
      specialtyCode?: string;
      status?: ClinicalNoteStatus;
    } = {}
  ): ClinicalNoteAggregate {
    const props: ClinicalNoteProps = {
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
    aggregate.addDomainEvent(
      new ClinicalNoteCreatedEvent({
        noteId: noteId.value,
        medicalRecordId,
        patientId,
        authorId,
        noteType,
        noteTitle,
        requiresCosign: options.requiresCosign || false,
        createdBy,
        createdAt: props.createdAt,
      })
    );

    return aggregate;
  }

  /**
   * Reconstitute from database
   */
  public static reconstitute(
    props: ClinicalNoteProps,
    id?: string
  ): ClinicalNoteAggregate {
    return new ClinicalNoteAggregate(props, id || props.noteId.value);
  }

  protected validateBusinessInvariants(): void {
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

  public toPersistence(): any {
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

  protected applyEvent(event: DomainEvent): void {
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

  override getPatientId(): string | null {
    return this.props.patientId;
  }

  override containsPHI(): boolean {
    return true;
  }

  /**
   * Update clinical note content
   */
  public updateContent(
    updates: {
      noteTitle?: string;
      noteContent?: string;
      clinicalFindings?: string;
      assessment?: string;
      plan?: string;
    },
    updatedBy: string,
    updateReason?: string
  ): void {
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

    const previousValues: Record<string, any> = {};
    const newValues: Record<string, any> = {};
    const updatedFields: string[] = [];

    // Track changes
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && this.props[key as keyof ClinicalNoteProps] !== value) {
        previousValues[key] = this.props[key as keyof ClinicalNoteProps];
        newValues[key] = value;
        updatedFields.push(key);
        (this.props as any)[key] = value;
      }
    });

    if (updatedFields.length > 0) {
      this.props.updatedAt = new Date();
      this.props.updatedBy = updatedBy;

      // Add domain event
      this.addDomainEvent(
        new ClinicalNoteUpdatedEvent({
          noteId: this.props.noteId.value,
          medicalRecordId: this.props.medicalRecordId,
          patientId: this.props.patientId,
          updatedFields,
          previousValues,
          newValues,
          updatedBy,
          updatedAt: this.props.updatedAt,
          updateReason,
        })
      );
    }
  }

  /**
   * Cosign clinical note
   */
  public cosign(
    cosignedBy: string,
    cosignComment?: string
  ): void {
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
    this.addDomainEvent(
      new ClinicalNoteCosignedEvent({
        noteId: this.props.noteId.value,
        medicalRecordId: this.props.medicalRecordId,
        patientId: this.props.patientId,
        authorId: this.props.authorId,
        cosignedBy,
        cosignedAt: this.props.cosignedAt,
        cosignComment,
      })
    );
  }

  /**
   * Archive clinical note
   */
  public archive(archivedBy: string, reason?: string): void {
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

    this.addDomainEvent(
      new ClinicalNoteUpdatedEvent({
        noteId: this.props.noteId.value,
        medicalRecordId: this.props.medicalRecordId,
        patientId: this.props.patientId,
        updatedFields: ['status'],
        previousValues: { status: previousStatus },
        newValues: { status: ClinicalNoteStatus.ARCHIVED },
        updatedBy: archivedBy,
        updatedAt: this.props.updatedAt,
        updateReason: reason || 'Lưu trữ ghi chú',
      })
    );
  }

  /**
   * Log access for HIPAA compliance
   */
  private logAccess(
    accessedBy: string,
    accessType: 'read' | 'write' | 'print' | 'export',
    purpose?: string,
    ipAddress?: string,
    userAgent?: string
  ): void {
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
  public recordReadAccess(
    accessedBy: string,
    purpose?: string,
    ipAddress?: string,
    userAgent?: string
  ): void {
    this.logAccess(accessedBy, 'read', purpose, ipAddress, userAgent);
  }

  // Getters
  public get noteId(): NoteId {
    return this.props.noteId;
  }

  public get medicalRecordId(): string {
    return this.props.medicalRecordId;
  }

  public get patientId(): string {
    return this.props.patientId;
  }

  public get authorId(): string {
    return this.props.authorId;
  }

  public get noteType(): ClinicalNoteType {
    return this.props.noteType;
  }

  public get noteTitle(): string {
    return this.props.noteTitle;
  }

  public get noteContent(): string {
    return this.props.noteContent;
  }

  public get clinicalFindings(): string | undefined {
    return this.props.clinicalFindings;
  }

  public get assessment(): string | undefined {
    return this.props.assessment;
  }

  public get plan(): string | undefined {
    return this.props.plan;
  }

  public get requiresCosign(): boolean {
    return this.props.requiresCosign;
  }

  public get cosignedBy(): string | undefined {
    return this.props.cosignedBy;
  }

  public get cosignedAt(): Date | undefined {
    return this.props.cosignedAt;
  }

  public get cosignComment(): string | undefined {
    return this.props.cosignComment;
  }

  public get status(): ClinicalNoteStatus {
    return this.props.status;
  }

  override get createdAt(): Date {
    return this.props.createdAt;
  }

  override get updatedAt(): Date {
    return this.props.updatedAt;
  }

  public get createdBy(): string {
    return this.props.createdBy;
  }

  public get updatedBy(): string | undefined {
    return this.props.updatedBy;
  }

  // Business logic methods
  public isDraft(): boolean {
    return this.props.status === ClinicalNoteStatus.DRAFT;
  }

  public isPendingCosign(): boolean {
    return this.props.status === ClinicalNoteStatus.PENDING_COSIGN;
  }

  public isCompleted(): boolean {
    return this.props.status === ClinicalNoteStatus.COMPLETED;
  }

  public isArchived(): boolean {
    return this.props.status === ClinicalNoteStatus.ARCHIVED;
  }

  public isDeleted(): boolean {
    return this.props.status === ClinicalNoteStatus.DELETED;
  }

  public isCosigned(): boolean {
    return !!this.props.cosignedBy && !!this.props.cosignedAt;
  }

  public hasSOAPFormat(): boolean {
    return !!(this.props.clinicalFindings && this.props.assessment && this.props.plan);
  }

  /**
   * Get note summary
   */
  public getSummary(): string {
    const parts: string[] = [];

    parts.push(`Mã ghi chú: ${this.props.noteId.value}`);
    parts.push(`Loại: ${this.getNoteTypeDisplay()}`);
    parts.push(`Tiêu đề: ${this.props.noteTitle}`);
    
    if (this.props.requiresCosign) {
      if (this.isCosigned()) {
        parts.push(`Đã ký tên: ${this.props.cosignedAt?.toLocaleDateString('vi-VN')}`);
      } else {
        parts.push('Chờ ký tên');
      }
    }

    parts.push(`Trạng thái: ${this.getStatusDisplay()}`);

    return parts.join(' | ');
  }

  /**
   * Get note type display in Vietnamese
   */
  private getNoteTypeDisplay(): string {
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
  private getStatusDisplay(): string {
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
  public toJSON(): any {
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
