"use strict";
/**
 * HTTP Provider Service - Infrastructure Layer
 * Fetches provider/doctor data from Provider Staff Service via HTTP
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Microservices
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpProviderService = void 0;
const axios_1 = __importDefault(require("axios"));
class HttpProviderService {
    constructor(baseUrl) {
        this.client = axios_1.default.create({
            baseURL: baseUrl,
            timeout: 5000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
    /**
     * Get provider by ID
     */
    async getProvider(providerId) {
        try {
            const response = await this.client.get(`/api/providers/${providerId}`);
            if (!response.data) {
                return null;
            }
            return this.mapToDTO(response.data);
        }
        catch (error) {
            if (error.response?.status === 404) {
                return null;
            }
            console.error(`[HttpProviderService] Failed to fetch provider ${providerId}:`, error.message);
            throw new Error(`Failed to fetch provider: ${error.message}`);
        }
    }
    /**
     * Get multiple providers by IDs
     */
    async getProviders(providerIds) {
        try {
            const promises = providerIds.map(id => this.getProvider(id));
            const results = await Promise.all(promises);
            return results.filter((provider) => provider !== null);
        }
        catch (error) {
            console.error('[HttpProviderService] Failed to fetch providers:', error.message);
            throw new Error(`Failed to fetch providers: ${error.message}`);
        }
    }
    /**
     * Map API response to DTO
     */
    mapToDTO(data) {
        return {
            providerId: data.provider_id || data.providerId || data.staff_id || data.staffId,
            fullName: data.full_name || data.fullName,
            specialization: data.specialization,
            department: data.department,
            licenseNumber: data.license_number || data.licenseNumber,
            phone: data.phone,
            email: data.email
        };
    }
}
exports.HttpProviderService = HttpProviderService;
//# sourceMappingURL=HttpProviderService.js.map