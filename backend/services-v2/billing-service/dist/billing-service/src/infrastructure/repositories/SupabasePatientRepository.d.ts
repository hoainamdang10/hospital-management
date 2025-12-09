/**
 * SupabasePatientRepository - Patient repository implementation for Billing Service
 * Provides patient data access for billing operations
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD
 */
import { Patient, IPatientRepository } from "../../domain/entities/Patient";
import { logger } from "../logging/logger";
import { OptimizedSupabaseClient } from "../../../../shared/infrastructure/database/optimized-supabase-client";
export interface PatientData {
    id: string;
    patient_id: string;
    user_id: string;
    full_name?: string;
    date_of_birth?: string;
    gender?: "male" | "female" | "other";
    national_id?: string;
    phone?: string;
    email?: string;
    address?: string;
    personal_info?: any;
    contact_info?: any;
    insurance_info?: any;
    created_at: string;
    updated_at: string;
    is_active?: boolean;
    status?: string;
}
/**
 * SupabasePatientRepository - Implementation for Supabase database
 */
export declare class SupabasePatientRepository implements IPatientRepository {
    private supabase;
    private loggerInstance;
    private readonly schemaName;
    private readonly tableName;
    constructor(supabase: OptimizedSupabaseClient, loggerInstance: typeof logger);
    /**
     * Find patient by ID
     */
    findById(id: string): Promise<Patient | null>;
    /**
     * Find patient by user ID
     */
    findByUserId(userId: string): Promise<Patient | null>;
    /**
     * Find patient by national ID
     */
    findByNationalId(nationalId: string): Promise<Patient | null>;
    /**
     * Check if patient exists
     */
    exists(id: string): Promise<boolean>;
    /**
     * Get patient insurance information
     */
    getInsuranceInfo(patientId: string): Promise<any | null>;
    /**
     * Update patient insurance information
     */
    updateInsuranceInfo(patientId: string, insuranceInfo: any): Promise<void>;
    /**
     * Map database record to Patient entity
     */
    private mapToPatient;
    /**
     * Fetch primary & active insurance info for patient
     */
    private fetchInsuranceInfo;
    /**
     * Merge insurance info from patients table and insurance_info table
     * - Preserve rich coverage object from patients.insurance_info if present
     * - Normalize snake_case fields from insurance_info table to camelCase
     */
    private mergeInsuranceInfo;
    /**
     * Determine whether provided identifier is UUID or patient_code (PAT-YYYYMM-XXX)
     */
    private resolvePatientIdentifier;
    private isUUID;
    private fromTable;
}
export declare function createSupabasePatientRepository(supabase: OptimizedSupabaseClient, loggerInstance: typeof logger): SupabasePatientRepository;
//# sourceMappingURL=SupabasePatientRepository.d.ts.map