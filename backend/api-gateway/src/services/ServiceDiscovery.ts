/**
 * ServiceDiscovery - Service Discovery and Health Management
 * Automatic service discovery and health monitoring for microservices
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Service Discovery Pattern, Vietnamese Healthcare Standards, Health Monitoring
 */

import axios from 'axios';
import { EnhancedGatewayConfig, ServiceEndpoint, ServiceInstance } from '../config/EnhancedGatewayConfig';

export interface ServiceDiscoveryConfig {
  discoveryInterval: number;
  healthCheckInterval: number;
  healthCheckTimeout: number;
  maxRetries: number;
  retryDelay: number;
  enableAutoRegistration: boolean;
  enableAutoDeregistration: boolean;
}

export interface HealthCheckResult {
  serviceName: string;
  instanceId: string;
  healthy: boolean;
  responseTime: number;
  statusCode?: number;
  error?: string;
  timestamp: Date;
  metadata?: any;
}

export interface ServiceRegistration {
  serviceName: string;
  instanceId: string;
  host: string;
  port: number;
  healthCheckPath: string;
  metadata: Record<string, any>;
  tags: string[];
}

export class ServiceDiscovery {
  private static instance: ServiceDiscovery;
  private config: EnhancedGatewayConfig;
  private discoveryConfig: ServiceDiscoveryConfig;
  private healthCheckTimer: NodeJS.Timeout | null = null;
  private discoveryTimer: NodeJS.Timeout | null = null;
  private healthCheckResults: Map<string, HealthCheckResult[]> = new Map();
  private registeredServices: Map<string, ServiceRegistration> = new Map();

  private constructor() {
    this.config = EnhancedGatewayConfig.getInstance();
    this.discoveryConfig = {
      discoveryInterval: 60000, // 1 minute
      healthCheckInterval: 30000, // 30 seconds
      healthCheckTimeout: 5000, // 5 seconds
      maxRetries: 3,
      retryDelay: 1000,
      enableAutoRegistration: true,
      enableAutoDeregistration: true
    };
  }

  public static getInstance(): ServiceDiscovery {
    if (!ServiceDiscovery.instance) {
      ServiceDiscovery.instance = new ServiceDiscovery();
    }
    return ServiceDiscovery.instance;
  }

  /**
   * Start service discovery and health monitoring
   */
  public async start(): Promise<void> {
    try {
      console.log('🔍 Starting Service Discovery for Vietnamese Healthcare System');

      // Perform initial service discovery
      await this.discoverServices();

      // Start periodic health checks
      this.startHealthChecks();

      // Start periodic service discovery
      this.startServiceDiscovery();

      console.log('✅ Service Discovery started successfully');

    } catch (error) {
      console.error('❌ Failed to start Service Discovery:', error);
      throw error;
    }
  }

  /**
   * Discover available services
   */
  private async discoverServices(): Promise<void> {
    try {
      console.log('🔍 Discovering services...');

      const allServices = this.config.getAllServices();
      const discoveryPromises: Promise<void>[] = [];

      for (const [serviceName, serviceConfig] of Object.entries(allServices)) {
        if (serviceConfig.enabled) {
          discoveryPromises.push(this.discoverService(serviceName, serviceConfig));
        }
      }

      await Promise.all(discoveryPromises);

      console.log('✅ Service discovery completed');

    } catch (error) {
      console.error('❌ Service discovery failed:', error);
    }
  }

  /**
   * Discover individual service
   */
  private async discoverService(serviceName: string, serviceConfig: ServiceEndpoint): Promise<void> {
    try {
      console.log(`🔍 Discovering ${serviceName}...`);

      // For now, we use the configured instances
      // In a real implementation, this might query a service registry
      for (const instance of serviceConfig.instances) {
        const registration: ServiceRegistration = {
          serviceName,
          instanceId: instance.id,
          host: instance.host,
          port: instance.port,
          healthCheckPath: serviceConfig.healthCheckPath,
          metadata: {
            version: serviceConfig.version,
            priority: serviceConfig.priority,
            vietnameseHealthcare: true,
            hipaaCompliant: true
          },
          tags: ['healthcare', 'vietnamese', 'microservice']
        };

        this.registeredServices.set(`${serviceName}:${instance.id}`, registration);
        console.log(`   ✅ Registered ${serviceName} instance: ${instance.id}`);
      }

    } catch (error) {
      console.error(`❌ Failed to discover ${serviceName}:`, error);
    }
  }

  /**
   * Start health checks
   */
  private startHealthChecks(): void {
    this.healthCheckTimer = setInterval(async () => {
      await this.performHealthChecks();
    }, this.discoveryConfig.healthCheckInterval);

    console.log(`🔍 Health checks started (${this.discoveryConfig.healthCheckInterval}ms intervals)`);
  }

  /**
   * Start service discovery
   */
  private startServiceDiscovery(): void {
    this.discoveryTimer = setInterval(async () => {
      await this.discoverServices();
    }, this.discoveryConfig.discoveryInterval);

    console.log(`🔍 Service discovery started (${this.discoveryConfig.discoveryInterval}ms intervals)`);
  }

  /**
   * Perform health checks on all registered services
   */
  private async performHealthChecks(): Promise<void> {
    try {
      const healthCheckPromises: Promise<HealthCheckResult>[] = [];

      for (const registration of this.registeredServices.values()) {
        healthCheckPromises.push(this.performHealthCheck(registration));
      }

      const results = await Promise.all(healthCheckPromises);

      // Process health check results
      for (const result of results) {
        this.processHealthCheckResult(result);
      }

      // Log health summary
      this.logHealthSummary();

    } catch (error) {
      console.error('❌ Health check batch failed:', error);
    }
  }

  /**
   * Perform health check on individual service
   */
  private async performHealthCheck(registration: ServiceRegistration): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const healthCheckUrl = `http://${registration.host}:${registration.port}${registration.healthCheckPath}`;

    try {
      const response = await axios.get(healthCheckUrl, {
        timeout: this.discoveryConfig.healthCheckTimeout,
        headers: {
          'User-Agent': 'Hospital-Management-Gateway/2.0.0',
          'X-Health-Check': 'true',
          'X-Vietnamese-Healthcare': 'true'
        }
      });

      const responseTime = Date.now() - startTime;

      return {
        serviceName: registration.serviceName,
        instanceId: registration.instanceId,
        healthy: response.status >= 200 && response.status < 300,
        responseTime,
        statusCode: response.status,
        timestamp: new Date(),
        metadata: {
          version: response.data?.version,
          uptime: response.data?.uptime,
          environment: response.data?.environment
        }
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;

      return {
        serviceName: registration.serviceName,
        instanceId: registration.instanceId,
        healthy: false,
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
    }
  }

  /**
   * Process health check result
   */
  private processHealthCheckResult(result: HealthCheckResult): void {
    const key = `${result.serviceName}:${result.instanceId}`;
    
    // Store health check result
    if (!this.healthCheckResults.has(key)) {
      this.healthCheckResults.set(key, []);
    }
    
    const results = this.healthCheckResults.get(key)!;
    results.push(result);
    
    // Keep only last 10 results
    if (results.length > 10) {
      results.shift();
    }

    // Update service configuration
    this.config.updateServiceHealth(
      result.serviceName,
      result.instanceId,
      result.healthy,
      result.responseTime
    );

    // Log health status changes
    if (!result.healthy) {
      console.warn(`⚠️ Health check failed for ${result.serviceName}:${result.instanceId} - ${result.error}`);
    }
  }

  /**
   * Log health summary
   */
  private logHealthSummary(): void {
    const allServices = this.config.getAllServices();
    let totalInstances = 0;
    let healthyInstances = 0;

    for (const [serviceName, serviceConfig] of Object.entries(allServices)) {
      if (serviceConfig.enabled) {
        const healthy = this.config.getHealthyInstances(serviceName);
        totalInstances += serviceConfig.instances.length;
        healthyInstances += healthy.length;
      }
    }

    const healthPercentage = totalInstances > 0 ? (healthyInstances / totalInstances * 100).toFixed(1) : '0';
    
    if (healthyInstances === totalInstances) {
      console.log(`💚 All services healthy (${healthyInstances}/${totalInstances}) - ${healthPercentage}%`);
    } else {
      console.warn(`⚠️ Service health: ${healthyInstances}/${totalInstances} healthy (${healthPercentage}%)`);
    }
  }

  /**
   * Register new service instance
   */
  public async registerService(registration: ServiceRegistration): Promise<boolean> {
    try {
      const key = `${registration.serviceName}:${registration.instanceId}`;
      
      // Check if service is already registered
      if (this.registeredServices.has(key)) {
        console.warn(`⚠️ Service ${key} is already registered`);
        return false;
      }

      // Perform initial health check
      const healthResult = await this.performHealthCheck(registration);
      
      if (!healthResult.healthy) {
        console.error(`❌ Cannot register unhealthy service: ${key}`);
        return false;
      }

      // Register service
      this.registeredServices.set(key, registration);
      
      // Add to configuration
      const serviceConfig = this.config.getServiceConfig(registration.serviceName);
      if (serviceConfig) {
        const newInstance: ServiceInstance = {
          id: registration.instanceId,
          host: registration.host,
          port: registration.port,
          healthy: true,
          lastHealthCheck: new Date(),
          responseTime: healthResult.responseTime,
          errorCount: 0,
          weight: 1
        };
        
        serviceConfig.instances.push(newInstance);
      }

      console.log(`✅ Registered service: ${key}`);
      return true;

    } catch (error) {
      console.error(`❌ Failed to register service ${registration.serviceName}:${registration.instanceId}:`, error);
      return false;
    }
  }

  /**
   * Deregister service instance
   */
  public deregisterService(serviceName: string, instanceId: string): boolean {
    try {
      const key = `${serviceName}:${instanceId}`;
      
      if (!this.registeredServices.has(key)) {
        console.warn(`⚠️ Service ${key} is not registered`);
        return false;
      }

      // Remove from registered services
      this.registeredServices.delete(key);
      
      // Remove from configuration
      const serviceConfig = this.config.getServiceConfig(serviceName);
      if (serviceConfig) {
        serviceConfig.instances = serviceConfig.instances.filter(
          instance => instance.id !== instanceId
        );
      }

      // Remove health check results
      this.healthCheckResults.delete(key);

      console.log(`✅ Deregistered service: ${key}`);
      return true;

    } catch (error) {
      console.error(`❌ Failed to deregister service ${serviceName}:${instanceId}:`, error);
      return false;
    }
  }

  /**
   * Get service discovery status
   */
  public getStatus(): any {
    const allServices = this.config.getAllServices();
    const serviceStatuses: Record<string, any> = {};

    for (const [serviceName, serviceConfig] of Object.entries(allServices)) {
      const healthyInstances = this.config.getHealthyInstances(serviceName);
      const recentHealthChecks = this.getRecentHealthChecks(serviceName);

      serviceStatuses[serviceName] = {
        enabled: serviceConfig.enabled,
        totalInstances: serviceConfig.instances.length,
        healthyInstances: healthyInstances.length,
        unhealthyInstances: serviceConfig.instances.length - healthyInstances.length,
        averageResponseTime: this.calculateAverageResponseTime(serviceName),
        lastHealthCheck: this.getLastHealthCheckTime(serviceName),
        recentHealthChecks: recentHealthChecks.length,
        vietnamese: {
          name: this.getVietnameseServiceName(serviceName),
          status: healthyInstances.length > 0 ? 'Hoạt động bình thường' : 'Không khả dụng'
        }
      };
    }

    return {
      discoveryActive: this.discoveryTimer !== null,
      healthChecksActive: this.healthCheckTimer !== null,
      totalRegisteredServices: this.registeredServices.size,
      serviceStatuses,
      configuration: {
        discoveryInterval: this.discoveryConfig.discoveryInterval,
        healthCheckInterval: this.discoveryConfig.healthCheckInterval,
        healthCheckTimeout: this.discoveryConfig.healthCheckTimeout
      },
      vietnamese: {
        title: 'Trạng thái Khám phá Dịch vụ',
        compliance: 'Tuân thủ tiêu chuẩn y tế Việt Nam'
      },
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Get recent health checks for service
   */
  private getRecentHealthChecks(serviceName: string): HealthCheckResult[] {
    const results: HealthCheckResult[] = [];
    
    for (const [key, healthChecks] of this.healthCheckResults.entries()) {
      if (key.startsWith(`${serviceName}:`)) {
        results.push(...healthChecks.slice(-5)); // Last 5 health checks
      }
    }
    
    return results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Calculate average response time for service
   */
  private calculateAverageResponseTime(serviceName: string): number {
    const recentHealthChecks = this.getRecentHealthChecks(serviceName);
    
    if (recentHealthChecks.length === 0) return 0;
    
    const totalTime = recentHealthChecks.reduce((sum, check) => sum + check.responseTime, 0);
    return Math.round(totalTime / recentHealthChecks.length);
  }

  /**
   * Get last health check time for service
   */
  private getLastHealthCheckTime(serviceName: string): Date | null {
    const recentHealthChecks = this.getRecentHealthChecks(serviceName);
    return recentHealthChecks.length > 0 ? recentHealthChecks[0].timestamp : null;
  }

  /**
   * Get Vietnamese service name
   */
  private getVietnameseServiceName(serviceName: string): string {
    const vietnameseNames: Record<string, string> = {
      'identity-service': 'Dịch vụ Xác thực',
      'patient-registry-service': 'Dịch vụ Đăng ký Bệnh nhân',
      'provider-staff-service': 'Dịch vụ Nhân viên Y tế',
      'scheduling-service': 'Dịch vụ Đặt lịch Khám',
      'clinical-emr-service': 'Dịch vụ Hồ sơ Y tế',
      'billing-service': 'Dịch vụ Thanh toán',
      'notifications-service': 'Dịch vụ Thông báo'
    };

    return vietnameseNames[serviceName] || serviceName;
  }

  /**
   * Get Vietnamese healthcare service discovery summary
   */
  public getVietnameseHealthcareSummary(): any {
    const status = this.getStatus();
    const totalServices = Object.keys(status.serviceStatuses).length;
    const healthyServices = Object.values(status.serviceStatuses).filter((s: any) => s.healthyInstances > 0).length;

    return {
      title: 'Tóm tắt Khám phá Dịch vụ Y tế Việt Nam',
      overview: {
        totalServices,
        healthyServices,
        unhealthyServices: totalServices - healthyServices,
        overallHealth: totalServices > 0 ? (healthyServices / totalServices * 100).toFixed(1) + '%' : '0%'
      },
      compliance: {
        vietnameseHealthcareStandards: true,
        hipaaCompliant: true,
        serviceDiscovery: true,
        healthMonitoring: true
      },
      services: status.serviceStatuses,
      monitoring: {
        discoveryActive: status.discoveryActive,
        healthChecksActive: status.healthChecksActive,
        lastUpdated: status.lastUpdated
      }
    };
  }

  /**
   * Stop service discovery and health monitoring
   */
  public stop(): void {
    try {
      if (this.healthCheckTimer) {
        clearInterval(this.healthCheckTimer);
        this.healthCheckTimer = null;
      }

      if (this.discoveryTimer) {
        clearInterval(this.discoveryTimer);
        this.discoveryTimer = null;
      }

      console.log('🔌 Service Discovery stopped');

    } catch (error) {
      console.error('❌ Error stopping Service Discovery:', error);
    }
  }
}
