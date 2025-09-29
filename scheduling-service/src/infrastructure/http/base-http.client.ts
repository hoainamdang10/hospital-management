/**
 * Base HTTP Client - Infrastructure Layer
 * HTTP client with retry logic, circuit breaker, and error handling
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Circuit Breaker Pattern, Retry Logic, Healthcare Integration
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { ILogger } from '../../../shared/infrastructure/logging/logger.interface';

export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export interface HttpClientConfig {
  baseURL: string;
  timeout: number;
  retryConfig: RetryConfig;
  circuitBreakerConfig: CircuitBreakerConfig;
  defaultHeaders?: Record<string, string>;
}

export enum CircuitBreakerState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

export interface ServiceHealthStatus {
  serviceName: string;
  isHealthy: boolean;
  lastHealthCheck: Date;
  consecutiveFailures: number;
  circuitBreakerState: CircuitBreakerState;
  responseTime: number;
  errorRate: number;
}

/**
 * Base HTTP Client with Circuit Breaker and Retry Logic
 * Provides resilient HTTP communication for microservices
 */
export class BaseHttpClient {
  private readonly axiosInstance: AxiosInstance;
  private readonly logger: ILogger;
  private readonly serviceName: string;
  private readonly retryConfig: RetryConfig;
  private readonly circuitBreakerConfig: CircuitBreakerConfig;

  // Circuit Breaker State
  private circuitBreakerState: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount: number = 0;
  private lastFailureTime: Date | null = null;
  private successCount: number = 0;

  // Health Monitoring
  private healthStatus: ServiceHealthStatus;
  private requestCount: number = 0;
  private errorCount: number = 0;
  private totalResponseTime: number = 0;

  constructor(
    serviceName: string,
    config: HttpClientConfig,
    logger: ILogger
  ) {
    this.serviceName = serviceName;
    this.logger = logger;
    this.retryConfig = config.retryConfig;
    this.circuitBreakerConfig = config.circuitBreakerConfig;

    // Initialize health status
    this.healthStatus = {
      serviceName,
      isHealthy: true,
      lastHealthCheck: new Date(),
      consecutiveFailures: 0,
      circuitBreakerState: CircuitBreakerState.CLOSED,
      responseTime: 0,
      errorRate: 0
    };

    // Create axios instance
    this.axiosInstance = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': `hospital-management-scheduling-service/2.0.0`,
        ...config.defaultHeaders
      }
    });

    this.setupInterceptors();
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const requestId = this.generateRequestId();
        config.headers['X-Request-ID'] = requestId;
        config.headers['X-Service-Name'] = 'scheduling-service';
        config.headers['X-Timestamp'] = new Date().toISOString();

        this.logger.debug('HTTP request initiated', {
          serviceName: this.serviceName,
          method: config.method?.toUpperCase(),
          url: config.url,
          requestId,
          circuitBreakerState: this.circuitBreakerState
        });

        return config;
      },
      (error) => {
        this.logger.error('HTTP request interceptor error', {
          serviceName: this.serviceName,
          error: error.message
        });
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => {
        const responseTime = this.calculateResponseTime(response.config);
        this.recordSuccess(responseTime);

        this.logger.debug('HTTP response received', {
          serviceName: this.serviceName,
          status: response.status,
          responseTime,
          requestId: response.config.headers['X-Request-ID']
        });

        return response;
      },
      (error) => {
        const responseTime = this.calculateResponseTime(error.config);
        this.recordFailure(error, responseTime);

        this.logger.error('HTTP response error', {
          serviceName: this.serviceName,
          error: error.message,
          status: error.response?.status,
          responseTime,
          requestId: error.config?.headers['X-Request-ID']
        });

        return Promise.reject(error);
      }
    );
  }

  /**
   * Make HTTP request with circuit breaker and retry logic
   */
  async request<T = any>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    // Check circuit breaker
    if (!this.canMakeRequest()) {
      const error = new Error(`Circuit breaker is OPEN for service ${this.serviceName}`);
      this.logger.warn('Request blocked by circuit breaker', {
        serviceName: this.serviceName,
        circuitBreakerState: this.circuitBreakerState,
        failureCount: this.failureCount
      });
      throw error;
    }

    return this.executeWithRetry(config);
  }

  /**
   * GET request
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, method: 'GET', url });
  }

  /**
   * POST request
   */
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, method: 'POST', url, data });
  }

  /**
   * PUT request
   */
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, method: 'PUT', url, data });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, method: 'DELETE', url });
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<ServiceHealthStatus> {
    try {
      const startTime = Date.now();
      await this.get('/health');
      const responseTime = Date.now() - startTime;

      this.healthStatus = {
        ...this.healthStatus,
        isHealthy: true,
        lastHealthCheck: new Date(),
        responseTime,
        circuitBreakerState: this.circuitBreakerState,
        errorRate: this.calculateErrorRate()
      };

      this.logger.debug('Health check successful', {
        serviceName: this.serviceName,
        responseTime,
        healthStatus: this.healthStatus
      });

    } catch (error) {
      this.healthStatus = {
        ...this.healthStatus,
        isHealthy: false,
        lastHealthCheck: new Date(),
        consecutiveFailures: this.failureCount,
        circuitBreakerState: this.circuitBreakerState,
        errorRate: this.calculateErrorRate()
      };

      this.logger.error('Health check failed', {
        serviceName: this.serviceName,
        error: error.message,
        healthStatus: this.healthStatus
      });
    }

    return this.healthStatus;
  }

  /**
   * Get current health status
   */
  getHealthStatus(): ServiceHealthStatus {
    return { ...this.healthStatus };
  }

  /**
   * Private methods
   */

  private canMakeRequest(): boolean {
    const now = new Date();

    switch (this.circuitBreakerState) {
      case CircuitBreakerState.CLOSED:
        return true;

      case CircuitBreakerState.OPEN:
        if (this.lastFailureTime && 
            (now.getTime() - this.lastFailureTime.getTime()) >= this.circuitBreakerConfig.resetTimeout) {
          this.circuitBreakerState = CircuitBreakerState.HALF_OPEN;
          this.logger.info('Circuit breaker transitioning to HALF_OPEN', {
            serviceName: this.serviceName
          });
          return true;
        }
        return false;

      case CircuitBreakerState.HALF_OPEN:
        return true;

      default:
        return false;
    }
  }

  private async executeWithRetry<T>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    let lastError: AxiosError;
    
    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        const response = await this.axiosInstance.request<T>(config);
        
        // Reset circuit breaker on successful request
        if (this.circuitBreakerState === CircuitBreakerState.HALF_OPEN) {
          this.circuitBreakerState = CircuitBreakerState.CLOSED;
          this.failureCount = 0;
          this.logger.info('Circuit breaker reset to CLOSED', {
            serviceName: this.serviceName
          });
        }

        return response;

      } catch (error) {
        lastError = error as AxiosError;
        
        if (attempt === this.retryConfig.maxRetries || !this.shouldRetry(error)) {
          break;
        }

        const delay = this.calculateRetryDelay(attempt);
        this.logger.warn('Request failed, retrying', {
          serviceName: this.serviceName,
          attempt: attempt + 1,
          maxRetries: this.retryConfig.maxRetries,
          delay,
          error: error.message
        });

        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  private shouldRetry(error: AxiosError): boolean {
    // Don't retry on client errors (4xx)
    if (error.response && error.response.status >= 400 && error.response.status < 500) {
      return false;
    }

    // Retry on network errors, timeouts, and server errors (5xx)
    return !error.response || error.response.status >= 500 || error.code === 'ECONNABORTED';
  }

  private calculateRetryDelay(attempt: number): number {
    const delay = Math.min(
      this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt),
      this.retryConfig.maxDelay
    );

    // Add jitter to prevent thundering herd
    return delay + Math.random() * 1000;
  }

  private recordSuccess(responseTime: number): void {
    this.requestCount++;
    this.totalResponseTime += responseTime;
    this.successCount++;

    // Reset failure count on success
    if (this.circuitBreakerState === CircuitBreakerState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= 3) { // Require 3 successful requests to close circuit
        this.circuitBreakerState = CircuitBreakerState.CLOSED;
        this.failureCount = 0;
        this.successCount = 0;
        this.logger.info('Circuit breaker closed after successful requests', {
          serviceName: this.serviceName
        });
      }
    }
  }

  private recordFailure(error: AxiosError, responseTime: number): void {
    this.requestCount++;
    this.errorCount++;
    this.totalResponseTime += responseTime;
    this.failureCount++;
    this.lastFailureTime = new Date();

    // Update circuit breaker state
    if (this.circuitBreakerState === CircuitBreakerState.CLOSED &&
        this.failureCount >= this.circuitBreakerConfig.failureThreshold) {
      this.circuitBreakerState = CircuitBreakerState.OPEN;
      this.logger.warn('Circuit breaker opened due to failures', {
        serviceName: this.serviceName,
        failureCount: this.failureCount,
        threshold: this.circuitBreakerConfig.failureThreshold
      });
    } else if (this.circuitBreakerState === CircuitBreakerState.HALF_OPEN) {
      this.circuitBreakerState = CircuitBreakerState.OPEN;
      this.successCount = 0;
      this.logger.warn('Circuit breaker reopened after failure in HALF_OPEN state', {
        serviceName: this.serviceName
      });
    }
  }

  private calculateResponseTime(config: any): number {
    if (config && config.metadata && config.metadata.startTime) {
      return Date.now() - config.metadata.startTime;
    }
    return 0;
  }

  private calculateErrorRate(): number {
    if (this.requestCount === 0) return 0;
    return (this.errorCount / this.requestCount) * 100;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
