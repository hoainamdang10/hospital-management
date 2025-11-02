"use strict";
/**
 * Local Provider Read Model Service
 * Replaces HttpProviderService with local read model queries (No HTTP)
 *
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance CQRS, Zero HTTP Dependencies, Pure Outbox Pattern
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalProviderReadModelService = void 0;
const Logger_1 = require("../logging/Logger");
const logger = (0, Logger_1.createLogger)('LocalProviderReadModelService');
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
class LocalProviderReadModelService {
    constructor(readModelRepo) {
        this.readModelRepo = readModelRepo;
        logger.info('Initialized (No HTTP dependencies)');
    }
    /**
     * Get provider by ID (local query)
     */
    async getProvider(providerId) {
        try {
            const provider = await this.readModelRepo.findById(providerId);
            if (!provider) {
                logger.debug('Provider not found in read model', { providerId });
                return null;
            }
            return {
                providerId: provider.providerId,
                fullName: provider.fullName,
                specialization: provider.specialization,
                department: provider.department,
                licenseNumber: provider.licenseNumber,
                phone: provider.phone,
                email: provider.email
            };
        }
        catch (error) {
            console.error(`[LocalProviderReadModelService] Error fetching provider ${providerId}:`, error);
            throw new Error(`Failed to fetch provider from read model: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Get multiple providers by IDs (batch query)
     */
    async getProviders(providerIds) {
        try {
            if (providerIds.length === 0)
                return [];
            const providers = await this.readModelRepo.findByIds(providerIds);
            return providers.map(provider => ({
                providerId: provider.providerId,
                fullName: provider.fullName,
                specialization: provider.specialization,
                department: provider.department,
                licenseNumber: provider.licenseNumber,
                phone: provider.phone,
                email: provider.email
            }));
        }
        catch (error) {
            console.error('[LocalProviderReadModelService] Error fetching providers:', error);
            throw new Error(`Failed to fetch providers from read model: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Find active providers by specialization
     */
    async findBySpecialization(specialization, tenantId = 'hospital-1') {
        try {
            const providers = await this.readModelRepo.findBySpecialization(specialization, tenantId);
            return providers.map(provider => ({
                providerId: provider.providerId,
                fullName: provider.fullName,
                specialization: provider.specialization,
                department: provider.department,
                licenseNumber: provider.licenseNumber,
                phone: provider.phone,
                email: provider.email
            }));
        }
        catch (error) {
            console.error(`[LocalProviderReadModelService] Error finding providers by specialization ${specialization}:`, error);
            throw new Error(`Failed to find providers by specialization: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Find active providers by department
     */
    async findByDepartment(department, tenantId = 'hospital-1') {
        try {
            const providers = await this.readModelRepo.findByDepartment(department, tenantId);
            return providers.map(provider => ({
                providerId: provider.providerId,
                fullName: provider.fullName,
                specialization: provider.specialization,
                department: provider.department,
                licenseNumber: provider.licenseNumber,
                phone: provider.phone,
                email: provider.email
            }));
        }
        catch (error) {
            console.error(`[LocalProviderReadModelService] Error finding providers by department ${department}:`, error);
            throw new Error(`Failed to find providers by department: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Check if provider exists in read model
     */
    async exists(providerId) {
        try {
            return await this.readModelRepo.exists(providerId);
        }
        catch (error) {
            console.error(`[LocalProviderReadModelService] Error checking provider existence ${providerId}:`, error);
            return false;
        }
    }
    /**
     * Get sync statistics (monitoring)
     */
    async getSyncStats() {
        try {
            return await this.readModelRepo.getSyncStats();
        }
        catch (error) {
            console.error('[LocalProviderReadModelService] Error getting sync stats:', error);
            return {
                totalProviders: 0,
                activeProviders: 0,
                lastSyncedAt: null,
                syncLagSeconds: null
            };
        }
    }
}
exports.LocalProviderReadModelService = LocalProviderReadModelService;
//# sourceMappingURL=LocalProviderReadModelService.js.map