/**
 * MedicalRecord Aggregate - Clinical EMR Service
 * Core aggregate for managing medical records with simplified scope
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */
import { HealthcareAggregateRoot } from "../../../shared/domain/base/aggregate-root";
import { DomainEvent } from "../../../shared/domain/base/domain-event";
import { BasicVitalSigns } from "../value-objects/BasicVitalSigns";
import { Diagnosis } from "../value-objects/Diagnosis";
import { Medication } from "../value-objects/Medication";
import { RecordId } from "../value-objects/RecordId";
export interface MedicalRecordProps {
    recordId: RecordId;
    patientId: string;
    doctorId: string;
    appointmentId?: string;
    visitDate: Date;
    symptoms?: string;
    examinationNotes?: string;
    diagnoses: Diagnosis[];
    medications: Medication[];
    diagnosis?: string;
    treatment?: string;
    medicationsLegacy?: string;
    notes?: string;
    vitalSigns?: BasicVitalSigns;
    fhirResourceId?: string;
    fhirVersion?: string;
    fhirProfile?: string;
    vietnameseMedicalCode?: string;
    specialtyCode?: string;
    hospitalCode?: string;
    status: MedicalRecordStatus;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    updatedBy?: string;
    accessLog?: MedicalRecordAccess[];
    lastAccessedAt?: Date;
    lastAccessedBy?: string;
}
export declare enum MedicalRecordStatus {
    ACTIVE = "active",
    ARCHIVED = "archived",
    DELETED = "deleted",
    DRAFT = "draft",// Bản nháp
    PENDING_REVIEW = "pending-review",// Chờ duyệt
    REVIEWED = "reviewed",// Đã duyệt
    AMENDED = "amended"
}
/**
 * Medical Record Access Log for HIPAA Compliance
 */
export interface MedicalRecordAccess {
    accessedAt: Date;
    accessedBy: string;
    accessType: "read" | "write" | "print" | "export";
    ipAddress?: string;
    userAgent?: string;
    purpose?: string;
}
export declare class MedicalRecordAggregate extends HealthcareAggregateRoot<MedicalRecordProps> {
    private constructor();
    /**
     * Create new medical record with enhanced features
     */
    static create(recordId: RecordId, patientId: string, doctorId: string, visitDate: Date, createdBy: string, options?: {
        appointmentId?: string;
        symptoms?: string;
        examinationNotes?: string;
        diagnoses?: Diagnosis[];
        medications?: Medication[];
        notes?: string;
        vitalSigns?: BasicVitalSigns;
        specialtyCode?: string;
        hospitalCode?: string;
        fhirProfile?: string;
        status?: MedicalRecordStatus;
        diagnosis?: string;
        treatment?: string;
        medicationsLegacy?: string;
    }): MedicalRecordAggregate;
    /**
     * Reconstitute from database
     */
    static reconstitute(props: MedicalRecordProps, id?: string): MedicalRecordAggregate;
    protected validateBusinessInvariants(): void;
    protected applyEvent(event: DomainEvent): void;
    getPatientId(): string | null;
    /**
     * Update medical record information
     */
    updateMedicalInformation(updates: {
        symptoms?: string;
        examinationNotes?: string;
        diagnosis?: string;
        treatment?: string;
        medications?: string;
        notes?: string;
    }, updatedBy: string, updateReason?: string): void;
    /**
     * Update vital signs
     */
    updateVitalSigns(vitalSigns: BasicVitalSigns, updatedBy: string): void;
    /**
     * Add diagnosis to medical record
     */
    addDiagnosis(diagnosis: Diagnosis, updatedBy: string): void;
    /**
     * Remove diagnosis from medical record
     */
    removeDiagnosis(diagnosisCode: string, updatedBy: string, reason?: string): void;
    /**
     * Add medication to medical record
     */
    addMedication(medication: Medication, updatedBy: string): void;
    /**
     * Remove medication from medical record
     */
    removeMedication(medicationCode: string, updatedBy: string, reason?: string): void;
    /**
     * Archive medical record
     */
    archive(archivedBy: string, reason?: string): void;
    /**
     * Restore archived medical record
     */
    restore(restoredBy: string, reason?: string): void;
    get recordId(): RecordId;
    get patientId(): string;
    get doctorId(): string;
    get appointmentId(): string | undefined;
    get visitDate(): Date;
    get symptoms(): string | undefined;
    get examinationNotes(): string | undefined;
    get diagnosis(): string | undefined;
    get treatment(): string | undefined;
    get medications(): string | undefined;
    get notes(): string | undefined;
    get vitalSigns(): BasicVitalSigns | undefined;
    get status(): MedicalRecordStatus;
    get createdAt(): Date;
    get updatedAt(): Date;
    get createdBy(): string;
    get updatedBy(): string | undefined;
    isActive(): boolean;
    isArchived(): boolean;
    isDeleted(): boolean;
    hasVitalSigns(): boolean;
    hasCompleteVitalSigns(): boolean;
    hasDiagnosis(): boolean;
    hasTreatment(): boolean;
    hasMedications(): boolean;
    isFromCurrentMonth(): boolean;
    isFromCurrentYear(): boolean;
    /**
     * Log access for HIPAA compliance
     */
    private logAccess;
    /**
     * Record read access
     */
    recordReadAccess(accessedBy: string, purpose?: string, ipAddress?: string, userAgent?: string): void;
    /**
     * Get FHIR-compliant medical record
     */
    toFHIR(): any;
    /**
     * Get FHIR status mapping
     */
    private getFHIRStatus;
    /**
     * Get FHIR sections
     */
    private getFHIRSections;
    /**
     * Validate FHIR compliance
     */
    validateFHIRCompliance(): {
        isValid: boolean;
        errors: string[];
    };
    /**
     * Get medical record summary in Vietnamese
     */
    getSummary(): string;
    get diagnoses(): Diagnosis[];
    get medications(): Medication[];
    get fhirResourceId(): string | undefined;
    get specialtyCode(): string | undefined;
    get accessLog(): MedicalRecordAccess[] | undefined;
    hasPrimaryDiagnosis(): boolean;
    hasActiveMedications(): boolean;
    getCriticalDiagnoses(): Diagnosis[];
    getHighPriorityMedications(): Medication[];
    isFHIRCompliant(): boolean;
    hasBeenAccessed(): boolean;
    getLastAccessInfo(): {
        date: Date;
        by: string;
    } | null;
    /**
     * Convert to JSON with enhanced properties
     */
    toJSON(): any;
}
//# sourceMappingURL=clinical.aggregate.d.ts.map