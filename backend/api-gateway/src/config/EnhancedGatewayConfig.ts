/**
 * EnhancedGatewayConfig - Enhanced API Gateway Configuration
 * Comprehensive configuration for Pure API Gateway Communication pattern
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Pure API Gateway Pattern, Vietnamese Healthcare Standards, Circuit Breaker Pattern
 */

export interface ServiceEndpoint {
  serviceName: string;
  baseUrl: string;
  port: number;
  healthCheckPath: string;
  version: string;
  enabled: boolean;
  priority: number;
  instances: ServiceInstance[];
}

export interface ServiceInstance {
  id: string;
  host: string;
  port: number;
  healthy: boolean;
  lastHealthCheck: Date;
  responseTime: number;
  errorCount: number;
  weight: number;
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringPeriod: number;
  halfOpenMaxCalls: number;
  slowCallThreshold: number;
  slowCallDurationThreshold: number;
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests: boolean;
  skipFailedRequests: boolean;
  keyGenerator: string;
  healthcareRoleMultipliers: Record<string, number>;
}

export interface VietnameseHealthcareConfig {
  enableHIPAACompliance: boolean;
  enableVietnameseValidation: boolean;
  enableBHYTIntegration: boolean;
  enableBHTNIntegration: boolean;
  enableMOHReporting: boolean;
  auditLogging: boolean;
  dataEncryption: boolean;
  vietnameseLanguageSupport: boolean;
}

export interface LoadBalancingConfig {
  strategy: 'ROUND_ROBIN' | 'WEIGHTED_ROUND_ROBIN' | 'LEAST_CONNECTIONS' | 'HEALTH_BASED';
  healthCheckInterval: number;
  unhealthyThreshold: number;
  healthyThreshold: number;
  maxRetries: number;
  retryDelay: number;
}

export class EnhancedGatewayConfig {
  private static instance: EnhancedGatewayConfig;
  
  private config = {
    // Gateway Basic Configuration
    gateway: {
      port: 3100,
      host: '0.0.0.0',
      environment: process.env.NODE_ENV || 'development',
      corsEnabled: true,
      compressionEnabled: true,
      requestLogging: true,
      responseLogging: true,
      maxRequestSize: '10mb',
      requestTimeout: 30000
    },

    // Service Endpoints Configuration
    services: {
      'identity-service': {
        serviceName: 'identity-service',
        baseUrl: process.env.IDENTITY_SERVICE_URL || 'http://localhost:3001',
        port: 3001,
        healthCheckPath: '/health',
        version: '2.0.0',
        enabled: true,
        priority: 1,
        instances: [
          {
            id: 'identity-001',
            host: 'localhost',
            port: 3001,
            healthy: true,
            lastHealthCheck: new Date(),
            responseTime: 0,
            errorCount: 0,
            weight: 1
          }
        ]
      } as ServiceEndpoint,

      'patient-registry-service': {
        serviceName: 'patient-registry-service',
        baseUrl: process.env.PATIENT_SERVICE_URL || 'http://localhost:3003',
        port: 3003,
        healthCheckPath: '/health',
        version: '2.0.0',
        enabled: true,
        priority: 2,
        instances: [
          {
            id: 'patient-001',
            host: 'localhost',
            port: 3003,
            healthy: true,
            lastHealthCheck: new Date(),
            responseTime: 0,
            errorCount: 0,
            weight: 1
          }
        ]
      } as ServiceEndpoint,

      'provider-staff-service': {
        serviceName: 'provider-staff-service',
        baseUrl: process.env.PROVIDER_SERVICE_URL || 'http://localhost:3002',
        port: 3002,
        healthCheckPath: '/health',
        version: '2.0.0',
        enabled: true,
        priority: 3,
        instances: [
          {
            id: 'provider-001',
            host: 'localhost',
            port: 3002,
            healthy: true,
            lastHealthCheck: new Date(),
            responseTime: 0,
            errorCount: 0,
            weight: 1
          }
        ]
      } as ServiceEndpoint,

      'scheduling-service': {
        serviceName: 'scheduling-service',
        baseUrl: process.env.SCHEDULING_SERVICE_URL || 'http://localhost:3004',
        port: 3004,
        healthCheckPath: '/health',
        version: '2.0.0',
        enabled: true,
        priority: 4,
        instances: [
          {
            id: 'scheduling-001',
            host: 'localhost',
            port: 3004,
            healthy: true,
            lastHealthCheck: new Date(),
            responseTime: 0,
            errorCount: 0,
            weight: 1
          }
        ]
      } as ServiceEndpoint,

      'clinical-emr-service': {
        serviceName: 'clinical-emr-service',
        baseUrl: process.env.CLINICAL_SERVICE_URL || 'http://localhost:3005',
        port: 3005,
        healthCheckPath: '/health',
        version: '2.0.0',
        enabled: true,
        priority: 5,
        instances: [
          {
            id: 'clinical-001',
            host: 'localhost',
            port: 3005,
            healthy: true,
            lastHealthCheck: new Date(),
            responseTime: 0,
            errorCount: 0,
            weight: 1
          }
        ]
      } as ServiceEndpoint,

      'billing-service': {
        serviceName: 'billing-service',
        baseUrl: process.env.BILLING_SERVICE_URL || 'http://localhost:3009',
        port: 3009,
        healthCheckPath: '/health',
        version: '2.0.0',
        enabled: true,
        priority: 6,
        instances: [
          {
            id: 'billing-001',
            host: 'localhost',
            port: 3009,
            healthy: true,
            lastHealthCheck: new Date(),
            responseTime: 0,
            errorCount: 0,
            weight: 1
          }
        ]
      } as ServiceEndpoint,

      'notifications-service': {
        serviceName: 'notifications-service',
        baseUrl: process.env.NOTIFICATIONS_SERVICE_URL || 'http://localhost:3011',
        port: 3011,
        healthCheckPath: '/health',
        version: '2.0.0',
        enabled: true,
        priority: 7,
        instances: [
          {
            id: 'notifications-001',
            host: 'localhost',
            port: 3011,
            healthy: true,
            lastHealthCheck: new Date(),
            responseTime: 0,
            errorCount: 0,
            weight: 1
          }
        ]
      } as ServiceEndpoint
    },

    // Circuit Breaker Configuration
    circuitBreaker: {
      failureThreshold: 5,
      recoveryTimeout: 60000,
      monitoringPeriod: 10000,
      halfOpenMaxCalls: 3,
      slowCallThreshold: 5,
      slowCallDurationThreshold: 5000
    } as CircuitBreakerConfig,

    // Rate Limiting Configuration
    rateLimit: {
      windowMs: 60000, // 1 minute
      maxRequests: 100,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      keyGenerator: 'ip',
      healthcareRoleMultipliers: {
        'PATIENT': 1.0,
        'DOCTOR': 2.0,
        'NURSE': 1.5,
        'ADMIN': 3.0,
        'EMERGENCY': 10.0,
        'SYSTEM': 5.0
      }
    } as RateLimitConfig,

    // Vietnamese Healthcare Configuration
    vietnameseHealthcare: {
      enableHIPAACompliance: true,
      enableVietnameseValidation: true,
      enableBHYTIntegration: true,
      enableBHTNIntegration: true,
      enableMOHReporting: true,
      auditLogging: true,
      dataEncryption: true,
      vietnameseLanguageSupport: true
    } as VietnameseHealthcareConfig,

    // Load Balancing Configuration
    loadBalancing: {
      strategy: 'HEALTH_BASED' as const,
      healthCheckInterval: 30000,
      unhealthyThreshold: 3,
      healthyThreshold: 2,
      maxRetries: 3,
      retryDelay: 1000
    } as LoadBalancingConfig,

    // Security Configuration
    security: {
      enableJWTValidation: true,
      enableRoleBasedAccess: true,
      enableIPWhitelist: false,
      enableRequestSigning: true,
      enableResponseEncryption: true,
      jwtSecret: process.env.JWT_SECRET || 'hospital-management-secret',
      encryptionKey: process.env.ENCRYPTION_KEY || 'vietnamese-healthcare-key',
      allowedOrigins: [
        'http://localhost:3000',
        'https://hospital-management.local',
        'https://hospital-management.vn'
      ]
    },

    // Monitoring Configuration
    monitoring: {
      enableMetrics: true,
      enableTracing: true,
      enableHealthChecks: true,
      metricsInterval: 10000,
      tracingEnabled: true,
      healthCheckInterval: 30000,
      alertThresholds: {
        responseTime: 5000,
        errorRate: 0.05,
        availability: 0.99
      }
    },

    // Caching Configuration
    caching: {
      enableResponseCaching: true,
      enableRequestCaching: false,
      defaultTTL: 300000, // 5 minutes
      maxCacheSize: 100,
      cacheKeyPrefix: 'hms-gateway',
      healthcareCachingRules: {
        'patient-data': { ttl: 60000, sensitive: true },
        'appointment-data': { ttl: 300000, sensitive: false },
        'medical-records': { ttl: 0, sensitive: true }, // No caching for medical records
        'billing-data': { ttl: 600000, sensitive: true },
        'public-data': { ttl: 3600000, sensitive: false }
      }
    }
  };

  private constructor() {}

  public static getInstance(): EnhancedGatewayConfig {
    if (!EnhancedGatewayConfig.instance) {
      EnhancedGatewayConfig.instance = new EnhancedGatewayConfig();
    }
    return EnhancedGatewayConfig.instance;
  }

  public getConfig() {
    return { ...this.config };
  }

  public getServiceConfig(serviceName: string): ServiceEndpoint | null {
    return this.config.services[serviceName] || null;
  }

  public getAllServices(): Record<string, ServiceEndpoint> {
    return { ...this.config.services };
  }

  public getCircuitBreakerConfig(): CircuitBreakerConfig {
    return { ...this.config.circuitBreaker };
  }

  public getRateLimitConfig(): RateLimitConfig {
    return { ...this.config.rateLimit };
  }

  public getVietnameseHealthcareConfig(): VietnameseHealthcareConfig {
    return { ...this.config.vietnameseHealthcare };
  }

  public getLoadBalancingConfig(): LoadBalancingConfig {
    return { ...this.config.loadBalancing };
  }

  public updateServiceHealth(serviceName: string, instanceId: string, healthy: boolean, responseTime: number): void {
    const service = this.config.services[serviceName];
    if (service) {
      const instance = service.instances.find(inst => inst.id === instanceId);
      if (instance) {
        instance.healthy = healthy;
        instance.lastHealthCheck = new Date();
        instance.responseTime = responseTime;
        
        if (!healthy) {
          instance.errorCount++;
        } else {
          instance.errorCount = Math.max(0, instance.errorCount - 1);
        }
      }
    }
  }

  public getHealthyInstances(serviceName: string): ServiceInstance[] {
    const service = this.config.services[serviceName];
    if (!service) return [];
    
    return service.instances.filter(instance => instance.healthy);
  }

  public isServiceEnabled(serviceName: string): boolean {
    const service = this.config.services[serviceName];
    return service ? service.enabled : false;
  }

  public getServicePriority(serviceName: string): number {
    const service = this.config.services[serviceName];
    return service ? service.priority : 999;
  }

  public validateVietnameseHealthcareCompliance(): boolean {
    const healthcare = this.config.vietnameseHealthcare;
    
    return healthcare.enableHIPAACompliance &&
           healthcare.enableVietnameseValidation &&
           healthcare.auditLogging &&
           healthcare.dataEncryption;
  }

  public getServiceRoutePattern(serviceName: string): string {
    const patterns: Record<string, string> = {
      'identity-service': '/api/v1/auth/*',
      'patient-registry-service': '/api/v1/patients/*',
      'provider-staff-service': '/api/v1/providers/*',
      'scheduling-service': '/api/v1/appointments/*',
      'clinical-emr-service': '/api/v1/medical-records/*',
      'billing-service': '/api/v1/billing/*',
      'notifications-service': '/api/v1/notifications/*'
    };

    return patterns[serviceName] || '/api/v1/*';
  }

  public getVietnameseHealthcareHeaders(): Record<string, string> {
    return {
      'X-Healthcare-Standard': 'Vietnamese-MOH-2024',
      'X-HIPAA-Compliant': 'true',
      'X-Language': 'vi-VN',
      'X-Timezone': 'Asia/Ho_Chi_Minh',
      'X-Currency': 'VND',
      'X-Insurance-Support': 'BHYT,BHTN',
      'X-Audit-Required': 'true'
    };
  }
}
