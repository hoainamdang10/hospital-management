import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import logger from '../utils/logger';

export interface ApiGatewayClientConfig {
  baseUrl: string;
  serviceName: string;
  timeout?: number;
  retries?: number;
}

export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * API Gateway Client for Service-to-Service Communication
 * 
 * This client allows services to communicate through API Gateway
 * instead of making direct service-to-service calls.
 */
export class ApiGatewayClient {
  private client: AxiosInstance;
  private serviceName: string;
  private retries: number;

  constructor(config: ApiGatewayClientConfig) {
    this.serviceName = config.serviceName;
    this.retries = config.retries || 3;

    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout || 10000,
      headers: {
        'Content-Type': 'application/json',
        'x-service-name': this.serviceName,
      },
    });

    // Request interceptor to add request ID and service headers
    this.client.interceptors.request.use(
      (config: any) => {
        // Generate unique request ID for tracing
        const requestId = this.generateRequestId();
        config.headers['x-request-id'] = requestId;

        logger.debug('API Gateway request', {
          serviceName: this.serviceName,
          requestId,
          method: config.method?.toUpperCase(),
          url: config.url,
        });

        return config;
      },
      (error: any) => {
        logger.error('API Gateway request error', { error: error.message });
        return Promise.reject(error);
      }
    );

    // Response interceptor for logging and error handling
    this.client.interceptors.response.use(
      (response: any) => {
        logger.debug('API Gateway response', {
          serviceName: this.serviceName,
          requestId: response.config.headers['x-request-id'],
          status: response.status,
          url: response.config.url,
        });
        return response;
      },
      (error: any) => {
        logger.error('API Gateway response error', {
          serviceName: this.serviceName,
          requestId: error.config?.headers['x-request-id'],
          status: error.response?.status,
          url: error.config?.url,
          error: error.message,
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Make GET request to Patient Service through API Gateway
   */
  async getPatient(patientId: string): Promise<ServiceResponse> {
    return this.makeRequest('GET', `/internal/patients/${patientId}`);
  }

  /**
   * Get patient statistics for a doctor
   */
  async getPatientStats(doctorId: string): Promise<ServiceResponse> {
    return this.makeRequest('GET', `/internal/patients/doctor/${doctorId}/stats`);
  }

  /**
   * Search patients
   */
  async searchPatients(query: string, limit?: number): Promise<ServiceResponse> {
    const params = new URLSearchParams({ q: query });
    if (limit) params.append('limit', limit.toString());
    
    return this.makeRequest('GET', `/internal/patients/search?${params.toString()}`);
  }

  /**
   * Make GET request to Appointment Service through API Gateway
   */
  async getDoctorAppointments(
    doctorId: string, 
    filters: {
      date?: string;
      status?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<ServiceResponse> {
    const params = new URLSearchParams();
    if (filters.date) params.append('date', filters.date);
    if (filters.status) params.append('status', filters.status);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    const url = `/internal/appointments/doctor/${doctorId}${queryString ? `?${queryString}` : ''}`;
    
    return this.makeRequest('GET', url);
  }

  /**
   * Get appointment statistics for a doctor
   */
  async getAppointmentStats(doctorId: string): Promise<ServiceResponse> {
    return this.makeRequest('GET', `/internal/appointments/doctor/${doctorId}/stats`);
  }

  /**
   * Get doctor information through API Gateway
   */
  async getDoctor(doctorId: string): Promise<ServiceResponse> {
    return this.makeRequest('GET', `/internal/doctors/${doctorId}`);
  }

  /**
   * Get doctor availability
   */
  async getDoctorAvailability(doctorId: string, date: string): Promise<ServiceResponse> {
    return this.makeRequest('GET', `/internal/doctors/${doctorId}/availability?date=${date}`);
  }

  /**
   * Get available time slots for a doctor
   */
  async getDoctorTimeSlots(
    doctorId: string, 
    date: string, 
    duration: number = 30
  ): Promise<ServiceResponse> {
    return this.makeRequest('GET', `/internal/doctors/${doctorId}/time-slots?date=${date}&duration=${duration}`);
  }

  /**
   * Get department information
   */
  async getDepartment(departmentId: string): Promise<ServiceResponse> {
    return this.makeRequest('GET', `/internal/departments/${departmentId}`);
  }

  /**
   * Get all departments
   */
  async getDepartments(): Promise<ServiceResponse> {
    return this.makeRequest('GET', '/internal/departments');
  }

  /**
   * Generic method to make requests with retry logic
   */
  private async makeRequest(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ServiceResponse> {
    let lastError: any;

    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        const response: AxiosResponse = await this.client.request({
          method,
          url,
          data,
          ...config,
        });

        return {
          success: true,
          data: response.data.data || response.data,
          message: response.data.message,
        };
      } catch (error: any) {
        lastError = error;
        
        if (attempt === this.retries) {
          break;
        }

        // Only retry on network errors or 5xx server errors
        if (
          error.code === 'ECONNREFUSED' ||
          error.code === 'ETIMEDOUT' ||
          (error.response && error.response.status >= 500)
        ) {
          const delay = Math.pow(2, attempt - 1) * 1000; // Exponential backoff
          logger.warn(`API Gateway request failed, retrying in ${delay}ms`, {
            attempt,
            maxRetries: this.retries,
            error: error.message,
            url,
          });
          
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        // Don't retry on client errors (4xx)
        break;
      }
    }

    // Handle final error
    const errorMessage = lastError.response?.data?.error || 
                        lastError.response?.data?.message || 
                        lastError.message || 
                        'Unknown error';

    logger.error('API Gateway request failed after all retries', {
      serviceName: this.serviceName,
      url,
      error: errorMessage,
      attempts: this.retries,
    });

    return {
      success: false,
      error: errorMessage,
    };
  }

  /**
   * Generate unique request ID for tracing
   */
  private generateRequestId(): string {
    return `${this.serviceName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if a service is available through health check
   */
  async checkServiceHealth(serviceName: string): Promise<boolean> {
    try {
      const response = await this.client.get(`/api/${serviceName}/health`);
      return response.status === 200;
    } catch (error) {
      logger.warn(`Service ${serviceName} health check failed`, { error });
      return false;
    }
  }

  /**
   * Get service discovery information
   */
  async getServiceDiscovery(): Promise<ServiceResponse> {
    return this.makeRequest('GET', '/services');
  }
}

/**
 * Factory function to create API Gateway client instances
 */
export function createApiGatewayClient(config: ApiGatewayClientConfig): ApiGatewayClient {
  return new ApiGatewayClient(config);
}

/**
 * Default API Gateway client configuration
 */
export const defaultApiGatewayConfig = {
  baseUrl: process.env.API_GATEWAY_URL || 'http://api-gateway:3100',
  timeout: 10000,
  retries: 3,
};
