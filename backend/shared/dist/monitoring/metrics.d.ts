/**
 * Shared Metrics Module for Hospital Management System
 * Provides Prometheus metrics collection for all microservices
 */
import { register, Counter, Histogram, Gauge } from 'prom-client';
export declare const httpRequestsTotal: Counter<"route" | "method" | "status_code" | "service">;
export declare const httpRequestDuration: Histogram<"route" | "method" | "status_code" | "service">;
export declare const databaseConnectionsActive: Gauge<"service" | "database">;
export declare const databaseQueryDuration: Histogram<"service" | "operation" | "table">;
export declare const databaseQueriesTotal: Counter<"service" | "operation" | "table" | "status">;
export declare const patientsTotal: Gauge<"status">;
export declare const doctorsTotal: Gauge<"status" | "specialty">;
export declare const appointmentsTotal: Counter<"type" | "status">;
export declare const appointmentsActive: Gauge<"status">;
export declare const authAttemptsTotal: Counter<"role" | "method" | "status">;
export declare const activeSessionsTotal: Gauge<"role">;
export declare const cacheHitsTotal: Counter<"service" | "cache_type">;
export declare const cacheMissesTotal: Counter<"service" | "cache_type">;
export declare const queueJobsTotal: Counter<"service" | "status" | "queue_name">;
export declare const queueJobDuration: Histogram<"service" | "queue_name">;
export declare const errorsTotal: Counter<"service" | "error_type" | "severity">;
/**
 * Middleware to collect HTTP metrics
 */
export declare const metricsMiddleware: (serviceName: string) => (req: any, res: any, next: any) => void;
/**
 * Database query metrics wrapper
 */
export declare const trackDatabaseQuery: <T>(serviceName: string, operation: string, table: string, queryFn: () => Promise<T>) => Promise<T>;
/**
 * Get metrics endpoint handler
 */
export declare const getMetricsHandler: (req: any, res: any) => Promise<void>;
/**
 * Reset all metrics (useful for testing)
 */
export declare const resetMetrics: () => void;
export { register };
//# sourceMappingURL=metrics.d.ts.map