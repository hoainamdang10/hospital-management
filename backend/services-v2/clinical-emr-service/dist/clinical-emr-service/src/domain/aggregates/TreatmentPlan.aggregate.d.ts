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
import { TreatmentPlanId } from '../value-objects/TreatmentPlanId';
export interface TreatmentPlanProps {
    planId: TreatmentPlanId;
    medicalRecordId: string;
    patientId: string;
    primaryDoctorId: string;
    diagnosis: string;
    diagnosisCode?: string;
    treatmentGoals: string;
    planDescription?: string;
    treatmentItems: TreatmentItem[];
    startDate: Date;
    expectedEndDate?: Date;
    actualEndDate?: Date;
    progressNotes?: string;
    currentProgress?: number;
    patientConsent: boolean;
    consentDate?: Date;
    consentBy?: string;
    consultingDoctors?: string[];
    fhirResourceId?: string;
    fhirVersion?: string;
    fhirProfile?: string;
    vietnamesePlanCode?: string;
    status: TreatmentPlanStatus;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    updatedBy?: string;
    accessLog?: TreatmentPlanAccess[];
    lastAccessedAt?: Date;
    lastAccessedBy?: string;
}
export declare enum TreatmentPlanStatus {
    DRAFT = "draft",// Đang soạn thảo
    PENDING_CONSENT = "pending_consent",// Chờ đồng ý
    ACTIVE = "active",// Đang hoạt động
    IN_PROGRESS = "in_progress",// Đang thực hiện
    ON_HOLD = "on_hold",// Tạm dừng
    COMPLETED = "completed",// Hoàn thành
    CANCELLED = "cancelled",// Đã hủy
    ARCHIVED = "archived"
}
export interface TreatmentItem {
    itemId: string;
    type: TreatmentItemType;
    name: string;
    description?: string;
    frequency?: string;
    duration?: string;
    instructions?: string;
    performedBy?: string;
    scheduledDate?: Date;
    completedDate?: Date;
    status: TreatmentItemStatus;
    notes?: string;
}
export declare enum TreatmentItemType {
    MEDICATION = "medication",// Thuốc
    PROCEDURE = "procedure",// Thủ thuật
    SURGERY = "surgery",// Phẫu thuật
    THERAPY = "therapy",// Vật lý trị liệu
    EXERCISE = "exercise",// Tập luyện
    DIET = "diet",// Chế độ ăn
    MONITORING = "monitoring",// Theo dõi
    LAB_TEST = "lab_test",// Xét nghiệm
    IMAGING = "imaging",// Chẩn đoán hình ảnh
    CONSULTATION = "consultation",// Tư vấn
    OTHER = "other"
}
export declare enum TreatmentItemStatus {
    PLANNED = "planned",// Đã lên kế hoạch
    SCHEDULED = "scheduled",// Đã đặt lịch
    IN_PROGRESS = "in_progress",// Đang thực hiện
    COMPLETED = "completed",// Hoàn thành
    CANCELLED = "cancelled",// Đã hủy
    SKIPPED = "skipped"
}
export interface TreatmentPlanAccess {
    accessedAt: Date;
    accessedBy: string;
    accessType: 'read' | 'write' | 'print' | 'export';
    ipAddress?: string;
    userAgent?: string;
    purpose?: string;
}
export declare class TreatmentPlanAggregate extends HealthcareAggregateRoot<TreatmentPlanProps> {
    private constructor();
    /**
     * Validate entity (required by Entity base class)
     */
    validate(): void;
    /**
     * Create new treatment plan
     */
    static create(planId: TreatmentPlanId, medicalRecordId: string, patientId: string, primaryDoctorId: string, diagnosis: string, treatmentGoals: string, startDate: Date, createdBy: string, options?: {
        diagnosisCode?: string;
        planDescription?: string;
        expectedEndDate?: Date;
        patientConsent?: boolean;
        consentDate?: Date;
        consentBy?: string;
        consultingDoctors?: string[];
        status?: TreatmentPlanStatus;
    }): TreatmentPlanAggregate;
    /**
     * Reconstitute from database
     */
    static reconstitute(props: TreatmentPlanProps, id?: string): TreatmentPlanAggregate;
    protected validateBusinessInvariants(): void;
    toPersistence(): any;
    protected applyEvent(event: DomainEvent): void;
    getPatientId(): string | null;
    containsPHI(): boolean;
    /**
     * Add treatment item to plan
     */
    addTreatmentItem(item: Omit<TreatmentItem, 'itemId' | 'status'>, addedBy: string): void;
    /**
     * Update treatment item status
     */
    updateTreatmentItemStatus(itemId: string, newStatus: TreatmentItemStatus, updatedBy: string, notes?: string): void;
    /**
     * Grant patient consent
     */
    grantConsent(consentBy: string, grantedBy: string): void;
    /**
     * Update progress notes
     */
    updateProgress(progressNotes: string, updatedBy: string): void;
    /**
     * Complete treatment plan
     */
    complete(completedBy: string, completionNotes?: string): void;
    /**
     * Cancel treatment plan
     */
    cancel(cancelledBy: string, reason: string): void;
    /**
     * Recalculate progress based on treatment items
     */
    private recalculateProgress;
    /**
     * Log access for HIPAA compliance
     */
    private logAccess;
    /**
     * Record read access (HIPAA compliance)
     */
    recordReadAccess(accessedBy: string, purpose?: string, ipAddress?: string, userAgent?: string): void;
    get planId(): TreatmentPlanId;
    get medicalRecordId(): string;
    get patientId(): string;
    get primaryDoctorId(): string;
    get diagnosis(): string;
    get diagnosisCode(): string | undefined;
    get treatmentGoals(): string;
    get planDescription(): string | undefined;
    get treatmentItems(): TreatmentItem[];
    get startDate(): Date;
    get expectedEndDate(): Date | undefined;
    get actualEndDate(): Date | undefined;
    get progressNotes(): string | undefined;
    get currentProgress(): number | undefined;
    get patientConsent(): boolean;
    get consentDate(): Date | undefined;
    get consentBy(): string | undefined;
    get consultingDoctors(): string[];
    get status(): TreatmentPlanStatus;
    get createdAt(): Date;
    get updatedAt(): Date;
    get createdBy(): string;
    get updatedBy(): string | undefined;
    get accessLog(): TreatmentPlanAccess[];
    get lastAccessedAt(): Date | undefined;
    get lastAccessedBy(): string | undefined;
    isDraft(): boolean;
    isPendingConsent(): boolean;
    isActive(): boolean;
    isInProgress(): boolean;
    isOnHold(): boolean;
    isCompleted(): boolean;
    isCancelled(): boolean;
    isArchived(): boolean;
    hasConsent(): boolean;
    hasTreatmentItems(): boolean;
    /**
     * Get summary information
     */
    getSummary(): any;
    /**
     * Convert to JSON
     */
    toJSON(): any;
}
//# sourceMappingURL=TreatmentPlan.aggregate.d.ts.map