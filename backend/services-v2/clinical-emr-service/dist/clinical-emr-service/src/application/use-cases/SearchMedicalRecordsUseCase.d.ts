/**
 * SearchMedicalRecordsUseCase - Application Layer
 * Use case for searching and filtering medical records with advanced criteria
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, HIPAA, Vietnamese Healthcare Standards
 */
import { BaseHealthcareUseCase, ValidationResult } from '@shared/application/use-cases/base/use-case.interface';
import { IMedicalRecordRepository } from '../../domain/repositories/IMedicalRecordRepository';
import { MedicalRecordStatus } from '../../domain/aggregates/clinical.aggregate';
import { DiagnosisCategory, DiagnosisSeverity, DiagnosisStatus } from '../../domain/value-objects/Diagnosis';
import { MedicationStatus } from '../../domain/value-objects/Medication';
/**
 * Search Criteria Interface
 */
export interface SearchCriteria {
    patientId?: string;
    doctorId?: string;
    appointmentId?: string;
    visitDateFrom?: string;
    visitDateTo?: string;
    createdDateFrom?: string;
    createdDateTo?: string;
    dateFrom?: Date;
    dateTo?: Date;
    searchText?: string;
    symptoms?: string;
    diagnosisText?: string;
    medicationText?: string;
    notes?: string;
    status?: MedicalRecordStatus[];
    diagnosisCode?: string;
    diagnosisCategory?: DiagnosisCategory[];
    diagnosisSeverity?: DiagnosisSeverity[];
    diagnosisStatus?: DiagnosisStatus[];
    medicationCode?: string;
    medicationStatus?: MedicationStatus[];
    specialtyCode?: string;
    hospitalCode?: string;
    fhirCompliant?: boolean;
    hasVitalSigns?: boolean;
    hasPrimaryDiagnosis?: boolean;
    hasActiveMedications?: boolean;
    hasCriticalDiagnoses?: boolean;
    fullTextSearch?: string;
}
/**
 * Sort Options
 */
export interface SortOptions {
    field: 'visitDate' | 'createdAt' | 'updatedAt' | 'patientId' | 'doctorId';
    direction: 'asc' | 'desc';
}
/**
 * Pagination Options
 */
export interface PaginationOptions {
    page: number;
    limit: number;
    offset?: number;
}
/**
 * Search Medical Records Request
 */
export interface SearchMedicalRecordsRequest {
    criteria: SearchCriteria;
    sort?: SortOptions;
    pagination?: PaginationOptions;
    searchedBy: string;
    includeDetails?: boolean;
    includeDiagnoses?: boolean;
    includeMedications?: boolean;
    includeVitalSigns?: boolean;
    includeAccessLog?: boolean;
    respectAccessControl?: boolean;
    auditSearch?: boolean;
}
/**
 * Search Results
 */
export interface SearchResults {
    records: MedicalRecordSummary[];
    totalCount: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}
/**
 * Medical Record Summary for Search Results
 */
export interface MedicalRecordSummary {
    recordId: string;
    patientId: string;
    doctorId: string;
    appointmentId?: string;
    visitDate: string;
    status: MedicalRecordStatus;
    summary: string;
    symptoms?: string;
    diagnosesCount: number;
    primaryDiagnosis?: {
        code: string;
        display: string;
        severity: DiagnosisSeverity;
    };
    hasCriticalDiagnoses: boolean;
    medicationsCount: number;
    activeMedicationsCount: number;
    hasHighPriorityMedications: boolean;
    hasVitalSigns: boolean;
    vitalSignsSummary?: string;
    fhirCompliant: boolean;
    specialtyCode?: string;
    createdAt: string;
    updatedAt: string;
    lastAccessedAt?: string;
    details?: {
        examinationNotes?: string;
        notes?: string;
        diagnoses?: any[];
        medications?: any[];
        vitalSigns?: any;
        accessLog?: any[];
    };
}
/**
 * Search Medical Records Response
 */
export interface SearchMedicalRecordsResponse {
    success: boolean;
    message: string;
    data?: {
        results: SearchResults;
        searchCriteria: SearchCriteria;
        executionTime: number;
        searchId: string;
    };
    errors?: Array<{
        field: string;
        message: string;
        code: string;
    }>;
}
/**
 * Search Medical Records Use Case
 */
export declare class SearchMedicalRecordsUseCase extends BaseHealthcareUseCase<SearchMedicalRecordsRequest, SearchMedicalRecordsResponse> {
    private readonly medicalRecordRepository;
    constructor(medicalRecordRepository: IMedicalRecordRepository);
    /**
     * Public execute method - required by BaseHealthcareUseCase
     */
    execute(request: SearchMedicalRecordsRequest): Promise<SearchMedicalRecordsResponse>;
    /**
     * Execute the use case
     */
    protected executeInternal(request: SearchMedicalRecordsRequest): Promise<SearchMedicalRecordsResponse>;
    /**
     * Execute search with criteria
     */
    private executeSearch;
    /**
     * Filter records by access control
     */
    private filterByAccessControl;
    /**
     * Convert medical record to summary format
     */
    private convertToSummary;
    /**
     * Generate unique search ID
     */
    private generateSearchId;
    /**
     * Audit search operation
     */
    private auditSearch;
    /**
     * Validate request
     */
    validate(request: SearchMedicalRecordsRequest): Promise<ValidationResult>;
    /**
     * Check authorization
     */
    authorize(request: SearchMedicalRecordsRequest, userId: string): Promise<boolean>;
    /**
     * Check if involves PHI
     */
    involvesPHI(request: SearchMedicalRecordsRequest): boolean;
    /**
     * Get patient ID
     */
    getPatientId(request: SearchMedicalRecordsRequest): string | null;
    /**
     * Get use case description
     */
    getDescription(): string;
    /**
     * Get required permissions
     */
    getRequiredPermissions(): string[];
}
//# sourceMappingURL=SearchMedicalRecordsUseCase.d.ts.map