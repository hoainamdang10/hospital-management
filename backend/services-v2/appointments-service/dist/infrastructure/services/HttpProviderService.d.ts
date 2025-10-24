/**
 * HTTP Provider Service - Infrastructure Layer
 * Fetches provider/doctor data from Provider Staff Service via HTTP
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Microservices
 */
import { IProviderService, ProviderDTO } from '../../application/services/IProviderService';
export declare class HttpProviderService implements IProviderService {
    private client;
    constructor(baseUrl: string);
    /**
     * Get provider by ID
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