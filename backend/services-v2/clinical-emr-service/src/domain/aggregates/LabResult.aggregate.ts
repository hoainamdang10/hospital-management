/**
 * LabResult Aggregate - Clinical EMR Service
 * Core aggregate for managing laboratory test results
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA, FHIR R4
 */

import { HealthcareAggregateRoot } from '@shared/domain/base/aggregate-root';
import { DomainEvent } from '@shared/domain/base/domain-event';
import { LabResultCreatedEvent } from '../events/LabResultCreatedEvent';
import { LabResultUpdatedEvent } from '../events/LabResultUpdatedEvent';
import { LabResultVerifiedEvent } from '../events/LabResultVerifiedEvent';
import { LabResultId } from '../value-objects/LabResultId';

export interface LabResultProps {
  resultId: LabResultId;
  medicalRecordId: string;
  patientId: string;
  
  // Test Information
  testName: string;
  testType: LabTestType;
  testCode?: string; // LOINC or local code
  
  // Sample Information
  specimenType?: string; // Blood, Urine, etc.
  specimenCollectedAt?: Date;
  specimenCollectedBy?: string;
  
  // Results
  resultValue?: string;
  referenceRange?: string;
  unit?: string;
  interpretation?: string; // Normal, Abnormal, Critical
  
  // Test Execution
  testPerformedAt?: Date;
  performedBy?: string; // Lab technician
  
  // Verification
  verifiedBy?: string; // Doctor who verified
  verifiedAt?: Date;
  
  // Ordering
  orderedBy: string; // Doctor who ordered
  orderedAt: Date;
  priority: LabTestPriority;
  
  // Status and Audit
  status: LabResultStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;
  
  // FHIR Compliance
  fhirResourceId?: string;
  
  // Audit trail for HIPAA compliance
  accessLog?: LabResultAccess[];
  lastAccessedAt?: Date;
  lastAccessedBy?: string;
}

export enum LabTestType {
  HEMATOLOGY = 'hematology', // Huyết học
  BIOCHEMISTRY = 'biochemistry', // Hóa sinh
  MICROBIOLOGY = 'microbiology', // Vi sinh
  IMMUNOLOGY = 'immunology', // Miễn dịch
  SEROLOGY = 'serology', // Huyết thanh
  URINALYSIS = 'urinalysis', // Nước tiểu
  COAGULATION = 'coagulation', // Đông máu
  ENDOCRINOLOGY = 'endocrinology', // Nội tiết
  TOXICOLOGY = 'toxicology', // Độc chất
  MOLECULAR = 'molecular', // Sinh học phân tử
  GENETICS = 'genetics', // Di truyền
  OTHER = 'other',
}

export enum LabResultStatus {
  ORDERED = 'ordered', // Đã chỉ định
  SPECIMEN_COLLECTED = 'specimen_collected', // Đã lấy mẫu
  IN_PROGRESS = 'in_progress', // Đang xét nghiệm
  PRELIMINARY = 'preliminary', // Kết quả sơ bộ
  FINAL = 'final', // Kết quả cuối cùng
  VERIFIED = 'verified', // Đã xác nhận
  AMENDED = 'amended', // Đã sửa đổi
  CANCELLED = 'cancelled', // Đã hủy
}

export enum LabTestPriority {
  ROUTINE = 'routine', // Thường quy
  URGENT = 'urgent', // Cấp
  STAT = 'stat', // Cấp cứu
  ASAP = 'asap', // Càng sớm càng tốt
}

export interface LabResultAccess {
  accessedBy: string;
  accessedAt: Date;
  accessPurpose: string;
  ipAddress?: string;
}

/**
 * LabResult Aggregate Root
 * Manages laboratory test results with business rules and invariants
 */
export class LabResult extends HealthcareAggregateRoot<LabResultProps> {
  private constructor(props: LabResultProps, id?: string) {
    super(props, id);
  }

  /**
   * Factory method to create new lab result
   */
  public static create(props: Omit<LabResultProps, 'resultId' | 'createdAt' | 'updatedAt' | 'status'>): LabResult {
    const labResult = new LabResult({
      ...props,
      resultId: LabResultId.create(),
      status: LabResultStatus.ORDERED,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    labResult.addDomainEvent(new LabResultCreatedEvent({
      resultId: labResult.props.resultId.value,
      patientId: labResult.props.patientId,
      medicalRecordId: labResult.props.medicalRecordId,
      testType: labResult.props.testType,
      orderedBy: labResult.props.orderedBy,
      priority: labResult.props.priority,
      timestamp: new Date(),
    }));

    return labResult;
  }

  /**
   * Reconstitute from persistence
   */
  public static reconstitute(props: LabResultProps, id: string): LabResult {
    return new LabResult(props, id);
  }

  // =====================================================
  // GETTERS
  // =====================================================

  get resultId(): LabResultId {
    return this.props.resultId;
  }

  get medicalRecordId(): string {
    return this.props.medicalRecordId;
  }

  get patientId(): string {
    return this.props.patientId;
  }

  get testName(): string {
    return this.props.testName;
  }

  get testType(): LabTestType {
    return this.props.testType;
  }

  get status(): LabResultStatus {
    return this.props.status;
  }

  get resultValue(): string | undefined {
    return this.props.resultValue;
  }

  get priority(): LabTestPriority {
    return this.props.priority;
  }

  // =====================================================
  // BUSINESS METHODS
  // =====================================================

  /**
   * Update lab result with test results
   */
  public updateResults(
    resultValue: string,
    referenceRange?: string,
    unit?: string,
    interpretation?: string,
    performedBy?: string,
    updatedBy?: string
  ): void {
    if (this.props.status === LabResultStatus.CANCELLED) {
      throw new Error('Cannot update cancelled lab result');
    }

    if (this.props.status === LabResultStatus.VERIFIED) {
      throw new Error('Cannot update verified lab result. Create amendment instead.');
    }

    this.props.resultValue = resultValue;
    this.props.referenceRange = referenceRange;
    this.props.unit = unit;
    this.props.interpretation = interpretation;
    this.props.performedBy = performedBy;
    this.props.testPerformedAt = new Date();
    this.props.status = LabResultStatus.PRELIMINARY;
    this.props.updatedAt = new Date();
    this.props.updatedBy = updatedBy;

    this.addDomainEvent(new LabResultUpdatedEvent({
      resultId: this.props.resultId.value,
      patientId: this.props.patientId,
      status: this.props.status,
      updatedBy: updatedBy || 'system',
      timestamp: new Date(),
    }));
  }

  /**
   * Verify lab result (doctor confirmation)
   */
  public verify(verifiedBy: string): void {
    if (this.props.status === LabResultStatus.CANCELLED) {
      throw new Error('Cannot verify cancelled lab result');
    }

    if (!this.props.resultValue) {
      throw new Error('Cannot verify lab result without results');
    }

    this.props.verifiedBy = verifiedBy;
    this.props.verifiedAt = new Date();
    this.props.status = LabResultStatus.VERIFIED;
    this.props.updatedAt = new Date();

    this.addDomainEvent(new LabResultVerifiedEvent({
      resultId: this.props.resultId.value,
      patientId: this.props.patientId,
      verifiedBy,
      timestamp: new Date(),
    }));
  }

  /**
   * Mark specimen as collected
   */
  public markSpecimenCollected(collectedBy: string): void {
    if (this.props.status !== LabResultStatus.ORDERED) {
      throw new Error('Can only mark specimen collected for ordered tests');
    }

    this.props.specimenCollectedAt = new Date();
    this.props.specimenCollectedBy = collectedBy;
    this.props.status = LabResultStatus.SPECIMEN_COLLECTED;
    this.props.updatedAt = new Date();
  }

  /**
   * Cancel lab result
   */
  public cancel(reason: string, cancelledBy: string): void {
    if (this.props.status === LabResultStatus.VERIFIED) {
      throw new Error('Cannot cancel verified lab result');
    }

    this.props.status = LabResultStatus.CANCELLED;
    this.props.notes = `Cancelled: ${reason}`;
    this.props.updatedAt = new Date();
    this.props.updatedBy = cancelledBy;
  }

  /**
   * Log access for HIPAA compliance
   */
  public logAccess(accessedBy: string, accessPurpose: string, ipAddress?: string): void {
    if (!this.props.accessLog) {
      this.props.accessLog = [];
    }

    this.props.accessLog.push({
      accessedBy,
      accessedAt: new Date(),
      accessPurpose,
      ipAddress,
    });

    this.props.lastAccessedAt = new Date();
    this.props.lastAccessedBy = accessedBy;
  }

  /**
   * Check if result is critical
   */
  public isCritical(): boolean {
    return this.props.interpretation?.toLowerCase().includes('critical') || false;
  }

  /**
   * Check if result is abnormal
   */
  public isAbnormal(): boolean {
    const interpretation = this.props.interpretation?.toLowerCase();
    return interpretation?.includes('abnormal') || interpretation?.includes('critical') || false;
  }

  /**
   * Validate business rules
   */
  public validate(): void {
    if (!this.props.testName) {
      throw new Error('Test name is required');
    }

    if (!this.props.patientId) {
      throw new Error('Patient ID is required');
    }

    if (!this.props.medicalRecordId) {
      throw new Error('Medical record ID is required');
    }

    if (!this.props.orderedBy) {
      throw new Error('Ordered by is required');
    }
  }
}

