/**
 * Provider Service Interface - Application Layer
 * Interface for fetching provider/doctor data from Provider Staff Service
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Microservices
 */
export interface ProviderDTO {
    providerId: string;
    fullName: string;
    specialization?: string;
    department?: string;
    licenseNumber?: string;
    phone?: string;
    email?: string;
}
export interface IProviderService {
    /**
     * Get provider by ID from Provider Staff Service
     */
    getProvider(providerId: string): Promise<ProviderDTO | null>;
    /**
     * Get multiple providers by IDs
     */
    getProviders(providerIds: string[]): Promise<ProviderDTO[]>;
}
//# sourceMappingURL=IProviderService.d.ts.map