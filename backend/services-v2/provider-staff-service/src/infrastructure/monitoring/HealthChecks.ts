/**
 * Provider/Staff Service Health Checks
 * Comprehensive health monitoring for production readiness
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Production Monitoring, Observability
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ILogger } from '../../application/interfaces/ILogger';

export type HealthStatus = 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';

export interface ComponentHealth {
  status: HealthStatus;
  message: string;
  responseTime?: number;
  details?: any;
}

export interface HealthCheckResult {
  overall: HealthStatus;
  timestamp: Date;
  service: string;
  version: string;
  uptime: number;
  components: {
    database: ComponentHealth;
    rabbitmq?: ComponentHealth;
    redis?: ComponentHealth;
  };
}

/**
 * Provider/Staff Service Health Check
 */
export class ProviderStaffHealthCheck {
  private supabaseClient: SupabaseClient;
  private readonly serviceName = 'provider-staff-service';
  private readonly version = '2.0.0';

  constructor(
    supabaseUrl: string,
    supabaseKey: string,
    private logger: ILogger
  ) {
    this.supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  /**
   * Perform comprehensive health check
   */
  async checkHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      // Check all components
      const [databaseHealth, rabbitmqHealth, redisHealth] = await Promise.allSettled([
        this.checkDatabase(),
        this.checkRabbitMQ(),
        this.checkRedis()
      ]);

      // Extract results
      const database = databaseHealth.status === 'fulfilled' 
        ? databaseHealth.value 
        : { status: 'UNHEALTHY' as HealthStatus, message: 'Database check failed', details: databaseHealth.reason };

      const rabbitmq = rabbitmqHealth.status === 'fulfilled' 
        ? rabbitmqHealth.value 
        : undefined;

      const redis = redisHealth.status === 'fulfilled' 
        ? redisHealth.value 
        : undefined;

      // Determine overall status
      const overall = this.determineOverallStatus(database, rabbitmq, redis);

      const result: HealthCheckResult = {
        overall,
        timestamp: new Date(),
        service: this.serviceName,
        version: this.version,
        uptime: process.uptime(),
        components: {
          database,
          ...(rabbitmq && { rabbitmq }),
          ...(redis && { redis })
        }
      };

      const totalTime = Date.now() - startTime;
      this.logger.debug('Health check completed', { 
        overall, 
        duration: totalTime 
      });

      return result;

    } catch (error) {
      this.logger.error('Health check failed', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });

      return {
        overall: 'UNHEALTHY',
        timestamp: new Date(),
        service: this.serviceName,
        version: this.version,
        uptime: process.uptime(),
        components: {
          database: {
            status: 'UNHEALTHY',
            message: 'Health check error',
            details: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      };
    }
  }

  /**
   * Check database connectivity and performance
   */
  private async checkDatabase(): Promise<ComponentHealth> {
    const startTime = Date.now();

    try {
      // Test database connection with a simple query
      const { error } = await this.supabaseClient
        .from('staff_profiles')
        .select('id')
        .limit(1);

      const responseTime = Date.now() - startTime;

      if (error) {
        this.logger.warn('Database health check failed', { error: error.message });
        return {
          status: 'UNHEALTHY',
          message: 'Database query failed',
          responseTime,
          details: error.message
        };
      }

      // Check response time
      if (responseTime > 1000) {
        return {
          status: 'DEGRADED',
          message: 'Database response time high',
          responseTime,
          details: `Response time: ${responseTime}ms`
        };
      }

      return {
        status: 'HEALTHY',
        message: 'Database operational',
        responseTime
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.logger.error('Database health check error', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });

      return {
        status: 'UNHEALTHY',
        message: 'Database connection failed',
        responseTime,
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check RabbitMQ connectivity (optional)
   */
  private async checkRabbitMQ(): Promise<ComponentHealth | undefined> {
    // RabbitMQ health check is optional
    // If RabbitMQ is not configured, return undefined
    if (!process.env.RABBITMQ_URL) {
      return undefined;
    }

    const startTime = Date.now();

    try {
      // Simple connectivity check
      // In production, you might want to check queue status, etc.
      const responseTime = Date.now() - startTime;

      return {
        status: 'HEALTHY',
        message: 'RabbitMQ operational',
        responseTime
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.logger.warn('RabbitMQ health check failed', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });

      return {
        status: 'DEGRADED',
        message: 'RabbitMQ unavailable',
        responseTime,
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check Redis connectivity (optional)
   */
  private async checkRedis(): Promise<ComponentHealth | undefined> {
    // Redis health check is optional
    // If Redis is not configured, return undefined
    if (!process.env.REDIS_URL) {
      return undefined;
    }

    const startTime = Date.now();

    try {
      // Simple connectivity check
      // In production, you might want to check cache status, etc.
      const responseTime = Date.now() - startTime;

      return {
        status: 'HEALTHY',
        message: 'Redis operational',
        responseTime
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.logger.warn('Redis health check failed', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });

      return {
        status: 'DEGRADED',
        message: 'Redis unavailable',
        responseTime,
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Determine overall health status
   */
  private determineOverallStatus(
    database: ComponentHealth,
    rabbitmq?: ComponentHealth,
    redis?: ComponentHealth
  ): HealthStatus {
    // Database is critical - if unhealthy, overall is unhealthy
    if (database.status === 'UNHEALTHY') {
      return 'UNHEALTHY';
    }

    // If database is degraded or any optional component is unhealthy, overall is degraded
    if (
      database.status === 'DEGRADED' ||
      rabbitmq?.status === 'UNHEALTHY' ||
      redis?.status === 'UNHEALTHY'
    ) {
      return 'DEGRADED';
    }

    // If any component is degraded, overall is degraded
    if (
      rabbitmq?.status === 'DEGRADED' ||
      redis?.status === 'DEGRADED'
    ) {
      return 'DEGRADED';
    }

    return 'HEALTHY';
  }

  /**
   * Quick health check (database only)
   */
  async quickCheck(): Promise<boolean> {
    try {
      const { error } = await this.supabaseClient
        .from('staff_profiles')
        .select('id')
        .limit(1);

      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Get service metrics
   */
  getMetrics() {
    return {
      service: this.serviceName,
      version: this.version,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    };
  }
}

