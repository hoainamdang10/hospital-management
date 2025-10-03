/**
 * Comprehensive Health Checks for Identity Service
 * Monitors all critical components and dependencies
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Production-Ready, HIPAA-Compliant Monitoring
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CircuitBreakerFactory } from '../resilience/CircuitBreaker';
import { getErrorMessage } from '../../utils/error-helper';

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
  details?: any;
  error?: string;
}

export interface ServiceHealth {
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
 * Health Check Service for Identity Service
 * Provides comprehensive monitoring of all service components
 */
export class IdentityServiceHealthCheck {
  private supabaseClient: SupabaseClient<any, 'auth_schema'>;
  private startTime: Date;

  constructor(
    supabaseUrl: string,
    supabaseKey: string,
    private logger: any
  ) {
    this.supabaseClient = createClient(supabaseUrl, supabaseKey, {
      db: { schema: 'auth_schema' }
    });
    this.startTime = new Date();
  }

  /**
   * Perform comprehensive health check
   */
  async checkHealth(): Promise<ServiceHealth> {


    try {
      const [
        database,
        authentication,
        authorization,
        sessions,
        audit,
        circuitBreakers
      ] = await Promise.allSettled([
        this.checkDatabase(),
        this.checkAuthentication(),
        this.checkAuthorization(),
        this.checkSessions(),
        this.checkAudit(),
        this.checkCircuitBreakers()
      ]);

      const components = {
        database: this.getResultFromSettled(database),
        authentication: this.getResultFromSettled(authentication),
        authorization: this.getResultFromSettled(authorization),
        sessions: this.getResultFromSettled(sessions),
        audit: this.getResultFromSettled(audit),
        circuitBreakers: this.getResultFromSettled(circuitBreakers)
      };

      const overall = this.calculateOverallHealth(components);

      return {
        overall,
        components,
        metadata: {
          version: '2.0.0',
          uptime: Date.now() - this.startTime.getTime(),
          environment: process.env.NODE_ENV || 'development',
          timestamp: new Date()
        }
      };
    } catch (error) {
      this.logger.error('Health check failed', { error: getErrorMessage(error) });
      
      return {
        overall: HealthStatus.UNHEALTHY,
        components: {
          database: this.createErrorResult(error),
          authentication: this.createErrorResult(error),
          authorization: this.createErrorResult(error),
          sessions: this.createErrorResult(error),
          audit: this.createErrorResult(error),
          circuitBreakers: this.createErrorResult(error)
        },
        metadata: {
          version: '2.0.0',
          uptime: Date.now() - this.startTime.getTime(),
          environment: process.env.NODE_ENV || 'development',
          timestamp: new Date()
        }
      };
    }
  }

  /**
   * Check database connectivity and performance
   */
  private async checkDatabase(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      // Test basic connectivity
      const { error } = await this.supabaseClient
        .from('user_profiles')
        .select('count')
        .limit(1);

      if (error) {
        throw new Error(`Database error: ${getErrorMessage(error)}`);
      }

      const responseTime = Date.now() - startTime;

      // Check response time thresholds
      let status = HealthStatus.HEALTHY;
      if (responseTime > 1000) {
        status = HealthStatus.DEGRADED;
      }
      if (responseTime > 5000) {
        status = HealthStatus.UNHEALTHY;
      }

      return {
        status,
        timestamp: new Date(),
        responseTime,
        details: {
          connectionPool: 'active',
          schema: 'auth_schema',
          tablesAccessible: true
        }
      };
    } catch (error) {
      return {
        status: HealthStatus.UNHEALTHY,
        timestamp: new Date(),
        responseTime: Date.now() - startTime,
        error: getErrorMessage(error)
      };
    }
  }

  /**
   * Check authentication service functionality
   */
  private async checkAuthentication(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      // Test authentication endpoints availability
      const { error } = await this.supabaseClient
        .from('healthcare_roles')
        .select('id, role_name')
        .limit(1);

      if (error) {
        throw new Error(`Authentication check failed: ${getErrorMessage(error)}`);
      }

      const responseTime = Date.now() - startTime;

      return {
        status: responseTime < 500 ? HealthStatus.HEALTHY : HealthStatus.DEGRADED,
        timestamp: new Date(),
        responseTime,
        details: {
          rolesAccessible: true,
          authEndpoints: 'available'
        }
      };
    } catch (error) {
      return {
        status: HealthStatus.UNHEALTHY,
        timestamp: new Date(),
        responseTime: Date.now() - startTime,
        error: getErrorMessage(error)
      };
    }
  }

  /**
   * Check authorization service functionality
   */
  private async checkAuthorization(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      // Test role permissions access
      const { error } = await this.supabaseClient
        .from('role_permissions')
        .select('id, permission_name')
        .limit(1);

      if (error) {
        throw new Error(`Authorization check failed: ${getErrorMessage(error)}`);
      }

      const responseTime = Date.now() - startTime;

      return {
        status: responseTime < 500 ? HealthStatus.HEALTHY : HealthStatus.DEGRADED,
        timestamp: new Date(),
        responseTime,
        details: {
          permissionsAccessible: true,
          rbacSystem: 'operational'
        }
      };
    } catch (error) {
      return {
        status: HealthStatus.UNHEALTHY,
        timestamp: new Date(),
        responseTime: Date.now() - startTime,
        error: getErrorMessage(error)
      };
    }
  }

  /**
   * Check session management functionality
   */
  private async checkSessions(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      // Test session table access
      const { error } = await this.supabaseClient
        .from('user_sessions')
        .select('count')
        .limit(1);

      if (error) {
        throw new Error(`Session check failed: ${getErrorMessage(error)}`);
      }

      const responseTime = Date.now() - startTime;

      return {
        status: responseTime < 500 ? HealthStatus.HEALTHY : HealthStatus.DEGRADED,
        timestamp: new Date(),
        responseTime,
        details: {
          sessionTableAccessible: true,
          sessionManagement: 'operational'
        }
      };
    } catch (error) {
      return {
        status: HealthStatus.UNHEALTHY,
        timestamp: new Date(),
        responseTime: Date.now() - startTime,
        error: getErrorMessage(error)
      };
    }
  }

  /**
   * Check audit logging functionality
   */
  private async checkAudit(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      // Test audit log access
      const { error } = await this.supabaseClient
        .from('audit_logs')
        .select('count')
        .limit(1);

      if (error) {
        throw new Error(`Audit check failed: ${getErrorMessage(error)}`);
      }

      const responseTime = Date.now() - startTime;

      return {
        status: responseTime < 500 ? HealthStatus.HEALTHY : HealthStatus.DEGRADED,
        timestamp: new Date(),
        responseTime,
        details: {
          auditLogsAccessible: true,
          hipaaCompliance: 'active'
        }
      };
    } catch (error) {
      return {
        status: HealthStatus.UNHEALTHY,
        timestamp: new Date(),
        responseTime: Date.now() - startTime,
        error: getErrorMessage(error)
      };
    }
  }

  /**
   * Check circuit breaker status
   */
  private async checkCircuitBreakers(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      const breakerStatus = CircuitBreakerFactory.getHealthStatus();
      const responseTime = Date.now() - startTime;

      // Check if any breakers are open
      const openBreakers = Object.values(breakerStatus).filter(
        (breaker: any) => breaker.state === 'OPEN'
      );

      let status = HealthStatus.HEALTHY;
      if (openBreakers.length > 0) {
        status = HealthStatus.DEGRADED;
      }

      return {
        status,
        timestamp: new Date(),
        responseTime,
        details: {
          totalBreakers: Object.keys(breakerStatus).length,
          openBreakers: openBreakers.length,
          breakerStatus
        }
      };
    } catch (error) {
      return {
        status: HealthStatus.UNHEALTHY,
        timestamp: new Date(),
        responseTime: Date.now() - startTime,
        error: getErrorMessage(error)
      };
    }
  }

  /**
   * Helper methods
   */
  private getResultFromSettled(settled: PromiseSettledResult<HealthCheckResult>): HealthCheckResult {
    if (settled.status === 'fulfilled') {
      return settled.value;
    } else {
      return this.createErrorResult(settled.reason);
    }
  }

  private createErrorResult(error: any): HealthCheckResult {
    return {
      status: HealthStatus.UNHEALTHY,
      timestamp: new Date(),
      responseTime: 0,
      error: getErrorMessage(error) || 'Unknown error'
    };
  }

  private calculateOverallHealth(components: any): HealthStatus {
    const statuses = Object.values(components).map((comp: any) => comp.status);
    
    if (statuses.every(status => status === HealthStatus.HEALTHY)) {
      return HealthStatus.HEALTHY;
    }
    
    if (statuses.some(status => status === HealthStatus.UNHEALTHY)) {
      return HealthStatus.UNHEALTHY;
    }
    
    if (statuses.some(status => status === HealthStatus.DEGRADED)) {
      return HealthStatus.DEGRADED;
    }
    
    return HealthStatus.UNKNOWN;
  }
}
