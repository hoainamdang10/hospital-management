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
import { PrescriptionId } from '../value-objects/PrescriptionId';
export interface PrescriptionProps {
    prescriptionId: PrescriptionId;
    medicalRecordId: string;
    patientId: string;
    prescribedBy: string;
    diagnosis?: string;
    diagnosisCode?: string;
    medications: MedicationItem[];
    generalInstructions?: string;
    precautions?: string;
    prescribedDate: Date;
    validUntil?: Date;
    dispensedBy?: string;
    dispensedAt?: Date;
    pharmacyId?: string;
    refillsAllowed: number;
    refillsRemaining: number;
    refillHistory?: RefillRecord[];
    fhirResourceId?: string;
    fhirVersion?: string;
    fhirProfile?: string;
    vietnamesePrescriptionCode?: string;
    status: PrescriptionStatus;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    updatedBy?: string;
    accessLog?: PrescriptionAccess[];
    lastAccessedAt?: Date;
    lastAccessedBy?: string;
}
export declare enum PrescriptionStatus {
    DRAFT = "draft",// Đang soạn thảo
    ACTIVE = "active",// Đang hoạt động
    DISPENSED = "dispensed",// Đã cấp thuốc
    COMPLETED = "completed",// Hoàn thành
    CANCELLED = "cancelled",// Đã hủy
    EXPIRED = "expired",// Hết hạn
    ON_HOLD = "on_hold",// Tạm dừng
    ARCHIVED = "archived"
}
export interface MedicationItem {
    itemId: string;
    medicationName: string;
    medicationCode?: string;
    activeIngredient?: string;
    dosage: string;
    dosageForm: MedicationDosageForm;
    route: MedicationRoute;
    frequency: string;
    timing?: string;
    duration: string;
    quantity: number;
    quantityUnit: string;
    instructions?: string;
    status: MedicationItemStatus;
    dispensedQuantity?: number;
    dispensedDate?: Date;
}
export declare enum MedicationDosageForm {
    TABLET = "tablet",// Viên nén
    CAPSULE = "capsule",// Viên nang
    SYRUP = "syrup",// Siro
    INJECTION = "injection",// Tiêm
    CREAM = "cream",// Kem
    OINTMENT = "ointment",// Thuốc mỡ
    DROPS = "drops",// Thuốc nhỏ
    INHALER = "inhaler",// Thuốc xịt
    PATCH = "patch",// Miếng dán
    POWDER = "powder",// Thuốc bột
    SUPPOSITORY = "suppository",// Thuốc đặt
    OTHER = "other"
}
export declare enum MedicationRoute {
    ORAL = "oral",// Uống
    SUBLINGUAL = "sublingual",// Ngậm dưới lưỡi
    TOPICAL = "topical",// Bôi ngoài da
    INJECTION_IV = "injection_iv",// Tiêm tĩnh mạch
    INJECTION_IM = "injection_im",// Tiêm bắp
    INJECTION_SC = "injection_sc",// Tiêm dưới da
    INHALATION = "inhalation",// Hít
    RECTAL = "rectal",// Đặt hậu môn
    VAGINAL = "vaginal",// Đặt âm đạo
    NASAL = "nasal",// Nhỏ mũi
    OPHTHALMIC = "ophthalmic",// Nhỏ mắt
    OTIC = "otic",// Nhỏ tai
    OTHER = "other"
}
export declare enum MedicationItemStatus {
    PENDING = "pending",// Chờ cấp thuốc
    DISPENSED = "dispensed",// Đã cấp thuốc
    DISCONTINUED = "discontinued",// Ngừng sử dụng
    SUBSTITUTED = "substituted"
}
export interface RefillRecord {
    refillNumber: number;
    refilledDate: Date;
    refilledBy: string;
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
export declare class PrescriptionAggregate extends HealthcareAggregateRoot<PrescriptionProps> {
    private constructor();
    /**
     * Validate entity (required by Entity base class)
     */
    validate(): void;
    /**
     * Create new prescription
     */
    static create(prescriptionId: PrescriptionId, medicalRecordId: string, patientId: string, prescribedBy: string, medications: Omit<MedicationItem, 'itemId' | 'status'>[], prescribedDate: Date, createdBy: string, options?: {
        diagnosis?: string;
        diagnosisCode?: string;
        generalInstructions?: string;
        precautions?: string;
        validUntil?: Date;
        refillsAllowed?: number;
        status?: PrescriptionStatus;
    }): PrescriptionAggregate;
    /**
     * Reconstitute from database
     */
    static reconstitute(props: PrescriptionProps, id?: string): PrescriptionAggregate;
    protected validateBusinessInvariants(): void;
    toPersistence(): any;
    protected applyEvent(event: DomainEvent): void;
    getPatientId(): string | null;
    containsPHI(): boolean;
    /**
     * Dispense prescription
     */
    dispense(dispensedBy: string, pharmacyId: string): void;
    /**
     * Refill prescription
     */
    refill(refilledBy: string, pharmacyId: string): void;
    /**
     * Complete prescription
     */
    complete(completedBy: string): void;
    /**
     * Cancel prescription
     */
    cancel(cancelledBy: string, reason: string): void;
    /**
     * Check if prescription is expired
     */
    checkExpiration(): void;
    /**
     * Log access for HIPAA compliance
     */
    private logAccess;
    /**
     * Record read access (HIPAA compliance)
     */
    recordReadAccess(accessedBy: string, purpose?: string, ipAddress?: string, userAgent?: string): void;
    get prescriptionId(): PrescriptionId;
    get medicalRecordId(): string;
    get patientId(): string;
    get prescribedBy(): string;
    get diagnosis(): string | undefined;
    get diagnosisCode(): string | undefined;
    get medications(): MedicationItem[];
    get generalInstructions(): string | undefined;
    get precautions(): string | undefined;
    get prescribedDate(): Date;
    get validUntil(): Date | undefined;
    get dispensedBy(): string | undefined;
    get dispensedAt(): Date | undefined;
    get pharmacyId(): string | undefined;
    get refillsAllowed(): number;
    get refillsRemaining(): number;
    get refillHistory(): RefillRecord[];
    get status(): PrescriptionStatus;
    get createdAt(): Date;
    get updatedAt(): Date;
    get createdBy(): string;
    get updatedBy(): string | undefined;
    get accessLog(): PrescriptionAccess[];
    get lastAccessedAt(): Date | undefined;
    get lastAccessedBy(): string | undefined;
    isDraft(): boolean;
    isActive(): boolean;
    isDispensed(): boolean;
    isCompleted(): boolean;
    isCancelled(): boolean;
    isExpired(): boolean;
    isOnHold(): boolean;
    isArchived(): boolean;
    hasRefillsAvailable(): boolean;
    /**
     * Get summary information
     */
    getSummary(): any;
    /**
     * Convert to JSON
     */
    toJSON(): any;
}
//# sourceMappingURL=Prescription.aggregate.d.ts.map