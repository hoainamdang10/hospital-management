/**
 * Performance Monitoring Middleware for GraphQL Gateway
 * Comprehensive metrics collection and performance tracking
 */

import { ApolloServerPlugin, GraphQLRequestContext } from "@apollo/server";
import logger from "@hospital/shared/dist/utils/logger";
import {
  Counter,
  Gauge,
  Histogram,
  collectDefaultMetrics,
  register,
} from "prom-client";
import { GraphQLContext } from "../context";

// Enable default metrics collection
collectDefaultMetrics({ register });

// Custom metrics
const httpRequestsTotal = new Counter({
  name: "graphql_requests_total",
  help: "Total number of GraphQL requests",
  labelNames: ["operation_type", "operation_name", "status", "user_role"],
  registers: [register],
});

const httpRequestDuration = new Histogram({
  name: "graphql_request_duration_seconds",
  help: "Duration of GraphQL requests in seconds",
  labelNames: ["operation_type", "operation_name", "user_role"],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 2, 3, 5, 7, 10],
  registers: [register],
});

const queryComplexity = new Histogram({
  name: "graphql_query_complexity",
  help: "GraphQL query complexity score",
  labelNames: ["operation_name", "user_role"],
  buckets: [10, 50, 100, 200, 500, 800, 1000, 1500, 2000],
  registers: [register],
});

const activeConnections = new Gauge({
  name: "graphql_active_connections",
  help: "Number of active GraphQL connections",
  registers: [register],
});

const cacheHits = new Counter({
  name: "cache_hits_total",
  help: "Total number of cache hits",
  labelNames: ["cache_type", "service"],
  registers: [register],
});

const cacheMisses = new Counter({
  name: "cache_misses_total",
  help: "Total number of cache misses",
  labelNames: ["cache_type", "service"],
  registers: [register],
});

const databaseQueries = new Counter({
  name: "database_queries_total",
  help: "Total number of database queries",
  labelNames: ["service", "operation"],
  registers: [register],
});

const databaseQueryDuration = new Histogram({
  name: "database_query_duration_seconds",
  help: "Duration of database queries in seconds",
  labelNames: ["service", "operation"],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
});

const errorsByType = new Counter({
  name: "graphql_errors_total",
  help: "Total number of GraphQL errors by type",
  labelNames: ["error_type", "operation_name", "user_role"],
  registers: [register],
});

const dataLoaderBatches = new Counter({
  name: "dataloader_batches_total",
  help: "Total number of DataLoader batches",
  labelNames: ["loader_name"],
  registers: [register],
});

const dataLoaderCacheHits = new Counter({
  name: "dataloader_cache_hits_total",
  help: "Total number of DataLoader cache hits",
  labelNames: ["loader_name"],
  registers: [register],
});

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  SLOW_QUERY: 1000, // 1 second
  HIGH_COMPLEXITY: 800,
  MEMORY_WARNING: 500 * 1024 * 1024, // 500MB
  ERROR_RATE_WARNING: 0.05, // 5%
};

export interface PerformanceMetrics {
  requestCount: number;
  averageResponseTime: number;
  errorRate: number;
  cacheHitRate: number;
  activeConnections: number;
  memoryUsage: number;
}

export class PerformanceMonitoringService {
  private requestCount = 0;
  private totalResponseTime = 0;
  private errorCount = 0;
  private startTime = Date.now();

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    const memoryUsage = process.memoryUsage();

    return {
      requestCount: this.requestCount,
      averageResponseTime:
        this.requestCount > 0 ? this.totalResponseTime / this.requestCount : 0,
      errorRate:
        this.requestCount > 0 ? this.errorCount / this.requestCount : 0,
      cacheHitRate: this.calculateCacheHitRate(),
      activeConnections: this.getActiveConnections(),
      memoryUsage: memoryUsage.heapUsed,
    };
  }

  /**
   * Calculate cache hit rate
   */
  private calculateCacheHitRate(): number {
    // This would be calculated from actual cache metrics
    // For now, return a placeholder
    return 0.85; // 85% hit rate
  }

  /**
   * Get active connections count
   */
  private getActiveConnections(): number {
    // This would be tracked from actual connection pool
    return 0;
  }

  /**
   * Record request metrics
   */
  recordRequest(duration: number, hasError: boolean): void {
    this.requestCount++;
    this.totalResponseTime += duration;

    if (hasError) {
      this.errorCount++;
    }
  }

  /**
   * Check if performance is degraded
   */
  isPerformanceDegraded(): boolean {
    const metrics = this.getMetrics();

    return (
      metrics.averageResponseTime > PERFORMANCE_THRESHOLDS.SLOW_QUERY ||
      metrics.errorRate > PERFORMANCE_THRESHOLDS.ERROR_RATE_WARNING ||
      metrics.memoryUsage > PERFORMANCE_THRESHOLDS.MEMORY_WARNING
    );
  }
}

// Singleton instance
export const performanceMonitoringService = new PerformanceMonitoringService();

/**
 * Apollo Server Performance Monitoring Plugin
 */
export const performanceMonitoringPlugin: ApolloServerPlugin<GraphQLContext> = {
  async requestDidStart() {
    const startTime = Date.now();
    let operationType: string = "unknown";
    let operationName: string = "unknown";
    let userRole: string = "anonymous";

    return {
      async didResolveOperation(
        requestContext: GraphQLRequestContext<GraphQLContext>
      ) {
        const { request, contextValue } = requestContext;

        // Extract operation details
        const operation = requestContext.document?.definitions[0];
        if (operation && operation.kind === "OperationDefinition") {
          operationType = operation.operation;
          operationName = operation.name?.value || "anonymous";
        }

        userRole = contextValue.user?.role || "anonymous";

        // Track active connections
        activeConnections.inc();

        logger.debug("📊 GraphQL operation started:", {
          operationType,
          operationName,
          userRole,
          requestId: contextValue.requestId,
        });
      },

      async didEncounterErrors(
        requestContext: GraphQLRequestContext<GraphQLContext>
      ) {
        const { errors } = requestContext;

        errors?.forEach((error) => {
          // Categorize error types
          let errorType = "unknown";
          if (error.message.includes("Authentication")) {
            errorType = "authentication";
          } else if (error.message.includes("Authorization")) {
            errorType = "authorization";
          } else if (error.message.includes("Validation")) {
            errorType = "validation";
          } else if (error.message.includes("Network")) {
            errorType = "network";
          } else {
            errorType = "internal";
          }

          errorsByType.inc({
            error_type: errorType,
            operation_name: operationName,
            user_role: userRole,
          });

          logger.error("❌ GraphQL error:", {
            errorType,
            operationName,
            userRole,
            message: error.message,
            path: error.path,
          });
        });
      },

      async willSendResponse(
        requestContext: GraphQLRequestContext<GraphQLContext>
      ) {
        const duration = (Date.now() - startTime) / 1000;
        const hasErrors =
          requestContext.errors && requestContext.errors.length > 0;
        const status = hasErrors ? "error" : "success";

        // Record metrics
        httpRequestsTotal.inc({
          operation_type: operationType,
          operation_name: operationName,
          status,
          user_role: userRole,
        });

        httpRequestDuration.observe(
          {
            operation_type: operationType,
            operation_name: operationName,
            user_role: userRole,
          },
          duration
        );

        // Track query complexity if available
        const complexity = (requestContext.contextValue as any).queryComplexity;
        if (complexity) {
          queryComplexity.observe(
            {
              operation_name: operationName,
              user_role: userRole,
            },
            complexity
          );

          // Alert on high complexity
          if (complexity > PERFORMANCE_THRESHOLDS.HIGH_COMPLEXITY) {
            logger.warn("⚠️ High complexity query:", {
              operationName,
              complexity,
              threshold: PERFORMANCE_THRESHOLDS.HIGH_COMPLEXITY,
              userRole,
            });
          }
        }

        // Decrease active connections
        activeConnections.dec();

        // Record in performance service
        performanceMonitoringService.recordRequest(
          duration * 1000,
          hasErrors || false
        );

        // Log slow queries
        if (duration > PERFORMANCE_THRESHOLDS.SLOW_QUERY / 1000) {
          logger.warn("🐌 Slow GraphQL query:", {
            operationName,
            operationType,
            duration: `${duration.toFixed(3)}s`,
            userRole,
            threshold: `${PERFORMANCE_THRESHOLDS.SLOW_QUERY / 1000}s`,
          });
        }

        // Add performance headers
        if (requestContext.response.http) {
          requestContext.response.http.headers.set(
            "X-Response-Time",
            `${duration.toFixed(3)}s`
          );
          requestContext.response.http.headers.set(
            "X-Query-Complexity",
            String(complexity || 0)
          );
          requestContext.response.http.headers.set("X-Cache-Status", "MISS"); // Would be dynamic
        }

        logger.debug("✅ GraphQL operation completed:", {
          operationName,
          operationType,
          duration: `${duration.toFixed(3)}s`,
          status,
          userRole,
        });
      },
    };
  },
};

/**
 * Cache metrics tracking
 */
export function trackCacheHit(cacheType: string, service: string): void {
  cacheHits.inc({ cache_type: cacheType, service });
}

export function trackCacheMiss(cacheType: string, service: string): void {
  cacheMisses.inc({ cache_type: cacheType, service });
}

/**
 * Database metrics tracking
 */
export function trackDatabaseQuery(
  service: string,
  operation: string,
  duration: number
): void {
  databaseQueries.inc({ service, operation });
  databaseQueryDuration.observe({ service, operation }, duration / 1000);
}

/**
 * DataLoader metrics tracking
 */
export function trackDataLoaderBatch(loaderName: string): void {
  dataLoaderBatches.inc({ loader_name: loaderName });
}

export function trackDataLoaderCacheHit(loaderName: string): void {
  dataLoaderCacheHits.inc({ loader_name: loaderName });
}

/**
 * Get Prometheus metrics
 */
export async function getPrometheusMetrics(): Promise<string> {
  return register.metrics();
}

/**
 * Health check with performance data
 */
export function getHealthStatus(): any {
  const metrics = performanceMonitoringService.getMetrics();
  const isHealthy = !performanceMonitoringService.isPerformanceDegraded();

  return {
    status: isHealthy ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    metrics: {
      requestCount: metrics.requestCount,
      averageResponseTime: `${metrics.averageResponseTime.toFixed(2)}ms`,
      errorRate: `${(metrics.errorRate * 100).toFixed(2)}%`,
      cacheHitRate: `${(metrics.cacheHitRate * 100).toFixed(2)}%`,
      memoryUsage: `${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`,
      activeConnections: metrics.activeConnections,
    },
    thresholds: {
      slowQuery: `${PERFORMANCE_THRESHOLDS.SLOW_QUERY}ms`,
      highComplexity: PERFORMANCE_THRESHOLDS.HIGH_COMPLEXITY,
      memoryWarning: `${PERFORMANCE_THRESHOLDS.MEMORY_WARNING / 1024 / 1024}MB`,
      errorRateWarning: `${PERFORMANCE_THRESHOLDS.ERROR_RATE_WARNING * 100}%`,
    },
  };
}
