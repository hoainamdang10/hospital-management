/**
 * LabResult Aggregate - Clinical EMR Service
 * Core aggregate for managing laboratory test results
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA, FHIR R4
 */
import { HealthcareAggregateRoot } from '@shared/domain/base/aggregate-root';
import { LabResultId } from '../value-objects/LabResultId';
export interface LabResultProps {
    resultId: LabResultId;
    medicalRecordId: string;
    patientId: string;
    testName: string;
    testType: LabTestType;
    testCode?: string;
    specimenType?: string;
    specimenCollectedAt?: Date;
    specimenCollectedBy?: string;
    resultValue?: string;
    referenceRange?: string;
    unit?: string;
    interpretation?: string;
    testPerformedAt?: Date;
    performedBy?: string;
    verifiedBy?: string;
    verifiedAt?: Date;
    orderedBy: string;
    orderedAt: Date;
    priority: LabTestPriority;
    status: LabResultStatus;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    updatedBy?: string;
    fhirResourceId?: string;
    accessLog?: LabResultAccess[];
    lastAccessedAt?: Date;
    lastAccessedBy?: string;
}
export declare enum LabTestType {
    HEMATOLOGY = "hematology",// Huyết học
    BIOCHEMISTRY = "biochemistry",// Hóa sinh
    MICROBIOLOGY = "microbiology",// Vi sinh
    IMMUNOLOGY = "immunology",// Miễn dịch
    SEROLOGY = "serology",// Huyết thanh
    URINALYSIS = "urinalysis",// Nước tiểu
    COAGULATION = "coagulation",// Đông máu
    ENDOCRINOLOGY = "endocrinology",// Nội tiết
    TOXICOLOGY = "toxicology",// Độc chất
    MOLECULAR = "molecular",// Sinh học phân tử
    GENETICS = "genetics",// Di truyền
    OTHER = "other"
}
export declare enum LabResultStatus {
    ORDERED = "ordered",// Đã chỉ định
    SPECIMEN_COLLECTED = "specimen_collected",// Đã lấy mẫu
    IN_PROGRESS = "in_progress",// Đang xét nghiệm
    PRELIMINARY = "preliminary",// Kết quả sơ bộ
    FINAL = "final",// Kết quả cuối cùng
    VERIFIED = "verified",// Đã xác nhận
    AMENDED = "amended",// Đã sửa đổi
    CANCELLED = "cancelled"
}
export declare enum LabTestPriority {
    ROUTINE = "routine",// Thường quy
    URGENT = "urgent",// Cấp
    STAT = "stat",// Cấp cứu
    ASAP = "asap"
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
export declare class LabResult extends HealthcareAggregateRoot<LabResultProps> {
    private constructor();
    /**
     * Factory method to create new lab result
     */
    static create(props: Omit<LabResultProps, 'resultId' | 'createdAt' | 'updatedAt' | 'status'>): LabResult;
    /**
     * Reconstitute from persistence
     */
    static reconstitute(props: LabResultProps, id: string): LabResult;
    get resultId(): LabResultId;
    get medicalRecordId(): string;
    get patientId(): string;
    get testName(): string;
    get testType(): LabTestType;
    get status(): LabResultStatus;
    get resultValue(): string | undefined;
    get priority(): LabTestPriority;
    /**
     * Update lab result with test results
     */
    updateResults(resultValue: string, referenceRange?: string, unit?: string, interpretation?: string, performedBy?: string, updatedBy?: string): void;
    /**
     * Verify lab result (doctor confirmation)
     */
    verify(verifiedBy: string): void;
    /**
     * Mark specimen as collected
     */
    markSpecimenCollected(collectedBy: string): void;
    /**
     * Cancel lab result
     */
    cancel(reason: string, cancelledBy: string): void;
    /**
     * Log access for HIPAA compliance
     */
    logAccess(accessedBy: string, accessPurpose: string, ipAddress?: string): void;
    /**
     * Check if result is critical
     */
    isCritical(): boolean;
    /**
     * Check if result is abnormal
     */
    isAbnormal(): boolean;
    /**
     * Validate business rules
     */
    validate(): void;
}
//# sourceMappingURL=LabResult.aggregate.d.ts.map