import { createClient } from "@supabase/supabase-js";

interface Metric {
  name: string;
  value: number;
  tags: { [key: string]: string };
  timestamp: Date;
}

interface PerformanceMetric {
  operation: string;
  duration_ms: number;
  success: boolean;
  user_id?: string;
  resource_count?: number;
  cache_hit?: boolean;
}

export class MetricsService {
  private supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  private metrics: Metric[] = [];
  private readonly BATCH_SIZE = 100;
  private readonly FLUSH_INTERVAL = 30000; // 30 seconds

  constructor() {
    // Auto-flush metrics periodically
    setInterval(() => {
      this.flushMetrics();
    }, this.FLUSH_INTERVAL);

    // Flush on process exit
    process.on("SIGINT", () => {
      this.flushMetrics();
      process.exit(0);
    });
  }

  // Record performance metrics
  recordPerformance(metric: PerformanceMetric): void {
    this.addMetric("medical_records.performance", metric.duration_ms, {
      operation: metric.operation,
      success: metric.success.toString(),
      user_id: metric.user_id || "unknown",
      resource_count: metric.resource_count?.toString() || "0",
      cache_hit: metric.cache_hit?.toString() || "false",
    });
  }

  // Record API usage metrics
  recordAPIUsage(
    endpoint: string,
    method: string,
    statusCode: number,
    responseTime: number
  ): void {
    this.addMetric("medical_records.api.requests", 1, {
      endpoint,
      method,
      status_code: statusCode.toString(),
      response_time_bucket: this.getResponseTimeBucket(responseTime),
    });

    this.addMetric("medical_records.api.response_time", responseTime, {
      endpoint,
      method,
      status_code: statusCode.toString(),
    });
  }

  // Record database metrics
  recordDatabaseOperation(
    operation: string,
    duration: number,
    success: boolean,
    recordCount?: number
  ): void {
    this.addMetric("medical_records.database.duration", duration, {
      operation,
      success: success.toString(),
      record_count_bucket: recordCount
        ? this.getRecordCountBucket(recordCount)
        : "unknown",
    });
  }

  // Record cache metrics
  recordCacheOperation(
    operation: "hit" | "miss" | "set" | "invalidate",
    key_pattern: string
  ): void {
    this.addMetric("medical_records.cache.operations", 1, {
      operation,
      key_pattern,
    });
  }

  // Record business metrics
  recordBusinessMetric(
    metric_type: string,
    value: number,
    tags: { [key: string]: string } = {}
  ): void {
    this.addMetric(`medical_records.business.${metric_type}`, value, tags);
  }

  // Record security events
  recordSecurityEvent(
    event_type: string,
    severity: "low" | "medium" | "high" | "critical",
    userId?: string
  ): void {
    this.addMetric("medical_records.security.events", 1, {
      event_type,
      severity,
      user_id: userId || "unknown",
    });
  }

  // Record error metrics
  recordError(
    error_type: string,
    error_code?: string,
    operation?: string
  ): void {
    this.addMetric("medical_records.errors", 1, {
      error_type,
      error_code: error_code || "unknown",
      operation: operation || "unknown",
    });
  }

  // Helper method to add metrics
  private addMetric(
    name: string,
    value: number,
    tags: { [key: string]: string }
  ): void {
    this.metrics.push({
      name,
      value,
      tags: {
        service: "medical-records-service",
        environment: process.env.NODE_ENV || "development",
        ...tags,
      },
      timestamp: new Date(),
    });

    // Auto-flush if batch is full
    if (this.metrics.length >= this.BATCH_SIZE) {
      this.flushMetrics();
    }
  }

  // Flush metrics to storage
  private async flushMetrics(): Promise<void> {
    if (this.metrics.length === 0) return;

    const metricsToFlush = [...this.metrics];
    this.metrics = [];

    try {
      // Insert metrics into database
      const { error } = await this.supabase.from("service_metrics").insert(
        metricsToFlush.map((metric) => ({
          service_name: "medical-records-service",
          operation: metric.name,
          duration_ms: metric.value,
          success: true,
          timestamp: metric.timestamp,
          metadata: metric.tags,
        }))
      );

      if (error) {
        console.error("Failed to flush metrics:", error);
        // Re-add metrics back to queue on failure
        this.metrics.unshift(...metricsToFlush);
      }
    } catch (error: any) {
      console.error("Error flushing metrics:", error);
      // Re-add metrics back to queue on failure
      this.metrics.unshift(...metricsToFlush);
    }
  }

  // Health check method
  async healthCheck(): Promise<any> {
    const health = {
      status: "healthy" as "healthy" | "degraded" | "unhealthy",
      metrics: {
        pending_metrics: this.metrics.length,
        last_flush: "recent",
      } as any,
    };

    try {
      // Test database connection
      const { error } = await this.supabase
        .from("service_metrics")
        .select("*", { count: "exact", head: true })
        .limit(1);

      if (error) {
        health.status = "degraded";
        health.metrics = { ...health.metrics, database_error: error.message };
      }
    } catch (error: any) {
      health.status = "unhealthy";
      health.metrics = {
        ...health.metrics,
        error: "Database connection failed",
      };
    }

    return health;
  }

  // Get performance metrics
  async getPerformanceMetrics(timeWindow: string): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from("service_metrics")
        .select("*")
        .eq("service_name", "medical-records-service")
        .gte(
          "timestamp",
          new Date(Date.now() - this.getTimeWindowMs(timeWindow)).toISOString()
        )
        .order("timestamp", { ascending: false });

      if (error) throw error;

      return {
        total_requests: data?.length || 0,
        avg_response_time:
          data?.reduce((sum, m) => sum + m.duration_ms, 0) /
          (data?.length || 1),
        success_rate:
          data?.filter((m) => m.success).length / (data?.length || 1),
        metrics: data || [],
      };
    } catch (error: any) {
      console.error("Error getting performance metrics:", error);
      return {
        total_requests: 0,
        avg_response_time: 0,
        success_rate: 1,
        metrics: [],
      };
    }
  }

  // Get metrics summary
  async getMetricsSummary(timeWindow: string): Promise<any> {
    try {
      const metrics = await this.getPerformanceMetrics(timeWindow);
      return {
        summary: {
          total_operations: metrics.total_requests,
          average_duration: metrics.avg_response_time,
          success_rate: metrics.success_rate,
          pending_metrics: this.metrics.length,
        },
        time_window: timeWindow,
      };
    } catch (error: any) {
      console.error("Error getting metrics summary:", error);
      return {
        summary: {
          total_operations: 0,
          average_duration: 0,
          success_rate: 1,
          pending_metrics: this.metrics.length,
        },
        time_window: timeWindow,
      };
    }
  }

  // Helper to convert time window string to milliseconds
  private getTimeWindowMs(timeWindow: string): number {
    const match = timeWindow.match(/(\d+)([hmsd])/);
    if (!match) return 3600000; // Default 1 hour

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case "s":
        return value * 1000;
      case "m":
        return value * 60 * 1000;
      case "h":
        return value * 60 * 60 * 1000;
      case "d":
        return value * 24 * 60 * 60 * 1000;
      default:
        return 3600000;
    }
  }

  // Utility methods
  private getResponseTimeBucket(responseTime: number): string {
    if (responseTime < 100) return "<100ms";
    if (responseTime < 500) return "100-500ms";
    if (responseTime < 1000) return "500ms-1s";
    if (responseTime < 5000) return "1-5s";
    return ">5s";
  }

  private getRecordCountBucket(count: number): string {
    if (count === 1) return "single";
    if (count <= 10) return "small";
    if (count <= 100) return "medium";
    if (count <= 1000) return "large";
    return "bulk";
  }

  private getTimeFilter(timeRange: string): string {
    const now = new Date();
    const ranges: { [key: string]: number } = {
      "5m": 5 * 60 * 1000,
      "15m": 15 * 60 * 1000,
      "1h": 60 * 60 * 1000,
      "6h": 6 * 60 * 60 * 1000,
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
    };

    const milliseconds = ranges[timeRange] || ranges["1h"];
    return new Date(now.getTime() - milliseconds).toISOString();
  }

  private aggregateMetrics(metrics: any[]): any {
    const aggregated: { [key: string]: any } = {};

    metrics.forEach((metric) => {
      const name = metric.metric_name;
      if (!aggregated[name]) {
        aggregated[name] = {
          count: 0,
          sum: 0,
          min: Number.MAX_VALUE,
          max: Number.MIN_VALUE,
          avg: 0,
        };
      }

      aggregated[name].count++;
      aggregated[name].sum += metric.metric_value;
      aggregated[name].min = Math.min(
        aggregated[name].min,
        metric.metric_value
      );
      aggregated[name].max = Math.max(
        aggregated[name].max,
        metric.metric_value
      );
      aggregated[name].avg = aggregated[name].sum / aggregated[name].count;
    });

    return aggregated;
  }

  private analyzePerformance(metrics: any[]): any {
    const operations: { [key: string]: number[] } = {};

    metrics.forEach((metric) => {
      const operation = metric.tags?.operation || "unknown";
      if (!operations[operation]) {
        operations[operation] = [];
      }
      operations[operation].push(metric.metric_value);
    });

    const analysis: { [key: string]: any } = {};

    Object.entries(operations).forEach(([operation, times]) => {
      const sorted = times.sort((a, b) => a - b);
      analysis[operation] = {
        count: times.length,
        avg: times.reduce((a, b) => a + b, 0) / times.length,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        p50: sorted[Math.floor(sorted.length * 0.5)],
        p95: sorted[Math.floor(sorted.length * 0.95)],
        p99: sorted[Math.floor(sorted.length * 0.99)],
      };
    });

    return analysis;
  }
}

export const metricsService = new MetricsService();
