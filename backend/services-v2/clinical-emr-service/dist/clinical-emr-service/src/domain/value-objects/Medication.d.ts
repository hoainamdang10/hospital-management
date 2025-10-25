/**
 * Medication Value Object - Clinical EMR Service
 * V2 Clean Architecture + DDD Implementation
 * Represents medication prescription with FHIR compliance and Vietnamese pharmaceutical standards
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, FHIR, Vietnamese Pharmaceutical Standards
 */
import { ValueObject } from '@shared/domain/base/value-object';
/**
 * Medication Status (FHIR Compliant)
 */
export declare enum MedicationStatus {
    ACTIVE = "active",// Đang sử dụng
    INACTIVE = "inactive",// Ngừng sử dụng
    ENTERED_IN_ERROR = "entered-in-error",// Nhập nhầm
    STOPPED = "stopped",// Đã dừng
    ON_HOLD = "on-hold",// Tạm dừng
    COMPLETED = "completed",// Hoàn thành
    CANCELLED = "cancelled"
}
/**
 * Dosage Form (Vietnamese Pharmaceutical Standards)
 */
export declare enum DosageForm {
    TABLET = "tablet",// Viên nén
    CAPSULE = "capsule",// Viên nang
    SYRUP = "syrup",// Siro
    INJECTION = "injection",// Tiêm
    CREAM = "cream",// Kem
    OINTMENT = "ointment",// Thuốc mỡ
    DROPS = "drops",// Thuốc nhỏ
    SPRAY = "spray",// Xịt
    POWDER = "powder",// Bột
    SOLUTION = "solution"
}
/**
 * Route of Administration (FHIR Compliant)
 */
export declare enum RouteOfAdministration {
    ORAL = "oral",// Uống
    TOPICAL = "topical",// Bôi ngoài da
    INTRAVENOUS = "intravenous",// Tiêm tĩnh mạch
    INTRAMUSCULAR = "intramuscular",// Tiêm bắp
    SUBCUTANEOUS = "subcutaneous",// Tiêm dưới da
    INHALATION = "inhalation",// Hít
    NASAL = "nasal",// Nhỏ mũi
    OPHTHALMIC = "ophthalmic",// Nhỏ mắt
    OTIC = "otic",// Nhỏ tai
    RECTAL = "rectal",// Đặt hậu môn
    VAGINAL = "vaginal"
}
/**
 * Frequency Unit
 */
export declare enum FrequencyUnit {
    TIMES_PER_DAY = "times-per-day",// Lần/ngày
    TIMES_PER_WEEK = "times-per-week",// Lần/tuần
    TIMES_PER_MONTH = "times-per-month",// Lần/tháng
    AS_NEEDED = "as-needed",// Khi cần
    ONCE_DAILY = "once-daily",// Một lần/ngày
    TWICE_DAILY = "twice-daily",// Hai lần/ngày
    THREE_TIMES_DAILY = "three-times-daily",// Ba lần/ngày
    FOUR_TIMES_DAILY = "four-times-daily"
}
/**
 * Medication Properties
 */
export interface MedicationProps {
    code: string;
    name: string;
    genericName?: string;
    brandName?: string;
    strength: string;
    dosageForm: DosageForm;
    route: RouteOfAdministration;
    dosage: string;
    frequency: string;
    frequencyUnit: FrequencyUnit;
    duration?: string;
    instructions: string;
    specialInstructions?: string;
    status: MedicationStatus;
    prescribedDate: Date;
    startDate?: Date;
    endDate?: Date;
    prescribedBy: string;
    pharmacistNotes?: string;
    vietnameseDrugCode?: string;
    registrationNumber?: string;
    manufacturer?: string;
    fhirCodeSystem?: string;
    fhirVersion?: string;
    contraindications?: string[];
    sideEffects?: string[];
    interactions?: string[];
    allergies?: string[];
    notes?: string;
    priority?: 'routine' | 'urgent' | 'stat';
}
/**
 * Medication Value Object
 * Represents a medication prescription with full FHIR compliance and Vietnamese standards
 */
export declare class Medication extends ValueObject<MedicationProps> {
    private constructor();
    protected validateFormat(): void;
    /**
     * Create new medication
     */
    static create(code: string, name: string, strength: string, dosageForm: DosageForm, route: RouteOfAdministration, dosage: string, frequency: string, frequencyUnit: FrequencyUnit, instructions: string, prescribedBy: string, options?: {
        genericName?: string;
        brandName?: string;
        duration?: string;
        specialInstructions?: string;
        status?: MedicationStatus;
        prescribedDate?: Date;
        startDate?: Date;
        endDate?: Date;
        pharmacistNotes?: string;
        vietnameseDrugCode?: string;
        registrationNumber?: string;
        manufacturer?: string;
        fhirCodeSystem?: string;
        fhirVersion?: string;
        contraindications?: string[];
        sideEffects?: string[];
        interactions?: string[];
        allergies?: string[];
        notes?: string;
        priority?: 'routine' | 'urgent' | 'stat';
    }): Medication;
    /**
     * Create Vietnamese medication
     */
    static createVietnamese(vietnameseDrugCode: string, name: string, strength: string, dosageForm: DosageForm, route: RouteOfAdministration, dosage: string, frequency: string, frequencyUnit: FrequencyUnit, instructions: string, prescribedBy: string, registrationNumber: string, options?: {
        genericName?: string;
        brandName?: string;
        duration?: string;
        manufacturer?: string;
        specialInstructions?: string;
        startDate?: Date;
        endDate?: Date;
        contraindications?: string[];
        sideEffects?: string[];
        notes?: string;
    }): Medication;
    /**
     * Validate medication properties
     */
    private validate;
    /**
     * Validate Vietnamese drug code format
     */
    private validateVietnameseDrugCode;
    /**
     * Validate registration number format
     */
    private validateRegistrationNumber;
    /**
     * Validate strength format
     */
    private validateStrengthFormat;
    /**
     * Validate dosage format
     */
    private validateDosageFormat;
    get code(): string;
    get name(): string;
    get genericName(): string | undefined;
    get brandName(): string | undefined;
    get strength(): string;
    get dosageForm(): DosageForm;
    get route(): RouteOfAdministration;
    get dosage(): string;
    get frequency(): string;
    get frequencyUnit(): FrequencyUnit;
    get duration(): string | undefined;
    get instructions(): string;
    get status(): MedicationStatus;
    get prescribedDate(): Date;
    get prescribedBy(): string;
    get vietnameseDrugCode(): string | undefined;
    get registrationNumber(): string | undefined;
    get contraindications(): string[] | undefined;
    get sideEffects(): string[] | undefined;
    get interactions(): string[] | undefined;
    isActive(): boolean;
    isCompleted(): boolean;
    isOralMedication(): boolean;
    isInjection(): boolean;
    hasContraindications(): boolean;
    hasSideEffects(): boolean;
    hasInteractions(): boolean;
    isHighPriority(): boolean;
    isExpired(): boolean;
    getDurationInDays(): number | null;
    /**
     * Get Vietnamese summary
     */
    getVietnameseSummary(): string;
    /**
     * Convert to FHIR format
     */
    toFHIR(): any;
    /**
     * Get SNOMED code for route
     */
    private getRouteSnomedCode;
    /**
     * Extract dose value from dosage string
     */
    private extractDoseValue;
    /**
     * Extract dose unit from dosage string
     */
    private extractDoseUnit;
    /**
     * Extract frequency value
     */
    private extractFrequencyValue;
    /**
     * Get timing unit for FHIR
     */
    private getTimingUnit;
    /**
     * Convert to JSON
     */
    toJSON(): any;
}
//# sourceMappingURL=Medication.d.ts.map