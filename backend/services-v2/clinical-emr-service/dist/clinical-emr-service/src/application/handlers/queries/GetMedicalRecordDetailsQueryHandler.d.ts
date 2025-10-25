/**
 * GetMedicalRecordDetailsQueryHandler - Application Layer
 * Query handler for retrieving detailed medical record information
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, HIPAA, Vietnamese Healthcare Standards
 */
import { BaseHealthcareUseCase, ValidationResult } from '@shared/application/use-cases/base/use-case.interface';
import { IMedicalRecordRepository } from '../../../domain/repositories/IMedicalRecordRepository';
/**
 * Get Medical Record Details Query
 */
export interface GetMedicalRecordDetailsQuery {
    recordId: string;
    requestedBy: string;
    includeDiagnoses?: boolean;
    includeMedications?: boolean;
    includeVitalSigns?: boolean;
    includeAccessLog?: boolean;
    includeFHIRData?: boolean;
    format?: 'summary' | 'detailed' | 'fhir';
    language?: 'vi' | 'en';
    auditAccess?: boolean;
    includeMetadata?: boolean;
}
/**
 * Medical Record Details Response
 */
export interface MedicalRecordDetailsResponse {
    success: boolean;
    message: string;
    data?: {
        recordId: string;
        patientId: string;
        doctorId: string;
        appointmentId?: string;
        visitDate: string;
        status: string;
        summary: string;
        symptoms?: string;
        examinationNotes?: string;
        notes?: string;
        diagnoses?: Array<{
            code: string;
            display: string;
            category: string;
            severity: string;
            status: string;
            recordedDate: string;
            recordedBy: string;
            vietnameseSummary: string;
            isPrimary: boolean;
            isConfirmed: boolean;
            isCritical: boolean;
            confidence?: number;
            fhirData?: any;
        }>;
        medications?: Array<{
            code: string;
            name: string;
            genericName?: string;
            strength: string;
            dosageForm: string;
            route: string;
            dosage: string;
            frequency: string;
            instructions: string;
            prescribedDate: string;
            prescribedBy: string;
            vietnameseSummary: string;
            isActive: boolean;
            isHighPriority: boolean;
            isExpired: boolean;
            fhirData?: any;
        }>;
        vitalSigns?: {
            temperature?: number;
            bloodPressure?: string;
            heartRate?: number;
            weight?: number;
            height?: number;
            summary: string;
            recordedAt: string;
            isComplete: boolean;
        };
        createdAt: string;
        updatedAt: string;
        createdBy: string;
        updatedBy?: string;
        fhirResourceId?: string;
        fhirCompliant: boolean;
        fhirValidation?: {
            isValid: boolean;
            errors: string[];
        };
        specialtyCode?: string;
        hospitalCode?: string;
        vietnameseMedicalCode?: string;
        lastAccessedAt?: string;
        lastAccessedBy?: string;
        accessLog?: Array<{
            accessedAt: string;
            accessedBy: string;
            accessType: string;
            purpose?: string;
        }>;
        metadata?: {
            diagnosesCount: number;
            medicationsCount: number;
            activeMedicationsCount: number;
            criticalDiagnosesCount: number;
            hasVitalSigns: boolean;
            hasBeenAccessed: boolean;
            accessCount: number;
        };
        fhirData?: any;
    };
    errors?: Array<{
        field: string;
        message: string;
        code: string;
    }>;
}
/**
 * Get Medical Record Details Query Handler
 */
export declare class GetMedicalRecordDetailsQueryHandler extends BaseHealthcareUseCase<GetMedicalRecordDetailsQuery, MedicalRecordDetailsResponse> {
    private readonly medicalRecordRepository;
    constructor(medicalRecordRepository: IMedicalRecordRepository);
    /**
     * Execute the query
     */
    protected executeInternal(query: GetMedicalRecordDetailsQuery): Promise<MedicalRecordDetailsResponse>;
    /**
     * Build response data based on query options
     */
    private buildResponse;
    /**
     * Format summary response
     */
    private formatSummaryResponse;
    /**
     * Validate query
     */
    validate(query: GetMedicalRecordDetailsQuery): Promise<ValidationResult>;
    /**
     * Check authorization
     */
    authorize(query: GetMedicalRecordDetailsQuery, userId: string): Promise<boolean>;
    /**
     * Check if involves PHI
     */
    involvesPHI(query: GetMedicalRecordDetailsQuery): boolean;
    /**
     * Get patient ID
     */
    getPatientId(query: GetMedicalRecordDetailsQuery): string | null;
    /**
     * Get use case description
     */
    getDescription(): string;
    /**
     * Get required permissions
     */
    getRequiredPermissions(): string[];
}
//# sourceMappingURL=GetMedicalRecordDetailsQueryHandler.d.ts.map