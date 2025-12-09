/**
 * Patient Read Model Repository
 * Maintains denormalized patient data for appointments service
 *
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance CQRS, Event-Driven Architecture, Eventual Consistency
 */
export interface PatientReadModel {
    patientId: string;
    tenantId: string;
    fullName: string;
    phone?: string;
    email?: string;
    dateOfBirth?: Date;
    gender?: string;
    nationalId?: string;
    insuranceNumber?: string;
    insuranceType?: string;
    address?: any;
    syncedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}
/**
 * Patient Read Model Repository
 * Query-side repository for patient data (CQRS pattern)
 */
export declare class PatientReadModelRepository {
    private supabase;
    private schemaClient;
    private readonly table;
    private readonly schema;
    private readonly fallbackSchema;
    private readonly fallbackTable;
    constructor(supabaseUrl: string, supabaseKey: string);
    /**
     * Upsert patient read model (idempotent)
     */
    upsert(patient: PatientReadModel): Promise<void>;
    /**
     * Find patient by ID
     * Falls back to patient_schema.patients if read model is empty
     */
    findById(patientId: string): Promise<PatientReadModel | null>;
    /**
     * Fallback: Query patient_schema.patients directly
     */
    private findByIdFallback;
    /**
     * Find multiple patients by IDs
     */
    findByIds(patientIds: string[]): Promise<PatientReadModel[]>;
    /**
     * Find patients by tenant
     */
    findByTenant(tenantId: string, limit?: number): Promise<PatientReadModel[]>;
    /**
     * Search patients by name/phone/email
     */
    search(query: string, tenantId: string, limit?: number): Promise<PatientReadModel[]>;
    /**
     * Delete patient read model
     */
    delete(patientId: string): Promise<void>;
    /**
     * Get sync statistics
     */
    getSyncStats(): Promise<{
        totalPatients: number;
        lastSyncedAt: Date | null;
        oldestSyncedAt: Date | null;
        syncLagSeconds: number | null;
    }>;
    /**
     * Check if patient exists
     */
    exists(patientId: string): Promise<boolean>;
    private shouldHydrateFromFallback;
    private mergePatientProfiles;
    /**
     * Count patients by tenant
     */
    countByTenant(tenantId: string): Promise<number>;
    /**
     * Map database row to domain model
     */
    private mapToModel;
}
//# sourceMappingURL=PatientReadModelRepository.d.ts.map