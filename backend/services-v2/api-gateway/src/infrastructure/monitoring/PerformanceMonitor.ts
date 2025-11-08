/**
 * Performance Monitor
 * In-memory performance metrics tracking with sliding window
 */

export interface RequestMetric {
  timestamp: number;
  path: string;
  method: string;
  statusCode: number;
  responseTime: number;
  success: boolean;
}

export interface PerformanceStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  requestsPerMinute: number;
  errorRate: number;
  slowestEndpoints: Array<{ path: string; avgTime: number; count: number }>;
  errorsByStatusCode: Record<number, number>;
  recentErrors: Array<{ path: string; statusCode: number; timestamp: number }>;
}

export class PerformanceMonitor {
  private metrics: RequestMetric[] = [];
  private readonly windowMs: number;
  private readonly maxMetrics: number;

  constructor(windowMs: number = 3600000, maxMetrics: number = 10000) {
    this.windowMs = windowMs; // Default: 1 hour
    this.maxMetrics = maxMetrics;
  }

  /**
   * Record a request metric
   */
  recordRequest(metric: RequestMetric): void {
    this.metrics.push(metric);

    // Clean old metrics
    this.cleanOldMetrics();

    // Limit total metrics to prevent memory issues
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  /**
   * Get performance statistics
   */
  getStats(): PerformanceStats {
    this.cleanOldMetrics();

    if (this.metrics.length === 0) {
      return this.getEmptyStats();
    }

    const totalRequests = this.metrics.length;
    const successfulRequests = this.metrics.filter(m => m.success).length;
    const failedRequests = totalRequests - successfulRequests;

    const responseTimes = this.metrics.map(m => m.responseTime);
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const minResponseTime = Math.min(...responseTimes);
    const maxResponseTime = Math.max(...responseTimes);

    const windowMinutes = this.windowMs / 60000;
    const requestsPerMinute = totalRequests / windowMinutes;

    const errorRate = (failedRequests / totalRequests) * 100;

    const slowestEndpoints = this.calculateSlowestEndpoints();
    const errorsByStatusCode = this.calculateErrorsByStatusCode();
    const recentErrors = this.getRecentErrors(10);

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      avgResponseTime: Math.round(avgResponseTime * 100) / 100,
      minResponseTime: Math.round(minResponseTime * 100) / 100,
      maxResponseTime: Math.round(maxResponseTime * 100) / 100,
      requestsPerMinute: Math.round(requestsPerMinute * 100) / 100,
      errorRate: Math.round(errorRate * 100) / 100,
      slowestEndpoints,
      errorsByStatusCode,
      recentErrors
    };
  }

  /**
   * Get metrics for a specific endpoint
   */
  getEndpointStats(path: string): Partial<PerformanceStats> {
    const endpointMetrics = this.metrics.filter(m => m.path === path);

    if (endpointMetrics.length === 0) {
      return {};
    }

    const totalRequests = endpointMetrics.length;
    const successfulRequests = endpointMetrics.filter(m => m.success).length;
    const responseTimes = endpointMetrics.map(m => m.responseTime);
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;

    return {
      totalRequests,
      successfulRequests,
      failedRequests: totalRequests - successfulRequests,
      avgResponseTime: Math.round(avgResponseTime * 100) / 100,
      minResponseTime: Math.round(Math.min(...responseTimes) * 100) / 100,
      maxResponseTime: Math.round(Math.max(...responseTimes) * 100) / 100
    };
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics = [];
  }

  /**
   * Clean metrics older than window
   */
  private cleanOldMetrics(): void {
    const cutoffTime = Date.now() - this.windowMs;
    this.metrics = this.metrics.filter(m => m.timestamp >= cutoffTime);
  }

  /**
   * Calculate slowest endpoints
   */
  private calculateSlowestEndpoints(): Array<{ path: string; avgTime: number; count: number }> {
    const endpointMap = new Map<string, { totalTime: number; count: number }>();

    this.metrics.forEach(m => {
      const existing = endpointMap.get(m.path) || { totalTime: 0, count: 0 };
      endpointMap.set(m.path, {
        totalTime: existing.totalTime + m.responseTime,
        count: existing.count + 1
      });
    });

    return Array.from(endpointMap.entries())
      .map(([path, data]) => ({
        path,
        avgTime: Math.round((data.totalTime / data.count) * 100) / 100,
        count: data.count
      }))
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, 10);
  }

  /**
   * Calculate errors by status code
   */
  private calculateErrorsByStatusCode(): Record<number, number> {
    const errors: Record<number, number> = {};

    this.metrics
      .filter(m => !m.success)
      .forEach(m => {
        errors[m.statusCode] = (errors[m.statusCode] || 0) + 1;
      });

    return errors;
  }

  /**
   * Get recent errors
   */
  private getRecentErrors(limit: number): Array<{ path: string; statusCode: number; timestamp: number }> {
    return this.metrics
      .filter(m => !m.success)
      .slice(-limit)
      .map(m => ({
        path: m.path,
        statusCode: m.statusCode,
        timestamp: m.timestamp
      }));
  }

  /**
   * Get empty stats
   */
  private getEmptyStats(): PerformanceStats {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      avgResponseTime: 0,
      minResponseTime: 0,
      maxResponseTime: 0,
      requestsPerMinute: 0,
      errorRate: 0,
      slowestEndpoints: [],
      errorsByStatusCode: {},
      recentErrors: []
    };
  }
}

