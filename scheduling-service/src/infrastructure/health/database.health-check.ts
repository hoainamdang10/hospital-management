/**
 * Database Health Check - Infrastructure Layer
 * Health check implementation for Supabase database connectivity
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Health Check Pattern, Database Monitoring, Production Readiness
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { IHealthCheck, HealthCheckResult, HealthStatus } from '../../../shared/infrastructure/health/health-check.interface';
import { ILogger } from '../../../shared/infrastructure/logging/logger.interface';

export interface DatabaseHealthMetrics {
  connectionTime: number;
  queryTime: number;
  activeConnections?: number;
  maxConnections?: number;
  connectionPoolUtilization?: number;
  lastSuccessfulQuery?: Date;
  consecutiveFailures: number;
}

/**
 * Database Health Check
 * Monitors Supabase database connectivity and performance
 */
export class DatabaseHealthCheck implements IHealthCheck {
  private readonly supabaseClient: SupabaseClient;
  private readonly logger: ILogger;
  private readonly checkName: string = 'database';
  private consecutiveFailures: number = 0;
  private lastSuccessfulCheck?: Date;
  private metrics: DatabaseHealthMetrics = {
    connectionTime: 0,
    queryTime: 0,
    consecutiveFailures: 0
  };

  constructor(supabaseClient: SupabaseClient, logger: ILogger) {
    this.supabaseClient = supabaseClient;
    this.logger = logger;
  }

  /**
   * Perform database health check
   */
  async check(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      this.logger.debug('Starting database health check');

      // Test basic connectivity
      const connectionResult = await this.testConnection();
      if (!connectionResult.success) {
        return this.createFailureResult(connectionResult.error, startTime);
      }

      // Test query performance
      const queryResult = await this.testQueryPerformance();
      if (!queryResult.success) {
        return this.createFailureResult(queryResult.error, startTime);
      }

      // Test table access
      const tableAccessResult = await this.testTableAccess();
      if (!tableAccessResult.success) {
        return this.createFailureResult(tableAccessResult.error, startTime);
      }

      // Update metrics
      this.updateSuccessMetrics(startTime);

      // Create success result
      const result: HealthCheckResult = {
        name: this.checkName,
        status: HealthStatus.HEALTHY,
        message: 'Database is healthy',
        messageVietnamese: 'Cơ sở dữ liệu hoạt động bình thường',
        timestamp: new Date(),
        responseTime: Date.now() - startTime,
        details: {
          connectionTime: this.metrics.connectionTime,
          queryTime: this.metrics.queryTime,
          consecutiveFailures: this.metrics.consecutiveFailures,
          lastSuccessfulCheck: this.lastSuccessfulCheck?.toISOString(),
          checks: {
            connection: 'passed',
            queryPerformance: 'passed',
            tableAccess: 'passed'
          }
        }
      };

      this.logger.debug('Database health check completed successfully', {
        responseTime: result.responseTime,
        connectionTime: this.metrics.connectionTime,
        queryTime: this.metrics.queryTime
      });

      return result;

    } catch (error) {
      return this.createFailureResult(error.message, startTime);
    }
  }

  /**
   * Test basic database connection
   */
  private async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const connectionStartTime = Date.now();

      // Simple connection test
      const { error } = await this.supabaseClient
        .from('appointments')
        .select('count', { count: 'exact', head: true })
        .limit(1);

      this.metrics.connectionTime = Date.now() - connectionStartTime;

      if (error) {
        this.logger.warn('Database connection test failed', {
          error: error.message,
          connectionTime: this.metrics.connectionTime
        });

        return {
          success: false,
          error: `Connection failed: ${error.message}`
        };
      }

      return { success: true };

    } catch (error) {
      this.logger.error('Database connection test error', {
        error: error.message
      });

      return {
        success: false,
        error: `Connection error: ${error.message}`
      };
    }
  }

  /**
   * Test query performance
   */
  private async testQueryPerformance(): Promise<{ success: boolean; error?: string }> {
    try {
      const queryStartTime = Date.now();

      // Test a simple query
      const { data, error } = await this.supabaseClient
        .from('appointments')
        .select('id')
        .limit(1);

      this.metrics.queryTime = Date.now() - queryStartTime;

      if (error) {
        this.logger.warn('Database query performance test failed', {
          error: error.message,
          queryTime: this.metrics.queryTime
        });

        return {
          success: false,
          error: `Query failed: ${error.message}`
        };
      }

      // Check if query time is acceptable (< 1000ms)
      if (this.metrics.queryTime > 1000) {
        this.logger.warn('Database query performance is slow', {
          queryTime: this.metrics.queryTime,
          threshold: 1000
        });

        return {
          success: false,
          error: `Query performance degraded: ${this.metrics.queryTime}ms > 1000ms`
        };
      }

      return { success: true };

    } catch (error) {
      this.logger.error('Database query performance test error', {
        error: error.message
      });

      return {
        success: false,
        error: `Query error: ${error.message}`
      };
    }
  }

  /**
   * Test table access permissions
   */
  private async testTableAccess(): Promise<{ success: boolean; error?: string }> {
    try {
      // Test read access
      const { error: readError } = await this.supabaseClient
        .from('appointments')
        .select('id')
        .limit(1);

      if (readError) {
        return {
          success: false,
          error: `Read access failed: ${readError.message}`
        };
      }

      // Test write access (insert and immediately delete)
      const testData = {
        appointment_id: `HEALTH_CHECK_${Date.now()}`,
        patient_id: 'HEALTH_CHECK_PATIENT',
        provider_id: 'HEALTH_CHECK_PROVIDER',
        appointment_type: 'consultation',
        priority: 'normal',
        status: 'scheduled',
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        reason: 'Health check test',
        created_by: 'health-check',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: insertData, error: insertError } = await this.supabaseClient
        .from('appointments')
        .insert(testData)
        .select('id')
        .single();

      if (insertError) {
        return {
          success: false,
          error: `Write access failed: ${insertError.message}`
        };
      }

      // Clean up test data
      if (insertData?.id) {
        const { error: deleteError } = await this.supabaseClient
          .from('appointments')
          .delete()
          .eq('id', insertData.id);

        if (deleteError) {
          this.logger.warn('Failed to clean up health check test data', {
            testId: insertData.id,
            error: deleteError.message
          });
        }
      }

      return { success: true };

    } catch (error) {
      this.logger.error('Database table access test error', {
        error: error.message
      });

      return {
        success: false,
        error: `Table access error: ${error.message}`
      };
    }
  }

  /**
   * Update metrics on successful check
   */
  private updateSuccessMetrics(startTime: number): void {
    this.consecutiveFailures = 0;
    this.lastSuccessfulCheck = new Date();
    this.metrics.consecutiveFailures = 0;
    this.metrics.lastSuccessfulQuery = new Date();
  }

  /**
   * Create failure result
   */
  private createFailureResult(errorMessage: string, startTime: number): HealthCheckResult {
    this.consecutiveFailures++;
    this.metrics.consecutiveFailures = this.consecutiveFailures;

    const result: HealthCheckResult = {
      name: this.checkName,
      status: this.consecutiveFailures >= 3 ? HealthStatus.UNHEALTHY : HealthStatus.DEGRADED,
      message: `Database health check failed: ${errorMessage}`,
      messageVietnamese: `Kiểm tra sức khỏe cơ sở dữ liệu thất bại: ${errorMessage}`,
      timestamp: new Date(),
      responseTime: Date.now() - startTime,
      error: errorMessage,
      details: {
        consecutiveFailures: this.consecutiveFailures,
        lastSuccessfulCheck: this.lastSuccessfulCheck?.toISOString(),
        connectionTime: this.metrics.connectionTime,
        queryTime: this.metrics.queryTime,
        checks: {
          connection: 'failed',
          queryPerformance: 'failed',
          tableAccess: 'failed'
        }
      }
    };

    this.logger.error('Database health check failed', {
      error: errorMessage,
      consecutiveFailures: this.consecutiveFailures,
      responseTime: result.responseTime
    });

    return result;
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
  getMetrics(): DatabaseHealthMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset consecutive failures counter
   */
  resetFailures(): void {
    this.consecutiveFailures = 0;
    this.metrics.consecutiveFailures = 0;
    this.logger.info('Database health check failures reset');
  }
}
