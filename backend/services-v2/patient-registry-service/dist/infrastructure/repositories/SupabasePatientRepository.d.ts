/**
 * SupabasePatientRepository - Infrastructure Repository Implementation
 * V2 Clean Architecture + DDD Implementation
 * Supabase implementation of patient repository with Vietnamese healthcare context
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Repository Pattern, Vietnamese Healthcare Standards, HIPAA
 */
import { OptimizedSupabaseClient } from '../../../../shared/infrastructure/database/optimized-supabase-client';
import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { Patient } from '../../domain/aggregates/Patient';
import { PatientId } from '../../domain/value-objects/PatientId';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
import { IAuditService } from '../../../../shared/application/services/audit.service.interface';
export interface SupabasePatientRepositoryConfig {
    supabase: OptimizedSupabaseClient;
    logger: ILogger;
    auditService: IAuditService;
    schema: string;
    tableName: string;
}
/**
 * Supabase Patient Repository
 * Implements patient repository with Vietnamese healthcare compliance
 */
export declare class SupabasePatientRepository implements IPatientRepository {
    private readonly supabaseClient;
    private readonly logger;
    private readonly auditService;
    private readonly schema;
    private readonly tableName;
    constructor(config: SupabasePatientRepositoryConfig);
    /**
     * Find patient by ID
     */
    findById(patientId: PatientId): Promise<Patient | null>;
    /**
     * Find patient by user ID
     */
    findByUserId(userId: string): Promise<Patient | null>;
    /**
     * Find patient by national ID
     */
    findByNationalId(nationalId: string): Promise<Patient | null>;
    /**
     * Save patient
     */
    save(patient: Patient): Promise<void>;
    /**
     * Delete patient (soft delete)
     */
    delete(patientId: PatientId): Promise<void>;
    /**
     * Find patients with filters
     */
    findWithFilters(filters: any, pagination?: any): Promise<{
        patients: Patient[];
        total: number;
    }>;
    /**
     * Search patients by term
     */
    searchPatients(searchTerm: string, filters?: any, pagination?: any): Promise<{
        patients: Patient[];
        total: number;
    }>;
    /**
     * Map database record to Patient aggregate
     */
    private mapToPatient;
    /**
     * Get repository health status
     */
    getHealthStatus(): Promise<any>;
}
//# sourceMappingURL=SupabasePatientRepository.d.ts.map