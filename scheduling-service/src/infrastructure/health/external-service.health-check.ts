/**
 * External Service Health Check - Infrastructure Layer
 * Health check implementation for external service dependencies
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Health Check Pattern, Service Monitoring, Circuit Breaker Integration
 */

import { IHealthCheck, HealthCheckResult, HealthStatus } from '../../../shared/infrastructure/health/health-check.interface';
import { ILogger } from '../../../shared/infrastructure/logging/logger.interface';
import { PatientRegistryServiceClient } from '../external-services/patient-registry.service-client';
import { ProviderStaffServiceClient } from '../external-services/provider-staff.service-client';

export interface ExternalServiceHealthMetrics {
  patientRegistryService: {
    isHealthy: boolean;
    responseTime: number;
    consecutiveFailures: number;
    lastSuccessfulCheck?: Date;
    circuitBreakerState: string;
    errorRate: number;
  };
  providerStaffService: {
    isHealthy: boolean;
    responseTime: number;
    consecutiveFailures: number;
    lastSuccessfulCheck?: Date;
    circuitBreakerState: string;
    errorRate: number;
  };
  overallHealth: {
    healthyServices: number;
    totalServices: number;
    healthPercentage: number;
  };
}

export interface ExternalServiceHealthCheckDependencies {
  patientRegistryService: PatientRegistryServiceClient;
  providerStaffService: ProviderStaffServiceClient;
}

/**
 * External Service Health Check
 * Monitors health of external service dependencies
 */
export class ExternalServiceHealthCheck implements IHealthCheck {
  private readonly patientRegistryService: PatientRegistryServiceClient;
  private readonly providerStaffService: ProviderStaffServiceClient;
  private readonly logger: ILogger;
  private readonly checkName: string = 'external-services';
  private metrics: ExternalServiceHealthMetrics;

  constructor(
    dependencies: ExternalServiceHealthCheckDependencies,
    logger: ILogger
  ) {
    this.patientRegistryService = dependencies.patientRegistryService;
    this.providerStaffService = dependencies.providerStaffService;
    this.logger = logger;

    // Initialize metrics
    this.metrics = {
      patientRegistryService: {
        isHealthy: false,
        responseTime: 0,
        consecutiveFailures: 0,
        circuitBreakerState: 'UNKNOWN',
        errorRate: 0
      },
      providerStaffService: {
        isHealthy: false,
        responseTime: 0,
        consecutiveFailures: 0,
        circuitBreakerState: 'UNKNOWN',
        errorRate: 0
      },
      overallHealth: {
        healthyServices: 0,
        totalServices: 2,
        healthPercentage: 0
      }
    };
  }

  /**
   * Perform external services health check
   */
  async check(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      this.logger.debug('Starting external services health check');

      // Check all external services in parallel
      const [patientRegistryResult, providerStaffResult] = await Promise.allSettled([
        this.checkPatientRegistryService(),
        this.checkProviderStaffService()
      ]);

      // Process results
      const patientRegistryHealth = patientRegistryResult.status === 'fulfilled' 
        ? patientRegistryResult.value 
        : { isHealthy: false, error: patientRegistryResult.reason?.message || 'Unknown error' };

      const providerStaffHealth = providerStaffResult.status === 'fulfilled' 
        ? providerStaffResult.value 
        : { isHealthy: false, error: providerStaffResult.reason?.message || 'Unknown error' };

      // Update metrics
      this.updateMetrics(patientRegistryHealth, providerStaffHealth);

      // Determine overall health status
      const overallStatus = this.determineOverallStatus();

      // Create result
      const result: HealthCheckResult = {
        name: this.checkName,
        status: overallStatus,
        message: this.createHealthMessage(overallStatus),
        messageVietnamese: this.createHealthMessageVietnamese(overallStatus),
        timestamp: new Date(),
        responseTime: Date.now() - startTime,
        details: {
          services: {
            patientRegistryService: {
              status: patientRegistryHealth.isHealthy ? 'healthy' : 'unhealthy',
              responseTime: patientRegistryHealth.responseTime,
              error: patientRegistryHealth.error,
              circuitBreakerState: this.metrics.patientRegistryService.circuitBreakerState,
              consecutiveFailures: this.metrics.patientRegistryService.consecutiveFailures,
              lastSuccessfulCheck: this.metrics.patientRegistryService.lastSuccessfulCheck?.toISOString()
            },
            providerStaffService: {
              status: providerStaffHealth.isHealthy ? 'healthy' : 'unhealthy',
              responseTime: providerStaffHealth.responseTime,
              error: providerStaffHealth.error,
              circuitBreakerState: this.metrics.providerStaffService.circuitBreakerState,
              consecutiveFailures: this.metrics.providerStaffService.consecutiveFailures,
              lastSuccessfulCheck: this.metrics.providerStaffService.lastSuccessfulCheck?.toISOString()
            }
          },
          summary: {
            healthyServices: this.metrics.overallHealth.healthyServices,
            totalServices: this.metrics.overallHealth.totalServices,
            healthPercentage: this.metrics.overallHealth.healthPercentage
          }
        }
      };

      this.logger.debug('External services health check completed', {
        overallStatus,
        healthyServices: this.metrics.overallHealth.healthyServices,
        totalServices: this.metrics.overallHealth.totalServices,
        responseTime: result.responseTime
      });

      return result;

    } catch (error) {
      this.logger.error('External services health check error', {
        error: error.message,
        stack: error.stack
      });

      return {
        name: this.checkName,
        status: HealthStatus.UNHEALTHY,
        message: `External services health check failed: ${error.message}`,
        messageVietnamese: `Kiểm tra sức khỏe dịch vụ ngoài thất bại: ${error.message}`,
        timestamp: new Date(),
        responseTime: Date.now() - startTime,
        error: error.message,
        details: {
          error: 'Health check execution failed',
          metrics: this.metrics
        }
      };
    }
  }

  /**
   * Check Patient Registry Service health
   */
  private async checkPatientRegistryService(): Promise<{ isHealthy: boolean; responseTime: number; error?: string }> {
    const startTime = Date.now();

    try {
      this.logger.debug('Checking Patient Registry Service health');

      // Use the service's built-in health check
      const isHealthy = await this.patientRegistryService.checkServiceHealth();
      const responseTime = Date.now() - startTime;

      if (isHealthy) {
        this.logger.debug('Patient Registry Service is healthy', { responseTime });
        return { isHealthy: true, responseTime };
      } else {
        this.logger.warn('Patient Registry Service is unhealthy', { responseTime });
        return { 
          isHealthy: false, 
          responseTime, 
          error: 'Service health check returned false' 
        };
      }

    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.logger.error('Patient Registry Service health check failed', {
        error: error.message,
        responseTime
      });

      return {
        isHealthy: false,
        responseTime,
        error: error.message
      };
    }
  }

  /**
   * Check Provider/Staff Service health
   */
  private async checkProviderStaffService(): Promise<{ isHealthy: boolean; responseTime: number; error?: string }> {
    const startTime = Date.now();

    try {
      this.logger.debug('Checking Provider/Staff Service health');

      // Use the service's built-in health check
      const isHealthy = await this.providerStaffService.checkServiceHealth();
      const responseTime = Date.now() - startTime;

      if (isHealthy) {
        this.logger.debug('Provider/Staff Service is healthy', { responseTime });
        return { isHealthy: true, responseTime };
      } else {
        this.logger.warn('Provider/Staff Service is unhealthy', { responseTime });
        return { 
          isHealthy: false, 
          responseTime, 
          error: 'Service health check returned false' 
        };
      }

    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.logger.error('Provider/Staff Service health check failed', {
        error: error.message,
        responseTime
      });

      return {
        isHealthy: false,
        responseTime,
        error: error.message
      };
    }
  }

  /**
   * Update health metrics
   */
  private updateMetrics(
    patientRegistryHealth: { isHealthy: boolean; responseTime: number; error?: string },
    providerStaffHealth: { isHealthy: boolean; responseTime: number; error?: string }
  ): void {
    const now = new Date();

    // Update Patient Registry Service metrics
    if (patientRegistryHealth.isHealthy) {
      this.metrics.patientRegistryService.consecutiveFailures = 0;
      this.metrics.patientRegistryService.lastSuccessfulCheck = now;
    } else {
      this.metrics.patientRegistryService.consecutiveFailures++;
    }

    this.metrics.patientRegistryService.isHealthy = patientRegistryHealth.isHealthy;
    this.metrics.patientRegistryService.responseTime = patientRegistryHealth.responseTime;

    // Get circuit breaker state from service
    const patientRegistryStatus = this.patientRegistryService.getHealthStatus();
    this.metrics.patientRegistryService.circuitBreakerState = patientRegistryStatus.circuitBreakerState;
    this.metrics.patientRegistryService.errorRate = patientRegistryStatus.errorRate;

    // Update Provider/Staff Service metrics
    if (providerStaffHealth.isHealthy) {
      this.metrics.providerStaffService.consecutiveFailures = 0;
      this.metrics.providerStaffService.lastSuccessfulCheck = now;
    } else {
      this.metrics.providerStaffService.consecutiveFailures++;
    }

    this.metrics.providerStaffService.isHealthy = providerStaffHealth.isHealthy;
    this.metrics.providerStaffService.responseTime = providerStaffHealth.responseTime;

    // Get circuit breaker state from service
    const providerStaffStatus = this.providerStaffService.getHealthStatus();
    this.metrics.providerStaffService.circuitBreakerState = providerStaffStatus.circuitBreakerState;
    this.metrics.providerStaffService.errorRate = providerStaffStatus.errorRate;

    // Update overall health metrics
    this.metrics.overallHealth.healthyServices = 
      (patientRegistryHealth.isHealthy ? 1 : 0) + 
      (providerStaffHealth.isHealthy ? 1 : 0);

    this.metrics.overallHealth.healthPercentage = 
      (this.metrics.overallHealth.healthyServices / this.metrics.overallHealth.totalServices) * 100;
  }

  /**
   * Determine overall health status
   */
  private determineOverallStatus(): HealthStatus {
    const healthPercentage = this.metrics.overallHealth.healthPercentage;

    if (healthPercentage === 100) {
      return HealthStatus.HEALTHY;
    } else if (healthPercentage >= 50) {
      return HealthStatus.DEGRADED;
    } else {
      return HealthStatus.UNHEALTHY;
    }
  }

  /**
   * Create health message
   */
  private createHealthMessage(status: HealthStatus): string {
    const { healthyServices, totalServices } = this.metrics.overallHealth;

    switch (status) {
      case HealthStatus.HEALTHY:
        return `All external services are healthy (${healthyServices}/${totalServices})`;
      
      case HealthStatus.DEGRADED:
        return `Some external services are unhealthy (${healthyServices}/${totalServices})`;
      
      case HealthStatus.UNHEALTHY:
        return `Most external services are unhealthy (${healthyServices}/${totalServices})`;
      
      default:
        return `External services status unknown (${healthyServices}/${totalServices})`;
    }
  }

  /**
   * Create Vietnamese health message
   */
  private createHealthMessageVietnamese(status: HealthStatus): string {
    const { healthyServices, totalServices } = this.metrics.overallHealth;

    switch (status) {
      case HealthStatus.HEALTHY:
        return `Tất cả dịch vụ ngoài hoạt động bình thường (${healthyServices}/${totalServices})`;
      
      case HealthStatus.DEGRADED:
        return `Một số dịch vụ ngoài gặp sự cố (${healthyServices}/${totalServices})`;
      
      case HealthStatus.UNHEALTHY:
        return `Hầu hết dịch vụ ngoài gặp sự cố (${healthyServices}/${totalServices})`;
      
      default:
        return `Trạng thái dịch vụ ngoài không xác định (${healthyServices}/${totalServices})`;
    }
  }

  /**
   * Get health check name
   */
  getName(): string {
    return this.checkName;
  }

  /**
   * Get current metrics
   */
  getMetrics(): ExternalServiceHealthMetrics {
    return JSON.parse(JSON.stringify(this.metrics));
  }

  /**
   * Get detailed service statistics
   */
  async getDetailedStatistics(): Promise<any> {
    try {
      const [patientRegistryStats, providerStaffStats] = await Promise.allSettled([
        this.patientRegistryService.getServiceStatistics(),
        this.providerStaffService.getServiceStatistics()
      ]);

      return {
        patientRegistryService: {
          statistics: patientRegistryStats.status === 'fulfilled' ? patientRegistryStats.value : null,
          health: this.metrics.patientRegistryService,
          error: patientRegistryStats.status === 'rejected' ? patientRegistryStats.reason?.message : null
        },
        providerStaffService: {
          statistics: providerStaffStats.status === 'fulfilled' ? providerStaffStats.value : null,
          health: this.metrics.providerStaffService,
          error: providerStaffStats.status === 'rejected' ? providerStaffStats.reason?.message : null
        },
        overall: this.metrics.overallHealth
      };

    } catch (error) {
      this.logger.error('Error getting detailed service statistics', {
        error: error.message
      });

      return {
        error: 'Failed to get detailed statistics',
        overall: this.metrics.overallHealth
      };
    }
  }

  /**
   * Reset failure counters
   */
  resetFailures(): void {
    this.metrics.patientRegistryService.consecutiveFailures = 0;
    this.metrics.providerStaffService.consecutiveFailures = 0;
    
    this.logger.info('External service health check failures reset');
  }
}
