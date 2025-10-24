/**
 * HTTP Provider Service - Infrastructure Layer
 * Fetches provider/doctor data from Provider Staff Service via HTTP
 *
 * Features:
 * - Circuit breaker pattern for resilience
 * - Exponential backoff retry logic
 * - Redis cache fallback
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, Microservices, Resilience Patterns
 */
import { IProviderService, ProviderDTO } from '../../application/services/IProviderService';
import { RedisCacheService } from '../cache/RedisCacheService';
export declare class HttpProviderService implements IProviderService {
    private client;
    private cache;
    private serviceName;
    constructor(baseUrl: string, cache?: RedisCacheService);
    /**
     * Setup exponential backoff retry logic
     */
    private setupRetryLogic;
    /**
     * Get provider by ID with circuit breaker and cache fallback
     */
    getProvider(providerId: string): Promise<ProviderDTO | null>;
    /**
     * Get multiple providers by IDs
     */
    getProviders(providerIds: string[]): Promise<ProviderDTO[]>;
    /**
     * Map API response to DTO
     */
    private mapToDTO;
}
//# sourceMappingURL=HttpProviderService.d.ts.map