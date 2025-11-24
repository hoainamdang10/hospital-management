/**
 * Local Provider Read Model Service
 * Replaces HttpProviderService with local read model queries (No HTTP)
 *
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance CQRS, Zero HTTP Dependencies, Pure Outbox Pattern
 */
import { IProviderService, ProviderDTO } from "../../application/services/IProviderService";
import { ProviderReadModelRepository } from "../repositories/ProviderReadModelRepository";
/**
 * Local Provider Service - Pure Outbox Pattern
 *
 * Benefits:
 * - No HTTP calls (no network errors, timeouts, circuit breakers)
 * - Fast local queries (<10ms vs 100-500ms HTTP)
 * - Always available (no dependency on Provider Service uptime)
 * - Eventual consistency via event sourcing
 *
 * Trade-offs:
 * - Data may be slightly stale (target sync lag: <5s)
 * - Requires event consumers to keep read model updated
 */
export declare class LocalProviderReadModelService implements IProviderService {
    private readonly readModelRepo;
    constructor(readModelRepo: ProviderReadModelRepository);
    /**
     * Get provider by ID (local query)
     */
    getProvider(providerId: string): Promise<ProviderDTO | null>;
    /**
     * Get multiple providers by IDs (batch query)
     */
    getProviders(providerIds: string[]): Promise<ProviderDTO[]>;
    /**
     * Find active providers by specialization
     */
    findBySpecialization(specialization: string, tenantId?: string): Promise<ProviderDTO[]>;
    /**
     * Find active providers by department
     */
    findByDepartment(department: string, tenantId?: string): Promise<ProviderDTO[]>;
    /**
     * Check if provider exists in read model
     */
    exists(providerId: string): Promise<boolean>;
    /**
     * Get sync statistics (monitoring)
     */
    getSyncStats(): Promise<{
        totalProviders: number;
        activeProviders: number;
        lastSyncedAt: Date | null;
        syncLagSeconds: number | null;
    }>;
}
//# sourceMappingURL=LocalProviderReadModelService.d.ts.map