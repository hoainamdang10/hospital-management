/**
 * Diagnosis Value Object - Clinical EMR Service
 * V2 Clean Architecture + DDD Implementation
 * Represents medical diagnosis with FHIR compliance and Vietnamese medical standards
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, FHIR, Vietnamese Medical Standards
 */
import { ValueObject } from '../../../shared/domain/base/value-object';
/**
 * Diagnosis Severity Levels (Vietnamese Medical Standards)
 */
export declare enum DiagnosisSeverity {
    MILD = "mild",// Nhẹ
    MODERATE = "moderate",// Trung bình
    SEVERE = "severe",// Nặng
    CRITICAL = "critical"
}
/**
 * Diagnosis Status (FHIR Compliant)
 */
export declare enum DiagnosisStatus {
    PROVISIONAL = "provisional",// Chẩn đoán sơ bộ
    DIFFERENTIAL = "differential",// Chẩn đoán phân biệt
    CONFIRMED = "confirmed",// Chẩn đoán xác định
    REFUTED = "refuted",// Chẩn đoán bị bác bỏ
    ENTERED_IN_ERROR = "entered-in-error"
}
/**
 * Diagnosis Category (Vietnamese Medical Classification)
 */
export declare enum DiagnosisCategory {
    PRIMARY = "primary",// Chẩn đoán chính
    SECONDARY = "secondary",// Chẩn đoán phụ
    COMPLICATION = "complication",// Biến chứng
    COMORBIDITY = "comorbidity"
}
/**
 * Diagnosis Properties
 */
export interface DiagnosisProps {
    code: string;
    display: string;
    description?: string;
    category: DiagnosisCategory;
    severity: DiagnosisSeverity;
    status: DiagnosisStatus;
    onsetDate?: Date;
    recordedDate: Date;
    recordedBy: string;
    vietnameseClassification?: string;
    specialtyCode?: string;
    fhirCodeSystem?: string;
    fhirVersion?: string;
    notes?: string;
    confidence?: number;
}
/**
 * Diagnosis Value Object
 * Represents a medical diagnosis with full FHIR compliance and Vietnamese standards
 */
export declare class Diagnosis extends ValueObject<DiagnosisProps> {
    private constructor();
    /**
     * Create new diagnosis
     */
    static create(code: string, display: string, category: DiagnosisCategory, severity: DiagnosisSeverity, status: DiagnosisStatus, recordedBy: string, options?: {
        description?: string;
        onsetDate?: Date;
        recordedDate?: Date;
        vietnameseClassification?: string;
        specialtyCode?: string;
        fhirCodeSystem?: string;
        fhirVersion?: string;
        notes?: string;
        confidence?: number;
    }): Diagnosis;
    /**
     * Create from ICD-10 code
     */
    static fromICD10(icd10Code: string, display: string, category: DiagnosisCategory, severity: DiagnosisSeverity, recordedBy: string, options?: {
        status?: DiagnosisStatus;
        description?: string;
        onsetDate?: Date;
        notes?: string;
        confidence?: number;
    }): Diagnosis;
    /**
     * Create Vietnamese medical diagnosis
     */
    static createVietnamese(vietnameseCode: string, display: string, category: DiagnosisCategory, severity: DiagnosisSeverity, specialtyCode: string, recordedBy: string, options?: {
        status?: DiagnosisStatus;
        description?: string;
        onsetDate?: Date;
        notes?: string;
        confidence?: number;
    }): Diagnosis;
    /**
     * Validate diagnosis properties
     */
    private validate;
    /**
     * Validate Vietnamese medical code format
     */
    private validateVietnameseMedicalCode;
    /**
     * Validate ICD-10 code format
     */
    private validateICD10Code;
    /**
     * Validate specialty code
     */
    private validateSpecialtyCode;
    get code(): string;
    get display(): string;
    get description(): string | undefined;
    get category(): DiagnosisCategory;
    get severity(): DiagnosisSeverity;
    get status(): DiagnosisStatus;
    get onsetDate(): Date | undefined;
    get recordedDate(): Date;
    get recordedBy(): string;
    get vietnameseClassification(): string | undefined;
    get specialtyCode(): string | undefined;
    get confidence(): number | undefined;
    get notes(): string | undefined;
    isPrimary(): boolean;
    isConfirmed(): boolean;
    isCritical(): boolean;
    isHighConfidence(): boolean;
    isRecentlyRecorded(days?: number): boolean;
    hasOnsetDate(): boolean;
    getDurationSinceOnset(): number | null;
    /**
     * Get Vietnamese summary
     */
    getVietnameseSummary(): string;
    /**
     * Convert to FHIR format
     */
    toFHIR(): any;
    /**
     * Get SNOMED code for severity
     */
    private getSeveritySnomedCode;
    /**
     * Convert to JSON
     */
    toJSON(): any;
}
//# sourceMappingURL=Diagnosis.d.ts.map