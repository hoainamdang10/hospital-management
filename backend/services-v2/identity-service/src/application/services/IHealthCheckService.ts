/**
 * IHealthCheckService - Application Service Interface
 * Defines contract for health check operations
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Production Monitoring
 */

export enum HealthStatus {
  HEALTHY = 'HEALTHY',
  DEGRADED = 'DEGRADED',
  UNHEALTHY = 'UNHEALTHY',
  UNKNOWN = 'UNKNOWN'
}

export interface HealthCheckResult {
  status: HealthStatus;
  timestamp: Date;
  responseTime: number;
  details?: Record<string, unknown>;
  error?: string;
}

export interface ServiceHealth {
  status: HealthStatus;
  overall: HealthStatus;
  components: {
    database: HealthCheckResult;
    authentication: HealthCheckResult;
    authorization: HealthCheckResult;
    sessions: HealthCheckResult;
    audit: HealthCheckResult;
    circuitBreakers: HealthCheckResult;
  };
  metadata: {
    version: string;
    uptime: number;
    environment: string;
    timestamp: Date;
  };
}

/**
 * Health Check Service Interface
 * Provides comprehensive monitoring of all service components
 */
export interface IHealthCheckService {
  /**
   * Perform comprehensive health check
   * @returns Service health status with component details
   */
  checkHealth(): Promise<ServiceHealth>;
}
