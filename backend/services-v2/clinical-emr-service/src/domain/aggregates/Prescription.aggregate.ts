/**
 * Prescription Aggregate - Clinical EMR Service
 * Core aggregate for managing medication prescriptions
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA, FHIR R4
 */

import { HealthcareAggregateRoot } from '@shared/domain/base/aggregate-root';
import { DomainEvent } from '@shared/domain/base/domain-event';
import { PrescriptionCreatedEvent } from '../events/PrescriptionCreatedEvent';
import { PrescriptionUpdatedEvent } from '../events/PrescriptionUpdatedEvent';
import { PrescriptionDispensedEvent } from '../events/PrescriptionDispensedEvent';
import { PrescriptionCompletedEvent } from '../events/PrescriptionCompletedEvent';
import { PrescriptionId } from '../value-objects/PrescriptionId';

export interface PrescriptionProps {
  prescriptionId: PrescriptionId;
  medicalRecordId: string;
  patientId: string;
  prescribedBy: string; // Doctor ID
  
  // Prescription Information
  diagnosis?: string; // Reason for prescription
  diagnosisCode?: string; // ICD-10 code
  
  // Medications
  medications: MedicationItem[];
  
  // Instructions
  generalInstructions?: string;
  precautions?: string;
  
  // Dates
  prescribedDate: Date;
  validUntil?: Date; // Prescription expiration date
  
  // Dispensing Information
  dispensedBy?: string; // Pharmacist ID
  dispensedAt?: Date;
  pharmacyId?: string;
  
  // Refills
  refillsAllowed: number; // Number of refills allowed (0 = no refills)
  refillsRemaining: number;
  refillHistory?: RefillRecord[];
  
  // FHIR Compliance
  fhirResourceId?: string;
  fhirVersion?: string;
  fhirProfile?: string;
  
  // Vietnamese Standards
  vietnamesePrescriptionCode?: string;
  
  // Status and Audit
  status: PrescriptionStatus;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;
  
  // Audit trail for HIPAA compliance
  accessLog?: PrescriptionAccess[];
  lastAccessedAt?: Date;
  lastAccessedBy?: string;
}

export enum PrescriptionStatus {
  DRAFT = 'draft', // Đang soạn thảo
  ACTIVE = 'active', // Đang hoạt động
  DISPENSED = 'dispensed', // Đã cấp thuốc
  COMPLETED = 'completed', // Hoàn thành
  CANCELLED = 'cancelled', // Đã hủy
  EXPIRED = 'expired', // Hết hạn
  ON_HOLD = 'on_hold', // Tạm dừng
  ARCHIVED = 'archived', // Lưu trữ
}

export interface MedicationItem {
  itemId: string; // Unique ID for the medication item
  medicationName: string; // Tên thuốc
  medicationCode?: string; // Mã thuốc (Vietnamese drug code)
  activeIngredient?: string; // Hoạt chất
  
  // Dosage
  dosage: string; // E.g., "500mg", "10ml"
  dosageForm: MedicationDosageForm; // E.g., Tablet, Capsule, Syrup
  route: MedicationRoute; // E.g., Oral, Injection
  
  // Frequency and Duration
  frequency: string; // E.g., "Twice daily", "Every 8 hours", "3 lần/ngày"
  timing?: string; // E.g., "After meals", "Before bedtime"
  duration: string; // E.g., "7 days", "2 weeks", "1 month"
  
  // Quantity
  quantity: number; // Number of units to dispense
  quantityUnit: string; // E.g., "tablets", "bottles", "vials"
  
  // Instructions
  instructions?: string; // Specific instructions for this medication
  
  // Status
  status: MedicationItemStatus;
  dispensedQuantity?: number;
  dispensedDate?: Date;
}

export enum MedicationDosageForm {
  TABLET = 'tablet', // Viên nén
  CAPSULE = 'capsule', // Viên nang
  SYRUP = 'syrup', // Siro
  INJECTION = 'injection', // Tiêm
  CREAM = 'cream', // Kem
  OINTMENT = 'ointment', // Thuốc mỡ
  DROPS = 'drops', // Thuốc nhỏ
  INHALER = 'inhaler', // Thuốc xịt
  PATCH = 'patch', // Miếng dán
  POWDER = 'powder', // Thuốc bột
  SUPPOSITORY = 'suppository', // Thuốc đặt
  OTHER = 'other', // Khác
}

export enum MedicationRoute {
  ORAL = 'oral', // Uống
  SUBLINGUAL = 'sublingual', // Ngậm dưới lưỡi
  TOPICAL = 'topical', // Bôi ngoài da
  INJECTION_IV = 'injection_iv', // Tiêm tĩnh mạch
  INJECTION_IM = 'injection_im', // Tiêm bắp
  INJECTION_SC = 'injection_sc', // Tiêm dưới da
  INHALATION = 'inhalation', // Hít
  RECTAL = 'rectal', // Đặt hậu môn
  VAGINAL = 'vaginal', // Đặt âm đạo
  NASAL = 'nasal', // Nhỏ mũi
  OPHTHALMIC = 'ophthalmic', // Nhỏ mắt
  OTIC = 'otic', // Nhỏ tai
  OTHER = 'other', // Khác
}

export enum MedicationItemStatus {
  PENDING = 'pending', // Chờ cấp thuốc
  DISPENSED = 'dispensed', // Đã cấp thuốc
  DISCONTINUED = 'discontinued', // Ngừng sử dụng
  SUBSTITUTED = 'substituted', // Thay thế
}

export interface RefillRecord {
  refillNumber: number; // Refill #1, #2, etc.
  refilledDate: Date;
  refilledBy: string; // Pharmacist ID
  pharmacyId?: string;
  notes?: string;
}

export interface PrescriptionAccess {
  accessedAt: Date;
  accessedBy: string;
  accessType: 'read' | 'write' | 'print' | 'export' | 'dispense';
  ipAddress?: string;
  userAgent?: string;
  purpose?: string;
}

export class PrescriptionAggregate extends HealthcareAggregateRoot<PrescriptionProps> {
  private constructor(props: PrescriptionProps, id?: string) {
    super(props, id);
  }

  /**
   * Validate entity (required by Entity base class)
   */
  override validate(): void {
    this.validateInvariants();
  }

  /**
   * Create new prescription
   */
  public static create(
    prescriptionId: PrescriptionId,
    medicalRecordId: string,
    patientId: string,
    prescribedBy: string,
    medications: Omit<MedicationItem, 'itemId' | 'status'>[],
    prescribedDate: Date,
    createdBy: string,
    options: {
      diagnosis?: string;
      diagnosisCode?: string;
      generalInstructions?: string;
      precautions?: string;
      validUntil?: Date;
      refillsAllowed?: number;
      status?: PrescriptionStatus;
    } = {}
  ): PrescriptionAggregate {
    // Generate medication item IDs
    const medicationItems: MedicationItem[] = medications.map((med, index) => ({
      ...med,
      itemId: `MED-${Date.now()}-${index}`,
      status: MedicationItemStatus.PENDING,
    }));

    const props: PrescriptionProps = {
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
    aggregate.addDomainEvent(
      new PrescriptionCreatedEvent({
        prescriptionId: prescriptionId.value,
        medicalRecordId,
        patientId,
        prescribedBy,
        medicationCount: medicationItems.length,
        prescribedDate,
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
    props: PrescriptionProps,
    id?: string
  ): PrescriptionAggregate {
    return new PrescriptionAggregate(props, id || props.prescriptionId.value);
  }

  protected validateBusinessInvariants(): void {
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

  public toPersistence(): any {
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

  protected applyEvent(event: DomainEvent): void {
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

  override getPatientId(): string | null {
    return this.props.patientId;
  }

  override containsPHI(): boolean {
    return true;
  }

  /**
   * Dispense prescription
   */
  public dispense(
    dispensedBy: string,
    pharmacyId: string
  ): void {
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

    this.addDomainEvent(
      new PrescriptionDispensedEvent({
        prescriptionId: this.props.prescriptionId.value,
        medicalRecordId: this.props.medicalRecordId,
        patientId: this.props.patientId,
        dispensedBy,
        dispensedAt: this.props.dispensedAt,
        pharmacyId,
        medicationCount: this.props.medications.length,
      })
    );
  }

  /**
   * Refill prescription
   */
  public refill(
    refilledBy: string,
    pharmacyId: string
  ): void {
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

    this.addDomainEvent(
      new PrescriptionUpdatedEvent({
        prescriptionId: this.props.prescriptionId.value,
        medicalRecordId: this.props.medicalRecordId,
        patientId: this.props.patientId,
        updatedFields: ['refillsRemaining', 'refillHistory'],
        previousValues: { refillsRemaining: this.props.refillsRemaining + 1 },
        newValues: { refillsRemaining: this.props.refillsRemaining },
        updatedBy: refilledBy,
        updatedAt: this.props.updatedAt,
        updateReason: `Cấp lại lần ${refillNumber}`,
      })
    );
  }

  /**
   * Complete prescription
   */
  public complete(completedBy: string): void {
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

    this.addDomainEvent(
      new PrescriptionCompletedEvent({
        prescriptionId: this.props.prescriptionId.value,
        medicalRecordId: this.props.medicalRecordId,
        patientId: this.props.patientId,
        prescribedBy: this.props.prescribedBy,
        completedBy,
        completedAt: this.props.updatedAt,
      })
    );
  }

  /**
   * Cancel prescription
   */
  public cancel(cancelledBy: string, reason: string): void {
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

    this.addDomainEvent(
      new PrescriptionUpdatedEvent({
        prescriptionId: this.props.prescriptionId.value,
        medicalRecordId: this.props.medicalRecordId,
        patientId: this.props.patientId,
        updatedFields: ['status'],
        previousValues: { status: previousStatus },
        newValues: { status: PrescriptionStatus.CANCELLED },
        updatedBy: cancelledBy,
        updatedAt: this.props.updatedAt,
        updateReason: reason,
      })
    );
  }

  /**
   * Check if prescription is expired
   */
  public checkExpiration(): void {
    if (this.props.validUntil && new Date() > this.props.validUntil) {
      if (this.props.status === PrescriptionStatus.ACTIVE || this.props.status === PrescriptionStatus.DISPENSED) {
        this.props.status = PrescriptionStatus.EXPIRED;
      }
    }
  }

  /**
   * Log access for HIPAA compliance
   */
  private logAccess(
    accessedBy: string,
    accessType: 'read' | 'write' | 'print' | 'export' | 'dispense',
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

  get prescriptionId(): PrescriptionId {
    return this.props.prescriptionId;
  }

  get medicalRecordId(): string {
    return this.props.medicalRecordId;
  }

  get patientId(): string {
    return this.props.patientId;
  }

  get prescribedBy(): string {
    return this.props.prescribedBy;
  }

  get diagnosis(): string | undefined {
    return this.props.diagnosis;
  }

  get diagnosisCode(): string | undefined {
    return this.props.diagnosisCode;
  }

  get medications(): MedicationItem[] {
    return this.props.medications;
  }

  get generalInstructions(): string | undefined {
    return this.props.generalInstructions;
  }

  get precautions(): string | undefined {
    return this.props.precautions;
  }

  get prescribedDate(): Date {
    return this.props.prescribedDate;
  }

  get validUntil(): Date | undefined {
    return this.props.validUntil;
  }

  get dispensedBy(): string | undefined {
    return this.props.dispensedBy;
  }

  get dispensedAt(): Date | undefined {
    return this.props.dispensedAt;
  }

  get pharmacyId(): string | undefined {
    return this.props.pharmacyId;
  }

  get refillsAllowed(): number {
    return this.props.refillsAllowed;
  }

  get refillsRemaining(): number {
    return this.props.refillsRemaining;
  }

  get refillHistory(): RefillRecord[] {
    return this.props.refillHistory || [];
  }

  get status(): PrescriptionStatus {
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

  get accessLog(): PrescriptionAccess[] {
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
    return this.props.status === PrescriptionStatus.DRAFT;
  }

  public isActive(): boolean {
    return this.props.status === PrescriptionStatus.ACTIVE;
  }

  public isDispensed(): boolean {
    return this.props.status === PrescriptionStatus.DISPENSED;
  }

  public isCompleted(): boolean {
    return this.props.status === PrescriptionStatus.COMPLETED;
  }

  public isCancelled(): boolean {
    return this.props.status === PrescriptionStatus.CANCELLED;
  }

  public isExpired(): boolean {
    return this.props.status === PrescriptionStatus.EXPIRED;
  }

  public isOnHold(): boolean {
    return this.props.status === PrescriptionStatus.ON_HOLD;
  }

  public isArchived(): boolean {
    return this.props.status === PrescriptionStatus.ARCHIVED;
  }

  public hasRefillsAvailable(): boolean {
    return this.props.refillsRemaining > 0;
  }

  /**
   * Get summary information
   */
  public getSummary(): any {
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
  public toJSON(): any {
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
