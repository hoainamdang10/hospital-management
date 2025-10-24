"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpProviderService = void 0;
const axios_1 = __importDefault(require("axios"));
const axios_retry_1 = __importDefault(require("axios-retry"));
const CircuitBreakerService_1 = require("../resilience/CircuitBreakerService");
const RedisCacheService_1 = require("../cache/RedisCacheService");
class HttpProviderService {
    constructor(baseUrl, cache) {
        this.serviceName = 'provider-service';
        this.client = axios_1.default.create({
            baseURL: baseUrl,
            timeout: 5000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        this.cache = cache || new RedisCacheService_1.RedisCacheService();
        this.setupRetryLogic();
    }
    /**
     * Setup exponential backoff retry logic
     */
    setupRetryLogic() {
        (0, axios_retry_1.default)(this.client, {
            retries: 3,
            retryDelay: axios_retry_1.default.exponentialDelay,
            retryCondition: (error) => {
                return axios_retry_1.default.isNetworkOrIdempotentRequestError(error) ||
                    (error.response?.status ? error.response.status >= 500 : false);
            },
            onRetry: (retryCount, error, requestConfig) => {
                console.log(`[HttpProviderService] Retry attempt ${retryCount} for ${requestConfig.url}`, error.message);
            }
        });
    }
    /**
     * Get provider by ID with circuit breaker and cache fallback
     */
    async getProvider(providerId) {
        const cacheKey = `provider:${providerId}`;
        try {
            const result = await CircuitBreakerService_1.circuitBreakerService.execute(this.serviceName, async () => {
                const cached = await this.cache.get(cacheKey);
                if (cached) {
                    console.debug(`[HttpProviderService] Cache hit for provider ${providerId}`);
                    return cached;
                }
                const response = await this.client.get(`/api/providers/${providerId}`);
                if (!response.data) {
                    return null;
                }
                const dto = this.mapToDTO(response.data);
                await this.cache.set(cacheKey, dto, { ttl: 300 });
                return dto;
            }, {
                timeout: 5000,
                errorThresholdPercentage: 50,
                resetTimeout: 30000
            });
            return result;
        }
        catch (error) {
            if (error.response?.status === 404) {
                return null;
            }
            console.error(`[HttpProviderService] Failed to fetch provider ${providerId}:`, error.message);
            const cachedFallback = await this.cache.get(cacheKey);
            if (cachedFallback) {
                console.warn(`[HttpProviderService] Using stale cache for provider ${providerId}`);
                return cachedFallback;
            }
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