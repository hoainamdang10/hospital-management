"use strict";
/**
 * HTTP Patient Service - Infrastructure Layer
 * Fetches patient data from Patient Registry Service via HTTP
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
exports.HttpPatientService = void 0;
const axios_1 = __importDefault(require("axios"));
const axios_retry_1 = __importDefault(require("axios-retry"));
const CircuitBreakerService_1 = require("../resilience/CircuitBreakerService");
const RedisCacheService_1 = require("../cache/RedisCacheService");
class HttpPatientService {
    constructor(baseUrl, cache) {
        this.serviceName = 'patient-service';
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
                console.log(`[HttpPatientService] Retry attempt ${retryCount} for ${requestConfig.url}`, error.message);
            }
        });
    }
    /**
     * Get patient by ID with circuit breaker and cache fallback
     */
    async getPatient(patientId) {
        const cacheKey = `patient:${patientId}`;
        try {
            const result = await CircuitBreakerService_1.circuitBreakerService.execute(this.serviceName, async () => {
                const cached = await this.cache.get(cacheKey);
                if (cached) {
                    console.debug(`[HttpPatientService] Cache hit for patient ${patientId}`);
                    return cached;
                }
                const response = await this.client.get(`/api/patients/${patientId}`);
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
            console.error(`[HttpPatientService] Failed to fetch patient ${patientId}:`, error.message);
            const cachedFallback = await this.cache.get(cacheKey);
            if (cachedFallback) {
                console.warn(`[HttpPatientService] Using stale cache for patient ${patientId}`);
                return cachedFallback;
            }
            throw new Error(`Failed to fetch patient: ${error.message}`);
        }
    }
    /**
     * Get multiple patients by IDs
     */
    async getPatients(patientIds) {
        try {
            const promises = patientIds.map(id => this.getPatient(id));
            const results = await Promise.all(promises);
            return results.filter((patient) => patient !== null);
        }
        catch (error) {
            console.error('[HttpPatientService] Failed to fetch patients:', error.message);
            throw new Error(`Failed to fetch patients: ${error.message}`);
        }
    }
    /**
     * Map API response to DTO
     */
    mapToDTO(data) {
        return {
            patientId: data.patient_id || data.patientId,
            fullName: data.full_name || data.fullName,
            phone: data.phone,
            email: data.email,
            dateOfBirth: data.date_of_birth ? new Date(data.date_of_birth) : undefined,
            gender: data.gender,
            nationalId: data.national_id || data.nationalId,
            insuranceNumber: data.insurance_number || data.insuranceNumber,
            insuranceType: data.insurance_type || data.insuranceType,
            address: data.address
        };
    }
}
exports.HttpPatientService = HttpPatientService;
//# sourceMappingURL=HttpPatientService.js.map