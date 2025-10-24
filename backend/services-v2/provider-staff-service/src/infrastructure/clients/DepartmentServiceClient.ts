/**
 * Department Service HTTP Client
 * Provider/Staff Service V2
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Inter-Service Communication, Circuit Breaker Pattern
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { 
  IDepartmentServiceClient, 
  DepartmentDTO, 
  DepartmentServiceResponse 
} from '../../application/interfaces/IDepartmentServiceClient';
import { ILogger } from '../../application/interfaces/ILogger';

export interface DepartmentServiceClientConfig {
  baseUrl: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

/**
 * HTTP Client for Department Service
 * Implements circuit breaker pattern and retry logic
 */
export class DepartmentServiceClient implements IDepartmentServiceClient {
  private client: AxiosInstance;
  private readonly retryAttempts: number;
  private readonly retryDelay: number;
  private circuitBreakerOpen: boolean = false;
  private circuitBreakerResetTime: number = 0;
  private readonly circuitBreakerThreshold: number = 5;
  private failureCount: number = 0;

  constructor(
    config: DepartmentServiceClientConfig,
    private logger: ILogger
  ) {
    this.retryAttempts = config.retryAttempts || 3;
    this.retryDelay = config.retryDelay || 1000;

    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout || 5000,
      headers: {
        'Content-Type': 'application/json',
        'X-Service-Name': 'provider-staff-service'
      }
    });

    this.setupInterceptors();
  }

  /**
   * Setup axios interceptors for logging and error handling
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        this.logger.debug('Department Service Request', {
          method: config.method,
          url: config.url,
          params: config.params
        });
        return config;
      },
      (error) => {
        this.logger.error('Department Service Request Error', { error: error.message });
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        this.logger.debug('Department Service Response', {
          status: response.status,
          url: response.config.url
        });
        this.resetCircuitBreaker();
        return response;
      },
      (error) => {
        this.handleError(error);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Check if circuit breaker is open
   */
  private isCircuitBreakerOpen(): boolean {
    if (this.circuitBreakerOpen) {
      if (Date.now() > this.circuitBreakerResetTime) {
        this.logger.info('Circuit breaker reset - attempting to reconnect');
        this.circuitBreakerOpen = false;
        this.failureCount = 0;
        return false;
      }
      return true;
    }
    return false;
  }

  /**
   * Open circuit breaker
   */
  private openCircuitBreaker(): void {
    this.circuitBreakerOpen = true;
    this.circuitBreakerResetTime = Date.now() + 60000; // 1 minute
    this.logger.warn('Circuit breaker opened - Department Service unavailable', {
      resetTime: new Date(this.circuitBreakerResetTime).toISOString()
    });
  }

  /**
   * Reset circuit breaker on successful request
   */
  private resetCircuitBreaker(): void {
    if (this.failureCount > 0) {
      this.failureCount = 0;
      this.logger.info('Circuit breaker reset - Department Service recovered');
    }
  }

  /**
   * Handle errors and circuit breaker logic
   */
  private handleError(error: AxiosError): void {
    this.failureCount++;
    
    if (this.failureCount >= this.circuitBreakerThreshold) {
      this.openCircuitBreaker();
    }

    this.logger.error('Department Service Error', {
      message: error.message,
      status: error.response?.status,
      failureCount: this.failureCount
    });
  }

  /**
   * Retry logic for failed requests
   */
  private async retryRequest<T>(
    requestFn: () => Promise<T>,
    attempt: number = 1
  ): Promise<T> {
    try {
      return await requestFn();
    } catch (error) {
      if (attempt < this.retryAttempts) {
        this.logger.warn(`Retrying request (attempt ${attempt + 1}/${this.retryAttempts})`);
        await this.delay(this.retryDelay * attempt);
        return this.retryRequest(requestFn, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get department by ID
   */
  async getDepartmentById(id: string): Promise<DepartmentDTO | null> {
    if (this.isCircuitBreakerOpen()) {
      this.logger.warn('Circuit breaker open - skipping Department Service call');
      return null;
    }

    try {
      const response = await this.retryRequest(async () => {
        return await this.client.get<DepartmentServiceResponse<DepartmentDTO>>(
          `/api/departments/${id}`
        );
      });

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return null;
    } catch (error) {
      this.logger.error('Failed to get department by ID', {
        id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  /**
   * Get department by code
   */
  async getDepartmentByCode(code: string): Promise<DepartmentDTO | null> {
    if (this.isCircuitBreakerOpen()) {
      this.logger.warn('Circuit breaker open - skipping Department Service call');
      return null;
    }

    try {
      const response = await this.retryRequest(async () => {
        return await this.client.get<DepartmentServiceResponse<DepartmentDTO>>(
          `/api/departments/code/${code}`
        );
      });

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return null;
    } catch (error) {
      this.logger.error('Failed to get department by code', {
        code,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  /**
   * Validate if department exists and is active
   */
  async validateDepartment(id: string): Promise<boolean> {
    const department = await this.getDepartmentById(id);
    return department !== null && department.isActive;
  }

  /**
   * Get all active departments
   */
  async getAllActiveDepartments(): Promise<DepartmentDTO[]> {
    if (this.isCircuitBreakerOpen()) {
      this.logger.warn('Circuit breaker open - skipping Department Service call');
      return [];
    }

    try {
      const response = await this.retryRequest(async () => {
        return await this.client.get<DepartmentServiceResponse<DepartmentDTO[]>>(
          '/api/departments',
          { params: { active: true } }
        );
      });

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return [];
    } catch (error) {
      this.logger.error('Failed to get all active departments', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  /**
   * Health check for Department Service
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health', { timeout: 3000 });
      return response.status === 200;
    } catch (error) {
      this.logger.error('Department Service health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }
}
