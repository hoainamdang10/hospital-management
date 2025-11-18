/**
 * Provider Read Model Repository
 * Maintains denormalized provider/staff data for appointments service
 *
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance CQRS, Event-Driven Architecture, Eventual Consistency
 */
export interface ProviderReadModel {
    providerId: string;
    tenantId: string;
    fullName: string;
    specialization?: string;
    department?: string;
    licenseNumber?: string;
    phone?: string;
    email?: string;
    isActive: boolean;
    syncedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}
/**
 * Provider Read Model Repository
 * Query-side repository for provider/staff data (CQRS pattern)
 */
export declare class ProviderReadModelRepository {
    private supabase;
    private readonly table;
    private readonly schema;
    private readonly fallbackSchema;
    private readonly fallbackTable;
    constructor(supabaseUrl: string, supabaseKey: string);
    /**
     * Upsert provider read model (idempotent)
     */
    upsert(provider: ProviderReadModel): Promise<void>;
    /**
     * Find provider by ID
     * Falls back to provider_schema.staff_profiles if read model is empty
     */
    findById(providerId: string): Promise<ProviderReadModel | null>;
    /**
     * Fallback: Query provider_schema.staff_profiles directly
     */
    private findByIdFallback;
    /**
     * Find multiple providers by IDs
     */
    findByIds(providerIds: string[]): Promise<ProviderReadModel[]>;
    /**
     * Find providers by tenant
     */
    findByTenant(tenantId: string, limit?: number): Promise<ProviderReadModel[]>;
    /**
     * Find active providers by specialization
     */
    findBySpecialization(specialization: string, tenantId: string, limit?: number): Promise<ProviderReadModel[]>;
    /**
     * Find active providers by department
     */
    findByDepartment(department: string, tenantId: string, limit?: number): Promise<ProviderReadModel[]>;
    /**
     * Search providers by name/email/license
     */
    search(query: string, tenantId: string, limit?: number): Promise<ProviderReadModel[]>;
    /**
     * Find all active providers
     */
    findActive(tenantId: string, limit?: number): Promise<ProviderReadModel[]>;
    /**
     * Delete provider read model
     */
    delete(providerId: string): Promise<void>;
    /**
     * Get sync statistics
     */
    getSyncStats(): Promise<{
        totalProviders: number;
        activeProviders: number;
        lastSyncedAt: Date | null;
        oldestSyncedAt: Date | null;
        syncLagSeconds: number | null;
    }>;
    /**
     * Check if provider exists
     */
    exists(providerId: string): Promise<boolean>;
    /**
     * Count providers by tenant
     */
    countByTenant(tenantId: string): Promise<number>;
    /**
     * Map database row to domain model
     */
    private mapToModel;
}
//# sourceMappingURL=ProviderReadModelRepository.d.ts.map