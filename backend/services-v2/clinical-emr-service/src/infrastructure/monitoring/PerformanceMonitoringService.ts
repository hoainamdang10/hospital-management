/**
 * PerformanceMonitoringService - Infrastructure Layer
 * Performance monitoring and optimization for Clinical EMR Service
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Performance Optimization, HIPAA
 */

/**
 * Performance Metrics
 */
export interface PerformanceMetrics {
  timestamp: Date;
  operation: string;
  duration: number;
  success: boolean;
  recordCount?: number;
  memoryUsage?: {
    used: number;
    total: number;
    percentage: number;
  };
  databaseMetrics?: {
    queryTime: number;
    connectionPoolSize: number;
    activeConnections: number;
  };
  cacheMetrics?: {
    hitRate: number;
    missRate: number;
    size: number;
  };
  errorDetails?: {
    type: string;
    message: string;
    stack?: string;
  };
}

/**
 * Performance Thresholds
 */
export interface PerformanceThresholds {
  maxResponseTime: number; // milliseconds
  maxMemoryUsage: number; // percentage
  minCacheHitRate: number; // percentage
  maxDatabaseQueryTime: number; // milliseconds
  maxConcurrentOperations: number;
}

/**
 * Performance Alert
 */
export interface PerformanceAlert {
  id: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'response_time' | 'memory_usage' | 'cache_performance' | 'database_performance' | 'error_rate';
  message: string;
  metrics: PerformanceMetrics;
  threshold: number;
  actualValue: number;
  recommendations: string[];
}

/**
 * Performance Report
 */
export interface PerformanceReport {
  period: {
    start: Date;
    end: Date;
  };
  summary: {
    totalOperations: number;
    successRate: number;
    averageResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    averageMemoryUsage: number;
    averageCacheHitRate: number;
    averageDatabaseQueryTime: number;
  };
  trends: {
    responseTimeTrend: 'improving' | 'stable' | 'degrading';
    memoryUsageTrend: 'improving' | 'stable' | 'degrading';
    cachePerformanceTrend: 'improving' | 'stable' | 'degrading';
  };
  alerts: PerformanceAlert[];
  recommendations: string[];
}

/**
 * Performance Monitoring Service
 */
export class PerformanceMonitoringService {
  private metrics: PerformanceMetrics[] = [];
  private alerts: PerformanceAlert[] = [];
  private activeOperations: Map<string, { startTime: Date; operation: string }> = new Map();
  
  private readonly thresholds: PerformanceThresholds = {
    maxResponseTime: 200, // 200ms
    maxMemoryUsage: 80, // 80%
    minCacheHitRate: 85, // 85%
    maxDatabaseQueryTime: 100, // 100ms
    maxConcurrentOperations: 50
  };

  /**
   * Start monitoring an operation
   */
  startOperation(operationId: string, operation: string): void {
    this.activeOperations.set(operationId, {
      startTime: new Date(),
      operation
    });
  }

  /**
   * End monitoring an operation
   */
  endOperation(
    operationId: string,
    success: boolean,
    recordCount?: number,
    errorDetails?: { type: string; message: string; stack?: string }
  ): PerformanceMetrics {
    const activeOp = this.activeOperations.get(operationId);
    if (!activeOp) {
      throw new Error(`Operation ${operationId} not found in active operations`);
    }

    const endTime = new Date();
    const duration = endTime.getTime() - activeOp.startTime.getTime();

    const metrics: PerformanceMetrics = {
      timestamp: endTime,
      operation: activeOp.operation,
      duration,
      success,
      recordCount,
      memoryUsage: this.getMemoryUsage(),
      databaseMetrics: this.getDatabaseMetrics(),
      cacheMetrics: this.getCacheMetrics(),
      errorDetails
    };

    // Store metrics
    this.metrics.push(metrics);
    this.activeOperations.delete(operationId);

    // Check for performance issues
    this.checkPerformanceThresholds(metrics);

    // Clean up old metrics (keep last 1000)
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    return metrics;
  }

  /**
   * Get current performance metrics
   */
  getCurrentMetrics(): {
    activeOperations: number;
    averageResponseTime: number;
    successRate: number;
    memoryUsage: number;
    cacheHitRate: number;
    recentAlerts: number;
  } {
    const recentMetrics = this.getRecentMetrics(5 * 60 * 1000); // Last 5 minutes
    
    const averageResponseTime = recentMetrics.length > 0
      ? recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length
      : 0;

    const successRate = recentMetrics.length > 0
      ? recentMetrics.filter(m => m.success).length / recentMetrics.length
      : 1;

    const currentMemory = this.getMemoryUsage();
    const currentCache = this.getCacheMetrics();
    
    const recentAlerts = this.alerts.filter(
      a => Date.now() - a.timestamp.getTime() < 5 * 60 * 1000
    ).length;

    return {
      activeOperations: this.activeOperations.size,
      averageResponseTime,
      successRate,
      memoryUsage: currentMemory.percentage,
      cacheHitRate: currentCache.hitRate,
      recentAlerts
    };
  }

  /**
   * Generate performance report
   */
  generateReport(periodMinutes: number = 60): PerformanceReport {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - periodMinutes * 60 * 1000);
    
    const periodMetrics = this.metrics.filter(
      m => m.timestamp >= startTime && m.timestamp <= endTime
    );

    const responseTimes = periodMetrics.map(m => m.duration).sort((a, b) => a - b);
    const successfulOps = periodMetrics.filter(m => m.success);
    
    const summary = {
      totalOperations: periodMetrics.length,
      successRate: periodMetrics.length > 0 ? successfulOps.length / periodMetrics.length : 1,
      averageResponseTime: responseTimes.length > 0 
        ? responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length 
        : 0,
      p95ResponseTime: responseTimes.length > 0 
        ? responseTimes[Math.floor(responseTimes.length * 0.95)] 
        : 0,
      p99ResponseTime: responseTimes.length > 0 
        ? responseTimes[Math.floor(responseTimes.length * 0.99)] 
        : 0,
      averageMemoryUsage: periodMetrics.length > 0
        ? periodMetrics
            .filter(m => m.memoryUsage)
            .reduce((sum, m) => sum + m.memoryUsage!.percentage, 0) / 
          periodMetrics.filter(m => m.memoryUsage).length
        : 0,
      averageCacheHitRate: periodMetrics.length > 0
        ? periodMetrics
            .filter(m => m.cacheMetrics)
            .reduce((sum, m) => sum + m.cacheMetrics!.hitRate, 0) / 
          periodMetrics.filter(m => m.cacheMetrics).length
        : 0,
      averageDatabaseQueryTime: periodMetrics.length > 0
        ? periodMetrics
            .filter(m => m.databaseMetrics)
            .reduce((sum, m) => sum + m.databaseMetrics!.queryTime, 0) / 
          periodMetrics.filter(m => m.databaseMetrics).length
        : 0
    };

    // Calculate trends (compare with previous period)
    const previousPeriodStart = new Date(startTime.getTime() - periodMinutes * 60 * 1000);
    const previousMetrics = this.metrics.filter(
      m => m.timestamp >= previousPeriodStart && m.timestamp < startTime
    );

    const trends = this.calculateTrends(periodMetrics, previousMetrics);

    // Get alerts for the period
    const periodAlerts = this.alerts.filter(
      a => a.timestamp >= startTime && a.timestamp <= endTime
    );

    // Generate recommendations
    const recommendations = this.generateRecommendations(summary, trends, periodAlerts);

    return {
      period: { start: startTime, end: endTime },
      summary,
      trends,
      alerts: periodAlerts,
      recommendations
    };
  }

  /**
   * Get recent metrics
   */
  private getRecentMetrics(timeWindowMs: number): PerformanceMetrics[] {
    const cutoff = new Date(Date.now() - timeWindowMs);
    return this.metrics.filter(m => m.timestamp >= cutoff);
  }

  /**
   * Get current memory usage
   */
  private getMemoryUsage(): { used: number; total: number; percentage: number } {
    const memUsage = process.memoryUsage();
    const totalMemory = memUsage.heapTotal;
    const usedMemory = memUsage.heapUsed;
    
    return {
      used: usedMemory,
      total: totalMemory,
      percentage: (usedMemory / totalMemory) * 100
    };
  }

  /**
   * Get database metrics (placeholder - would integrate with actual DB monitoring)
   */
  private getDatabaseMetrics(): { queryTime: number; connectionPoolSize: number; activeConnections: number } {
    // This would integrate with actual database monitoring
    return {
      queryTime: Math.random() * 50, // Placeholder
      connectionPoolSize: 20,
      activeConnections: Math.floor(Math.random() * 15)
    };
  }

  /**
   * Get cache metrics (placeholder - would integrate with actual cache monitoring)
   */
  private getCacheMetrics(): { hitRate: number; missRate: number; size: number } {
    // This would integrate with actual cache monitoring
    const hitRate = 85 + Math.random() * 10; // 85-95%
    return {
      hitRate,
      missRate: 100 - hitRate,
      size: Math.floor(Math.random() * 1000)
    };
  }

  /**
   * Check performance thresholds and generate alerts
   */
  private checkPerformanceThresholds(metrics: PerformanceMetrics): void {
    const alerts: PerformanceAlert[] = [];

    // Response time check
    if (metrics.duration > this.thresholds.maxResponseTime) {
      alerts.push({
        id: `alert-${Date.now()}-response-time`,
        timestamp: new Date(),
        severity: metrics.duration > this.thresholds.maxResponseTime * 2 ? 'critical' : 'high',
        type: 'response_time',
        message: `Operation ${metrics.operation} exceeded response time threshold`,
        metrics,
        threshold: this.thresholds.maxResponseTime,
        actualValue: metrics.duration,
        recommendations: [
          'Consider optimizing database queries',
          'Review caching strategy',
          'Check for resource contention'
        ]
      });
    }

    // Memory usage check
    if (metrics.memoryUsage && metrics.memoryUsage.percentage > this.thresholds.maxMemoryUsage) {
      alerts.push({
        id: `alert-${Date.now()}-memory`,
        timestamp: new Date(),
        severity: metrics.memoryUsage.percentage > 90 ? 'critical' : 'high',
        type: 'memory_usage',
        message: `High memory usage detected: ${metrics.memoryUsage.percentage.toFixed(1)}%`,
        metrics,
        threshold: this.thresholds.maxMemoryUsage,
        actualValue: metrics.memoryUsage.percentage,
        recommendations: [
          'Review memory leaks',
          'Optimize data structures',
          'Consider garbage collection tuning'
        ]
      });
    }

    // Cache performance check
    if (metrics.cacheMetrics && metrics.cacheMetrics.hitRate < this.thresholds.minCacheHitRate) {
      alerts.push({
        id: `alert-${Date.now()}-cache`,
        timestamp: new Date(),
        severity: metrics.cacheMetrics.hitRate < 70 ? 'high' : 'medium',
        type: 'cache_performance',
        message: `Low cache hit rate: ${metrics.cacheMetrics.hitRate.toFixed(1)}%`,
        metrics,
        threshold: this.thresholds.minCacheHitRate,
        actualValue: metrics.cacheMetrics.hitRate,
        recommendations: [
          'Review caching strategy',
          'Increase cache size',
          'Optimize cache key patterns'
        ]
      });
    }

    // Database performance check
    if (metrics.databaseMetrics && metrics.databaseMetrics.queryTime > this.thresholds.maxDatabaseQueryTime) {
      alerts.push({
        id: `alert-${Date.now()}-database`,
        timestamp: new Date(),
        severity: metrics.databaseMetrics.queryTime > this.thresholds.maxDatabaseQueryTime * 2 ? 'critical' : 'high',
        type: 'database_performance',
        message: `Slow database query detected: ${metrics.databaseMetrics.queryTime}ms`,
        metrics,
        threshold: this.thresholds.maxDatabaseQueryTime,
        actualValue: metrics.databaseMetrics.queryTime,
        recommendations: [
          'Add database indexes',
          'Optimize query structure',
          'Consider query result caching'
        ]
      });
    }

    // Store alerts
    this.alerts.push(...alerts);

    // Clean up old alerts (keep last 100)
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }
  }

  /**
   * Calculate performance trends
   */
  private calculateTrends(
    currentMetrics: PerformanceMetrics[],
    previousMetrics: PerformanceMetrics[]
  ): {
    responseTimeTrend: 'improving' | 'stable' | 'degrading';
    memoryUsageTrend: 'improving' | 'stable' | 'degrading';
    cachePerformanceTrend: 'improving' | 'stable' | 'degrading';
  } {
    const currentAvgResponseTime = currentMetrics.length > 0
      ? currentMetrics.reduce((sum, m) => sum + m.duration, 0) / currentMetrics.length
      : 0;

    const previousAvgResponseTime = previousMetrics.length > 0
      ? previousMetrics.reduce((sum, m) => sum + m.duration, 0) / previousMetrics.length
      : 0;

    const responseTimeTrend = this.getTrend(currentAvgResponseTime, previousAvgResponseTime, false);

    const currentAvgMemory = currentMetrics
      .filter(m => m.memoryUsage)
      .reduce((sum, m) => sum + m.memoryUsage!.percentage, 0) / 
      currentMetrics.filter(m => m.memoryUsage).length || 0;

    const previousAvgMemory = previousMetrics
      .filter(m => m.memoryUsage)
      .reduce((sum, m) => sum + m.memoryUsage!.percentage, 0) / 
      previousMetrics.filter(m => m.memoryUsage).length || 0;

    const memoryUsageTrend = this.getTrend(currentAvgMemory, previousAvgMemory, false);

    const currentAvgCacheHit = currentMetrics
      .filter(m => m.cacheMetrics)
      .reduce((sum, m) => sum + m.cacheMetrics!.hitRate, 0) / 
      currentMetrics.filter(m => m.cacheMetrics).length || 0;

    const previousAvgCacheHit = previousMetrics
      .filter(m => m.cacheMetrics)
      .reduce((sum, m) => sum + m.cacheMetrics!.hitRate, 0) / 
      previousMetrics.filter(m => m.cacheMetrics).length || 0;

    const cachePerformanceTrend = this.getTrend(currentAvgCacheHit, previousAvgCacheHit, true);

    return {
      responseTimeTrend,
      memoryUsageTrend,
      cachePerformanceTrend
    };
  }

  /**
   * Get trend direction
   */
  private getTrend(
    current: number,
    previous: number,
    higherIsBetter: boolean
  ): 'improving' | 'stable' | 'degrading' {
    if (previous === 0) return 'stable';
    
    const changePercent = ((current - previous) / previous) * 100;
    const threshold = 5; // 5% change threshold

    if (Math.abs(changePercent) < threshold) {
      return 'stable';
    }

    if (higherIsBetter) {
      return changePercent > 0 ? 'improving' : 'degrading';
    } else {
      return changePercent < 0 ? 'improving' : 'degrading';
    }
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(
    summary: any,
    trends: any,
    alerts: PerformanceAlert[]
  ): string[] {
    const recommendations: string[] = [];

    // Response time recommendations
    if (summary.averageResponseTime > this.thresholds.maxResponseTime) {
      recommendations.push('Optimize slow operations to improve response times');
    }

    if (trends.responseTimeTrend === 'degrading') {
      recommendations.push('Response times are degrading - investigate recent changes');
    }

    // Memory recommendations
    if (summary.averageMemoryUsage > this.thresholds.maxMemoryUsage) {
      recommendations.push('High memory usage detected - consider memory optimization');
    }

    // Cache recommendations
    if (summary.averageCacheHitRate < this.thresholds.minCacheHitRate) {
      recommendations.push('Improve caching strategy to increase hit rates');
    }

    // Database recommendations
    if (summary.averageDatabaseQueryTime > this.thresholds.maxDatabaseQueryTime) {
      recommendations.push('Optimize database queries and consider adding indexes');
    }

    // Alert-based recommendations
    const criticalAlerts = alerts.filter(a => a.severity === 'critical');
    if (criticalAlerts.length > 0) {
      recommendations.push('Address critical performance alerts immediately');
    }

    // Success rate recommendations
    if (summary.successRate < 0.95) {
      recommendations.push('Investigate and fix errors to improve success rate');
    }

    return recommendations;
  }

  /**
   * Clear old metrics and alerts
   */
  clearOldData(olderThanHours: number = 24): void {
    const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    
    this.metrics = this.metrics.filter(m => m.timestamp >= cutoff);
    this.alerts = this.alerts.filter(a => a.timestamp >= cutoff);
  }

  /**
   * Get all alerts
   */
  getAlerts(severity?: 'low' | 'medium' | 'high' | 'critical'): PerformanceAlert[] {
    if (severity) {
      return this.alerts.filter(a => a.severity === severity);
    }
    return [...this.alerts];
  }

  /**
   * Update performance thresholds
   */
  updateThresholds(newThresholds: Partial<PerformanceThresholds>): void {
    Object.assign(this.thresholds, newThresholds);
  }

  /**
   * Get current thresholds
   */
  getThresholds(): PerformanceThresholds {
    return { ...this.thresholds };
  }
}
