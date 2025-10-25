/**
 * SupabaseMedicalRecordRepository - Infrastructure Layer
 * V2 Clean Architecture + DDD Implementation
 * Implements medical record persistence with Supabase and Vietnamese healthcare optimization
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, HIPAA, Vietnamese Healthcare Standards
 */
import { OptimizedSupabaseClient } from "@shared/infrastructure/database/optimized-supabase-client";
import { MedicalRecordAggregate, MedicalRecordStatus } from "../../domain/aggregates/clinical.aggregate";
import { DoctorMedicalRecordStatistics, IMedicalRecordRepository, MedicalRecordSearchCriteria, MedicalRecordSearchResult, PatientMedicalRecordStatistics } from "../../domain/repositories/IMedicalRecordRepository";
import { RecordId } from "../../domain/value-objects/RecordId";
import { ILogger } from "@shared/infrastructure/logging/logger.interface";
import { IAuditService } from "@shared/application/services/audit.service.interface";
export interface SupabaseMedicalRecordRepositoryConfig {
    supabase: OptimizedSupabaseClient;
    logger: ILogger;
    auditService: IAuditService;
    schema: string;
    tableName: string;
}
/**
 * Supabase Medical Record Repository
 * Implements medical record persistence with Vietnamese healthcare compliance
 */
export declare class SupabaseMedicalRecordRepository implements IMedicalRecordRepository {
    private readonly supabaseClient;
    private readonly logger;
    private readonly auditService;
    private readonly schema;
    private readonly tableName;
    constructor(config: SupabaseMedicalRecordRepositoryConfig);
    /**
     * Save medical record aggregate
     */
    save(medicalRecord: MedicalRecordAggregate): Promise<void>;
    /**
     * Find medical record by ID
     */
    findById(recordId: RecordId): Promise<MedicalRecordAggregate | null>;
    /**
     * Find medical record by string ID
     */
    findByStringId(recordId: string): Promise<MedicalRecordAggregate | null>;
    /**
     * Find all medical records for a patient
     */
    findByPatientId(patientId: string, options?: {
        status?: MedicalRecordStatus;
        limit?: number;
        offset?: number;
        sortBy?: "visitDate" | "createdAt" | "updatedAt";
        sortOrder?: "asc" | "desc";
    }): Promise<MedicalRecordAggregate[]>;
    /**
     * Find all medical records by doctor
     */
    findByDoctorId(doctorId: string, options?: {
        status?: MedicalRecordStatus;
        limit?: number;
        offset?: number;
        sortBy?: "visitDate" | "createdAt" | "updatedAt";
        sortOrder?: "asc" | "desc";
    }): Promise<MedicalRecordAggregate[]>;
    /**
     * Find medical record by appointment ID
     */
    findByAppointmentId(appointmentId: string): Promise<MedicalRecordAggregate | null>;
    /**
     * Search medical records with filters
     */
    search(criteria: MedicalRecordSearchCriteria): Promise<MedicalRecordSearchResult>;
    /**
     * Count medical records by patient
     */
    countByPatientId(patientId: string, status?: MedicalRecordStatus): Promise<number>;
    /**
     * Count medical records by doctor
     */
    countByDoctorId(doctorId: string, status?: MedicalRecordStatus): Promise<number>;
    /**
     * Update medical record
     */
    update(medicalRecord: MedicalRecordAggregate): Promise<void>;
    /**
     * Delete medical record (soft delete)
     */
    delete(recordId: RecordId, deletedBy: string): Promise<void>;
    /**
     * Check if medical record exists
     */
    exists(recordId: RecordId): Promise<boolean>;
    /**
     * Find medical records by date range
     */
    findByDateRange(startDate: Date, endDate: Date, options?: {
        patientId?: string;
        doctorId?: string;
        status?: MedicalRecordStatus;
        limit?: number;
        offset?: number;
    }): Promise<MedicalRecordAggregate[]>;
    /**
     * Get patient medical record statistics
     */
    getPatientStatistics(patientId: string): Promise<PatientMedicalRecordStatistics>;
    /**
     * Get doctor medical record statistics
     */
    getDoctorStatistics(doctorId: string): Promise<DoctorMedicalRecordStatistics>;
    /**
     * Advanced search with full-text search and filtering
     */
    advancedSearch(criteria: {
        searchText?: string;
        patientId?: string;
        doctorId?: string;
        dateFrom?: Date;
        dateTo?: Date;
        diagnosisCode?: string;
        medicationCode?: string;
        hasCriticalDiagnoses?: boolean;
        hasActiveMedications?: boolean;
        hasVitalSigns?: boolean;
        fhirCompliant?: boolean;
        includeArchived?: boolean;
        includeDeleted?: boolean;
    }, options?: {
        page?: number;
        pageSize?: number;
        sortBy?: string;
        sortOrder?: "asc" | "desc";
        useFullTextSearch?: boolean;
        minRelevanceScore?: number;
    }): Promise<{
        records: MedicalRecordAggregate[];
        totalCount: number;
        page: number;
        pageSize: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
        searchMetrics?: {
            searchTime: number;
            indexUsed: boolean;
            relevanceScores?: number[];
        };
    }>;
    /**
     * Get medical records with FHIR export data
     */
    findWithFHIRData(recordIds: string[]): Promise<Array<{
        record: MedicalRecordAggregate;
        fhirData: any;
        fhirValid: boolean;
    }>>;
    /**
     * Bulk update medical records
     */
    bulkUpdate(updates: Array<{
        recordId: string;
        updates: Partial<{
            status: MedicalRecordStatus;
            notes: string;
            updatedBy: string;
        }>;
    }>): Promise<void>;
    /**
     * Get performance analytics
     */
    getPerformanceAnalytics(dateFrom: Date, dateTo: Date): Promise<{
        totalRecords: number;
        recordsPerDay: Array<{
            date: string;
            count: number;
        }>;
        topDiagnoses: Array<{
            code: string;
            display: string;
            count: number;
        }>;
        topMedications: Array<{
            code: string;
            name: string;
            count: number;
        }>;
        doctorStatistics: Array<{
            doctorId: string;
            recordCount: number;
            avgRecordsPerDay: number;
        }>;
        patientStatistics: Array<{
            patientId: string;
            recordCount: number;
            lastVisit: Date;
        }>;
        fhirComplianceRate: number;
        avgRecordCompleteness: number;
    }>;
    /**
     * Map aggregate to database format with enhanced data
     */
    private mapAggregateToDatabase;
    /**
     * Generate search vector for full-text search
     */
    private generateSearchVector;
    /**
     * Map database record to aggregate
     */
    private mapDatabaseToAggregate;
    /**
     * Map sort field to database column
     */
    private mapSortField;
    /**
     * Get next sequence number for record ID generation
     */
    getNextSequenceNumber(yearMonth: string): Promise<number>;
    /**
     * Update existing medical record
     */
    private updateRecord;
    /**
     * Convert domain aggregate to persistence format
     */
    private toPersistence;
    /**
     * Find recent medical records
     */
    findRecent(limit?: number, status?: MedicalRecordStatus): Promise<MedicalRecordAggregate[]>;
    /**
     * Bulk save medical records
     */
    bulkSave(medicalRecords: MedicalRecordAggregate[]): Promise<void>;
}
//# sourceMappingURL=SupabaseMedicalRecordRepository.d.ts.map