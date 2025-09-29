import { Logger } from 'winston';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

export interface ServiceAdapter {
  serviceName: string;
  baseUrl: string;
  executeAction(action: string, payload: any, options?: RequestOptions): Promise<any>;
  executeCompensation(action: string, payload: any, options?: RequestOptions): Promise<any>;
  healthCheck(): Promise<boolean>;
}

export interface RequestOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
}

export interface ServiceConfig {
  name: string;
  baseUrl: string;
  timeout: number;
  retries: number;
  retryDelay: number;
  healthEndpoint: string;
  authRequired: boolean;
}

export class ServiceAdapterFactory {
  private logger: Logger;
  private adapters: Map<string, ServiceAdapter> = new Map();
  private serviceConfigs: Map<string, ServiceConfig> = new Map();
  private apiGatewayUrl: string;

  constructor(logger: Logger) {
    this.logger = logger;
    this.apiGatewayUrl = process.env.API_GATEWAY_URL || 'http://api-gateway:3100';
    this.initializeServiceConfigs();
  }

  /**
   * Initialize service configurations
   */
  private initializeServiceConfigs(): void {
    const services: ServiceConfig[] = [
      {
        name: 'auth-service',
        baseUrl: `${this.apiGatewayUrl}/api/auth`,
        timeout: 15000,
        retries: 3,
        retryDelay: 1000,
        healthEndpoint: '/health',
        authRequired: true
      },
      {
        name: 'doctor-service',
        baseUrl: `${this.apiGatewayUrl}/api/doctors`,
        timeout: 15000,
        retries: 3,
        retryDelay: 1000,
        healthEndpoint: '/health',
        authRequired: true
      },
      {
        name: 'patient-service',
        baseUrl: `${this.apiGatewayUrl}/api/patients`,
        timeout: 15000,
        retries: 3,
        retryDelay: 1000,
        healthEndpoint: '/health',
        authRequired: true
      },
      {
        name: 'appointment-service',
        baseUrl: `${this.apiGatewayUrl}/api/appointments`,
        timeout: 15000,
        retries: 3,
        retryDelay: 1000,
        healthEndpoint: '/health',
        authRequired: true
      },
      {
        name: 'medical-records-service',
        baseUrl: `${this.apiGatewayUrl}/api/medical-records`,
        timeout: 20000,
        retries: 3,
        retryDelay: 1000,
        healthEndpoint: '/health',
        authRequired: true
      },
      {
        name: 'payment-service',
        baseUrl: `${this.apiGatewayUrl}/api/payments`,
        timeout: 30000,
        retries: 3,
        retryDelay: 1000,
        healthEndpoint: '/health',
        authRequired: true
      },
      {
        name: 'file-service',
        baseUrl: `${this.apiGatewayUrl}/api/files`,
        timeout: 60000,
        retries: 2,
        retryDelay: 2000,
        healthEndpoint: '/health',
        authRequired: true
      }
    ];

    services.forEach(config => {
      this.serviceConfigs.set(config.name, config);
      this.adapters.set(config.name, new HttpServiceAdapter(config, this.logger));
    });

    this.logger.info('Service adapters initialized', { 
      services: services.map(s => s.name) 
    });
  }

  /**
   * Get service adapter by name
   */
  getAdapter(serviceName: string): ServiceAdapter | null {
    return this.adapters.get(serviceName) || null;
  }

  /**
   * Get all available adapters
   */
  getAllAdapters(): ServiceAdapter[] {
    return Array.from(this.adapters.values());
  }

  /**
   * Register a custom adapter
   */
  registerAdapter(serviceName: string, adapter: ServiceAdapter): void {
    this.adapters.set(serviceName, adapter);
    this.logger.info('Custom service adapter registered', { serviceName });
  }

  /**
   * Health check all services
   */
  async healthCheckAll(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    const adapters = Array.from(this.adapters.entries());

    await Promise.allSettled(
      adapters.map(async ([serviceName, adapter]) => {
        try {
          results[serviceName] = await adapter.healthCheck();
        } catch (error) {
          results[serviceName] = false;
        }
      })
    );

    return results;
  }
}

/**
 * HTTP-based service adapter implementation
 */
class HttpServiceAdapter implements ServiceAdapter {
  public serviceName: string;
  public baseUrl: string;
  private config: ServiceConfig;
  private logger: Logger;
  private httpClient: AxiosInstance;

  constructor(config: ServiceConfig, logger: Logger) {
    this.serviceName = config.name;
    this.baseUrl = config.baseUrl;
    this.config = config;
    this.logger = logger;

    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Admin-Orchestrator/1.0'
      }
    });

    this.setupInterceptors();
  }

  /**
   * Setup axios interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.httpClient.interceptors.request.use(
      (config) => {
        // Add authentication token if required
        if (this.config.authRequired) {
          const token = process.env.SERVICE_AUTH_TOKEN || process.env.SUPABASE_SERVICE_ROLE_KEY;
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }

        this.logger.debug('HTTP request', { 
          service: this.serviceName,
          method: config.method,
          url: config.url 
        });

        return config;
      },
      (error) => {
        this.logger.error('HTTP request error', { 
          service: this.serviceName,
          error: error.message 
        });
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.httpClient.interceptors.response.use(
      (response) => {
        this.logger.debug('HTTP response', { 
          service: this.serviceName,
          status: response.status,
          url: response.config.url 
        });
        return response;
      },
      (error) => {
        this.logger.error('HTTP response error', { 
          service: this.serviceName,
          status: error.response?.status,
          message: error.message,
          url: error.config?.url
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Execute service action with retry logic
   */
  async executeAction(action: string, payload: any, options: RequestOptions = {}): Promise<any> {
    const requestOptions: RequestOptions = {
      timeout: this.config.timeout,
      retries: this.config.retries,
      retryDelay: this.config.retryDelay,
      ...options
    };

    return this.executeWithRetry(action, payload, requestOptions, 'action');
  }

  /**
   * Execute compensation action with retry logic
   */
  async executeCompensation(action: string, payload: any, options: RequestOptions = {}): Promise<any> {
    const requestOptions: RequestOptions = {
      timeout: this.config.timeout,
      retries: this.config.retries,
      retryDelay: this.config.retryDelay,
      ...options
    };

    return this.executeWithRetry(action, payload, requestOptions, 'compensation');
  }

  /**
   * Execute request with retry logic
   */
  private async executeWithRetry(
    action: string, 
    payload: any, 
    options: RequestOptions, 
    type: 'action' | 'compensation'
  ): Promise<any> {
    const maxRetries = options.retries || 0;
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.makeHttpRequest(action, payload, options, type);
        
        if (attempt > 0) {
          this.logger.info('Request succeeded after retry', { 
            service: this.serviceName,
            action,
            attempt,
            type
          });
        }

        return response.data;

      } catch (error: any) {
        lastError = error;
        
        if (attempt < maxRetries) {
          const delay = (options.retryDelay || 1000) * Math.pow(2, attempt); // Exponential backoff
          
          this.logger.warn('Request failed, retrying', { 
            service: this.serviceName,
            action,
            attempt: attempt + 1,
            maxRetries,
            delay,
            error: error.message,
            type
          });

          await this.sleep(delay);
        }
      }
    }

    this.logger.error('Request failed after all retries', { 
      service: this.serviceName,
      action,
      maxRetries,
      error: lastError.message,
      type
    });

    throw lastError;
  }

  /**
   * Make HTTP request
   */
  private async makeHttpRequest(
    action: string, 
    payload: any, 
    options: RequestOptions, 
    type: 'action' | 'compensation'
  ): Promise<AxiosResponse> {
    const endpoint = this.getActionEndpoint(action, type);
    const method = this.getHttpMethod(action, type);

    const requestConfig: AxiosRequestConfig = {
      method,
      url: endpoint,
      timeout: options.timeout,
      headers: options.headers
    };

    if (method === 'GET' || method === 'DELETE') {
      requestConfig.params = payload;
    } else {
      requestConfig.data = payload;
    }

    return this.httpClient.request(requestConfig);
  }

  /**
   * Get endpoint for action
   */
  private getActionEndpoint(action: string, type: 'action' | 'compensation'): string {
    // Map actions to endpoints based on service and action type
    const actionMappings: Record<string, Record<string, string>> = {
      'auth-service': {
        'createUser': '/users',
        'deleteUser': '/users',
        'createUsersBatch': '/users/batch',
        'deleteUsersBatch': '/users/batch',
        'checkDepartmentCapacity': '/admin/departments/capacity',
        'updateDepartmentCapacity': '/admin/departments/capacity'
      },
      'doctor-service': {
        'createDoctor': '/doctors',
        'deleteDoctor': '/doctors',
        'updateDoctor': '/doctors'
      },
      'patient-service': {
        'createPatient': '/patients',
        'deletePatient': '/patients'
      },
      'appointment-service': {
        'createAppointment': '/appointments',
        'deleteAppointment': '/appointments'
      },
      'medical-records-service': {
        'createRecord': '/records',
        'deleteRecord': '/records'
      },
      'payment-service': {
        'processPayment': '/payments',
        'refundPayment': '/payments/refund'
      },
      'file-service': {
        'uploadFile': '/upload',
        'deleteFile': '/files'
      }
    };

    const serviceActions = actionMappings[this.serviceName] || {};
    return serviceActions[action] || `/${action}`;
  }

  /**
   * Get HTTP method for action
   */
  private getHttpMethod(action: string, type: 'action' | 'compensation'): string {
    if (type === 'compensation' || action.startsWith('delete')) {
      return 'DELETE';
    }
    
    if (action.startsWith('create') || action.startsWith('process')) {
      return 'POST';
    }
    
    if (action.startsWith('update')) {
      return 'PUT';
    }
    
    if (action.startsWith('get') || action.startsWith('check')) {
      return 'GET';
    }

    return 'POST'; // Default
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.httpClient.get(this.config.healthEndpoint, {
        timeout: 5000
      });
      
      return response.status === 200;
    } catch (error: any) {
      this.logger.warn('Health check failed', { 
        service: this.serviceName,
        error: error.message 
      });
      return false;
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
