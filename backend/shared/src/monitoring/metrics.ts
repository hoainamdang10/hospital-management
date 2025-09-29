/**
 * Shared Metrics Module for Hospital Management System
 * Provides Prometheus metrics collection for all microservices
 */

import { register, collectDefaultMetrics, Counter, Histogram, Gauge } from 'prom-client';

// Collect default metrics (CPU, memory, etc.)
collectDefaultMetrics({
  prefix: 'hospital_',
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
});

// HTTP Request metrics
export const httpRequestsTotal = new Counter({
  name: 'hospital_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code', 'service'],
});

export const httpRequestDuration = new Histogram({
  name: 'hospital_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code', 'service'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});

// Database metrics
export const databaseConnectionsActive = new Gauge({
  name: 'hospital_database_connections_active',
  help: 'Number of active database connections',
  labelNames: ['service', 'database'],
});

export const databaseQueryDuration = new Histogram({
  name: 'hospital_database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['service', 'operation', 'table'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
});

export const databaseQueriesTotal = new Counter({
  name: 'hospital_database_queries_total',
  help: 'Total number of database queries',
  labelNames: ['service', 'operation', 'table', 'status'],
});

// Business metrics
export const patientsTotal = new Gauge({
  name: 'hospital_patients_total',
  help: 'Total number of patients in the system',
  labelNames: ['status'],
});

export const doctorsTotal = new Gauge({
  name: 'hospital_doctors_total',
  help: 'Total number of doctors in the system',
  labelNames: ['status', 'specialty'],
});

export const appointmentsTotal = new Counter({
  name: 'hospital_appointments_total',
  help: 'Total number of appointments',
  labelNames: ['status', 'type'],
});

export const appointmentsActive = new Gauge({
  name: 'hospital_appointments_active',
  help: 'Number of active appointments',
  labelNames: ['status'],
});

// Authentication metrics
export const authAttemptsTotal = new Counter({
  name: 'hospital_auth_attempts_total',
  help: 'Total number of authentication attempts',
  labelNames: ['method', 'status', 'role'],
});

export const activeSessionsTotal = new Gauge({
  name: 'hospital_active_sessions_total',
  help: 'Number of active user sessions',
  labelNames: ['role'],
});

// Cache metrics
export const cacheHitsTotal = new Counter({
  name: 'hospital_cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['service', 'cache_type'],
});

export const cacheMissesTotal = new Counter({
  name: 'hospital_cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['service', 'cache_type'],
});

// Queue metrics
export const queueJobsTotal = new Counter({
  name: 'hospital_queue_jobs_total',
  help: 'Total number of queue jobs',
  labelNames: ['service', 'queue_name', 'status'],
});

export const queueJobDuration = new Histogram({
  name: 'hospital_queue_job_duration_seconds',
  help: 'Duration of queue job processing in seconds',
  labelNames: ['service', 'queue_name'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
});

// Error metrics
export const errorsTotal = new Counter({
  name: 'hospital_errors_total',
  help: 'Total number of errors',
  labelNames: ['service', 'error_type', 'severity'],
});

/**
 * Middleware to collect HTTP metrics
 */
export const metricsMiddleware = (serviceName: string) => {
  return (req: any, res: any, next: any) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = (Date.now() - start) / 1000;
      const route = req.route?.path || req.path || 'unknown';
      
      httpRequestsTotal.inc({
        method: req.method,
        route,
        status_code: res.statusCode,
        service: serviceName,
      });
      
      httpRequestDuration.observe(
        {
          method: req.method,
          route,
          status_code: res.statusCode,
          service: serviceName,
        },
        duration
      );
    });
    
    next();
  };
};

/**
 * Database query metrics wrapper
 */
export const trackDatabaseQuery = async <T>(
  serviceName: string,
  operation: string,
  table: string,
  queryFn: () => Promise<T>
): Promise<T> => {
  const start = Date.now();
  let status = 'success';
  
  try {
    const result = await queryFn();
    return result;
  } catch (error) {
    status = 'error';
    throw error;
  } finally {
    const duration = (Date.now() - start) / 1000;
    
    databaseQueryDuration.observe(
      { service: serviceName, operation, table },
      duration
    );
    
    databaseQueriesTotal.inc({
      service: serviceName,
      operation,
      table,
      status,
    });
  }
};

/**
 * Get metrics endpoint handler
 */
export const getMetricsHandler = async (req: any, res: any) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end(error);
  }
};

/**
 * Reset all metrics (useful for testing)
 */
export const resetMetrics = () => {
  register.resetMetrics();
};

export { register };
