/**
 * TreatmentPlan Aggregate - Clinical EMR Service
 * Core aggregate for managing patient treatment plans
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA, FHIR R4
 */

import { HealthcareAggregateRoot } from '@shared/domain/base/aggregate-root';
import { DomainEvent } from '@shared/domain/base/domain-event';
import { TreatmentPlanCreatedEvent } from '../events/TreatmentPlanCreatedEvent';
import { TreatmentPlanUpdatedEvent } from '../events/TreatmentPlanUpdatedEvent';
import { TreatmentPlanCompletedEvent } from '../events/TreatmentPlanCompletedEvent';
import { TreatmentPlanId } from '../value-objects/TreatmentPlanId';

export interface TreatmentPlanProps {
  planId: TreatmentPlanId;
  medicalRecordId: string;
  patientId: string;
  primaryDoctorId: string; // Lead doctor responsible for the plan
  
  // Treatment Plan Information
  diagnosis: string; // Primary diagnosis requiring treatment
  diagnosisCode?: string; // ICD-10 code
  treatmentGoals: string; // Expected outcomes
  planDescription?: string; // Detailed treatment plan
  
  // Treatment Items
  treatmentItems: TreatmentItem[];
  
  // Schedule
  startDate: Date;
  expectedEndDate?: Date;
  actualEndDate?: Date;
  
  // Progress Tracking
  progressNotes?: string;
  currentProgress?: number; // Percentage (0-100)
  
  // Patient Consent
  patientConsent: boolean;
  consentDate?: Date;
  consentBy?: string; // Patient or guardian ID
  
  // Team
  consultingDoctors?: string[]; // Other doctors involved
  
  // FHIR Compliance
  fhirResourceId?: string;
  fhirVersion?: string;
  fhirProfile?: string;
  
  // Vietnamese Standards
  vietnamesePlanCode?: string;
  
  // Status and Audit
  status: TreatmentPlanStatus;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;
  
  // Audit trail for HIPAA compliance
  accessLog?: TreatmentPlanAccess[];
  lastAccessedAt?: Date;
  lastAccessedBy?: string;
}

export enum TreatmentPlanStatus {
  DRAFT = 'draft', // Đang soạn thảo
  PENDING_CONSENT = 'pending_consent', // Chờ đồng ý
  ACTIVE = 'active', // Đang hoạt động
  IN_PROGRESS = 'in_progress', // Đang thực hiện
  ON_HOLD = 'on_hold', // Tạm dừng
  COMPLETED = 'completed', // Hoàn thành
  CANCELLED = 'cancelled', // Đã hủy
  ARCHIVED = 'archived', // Lưu trữ
}

export interface TreatmentItem {
  itemId: string; // Unique ID for the treatment item
  type: TreatmentItemType;
  name: string;
  description?: string;
  frequency?: string; // E.g., "Twice daily", "Once a week"
  duration?: string; // E.g., "2 weeks", "1 month"
  instructions?: string;
  performedBy?: string; // Doctor/nurse ID
  scheduledDate?: Date;
  completedDate?: Date;
  status: TreatmentItemStatus;
  notes?: string;
}

export enum TreatmentItemType {
  MEDICATION = 'medication', // Thuốc
  PROCEDURE = 'procedure', // Thủ thuật
  SURGERY = 'surgery', // Phẫu thuật
  THERAPY = 'therapy', // Vật lý trị liệu
  EXERCISE = 'exercise', // Tập luyện
  DIET = 'diet', // Chế độ ăn
  MONITORING = 'monitoring', // Theo dõi
  LAB_TEST = 'lab_test', // Xét nghiệm
  IMAGING = 'imaging', // Chẩn đoán hình ảnh
  CONSULTATION = 'consultation', // Tư vấn
  OTHER = 'other', // Khác
}

export enum TreatmentItemStatus {
  PLANNED = 'planned', // Đã lên kế hoạch
  SCHEDULED = 'scheduled', // Đã đặt lịch
  IN_PROGRESS = 'in_progress', // Đang thực hiện
  COMPLETED = 'completed', // Hoàn thành
  CANCELLED = 'cancelled', // Đã hủy
  SKIPPED = 'skipped', // Bỏ qua
}

export interface TreatmentPlanAccess {
  accessedAt: Date;
  accessedBy: string;
  accessType: 'read' | 'write' | 'print' | 'export';
  ipAddress?: string;
  userAgent?: string;
  purpose?: string;
}

export class TreatmentPlanAggregate extends HealthcareAggregateRoot<TreatmentPlanProps> {
  private constructor(props: TreatmentPlanProps, id?: string) {
    super(props, id);
  }

  /**
   * Validate entity (required by Entity base class)
   */
  override validate(): void {
    this.validateInvariants();
  }

  /**
   * Create new treatment plan
   */
  public static create(
    planId: TreatmentPlanId,
    medicalRecordId: string,
    patientId: string,
    primaryDoctorId: string,
    diagnosis: string,
    treatmentGoals: string,
    startDate: Date,
    createdBy: string,
    options: {
      diagnosisCode?: string;
      planDescription?: string;
      expectedEndDate?: Date;
      patientConsent?: boolean;
      consentDate?: Date;
      consentBy?: string;
      consultingDoctors?: string[];
      status?: TreatmentPlanStatus;
    } = {}
  ): TreatmentPlanAggregate {
    const props: TreatmentPlanProps = {
      planId,
      medicalRecordId,
      patientId,
      primaryDoctorId,
      diagnosis,
      diagnosisCode: options.diagnosisCode,
      treatmentGoals,
      planDescription: options.planDescription,
      treatmentItems: [],
      startDate,
      expectedEndDate: options.expectedEndDate,
      currentProgress: 0,
      patientConsent: options.patientConsent || false,
      consentDate: options.consentDate,
      consentBy: options.consentBy,
      consultingDoctors: options.consultingDoctors || [],
      
      // FHIR Compliance
      fhirResourceId: `CarePlan/${planId.value}`,
      fhirVersion: '4.0.1',
      fhirProfile: 'http://moh.gov.vn/fhir/StructureDefinition/CarePlan',
      
      // Vietnamese Standards
      vietnamesePlanCode: planId.value,
      
      status: options.status || (options.patientConsent ? TreatmentPlanStatus.ACTIVE : TreatmentPlanStatus.PENDING_CONSENT),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy,
      updatedBy: createdBy,
      
      // Initialize access log
      accessLog: [{
        accessedAt: new Date(),
        accessedBy: createdBy,
        accessType: 'write',
        purpose: 'Tạo kế hoạch điều trị mới',
      }],
      lastAccessedAt: new Date(),
      lastAccessedBy: createdBy,
    };

    const aggregate = new TreatmentPlanAggregate(props, planId.value);

    // Validate business invariants
    aggregate.validateInvariants();

    // Add domain event
    aggregate.addDomainEvent(
      new TreatmentPlanCreatedEvent({
        planId: planId.value,
        medicalRecordId,
        patientId,
        primaryDoctorId,
        diagnosis,
        treatmentGoals,
        startDate,
        patientConsent: props.patientConsent,
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
    props: TreatmentPlanProps,
    id?: string
  ): TreatmentPlanAggregate {
    return new TreatmentPlanAggregate(props, id || props.planId.value);
  }

  protected validateBusinessInvariants(): void {
    const { planId, medicalRecordId, patientId, primaryDoctorId, diagnosis, treatmentGoals, startDate, createdBy } = this.props;

    // Required fields validation
    if (!planId) {
      throw new Error('PlanId là bắt buộc');
    }
    if (!medicalRecordId || medicalRecordId.trim() === '') {
      throw new Error('MedicalRecordId là bắt buộc');
    }
    if (!patientId || patientId.trim() === '') {
      throw new Error('PatientId là bắt buộc');
    }
    if (!primaryDoctorId || primaryDoctorId.trim() === '') {
      throw new Error('PrimaryDoctorId là bắt buộc');
    }
    if (!diagnosis || diagnosis.trim() === '') {
      throw new Error('Chẩn đoán là bắt buộc');
    }
    if (!treatmentGoals || treatmentGoals.trim() === '') {
      throw new Error('Mục tiêu điều trị là bắt buộc');
    }
    if (!startDate) {
      throw new Error('Ngày bắt đầu là bắt buộc');
    }
    if (!createdBy || createdBy.trim() === '') {
      throw new Error('CreatedBy là bắt buộc');
    }

    // Diagnosis length validation
    if (diagnosis.length > 500) {
      throw new Error('Chẩn đoán không được vượt quá 500 ký tự');
    }

    // Treatment goals length validation
    if (treatmentGoals.length > 1000) {
      throw new Error('Mục tiêu điều trị không được vượt quá 1,000 ký tự');
    }

    // Status validation
    if (!Object.values(TreatmentPlanStatus).includes(this.props.status)) {
      throw new Error('Trạng thái kế hoạch điều trị không hợp lệ');
    }

    // Patient ID format validation
    const patientIdRegex = /^PAT-\d{6}-\d{3}$/;
    if (!patientIdRegex.test(patientId)) {
      throw new Error('PatientId phải có định dạng PAT-YYYYMM-XXX');
    }

    // Doctor ID format validation
    const doctorIdRegex = /^[A-Z]{2,4}-DOC-\d{6}-\d{3}$/;
    if (!doctorIdRegex.test(primaryDoctorId)) {
      throw new Error('PrimaryDoctorId phải có định dạng DEPT-DOC-YYYYMM-XXX');
    }

    // Date validations
    if (this.props.expectedEndDate && this.props.expectedEndDate < startDate) {
      throw new Error('Ngày kết thúc dự kiến phải sau ngày bắt đầu');
    }

    // Progress validation
    if (this.props.currentProgress !== undefined) {
      if (this.props.currentProgress < 0 || this.props.currentProgress > 100) {
        throw new Error('Tiến độ phải nằm trong khoảng 0-100');
      }
    }

    // Consent validation
    if (this.props.status === TreatmentPlanStatus.ACTIVE && !this.props.patientConsent) {
      throw new Error('Kế hoạch điều trị hoạt động phải có sự đồng ý của bệnh nhân');
    }
  }

  public toPersistence(): any {
    return {
      id: this.id,
      plan_id: this.props.planId.value,
      medical_record_id: this.props.medicalRecordId,
      patient_id: this.props.patientId,
      primary_doctor_id: this.props.primaryDoctorId,
      diagnosis: this.props.diagnosis,
      diagnosis_code: this.props.diagnosisCode,
      treatment_goals: this.props.treatmentGoals,
      plan_description: this.props.planDescription,
      treatment_items_json: JSON.stringify(this.props.treatmentItems || []),
      start_date: this.props.startDate.toISOString(),
      expected_end_date: this.props.expectedEndDate?.toISOString(),
      actual_end_date: this.props.actualEndDate?.toISOString(),
      progress_notes: this.props.progressNotes,
      current_progress: this.props.currentProgress,
      patient_consent: this.props.patientConsent,
      consent_date: this.props.consentDate?.toISOString(),
      consent_by: this.props.consentBy,
      consulting_doctors_json: JSON.stringify(this.props.consultingDoctors || []),
      fhir_resource_id: this.props.fhirResourceId,
      fhir_version: this.props.fhirVersion,
      fhir_profile: this.props.fhirProfile,
      vietnamese_plan_code: this.props.vietnamesePlanCode,
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
      case 'TreatmentPlanCreated':
        // Event already applied during creation
        break;
      case 'TreatmentPlanUpdated':
        this.props.updatedAt = new Date();
        break;
      case 'TreatmentPlanCompleted':
        this.props.status = TreatmentPlanStatus.COMPLETED;
        this.props.currentProgress = 100;
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
   * Add treatment item to plan
   */
  public addTreatmentItem(
    item: Omit<TreatmentItem, 'itemId' | 'status'>,
    addedBy: string
  ): void {
    if (this.isCompleted() || this.isCancelled()) {
      throw new Error('Không thể thêm mục điều trị vào kế hoạch đã hoàn thành hoặc đã hủy');
    }

    this.logAccess(addedBy, 'write', 'Thêm mục điều trị');

    const newItem: TreatmentItem = {
      itemId: `ITEM-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      ...item,
      status: TreatmentItemStatus.PLANNED,
    };

    if (!this.props.treatmentItems) {
      this.props.treatmentItems = [];
    }

    this.props.treatmentItems.push(newItem);
    this.props.updatedAt = new Date();
    this.props.updatedBy = addedBy;

    this.addDomainEvent(
      new TreatmentPlanUpdatedEvent({
        planId: this.props.planId.value,
        medicalRecordId: this.props.medicalRecordId,
        patientId: this.props.patientId,
        updatedFields: ['treatmentItems'],
        previousValues: { treatmentItemsCount: this.props.treatmentItems.length - 1 },
        newValues: { treatmentItemsCount: this.props.treatmentItems.length },
        updatedBy: addedBy,
        updatedAt: this.props.updatedAt,
        updateReason: 'Thêm mục điều trị mới',
      })
    );
  }

  /**
   * Update treatment item status
   */
  public updateTreatmentItemStatus(
    itemId: string,
    newStatus: TreatmentItemStatus,
    updatedBy: string,
    notes?: string
  ): void {
    if (this.isCompleted() || this.isCancelled()) {
      throw new Error('Không thể cập nhật mục điều trị trong kế hoạch đã hoàn thành hoặc đã hủy');
    }

    this.logAccess(updatedBy, 'write', 'Cập nhật trạng thái mục điều trị');

    const item = this.props.treatmentItems?.find(i => i.itemId === itemId);
    if (!item) {
      throw new Error(`Không tìm thấy mục điều trị với ID ${itemId}`);
    }

    const previousStatus = item.status;
    item.status = newStatus;
    if (notes) {
      item.notes = notes;
    }

    if (newStatus === TreatmentItemStatus.COMPLETED) {
      item.completedDate = new Date();
    }

    this.props.updatedAt = new Date();
    this.props.updatedBy = updatedBy;

    // Recalculate progress
    this.recalculateProgress();

    this.addDomainEvent(
      new TreatmentPlanUpdatedEvent({
        planId: this.props.planId.value,
        medicalRecordId: this.props.medicalRecordId,
        patientId: this.props.patientId,
        updatedFields: ['treatmentItemStatus', 'currentProgress'],
        previousValues: { itemStatus: previousStatus, itemId },
        newValues: { itemStatus: newStatus, itemId, currentProgress: this.props.currentProgress },
        updatedBy,
        updatedAt: this.props.updatedAt,
        updateReason: 'Cập nhật trạng thái mục điều trị',
      })
    );
  }

  /**
   * Grant patient consent
   */
  public grantConsent(consentBy: string, grantedBy: string): void {
    if (this.props.patientConsent) {
      throw new Error('Bệnh nhân đã đồng ý với kế hoạch điều trị');
    }

    this.logAccess(grantedBy, 'write', 'Ghi nhận đồng ý của bệnh nhân');

    this.props.patientConsent = true;
    this.props.consentDate = new Date();
    this.props.consentBy = consentBy;

    // Auto-activate if was pending consent
    if (this.props.status === TreatmentPlanStatus.PENDING_CONSENT) {
      this.props.status = TreatmentPlanStatus.ACTIVE;
    }

    this.props.updatedAt = new Date();
    this.props.updatedBy = grantedBy;

    this.addDomainEvent(
      new TreatmentPlanUpdatedEvent({
        planId: this.props.planId.value,
        medicalRecordId: this.props.medicalRecordId,
        patientId: this.props.patientId,
        updatedFields: ['patientConsent', 'status'],
        previousValues: { patientConsent: false, status: TreatmentPlanStatus.PENDING_CONSENT },
        newValues: { patientConsent: true, status: this.props.status },
        updatedBy: grantedBy,
        updatedAt: this.props.updatedAt,
        updateReason: 'Ghi nhận đồng ý của bệnh nhân',
      })
    );
  }

  /**
   * Update progress notes
   */
  public updateProgress(
    progressNotes: string,
    updatedBy: string
  ): void {
    if (this.isCompleted() || this.isCancelled()) {
      throw new Error('Không thể cập nhật tiến độ cho kế hoạch đã hoàn thành hoặc đã hủy');
    }

    this.logAccess(updatedBy, 'write', 'Cập nhật tiến độ điều trị');

    const previousNotes = this.props.progressNotes;
    this.props.progressNotes = progressNotes;
    this.props.updatedAt = new Date();
    this.props.updatedBy = updatedBy;

    this.addDomainEvent(
      new TreatmentPlanUpdatedEvent({
        planId: this.props.planId.value,
        medicalRecordId: this.props.medicalRecordId,
        patientId: this.props.patientId,
        updatedFields: ['progressNotes'],
        previousValues: { progressNotes: previousNotes },
        newValues: { progressNotes },
        updatedBy,
        updatedAt: this.props.updatedAt,
        updateReason: 'Cập nhật ghi chú tiến độ',
      })
    );
  }

  /**
   * Complete treatment plan
   */
  public complete(completedBy: string, completionNotes?: string): void {
    if (this.isCompleted()) {
      throw new Error('Kế hoạch điều trị đã được hoàn thành');
    }

    if (this.isCancelled()) {
      throw new Error('Không thể hoàn thành kế hoạch điều trị đã bị hủy');
    }

    this.logAccess(completedBy, 'write', 'Hoàn thành kế hoạch điều trị');

    this.props.status = TreatmentPlanStatus.COMPLETED;
    this.props.actualEndDate = new Date();
    this.props.currentProgress = 100;
    if (completionNotes) {
      this.props.progressNotes = this.props.progressNotes
        ? `${this.props.progressNotes}\n\n[Hoàn thành] ${completionNotes}`
        : completionNotes;
    }
    this.props.updatedAt = new Date();
    this.props.updatedBy = completedBy;

    this.addDomainEvent(
      new TreatmentPlanCompletedEvent({
        planId: this.props.planId.value,
        medicalRecordId: this.props.medicalRecordId,
        patientId: this.props.patientId,
        primaryDoctorId: this.props.primaryDoctorId,
        completedBy,
        completedAt: this.props.actualEndDate,
        completionNotes,
      })
    );
  }

  /**
   * Cancel treatment plan
   */
  public cancel(cancelledBy: string, reason: string): void {
    if (this.isCompleted()) {
      throw new Error('Không thể hủy kế hoạch điều trị đã hoàn thành');
    }

    if (this.isCancelled()) {
      throw new Error('Kế hoạch điều trị đã bị hủy');
    }

    this.logAccess(cancelledBy, 'write', 'Hủy kế hoạch điều trị');

    const previousStatus = this.props.status;
    this.props.status = TreatmentPlanStatus.CANCELLED;
    this.props.actualEndDate = new Date();
    this.props.progressNotes = this.props.progressNotes
      ? `${this.props.progressNotes}\n\n[Đã hủy] ${reason}`
      : `[Đã hủy] ${reason}`;
    this.props.updatedAt = new Date();
    this.props.updatedBy = cancelledBy;

    this.addDomainEvent(
      new TreatmentPlanUpdatedEvent({
        planId: this.props.planId.value,
        medicalRecordId: this.props.medicalRecordId,
        patientId: this.props.patientId,
        updatedFields: ['status'],
        previousValues: { status: previousStatus },
        newValues: { status: TreatmentPlanStatus.CANCELLED },
        updatedBy: cancelledBy,
        updatedAt: this.props.updatedAt,
        updateReason: reason,
      })
    );
  }

  /**
   * Recalculate progress based on treatment items
   */
  private recalculateProgress(): void {
    if (!this.props.treatmentItems || this.props.treatmentItems.length === 0) {
      this.props.currentProgress = 0;
      return;
    }

    const completedItems = this.props.treatmentItems.filter(
      i => i.status === TreatmentItemStatus.COMPLETED
    ).length;

    this.props.currentProgress = Math.round((completedItems / this.props.treatmentItems.length) * 100);
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

  get planId(): TreatmentPlanId {
    return this.props.planId;
  }

  get medicalRecordId(): string {
    return this.props.medicalRecordId;
  }

  get patientId(): string {
    return this.props.patientId;
  }

  get primaryDoctorId(): string {
    return this.props.primaryDoctorId;
  }

  get diagnosis(): string {
    return this.props.diagnosis;
  }

  get diagnosisCode(): string | undefined {
    return this.props.diagnosisCode;
  }

  get treatmentGoals(): string {
    return this.props.treatmentGoals;
  }

  get planDescription(): string | undefined {
    return this.props.planDescription;
  }

  get treatmentItems(): TreatmentItem[] {
    return this.props.treatmentItems || [];
  }

  get startDate(): Date {
    return this.props.startDate;
  }

  get expectedEndDate(): Date | undefined {
    return this.props.expectedEndDate;
  }

  get actualEndDate(): Date | undefined {
    return this.props.actualEndDate;
  }

  get progressNotes(): string | undefined {
    return this.props.progressNotes;
  }

  get currentProgress(): number | undefined {
    return this.props.currentProgress;
  }

  get patientConsent(): boolean {
    return this.props.patientConsent;
  }

  get consentDate(): Date | undefined {
    return this.props.consentDate;
  }

  get consentBy(): string | undefined {
    return this.props.consentBy;
  }

  get consultingDoctors(): string[] {
    return this.props.consultingDoctors || [];
  }

  get status(): TreatmentPlanStatus {
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

  get accessLog(): TreatmentPlanAccess[] {
    return this.props.accessLog || [];
  }

  get lastAccessedAt(): Date | undefined {
    return this.props.lastAccessedAt;
  }

  get lastAccessedBy(): string | undefined {
    return this.props.lastAccessedBy;
  }

  // --- Business Logic Methods ---

  public isDraft(): boolean {
    return this.props.status === TreatmentPlanStatus.DRAFT;
  }

  public isPendingConsent(): boolean {
    return this.props.status === TreatmentPlanStatus.PENDING_CONSENT;
  }

  public isActive(): boolean {
    return this.props.status === TreatmentPlanStatus.ACTIVE;
  }

  public isInProgress(): boolean {
    return this.props.status === TreatmentPlanStatus.IN_PROGRESS;
  }

  public isOnHold(): boolean {
    return this.props.status === TreatmentPlanStatus.ON_HOLD;
  }

  public isCompleted(): boolean {
    return this.props.status === TreatmentPlanStatus.COMPLETED;
  }

  public isCancelled(): boolean {
    return this.props.status === TreatmentPlanStatus.CANCELLED;
  }

  public isArchived(): boolean {
    return this.props.status === TreatmentPlanStatus.ARCHIVED;
  }

  public hasConsent(): boolean {
    return this.props.patientConsent;
  }

  public hasTreatmentItems(): boolean {
    return !!this.props.treatmentItems && this.props.treatmentItems.length > 0;
  }

  /**
   * Get summary information
   */
  public getSummary(): any {
    return {
      planId: this.props.planId.value,
      medicalRecordId: this.props.medicalRecordId,
      patientId: this.props.patientId,
      primaryDoctorId: this.props.primaryDoctorId,
      diagnosis: this.props.diagnosis,
      treatmentGoals: this.props.treatmentGoals,
      status: this.props.status,
      startDate: this.props.startDate,
      expectedEndDate: this.props.expectedEndDate,
      actualEndDate: this.props.actualEndDate,
      currentProgress: this.props.currentProgress,
      patientConsent: this.props.patientConsent,
      treatmentItemsCount: this.treatmentItems.length,
      completedItemsCount: this.treatmentItems.filter(i => i.status === TreatmentItemStatus.COMPLETED).length,
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
      planId: this.props.planId.value,
      medicalRecordId: this.props.medicalRecordId,
      patientId: this.props.patientId,
      primaryDoctorId: this.props.primaryDoctorId,
      diagnosis: this.props.diagnosis,
      diagnosisCode: this.props.diagnosisCode,
      treatmentGoals: this.props.treatmentGoals,
      planDescription: this.props.planDescription,
      treatmentItems: this.props.treatmentItems,
      startDate: this.props.startDate,
      expectedEndDate: this.props.expectedEndDate,
      actualEndDate: this.props.actualEndDate,
      progressNotes: this.props.progressNotes,
      currentProgress: this.props.currentProgress,
      patientConsent: this.props.patientConsent,
      consentDate: this.props.consentDate,
      consentBy: this.props.consentBy,
      consultingDoctors: this.props.consultingDoctors,
      fhirResourceId: this.props.fhirResourceId,
      fhirVersion: this.props.fhirVersion,
      fhirProfile: this.props.fhirProfile,
      vietnamesePlanCode: this.props.vietnamesePlanCode,
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
