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
import { DiagnosticReportCreatedEvent } from '../events/DiagnosticReportCreatedEvent';
import { DiagnosticReportUpdatedEvent } from '../events/DiagnosticReportUpdatedEvent';
import { DiagnosticReportFinalizedEvent } from '../events/DiagnosticReportFinalizedEvent';
import { DiagnosticReportId } from '../value-objects/DiagnosticReportId';

export interface DiagnosticReportProps {
  reportId: DiagnosticReportId;
  medicalRecordId: string;
  patientId: string;
  orderedBy: string; // Doctor who ordered the test
  
  // Report Information
  reportType: DiagnosticReportType;
  reportTitle: string;
  testName: string;
  testCode?: string; // LOINC or local code
  
  // Results
  results?: string; // Main results text
  interpretation?: string; // Clinical interpretation
  conclusion?: string; // Final conclusion
  recommendations?: string; // Clinical recommendations
  
  // Technical Details
  specimenType?: string; // Blood, Urine, Tissue, etc.
  specimenCollectedAt?: Date;
  testPerformedAt?: Date;
  
  // Reporting
  reportedBy?: string; // Lab technician/radiologist who performed test
  verifiedBy?: string; // Doctor who verified results
  verifiedAt?: Date;
  
  // Attachments
  attachments?: DiagnosticAttachment[];
  
  // FHIR Compliance
  fhirResourceId?: string;
  fhirVersion?: string;
  fhirProfile?: string;
  
  // Vietnamese Standards
  vietnameseReportCode?: string;
  labCode?: string;
  
  // Status and Audit
  status: DiagnosticReportStatus;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;
  
  // Audit trail for HIPAA compliance
  accessLog?: DiagnosticReportAccess[];
  lastAccessedAt?: Date;
  lastAccessedBy?: string;
}

export enum DiagnosticReportType {
  LABORATORY = 'laboratory', // Xét nghiệm
  IMAGING = 'imaging', // Chẩn đoán hình ảnh
  PATHOLOGY = 'pathology', // Giải phẫu bệnh
  MICROBIOLOGY = 'microbiology', // Vi sinh
  BIOCHEMISTRY = 'biochemistry', // Hóa sinh
  HEMATOLOGY = 'hematology', // Huyết học
  CARDIOLOGY = 'cardiology', // Điện tim
  ULTRASOUND = 'ultrasound', // Siêu âm
  XRAY = 'xray', // X-quang
  CT_SCAN = 'ct_scan', // CT
  MRI = 'mri', // MRI
  ENDOSCOPY = 'endoscopy', // Nội soi
}

export enum DiagnosticReportStatus {
  ORDERED = 'ordered', // Đã chỉ định
  SPECIMEN_COLLECTED = 'specimen_collected', // Đã lấy mẫu
  IN_PROGRESS = 'in_progress', // Đang thực hiện
  PRELIMINARY = 'preliminary', // Kết quả sơ bộ
  FINAL = 'final', // Kết quả cuối cùng
  AMENDED = 'amended', // Đã sửa đổi
  CANCELLED = 'cancelled', // Đã hủy
  ARCHIVED = 'archived', // Lưu trữ
}

export interface DiagnosticAttachment {
  fileName: string;
  fileType: string; // PDF, DICOM, JPEG, etc.
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

export class DiagnosticReportAggregate extends HealthcareAggregateRoot<DiagnosticReportProps> {
  private constructor(props: DiagnosticReportProps, id?: string) {
    super(props, id);
  }

  /**
   * Validate entity (required by Entity base class)
   */
  override validate(): void {
    this.validateInvariants();
  }

  /**
   * Create new diagnostic report
   */
  public static create(
    reportId: DiagnosticReportId,
    medicalRecordId: string,
    patientId: string,
    orderedBy: string,
    reportType: DiagnosticReportType,
    reportTitle: string,
    testName: string,
    createdBy: string,
    options: {
      testCode?: string;
      specimenType?: string;
      labCode?: string;
      status?: DiagnosticReportStatus;
    } = {}
  ): DiagnosticReportAggregate {
    const props: DiagnosticReportProps = {
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
    aggregate.addDomainEvent(
      new DiagnosticReportCreatedEvent({
        reportId: reportId.value,
        medicalRecordId,
        patientId,
        orderedBy,
        reportType,
        testName,
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
    props: DiagnosticReportProps,
    id?: string
  ): DiagnosticReportAggregate {
    return new DiagnosticReportAggregate(props, id || props.reportId.value);
  }

  protected validateBusinessInvariants(): void {
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

  public toPersistence(): any {
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

  protected applyEvent(event: DomainEvent): void {
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

  override getPatientId(): string | null {
    return this.props.patientId;
  }

  override containsPHI(): boolean {
    return true;
  }

  /**
   * Update report results
   */
  public updateResults(
    updates: {
      results?: string;
      interpretation?: string;
      conclusion?: string;
      recommendations?: string;
      reportedBy?: string;
      testPerformedAt?: Date;
    },
    updatedBy: string,
    updateReason?: string
  ): void {
    // Cannot update if finalized without creating amendment
    if (this.isFinal()) {
      throw new Error('Không thể cập nhật báo cáo đã hoàn thành. Sử dụng chức năng sửa đổi (amend).');
    }

    // Cannot update if cancelled
    if (this.isCancelled()) {
      throw new Error('Không thể cập nhật báo cáo đã bị hủy');
    }

    this.logAccess(updatedBy, 'write', 'Cập nhật kết quả báo cáo');

    const previousValues: Record<string, any> = {};
    const newValues: Record<string, any> = {};
    const updatedFields: string[] = [];

    // Track changes
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && this.props[key as keyof DiagnosticReportProps] !== value) {
        previousValues[key] = this.props[key as keyof DiagnosticReportProps];
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
        new DiagnosticReportUpdatedEvent({
          reportId: this.props.reportId.value,
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
   * Finalize report (mark as final)
   */
  public finalize(verifiedBy: string, verificationComment?: string): void {
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
    this.addDomainEvent(
      new DiagnosticReportFinalizedEvent({
        reportId: this.props.reportId.value,
        medicalRecordId: this.props.medicalRecordId,
        patientId: this.props.patientId,
        orderedBy: this.props.orderedBy,
        verifiedBy,
        verifiedAt: this.props.verifiedAt,
        verificationComment,
      })
    );
  }

  /**
   * Add attachment
   */
  public addAttachment(attachment: DiagnosticAttachment, addedBy: string): void {
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
  public cancel(cancelledBy: string, reason: string): void {
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

    this.addDomainEvent(
      new DiagnosticReportUpdatedEvent({
        reportId: this.props.reportId.value,
        medicalRecordId: this.props.medicalRecordId,
        patientId: this.props.patientId,
        updatedFields: ['status'],
        previousValues: { status: previousStatus },
        newValues: { status: DiagnosticReportStatus.CANCELLED },
        updatedBy: cancelledBy,
        updatedAt: this.props.updatedAt,
        updateReason: reason,
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
  }

  /**
   * Record read access (HIPAA compliance)
   */
  public recordReadAccess(
    accessedBy: string,
    purpose?: string,
    ipAddress?: string,
    userAgent?: string
  ): void {
    this.logAccess(accessedBy, 'read', purpose, ipAddress, userAgent);
  }

  // --- Getters ---

  get reportId(): DiagnosticReportId {
    return this.props.reportId;
  }

  get medicalRecordId(): string {
    return this.props.medicalRecordId;
  }

  get patientId(): string {
    return this.props.patientId;
  }

  get orderedBy(): string {
    return this.props.orderedBy;
  }

  get reportType(): DiagnosticReportType {
    return this.props.reportType;
  }

  get reportTitle(): string {
    return this.props.reportTitle;
  }

  get testName(): string {
    return this.props.testName;
  }

  get testCode(): string | undefined {
    return this.props.testCode;
  }

  get results(): string | undefined {
    return this.props.results;
  }

  get interpretation(): string | undefined {
    return this.props.interpretation;
  }

  get conclusion(): string | undefined {
    return this.props.conclusion;
  }

  get recommendations(): string | undefined {
    return this.props.recommendations;
  }

  get specimenType(): string | undefined {
    return this.props.specimenType;
  }

  get specimenCollectedAt(): Date | undefined {
    return this.props.specimenCollectedAt;
  }

  get testPerformedAt(): Date | undefined {
    return this.props.testPerformedAt;
  }

  get reportedBy(): string | undefined {
    return this.props.reportedBy;
  }

  get verifiedBy(): string | undefined {
    return this.props.verifiedBy;
  }

  get verifiedAt(): Date | undefined {
    return this.props.verifiedAt;
  }

  get attachments(): DiagnosticAttachment[] {
    return this.props.attachments || [];
  }

  get status(): DiagnosticReportStatus {
    return this.props.status;
  }

  override get createdAt(): Date {
    return this.props.createdAt;
  }

  override get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get createdBy(): string {
    return this.props.createdBy;
  }

  get updatedBy(): string | undefined {
    return this.props.updatedBy;
  }

  get accessLog(): DiagnosticReportAccess[] {
    return this.props.accessLog || [];
  }

  get lastAccessedAt(): Date | undefined {
    return this.props.lastAccessedAt;
  }

  get lastAccessedBy(): string | undefined {
    return this.props.lastAccessedBy;
  }

  // --- Business Logic Methods ---

  public isOrdered(): boolean {
    return this.props.status === DiagnosticReportStatus.ORDERED;
  }

  public isInProgress(): boolean {
    return this.props.status === DiagnosticReportStatus.IN_PROGRESS;
  }

  public isPreliminary(): boolean {
    return this.props.status === DiagnosticReportStatus.PRELIMINARY;
  }

  public isFinal(): boolean {
    return this.props.status === DiagnosticReportStatus.FINAL;
  }

  public isAmended(): boolean {
    return this.props.status === DiagnosticReportStatus.AMENDED;
  }

  public isCancelled(): boolean {
    return this.props.status === DiagnosticReportStatus.CANCELLED;
  }

  public isArchived(): boolean {
    return this.props.status === DiagnosticReportStatus.ARCHIVED;
  }

  public hasResults(): boolean {
    return !!this.props.results && this.props.results.trim() !== '';
  }

  public isVerified(): boolean {
    return !!this.props.verifiedBy && !!this.props.verifiedAt;
  }

  public hasAttachments(): boolean {
    return !!this.props.attachments && this.props.attachments.length > 0;
  }

  /**
   * Get summary information
   */
  public getSummary(): any {
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
  public toJSON(): any {
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
