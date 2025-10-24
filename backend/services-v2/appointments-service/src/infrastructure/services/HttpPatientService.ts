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

import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import { IPatientService, PatientDTO } from '../../application/services/IPatientService';
import { circuitBreakerService } from '../resilience/CircuitBreakerService';
import { RedisCacheService } from '../cache/RedisCacheService';

export class HttpPatientService implements IPatientService {
  private client: AxiosInstance;
  private cache: RedisCacheService;
  private serviceName = 'patient-service';

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
          `[HttpPatientService] Retry attempt ${retryCount} for ${requestConfig.url}`,
          error.message
        );
      }
    });
  }

  /**
   * Get patient by ID with circuit breaker and cache fallback
   */
  async getPatient(patientId: string): Promise<PatientDTO | null> {
    const cacheKey = `patient:${patientId}`;

    try {
      const result = await circuitBreakerService.execute(
        this.serviceName,
        async () => {
          const cached = await this.cache.get<PatientDTO>(cacheKey);
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

      console.error(`[HttpPatientService] Failed to fetch patient ${patientId}:`, error.message);

      const cachedFallback = await this.cache.get<PatientDTO>(cacheKey);
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
  async getPatients(patientIds: string[]): Promise<PatientDTO[]> {
    try {
      const promises = patientIds.map(id => this.getPatient(id));
      const results = await Promise.all(promises);
      
      return results.filter((patient): patient is PatientDTO => patient !== null);
    } catch (error: any) {
      console.error('[HttpPatientService] Failed to fetch patients:', error.message);
      throw new Error(`Failed to fetch patients: ${error.message}`);
    }
  }

  /**
   * Map API response to DTO
   */
  private mapToDTO(data: any): PatientDTO {
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

