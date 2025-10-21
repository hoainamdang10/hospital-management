/**
 * Scheduler Service SDK - Remote HTTP Adapter
 * 
 * Production implementation using Axios HTTP client with:
 * - Automatic correlation ID propagation
 * - Retry logic for 5xx errors with exponential backoff
 * - Idempotency-Key header support
 * - Error handling and transformation
 */

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { IScheduler } from './IScheduler';
import {
  CreateScheduleRequest,
  ScheduleResponse,
  CancelByOwnerRequest,
  CancelResponse,
  RunResponse,
  GetScheduleRunsRequest,
  RunsResponse,
  HealthResponse,
  SchedulerClientConfig,
  SchedulerError,
  ErrorResponse,
  isErrorResponse,
  validateScheduleType
} from './types';

export class RemoteSchedulerAdapter implements IScheduler {
  private client: AxiosInstance;
  private config: Required<SchedulerClientConfig>;
  
  constructor(config: SchedulerClientConfig) {
    // Set defaults
    this.config = {
      baseURL: config.baseURL,
      apiKey: config.apiKey || '',
      timeout: config.timeout || 5000,
      retries: config.retries || 3,
      retryDelay: config.retryDelay || 1000,
      headers: config.headers || {}
    };
    
    // Create Axios instance
    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...this.config.headers
      }
    });
    
    // Setup interceptors
    this.setupRequestInterceptor();
    this.setupResponseInterceptor();
  }
  
  /**
   * Request interceptor
   * - Add Authorization header (if apiKey provided)
   * - Add/propagate X-Correlation-Id
   * - Add X-Idempotency-Key (if provided in config)
   */
  private setupRequestInterceptor(): void {
    this.client.interceptors.request.use(
      (config) => {
        // Add Authorization header
        if (this.config.apiKey) {
          config.headers.Authorization = `Bearer ${this.config.apiKey}`;
        }
        
        // Add/propagate X-Correlation-Id
        if (!config.headers['X-Correlation-Id']) {
          config.headers['X-Correlation-Id'] = uuidv4();
        }
        
        // Add X-Idempotency-Key if provided
        if (config.headers['X-Idempotency-Key']) {
          // Already set by caller
        }
        
        return config;
      },
      (error) => Promise.reject(error)
    );
  }
  
  /**
   * Response interceptor
   * - Transform error responses to SchedulerError
   * - Retry 5xx errors with exponential backoff
   * - Don't retry 4xx errors (client errors)
   */
  private setupResponseInterceptor(): void {
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const config = error.config as AxiosRequestConfig & { _retryCount?: number };
        
        // Transform error response
        if (error.response?.data && isErrorResponse(error.response.data)) {
          const errorData = error.response.data as ErrorResponse;
          throw new SchedulerError(
            errorData.error.code,
            errorData.error.message,
            errorData.error.details,
            errorData.error.trace_id
          );
        }
        
        // Retry logic for 5xx errors
        const status = error.response?.status || 0;
        const isServerError = status >= 500 && status < 600;
        const isTimeout = error.code === 'ECONNABORTED';
        const shouldRetry = isServerError || isTimeout;
        
        if (shouldRetry && config) {
          config._retryCount = config._retryCount || 0;
          
          if (config._retryCount < this.config.retries) {
            config._retryCount += 1;
            
            // Exponential backoff with jitter
            const delay = this.config.retryDelay * Math.pow(2, config._retryCount - 1);
            const jitter = Math.random() * 1000;
            
            await new Promise(resolve => setTimeout(resolve, delay + jitter));
            
            return this.client.request(config);
          }
        }
        
        // No retry or max retries reached
        throw new SchedulerError(
          'INTERNAL_ERROR',
          error.message || 'An unexpected error occurred',
          { originalError: error.message },
          error.response?.headers['x-trace-id']
        );
      }
    );
  }
  
  /**
   * Create or update schedule by dedup key
   */
  async createOrUpdateByDedup(request: CreateScheduleRequest): Promise<ScheduleResponse> {
    // Client-side validation
    validateScheduleType(request);
    
    // Convert Date to ISO string
    const payload = {
      ...request,
      startAtUtc: request.startAtUtc instanceof Date 
        ? request.startAtUtc.toISOString() 
        : request.startAtUtc,
      endAtUtc: request.endAtUtc instanceof Date 
        ? request.endAtUtc.toISOString() 
        : request.endAtUtc
    };
    
    const response = await this.client.post<ScheduleResponse>(
      '/api/v1/schedules:createOrUpdateByDedup',
      payload,
      {
        headers: {
          'X-Tenant-Id': request.tenantId
        }
      }
    );
    
    return response.data;
  }
  
  /**
   * Cancel all schedules by owner
   */
  async cancelByOwner(request: CancelByOwnerRequest): Promise<CancelResponse> {
    const response = await this.client.post<CancelResponse>(
      '/api/v1/schedules:cancelByOwner',
      request,
      {
        headers: {
          'X-Tenant-Id': request.tenantId
        }
      }
    );
    
    return response.data;
  }
  
  /**
   * Get schedule by ID
   */
  async getSchedule(scheduleId: string): Promise<ScheduleResponse> {
    const response = await this.client.get<ScheduleResponse>(
      `/api/v1/schedules/${scheduleId}`
    );
    
    return response.data;
  }
  
  /**
   * Trigger schedule to run immediately
   */
  async runNow(scheduleId: string): Promise<RunResponse> {
    const response = await this.client.post<RunResponse>(
      `/api/v1/schedules/${scheduleId}:runNow`
    );
    
    return response.data;
  }
  
  /**
   * Get schedule runs
   */
  async getScheduleRuns(request: GetScheduleRunsRequest): Promise<RunsResponse> {
    const params: Record<string, any> = {};
    
    if (request.status) params.status = request.status;
    if (request.fromUtc) {
      params.fromUtc = request.fromUtc instanceof Date 
        ? request.fromUtc.toISOString() 
        : request.fromUtc;
    }
    if (request.toUtc) {
      params.toUtc = request.toUtc instanceof Date 
        ? request.toUtc.toISOString() 
        : request.toUtc;
    }
    if (request.limit) params.limit = request.limit;
    if (request.cursor) params.cursor = request.cursor;
    
    const response = await this.client.get<RunsResponse>(
      `/api/v1/schedules/${request.scheduleId}/runs`,
      { params }
    );
    
    return response.data;
  }
  
  /**
   * Health check
   */
  async health(): Promise<HealthResponse> {
    const response = await this.client.get<HealthResponse>('/health');
    return response.data;
  }
  
  /**
   * Set idempotency key for next request
   * 
   * This is useful for network-level retries to ensure idempotency.
   * 
   * @param key - Idempotency key (UUID recommended)
   * @returns this (for chaining)
   * 
   * @example
   * ```typescript
   * const idempotencyKey = uuidv4();
   * const schedule = await scheduler
   *   .withIdempotencyKey(idempotencyKey)
   *   .createOrUpdateByDedup(request);
   * ```
   */
  withIdempotencyKey(key: string): this {
    this.client.defaults.headers.common['X-Idempotency-Key'] = key;
    return this;
  }
  
  /**
   * Set correlation ID for next request
   * 
   * This is useful for distributed tracing.
   * 
   * @param id - Correlation ID (UUID recommended)
   * @returns this (for chaining)
   * 
   * @example
   * ```typescript
   * const correlationId = uuidv4();
   * const schedule = await scheduler
   *   .withCorrelationId(correlationId)
   *   .createOrUpdateByDedup(request);
   * ```
   */
  withCorrelationId(id: string): this {
    this.client.defaults.headers.common['X-Correlation-Id'] = id;
    return this;
  }
}

