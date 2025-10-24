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

import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import { IProviderService, ProviderDTO } from '../../application/services/IProviderService';
import { circuitBreakerService } from '../resilience/CircuitBreakerService';
import { RedisCacheService } from '../cache/RedisCacheService';

export class HttpProviderService implements IProviderService {
  private client: AxiosInstance;
  private cache: RedisCacheService;
  private serviceName = 'provider-service';

  constructor(baseUrl: string, cache?: RedisCacheService) {
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.cache = cache || new RedisCacheService();

    this.setupRetryLogic();
  }

  /**
   * Setup exponential backoff retry logic
   */
  private setupRetryLogic(): void {
    axiosRetry(this.client, {
      retries: 3,
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: (error) => {
        return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
               (error.response?.status ? error.response.status >= 500 : false);
      },
      onRetry: (retryCount, error, requestConfig) => {
        console.log(
          `[HttpProviderService] Retry attempt ${retryCount} for ${requestConfig.url}`,
          error.message
        );
      }
    });
  }

  /**
   * Get provider by ID with circuit breaker and cache fallback
   */
  async getProvider(providerId: string): Promise<ProviderDTO | null> {
    const cacheKey = `provider:${providerId}`;

    try {
      const result = await circuitBreakerService.execute(
        this.serviceName,
        async () => {
          const cached = await this.cache.get<ProviderDTO>(cacheKey);
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
        },
        {
          timeout: 5000,
          errorThresholdPercentage: 50,
          resetTimeout: 30000
        }
      );

      return result;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }

      console.error(`[HttpProviderService] Failed to fetch provider ${providerId}:`, error.message);

      const cachedFallback = await this.cache.get<ProviderDTO>(cacheKey);
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
  async getProviders(providerIds: string[]): Promise<ProviderDTO[]> {
    try {
      const promises = providerIds.map(id => this.getProvider(id));
      const results = await Promise.all(promises);
      
      return results.filter((provider): provider is ProviderDTO => provider !== null);
    } catch (error: any) {
      console.error('[HttpProviderService] Failed to fetch providers:', error.message);
      throw new Error(`Failed to fetch providers: ${error.message}`);
    }
  }

  /**
   * Map API response to DTO
   */
  private mapToDTO(data: any): ProviderDTO {
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

