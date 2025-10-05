/**
 * SupabasePatientRepository - Infrastructure Layer
 * Implements IPatientRepository with Supabase PostgreSQL
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, HIPAA
 */
import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { Patient } from '../../domain/aggregates/Patient';
import { PatientId } from '../../domain/value-objects/PatientId';
import { ILogger } from '../../shared/application/services/logger.interface';
/**
 * Supabase Patient Repository Implementation
 */
export declare class SupabasePatientRepository implements IPatientRepository {
    private logger;
    private supabaseClient;
    private circuitBreaker;
    private matchingService;
    constructor(supabaseUrl: string, supabaseKey: string, logger: ILogger);
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
     * Find patient by BHYT number
     */
    findByBHYTNumber(bhytNumber: string): Promise<Patient | null>;
    /**
     * Save patient (create or update)
     */
    save(patient: Patient): Promise<void>;
    /**
     * Delete patient (soft delete)
     */
    delete(patientId: PatientId): Promise<void>;
    /**
     * Find patients with filters
     */
    findWithFilters(filters: {
        isActive?: boolean;
        registrationDateFrom?: string;
        registrationDateTo?: string;
        city?: string;
        province?: string;
    }, pagination?: {
        page: number;
        limit: number;
        sorting?: {
            field: string;
            direction: 'asc' | 'desc';
        };
    }): Promise<{
        patients: Patient[];
        total: number;
    }>;
    /**
     * Search patients by term
     */
    searchPatients(searchTerm: string, filters?: {
        isActive?: boolean;
    }, pagination?: {
        page: number;
        limit: number;
    }): Promise<{
        patients: Patient[];
        total: number;
    }>;
    /**
     * Match patients (PMI $match operation)
     * Delegates to PatientMatchingService
     */
    matchPatients(criteria: {
        fullName?: string;
        dateOfBirth?: Date;
        nationalId?: string;
        primaryPhone?: string;
        email?: string;
    }, onlyCertainMatches?: boolean, limit?: number): Promise<Array<{
        patient: Patient;
        matchGrade: 'certain' | 'probable' | 'possible' | 'certainly-not';
        score: number;
    }>>;
    /**
     * Get repository health status
     */
    getHealthStatus(): Promise<any>;
    /**
     * Fetch insurance info for patient
     */
    private fetchInsurance;
    /**
     * Fetch emergency contacts for patient
     */
    private fetchEmergencyContacts;
    /**
     * Fetch consents for patient
     */
    private fetchConsents;
    /**
     * Fetch links for patient
     */
    private fetchLinks;
    /**
     * Save insurance info
     */
    private saveInsurance;
    /**
     * Save emergency contacts
     */
    private saveEmergencyContacts;
    /**
     * Save consents
     */
    private saveConsents;
    /**
     * Save links
     */
    private saveLinks;
}
//# sourceMappingURL=SupabasePatientRepository.d.ts.map