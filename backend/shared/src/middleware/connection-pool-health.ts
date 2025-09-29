// ============================================================================
// CONNECTION POOL HEALTH MIDDLEWARE
// Database connection pool monitoring and health check middleware
// ============================================================================

import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

interface ConnectionPoolStats {
  total_connections: number;
  active_connections: number;
  idle_connections: number;
  waiting_requests: number;
  max_connections: number;
  min_connections: number;
  connection_timeout: number;
  idle_timeout: number;
  uptime: number;
  last_check: string;
}

interface ConnectionPoolHealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  response_time: number;
  stats: ConnectionPoolStats;
  errors?: string[];
  warnings?: string[];
}

interface ConnectionPoolMetrics {
  service: string;
  timestamp: string;
  connections: {
    total: number;
    active: number;
    idle: number;
    waiting: number;
  };
  performance: {
    avg_response_time: number;
    queries_per_second: number;
    error_rate: number;
  };
  health_score: number;
}

/**
 * Create connection pool health check endpoint
 */
export function createConnectionPoolHealthCheck(serviceName: string) {
  return async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      logger.info(`[${serviceName}] Performing connection pool health check`);

      // Mock connection pool stats (replace with actual implementation)
      const stats: ConnectionPoolStats = {
        total_connections: 10,
        active_connections: 3,
        idle_connections: 7,
        waiting_requests: 0,
        max_connections: 20,
        min_connections: 5,
        connection_timeout: 30000,
        idle_timeout: 600000,
        uptime: Date.now() - (24 * 60 * 60 * 1000), // 24 hours
        last_check: new Date().toISOString()
      };

      const responseTime = Date.now() - startTime;
      
      // Determine health status
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      const warnings: string[] = [];
      const errors: string[] = [];

      // Check for degraded performance
      if (stats.active_connections / stats.max_connections > 0.8) {
        status = 'degraded';
        warnings.push('High connection usage (>80%)');
      }

      if (stats.waiting_requests > 0) {
        status = 'degraded';
        warnings.push(`${stats.waiting_requests} requests waiting for connections`);
      }

      // Check for unhealthy conditions
      if (stats.active_connections >= stats.max_connections) {
        status = 'unhealthy';
        errors.push('Connection pool exhausted');
      }

      if (responseTime > 5000) {
        status = 'unhealthy';
        errors.push('Health check response time too high');
      }

      const healthCheck: ConnectionPoolHealthCheck = {
        service: serviceName,
        status,
        timestamp: new Date().toISOString(),
        response_time: responseTime,
        stats,
        ...(warnings.length > 0 && { warnings }),
        ...(errors.length > 0 && { errors })
      };

      const httpStatus = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503;
      
      res.status(httpStatus).json({
        success: status !== 'unhealthy',
        data: healthCheck
      });

    } catch (error) {
      logger.error(`[${serviceName}] Connection pool health check failed:`, error);
      
      const responseTime = Date.now() - startTime;
      
      res.status(503).json({
        success: false,
        data: {
          service: serviceName,
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          response_time: responseTime,
          errors: [error instanceof Error ? error.message : 'Unknown error']
        }
      });
    }
  };
}

/**
 * Create connection pool metrics endpoint
 */
export function createConnectionPoolMetrics(serviceName: string) {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info(`[${serviceName}] Collecting connection pool metrics`);

      // Mock metrics (replace with actual implementation)
      const metrics: ConnectionPoolMetrics = {
        service: serviceName,
        timestamp: new Date().toISOString(),
        connections: {
          total: 10,
          active: 3,
          idle: 7,
          waiting: 0
        },
        performance: {
          avg_response_time: 45.2,
          queries_per_second: 125.8,
          error_rate: 0.02
        },
        health_score: 95.5
      };

      res.json({
        success: true,
        data: metrics
      });

    } catch (error) {
      logger.error(`[${serviceName}] Failed to collect connection pool metrics:`, error);
      
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to collect metrics',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  };
}

/**
 * Create connection pool stress test endpoint
 */
export function createConnectionPoolStressTest(serviceName: string) {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info(`[${serviceName}] Starting connection pool stress test`);

      const { duration = 30, concurrency = 10 } = req.query;
      const testDuration = Math.min(Number(duration), 300); // Max 5 minutes
      const testConcurrency = Math.min(Number(concurrency), 50); // Max 50 concurrent

      // Mock stress test results (replace with actual implementation)
      const stressTestResults = {
        service: serviceName,
        test_config: {
          duration: testDuration,
          concurrency: testConcurrency
        },
        results: {
          total_requests: testDuration * testConcurrency,
          successful_requests: Math.floor(testDuration * testConcurrency * 0.98),
          failed_requests: Math.floor(testDuration * testConcurrency * 0.02),
          avg_response_time: 52.3,
          min_response_time: 12.1,
          max_response_time: 234.7,
          requests_per_second: testConcurrency * 0.95,
          error_rate: 0.02
        },
        connection_pool_impact: {
          max_connections_used: Math.min(testConcurrency + 2, 20),
          max_waiting_requests: Math.max(0, testConcurrency - 15),
          pool_exhausted: testConcurrency > 20,
          performance_degradation: testConcurrency > 15 ? 'moderate' : 'minimal'
        },
        timestamp: new Date().toISOString()
      };

      res.json({
        success: true,
        data: stressTestResults
      });

    } catch (error) {
      logger.error(`[${serviceName}] Connection pool stress test failed:`, error);
      
      res.status(500).json({
        success: false,
        error: {
          message: 'Stress test failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  };
}

/**
 * Connection pool monitoring middleware
 */
export function connectionPoolMonitoring(serviceName: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();
    
    // Add connection pool info to request
    (req as any).connectionPool = {
      service: serviceName,
      request_start: startTime
    };

    // Monitor response
    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      
      if (responseTime > 1000) {
        logger.warn(`[${serviceName}] Slow database query detected:`, {
          path: req.path,
          method: req.method,
          response_time: responseTime,
          status_code: res.statusCode
        });
      }
    });

    next();
  };
}
