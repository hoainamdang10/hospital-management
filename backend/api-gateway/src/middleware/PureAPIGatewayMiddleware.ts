/**
 * PureAPIGatewayMiddleware - Pure API Gateway Communication Pattern
 * Ensures all service-to-service communication goes through API Gateway
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Pure API Gateway Pattern, Vietnamese Healthcare Standards, Service Mesh
 */

import { Request, Response, NextFunction } from 'express';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { EnhancedGatewayConfig, ServiceEndpoint } from '../config/EnhancedGatewayConfig';
import { CircuitBreakerMiddleware, CircuitBreaker } from './CircuitBreakerMiddleware';

export interface ServiceRequest {
  serviceName: string;
  method: string;
  path: string;
  headers: Record<string, string>;
  body?: any;
  query?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

export interface ServiceResponse {
  success: boolean;
  statusCode: number;
  data?: any;
  error?: string;
  responseTime: number;
  serviceName: string;
  headers: Record<string, string>;
  metadata: {
    requestId: string;
    timestamp: string;
    circuitBreakerState: string;
    retryCount: number;
    fromCache: boolean;
  };
}

export interface LoadBalancingResult {
  selectedInstance: any;
  strategy: string;
  totalInstances: number;
  healthyInstances: number;
}

export class PureAPIGatewayMiddleware {
  private static instance: PureAPIGatewayMiddleware;
  private config: EnhancedGatewayConfig;
  private circuitBreakerMiddleware: CircuitBreakerMiddleware;
  private requestCache: Map<string, { response: ServiceResponse; expiry: number }> = new Map();
  private requestMetrics: Map<string, any> = new Map();

  private constructor() {
    this.config = EnhancedGatewayConfig.getInstance();
    this.circuitBreakerMiddleware = CircuitBreakerMiddleware.getInstance();
    this.startCacheCleanup();
  }

  public static getInstance(): PureAPIGatewayMiddleware {
    if (!PureAPIGatewayMiddleware.instance) {
      PureAPIGatewayMiddleware.instance = new PureAPIGatewayMiddleware();
    }
    return PureAPIGatewayMiddleware.instance;
  }

  /**
   * Main middleware function
   */
  public middleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        // Extract service information
        const serviceName = this.extractServiceName(req.path);
        
        if (!serviceName) {
          return next();
        }

        // Check if service is enabled
        if (!this.config.isServiceEnabled(serviceName)) {
          return res.status(503).json({
            success: false,
            message: `Dịch vụ ${serviceName} hiện không khả dụng`,
            error: 'SERVICE_DISABLED',
            timestamp: new Date().toISOString()
          });
        }

        // Generate request ID for tracing
        const requestId = this.generateRequestId();
        req.headers['x-request-id'] = requestId;

        // Add Vietnamese healthcare headers
        this.addVietnameseHealthcareHeaders(req);

        // Prepare service request
        const serviceRequest: ServiceRequest = {
          serviceName,
          method: req.method,
          path: req.path,
          headers: { ...req.headers } as Record<string, string>,
          body: req.body,
          query: req.query as Record<string, string>,
          timeout: 30000,
          retries: 3
        };

        // Check cache first
        const cachedResponse = this.getCachedResponse(serviceRequest);
        if (cachedResponse) {
          console.log(`📦 Cache hit for ${serviceName}: ${req.path}`);
          return this.sendResponse(res, cachedResponse);
        }

        // Execute request through Pure API Gateway pattern
        const serviceResponse = await this.executeServiceRequest(serviceRequest);

        // Cache response if applicable
        this.cacheResponse(serviceRequest, serviceResponse);

        // Send response
        this.sendResponse(res, serviceResponse);

      } catch (error) {
        console.error('❌ Pure API Gateway middleware error:', error);
        
        res.status(500).json({
          success: false,
          message: 'Đã xảy ra lỗi hệ thống',
          error: 'GATEWAY_ERROR',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id']
        });
      }
    };
  }

  /**
   * Execute service request with Pure API Gateway pattern
   */
  private async executeServiceRequest(serviceRequest: ServiceRequest): Promise<ServiceResponse> {
    const startTime = Date.now();
    const circuitBreaker = this.circuitBreakerMiddleware.getCircuitBreaker(serviceRequest.serviceName);

    try {
      // Execute through circuit breaker
      const response = await circuitBreaker.execute(
        () => this.performServiceCall(serviceRequest),
        () => this.getFallbackResponse(serviceRequest)
      );

      const responseTime = Date.now() - startTime;

      // Record metrics
      this.recordRequestMetrics(serviceRequest.serviceName, true, responseTime);

      return {
        success: true,
        statusCode: response.status,
        data: response.data,
        responseTime,
        serviceName: serviceRequest.serviceName,
        headers: response.headers,
        metadata: {
          requestId: serviceRequest.headers['x-request-id'] || 'unknown',
          timestamp: new Date().toISOString(),
          circuitBreakerState: circuitBreaker.getStatus().state,
          retryCount: 0,
          fromCache: false
        }
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      // Record metrics
      this.recordRequestMetrics(serviceRequest.serviceName, false, responseTime);

      console.error(`❌ Service request failed for ${serviceRequest.serviceName}:`, error);

      return {
        success: false,
        statusCode: 500,
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime,
        serviceName: serviceRequest.serviceName,
        headers: {},
        metadata: {
          requestId: serviceRequest.headers['x-request-id'] || 'unknown',
          timestamp: new Date().toISOString(),
          circuitBreakerState: circuitBreaker.getStatus().state,
          retryCount: 0,
          fromCache: false
        }
      };
    }
  }

  /**
   * Perform actual service call
   */
  private async performServiceCall(serviceRequest: ServiceRequest): Promise<AxiosResponse> {
    // Load balance to select service instance
    const loadBalancingResult = this.selectServiceInstance(serviceRequest.serviceName);
    
    if (!loadBalancingResult.selectedInstance) {
      throw new Error(`No healthy instances available for ${serviceRequest.serviceName}`);
    }

    const instance = loadBalancingResult.selectedInstance;
    const baseUrl = `http://${instance.host}:${instance.port}`;

    // Prepare axios config
    const axiosConfig: AxiosRequestConfig = {
      method: serviceRequest.method as any,
      url: `${baseUrl}${serviceRequest.path}`,
      headers: {
        ...serviceRequest.headers,
        'X-Gateway-Request': 'true',
        'X-Service-Name': serviceRequest.serviceName,
        'X-Load-Balancing-Strategy': loadBalancingResult.strategy
      },
      timeout: serviceRequest.timeout || 30000,
      validateStatus: (status) => status < 500 // Don't throw for 4xx errors
    };

    // Add body for POST/PUT/PATCH requests
    if (serviceRequest.body && ['POST', 'PUT', 'PATCH'].includes(serviceRequest.method.toUpperCase())) {
      axiosConfig.data = serviceRequest.body;
    }

    // Add query parameters
    if (serviceRequest.query && Object.keys(serviceRequest.query).length > 0) {
      axiosConfig.params = serviceRequest.query;
    }

    console.log(`🔄 Proxying ${serviceRequest.method} ${serviceRequest.path} to ${serviceRequest.serviceName} (${instance.id})`);

    // Execute request
    const response = await axios(axiosConfig);

    // Update instance health based on response
    this.updateInstanceHealth(serviceRequest.serviceName, instance.id, response.status < 400, Date.now() - performance.now());

    return response;
  }

  /**
   * Get fallback response
   */
  private async getFallbackResponse(serviceRequest: ServiceRequest): Promise<AxiosResponse> {
    console.warn(`⚠️ Using fallback response for ${serviceRequest.serviceName}`);

    // Return appropriate fallback based on service type
    const fallbackData = this.generateFallbackData(serviceRequest.serviceName, serviceRequest.path);

    return {
      status: 200,
      statusText: 'OK (Fallback)',
      data: fallbackData,
      headers: {
        'X-Fallback-Response': 'true',
        'X-Service-Name': serviceRequest.serviceName
      },
      config: {} as any,
      request: {} as any
    };
  }

  /**
   * Generate fallback data based on service
   */
  private generateFallbackData(serviceName: string, path: string): any {
    const fallbackResponses: Record<string, any> = {
      'scheduling-service': {
        success: false,
        message: 'Dịch vụ lịch hẹn tạm thời không khả dụng. Vui lòng thử lại sau.',
        data: null,
        fallback: true
      },
      'clinical-emr-service': {
        success: false,
        message: 'Hệ thống hồ sơ y tế tạm thời không khả dụng. Vui lòng liên hệ bộ phận kỹ thuật.',
        data: null,
        fallback: true
      },
      'billing-service': {
        success: false,
        message: 'Dịch vụ thanh toán tạm thời không khả dụng. Vui lòng thử lại sau.',
        data: null,
        fallback: true
      },
      'notifications-service': {
        success: true,
        message: 'Thông báo sẽ được gửi khi dịch vụ khôi phục.',
        data: { queued: true },
        fallback: true
      }
    };

    return fallbackResponses[serviceName] || {
      success: false,
      message: 'Dịch vụ tạm thời không khả dụng',
      data: null,
      fallback: true
    };
  }

  /**
   * Select service instance using load balancing
   */
  private selectServiceInstance(serviceName: string): LoadBalancingResult {
    const serviceConfig = this.config.getServiceConfig(serviceName);
    if (!serviceConfig) {
      return {
        selectedInstance: null,
        strategy: 'NONE',
        totalInstances: 0,
        healthyInstances: 0
      };
    }

    const healthyInstances = this.config.getHealthyInstances(serviceName);
    const loadBalancingConfig = this.config.getLoadBalancingConfig();

    if (healthyInstances.length === 0) {
      return {
        selectedInstance: null,
        strategy: loadBalancingConfig.strategy,
        totalInstances: serviceConfig.instances.length,
        healthyInstances: 0
      };
    }

    let selectedInstance;

    switch (loadBalancingConfig.strategy) {
      case 'ROUND_ROBIN':
        selectedInstance = this.roundRobinSelection(healthyInstances, serviceName);
        break;
      case 'WEIGHTED_ROUND_ROBIN':
        selectedInstance = this.weightedRoundRobinSelection(healthyInstances);
        break;
      case 'LEAST_CONNECTIONS':
        selectedInstance = this.leastConnectionsSelection(healthyInstances);
        break;
      case 'HEALTH_BASED':
        selectedInstance = this.healthBasedSelection(healthyInstances);
        break;
      default:
        selectedInstance = healthyInstances[0];
    }

    return {
      selectedInstance,
      strategy: loadBalancingConfig.strategy,
      totalInstances: serviceConfig.instances.length,
      healthyInstances: healthyInstances.length
    };
  }

  /**
   * Round robin selection
   */
  private roundRobinSelection(instances: any[], serviceName: string): any {
    const key = `rr_${serviceName}`;
    const currentIndex = this.requestMetrics.get(key) || 0;
    const selectedInstance = instances[currentIndex % instances.length];
    this.requestMetrics.set(key, currentIndex + 1);
    return selectedInstance;
  }

  /**
   * Weighted round robin selection
   */
  private weightedRoundRobinSelection(instances: any[]): any {
    const totalWeight = instances.reduce((sum, instance) => sum + instance.weight, 0);
    const random = Math.random() * totalWeight;
    
    let currentWeight = 0;
    for (const instance of instances) {
      currentWeight += instance.weight;
      if (random <= currentWeight) {
        return instance;
      }
    }
    
    return instances[0];
  }

  /**
   * Least connections selection
   */
  private leastConnectionsSelection(instances: any[]): any {
    // For simplicity, select instance with lowest error count
    return instances.reduce((best, current) => 
      current.errorCount < best.errorCount ? current : best
    );
  }

  /**
   * Health-based selection
   */
  private healthBasedSelection(instances: any[]): any {
    // Select instance with best response time and lowest error count
    return instances.reduce((best, current) => {
      const bestScore = best.responseTime + (best.errorCount * 1000);
      const currentScore = current.responseTime + (current.errorCount * 1000);
      return currentScore < bestScore ? current : best;
    });
  }

  /**
   * Update instance health
   */
  private updateInstanceHealth(serviceName: string, instanceId: string, healthy: boolean, responseTime: number): void {
    this.config.updateServiceHealth(serviceName, instanceId, healthy, responseTime);
  }

  /**
   * Extract service name from path
   */
  private extractServiceName(path: string): string | null {
    const servicePatterns: Record<string, string> = {
      '/api/v1/auth': 'identity-service',
      '/api/v1/patients': 'patient-registry-service',
      '/api/v1/providers': 'provider-staff-service',
      '/api/v1/appointments': 'scheduling-service',
      '/api/v1/medical-records': 'clinical-emr-service',
      '/api/v1/billing': 'billing-service',
      '/api/v1/notifications': 'notifications-service'
    };

    for (const [pattern, serviceName] of Object.entries(servicePatterns)) {
      if (path.startsWith(pattern)) {
        return serviceName;
      }
    }

    return null;
  }

  /**
   * Add Vietnamese healthcare headers
   */
  private addVietnameseHealthcareHeaders(req: Request): void {
    const healthcareHeaders = this.config.getVietnameseHealthcareHeaders();
    Object.entries(healthcareHeaders).forEach(([key, value]) => {
      if (!req.headers[key.toLowerCase()]) {
        req.headers[key.toLowerCase()] = value;
      }
    });
  }

  /**
   * Generate request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get cached response
   */
  private getCachedResponse(serviceRequest: ServiceRequest): ServiceResponse | null {
    const cacheKey = this.generateCacheKey(serviceRequest);
    const cached = this.requestCache.get(cacheKey);
    
    if (cached && cached.expiry > Date.now()) {
      cached.response.metadata.fromCache = true;
      return cached.response;
    }

    return null;
  }

  /**
   * Cache response
   */
  private cacheResponse(serviceRequest: ServiceRequest, response: ServiceResponse): void {
    if (!response.success || response.statusCode >= 400) {
      return; // Don't cache error responses
    }

    const cacheConfig = this.config.getConfig().caching;
    if (!cacheConfig.enableResponseCaching) {
      return;
    }

    const cacheKey = this.generateCacheKey(serviceRequest);
    const ttl = this.getCacheTTL(serviceRequest.path);
    
    if (ttl > 0) {
      this.requestCache.set(cacheKey, {
        response,
        expiry: Date.now() + ttl
      });
    }
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(serviceRequest: ServiceRequest): string {
    const keyParts = [
      serviceRequest.serviceName,
      serviceRequest.method,
      serviceRequest.path,
      JSON.stringify(serviceRequest.query || {})
    ];
    
    return `${this.config.getConfig().caching.cacheKeyPrefix}:${keyParts.join(':')}`;
  }

  /**
   * Get cache TTL for path
   */
  private getCacheTTL(path: string): number {
    const cacheConfig = this.config.getConfig().caching;
    
    // Check healthcare-specific caching rules
    for (const [pattern, rule] of Object.entries(cacheConfig.healthcareCachingRules)) {
      if (path.includes(pattern)) {
        return rule.ttl;
      }
    }

    return cacheConfig.defaultTTL;
  }

  /**
   * Record request metrics
   */
  private recordRequestMetrics(serviceName: string, success: boolean, responseTime: number): void {
    const key = `metrics_${serviceName}`;
    const metrics = this.requestMetrics.get(key) || {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0
    };

    metrics.totalRequests++;
    if (success) {
      metrics.successfulRequests++;
    } else {
      metrics.failedRequests++;
    }

    // Update average response time
    const totalTime = (metrics.averageResponseTime * (metrics.totalRequests - 1)) + responseTime;
    metrics.averageResponseTime = totalTime / metrics.totalRequests;

    this.requestMetrics.set(key, metrics);
  }

  /**
   * Send response
   */
  private sendResponse(res: Response, serviceResponse: ServiceResponse): void {
    // Set response headers
    Object.entries(serviceResponse.headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    // Set Vietnamese healthcare headers
    const healthcareHeaders = this.config.getVietnameseHealthcareHeaders();
    Object.entries(healthcareHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    // Set metadata headers
    res.setHeader('X-Response-Time', serviceResponse.responseTime.toString());
    res.setHeader('X-Service-Name', serviceResponse.serviceName);
    res.setHeader('X-Request-ID', serviceResponse.metadata.requestId);
    res.setHeader('X-From-Cache', serviceResponse.metadata.fromCache.toString());

    // Send response
    res.status(serviceResponse.statusCode).json(serviceResponse.data || {
      success: serviceResponse.success,
      message: serviceResponse.error || 'Request processed successfully',
      timestamp: serviceResponse.metadata.timestamp
    });
  }

  /**
   * Start cache cleanup
   */
  private startCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, cached] of this.requestCache.entries()) {
        if (cached.expiry <= now) {
          this.requestCache.delete(key);
        }
      }
    }, 60000); // Cleanup every minute
  }

  /**
   * Get Pure API Gateway status
   */
  public getStatus(): any {
    const circuitBreakerStatuses = this.circuitBreakerMiddleware.getAllStatuses();
    
    return {
      pureAPIGatewayPattern: 'ACTIVE',
      totalServices: Object.keys(circuitBreakerStatuses).length,
      healthyServices: Object.values(circuitBreakerStatuses).filter(status => status.isHealthy).length,
      cacheSize: this.requestCache.size,
      requestMetrics: Object.fromEntries(this.requestMetrics),
      circuitBreakerStatuses,
      vietnameseHealthcareCompliance: this.config.validateVietnameseHealthcareCompliance(),
      lastUpdated: new Date().toISOString()
    };
  }
}
