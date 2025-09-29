import logger from '@hospital/shared/dist/utils/logger';

// Performance metrics interface
interface PerformanceMetrics {
  timestamp: string;
  requestCount: number;
  averageResponseTime: number;
  errorRate: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: number;
  activeConnections: number;
  cacheHitRate: number;
  dataLoaderStats: {
    batchCount: number;
    averageBatchSize: number;
    cacheHitRate: number;
  };
  subscriptionStats: {
    activeSubscriptions: number;
    messagesPerSecond: number;
    connectionCount: number;
  };
}

// Request tracking interface
interface RequestMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  query?: string;
  variables?: any;
  operationName?: string;
  success: boolean;
  errorMessage?: string;
  cacheHit?: boolean;
  dataLoaderUsed?: boolean;
}

class PerformanceService {
  private metrics: PerformanceMetrics;
  private requestHistory: RequestMetrics[] = [];
  private maxHistorySize: number = 1000;
  private metricsInterval: NodeJS.Timeout | null = null;
  private isInitialized: boolean = false;

  // Performance counters
  private requestCount: number = 0;
  private errorCount: number = 0;
  private totalResponseTime: number = 0;
  private cacheHits: number = 0;
  private cacheMisses: number = 0;
  private dataLoaderBatches: number = 0;
  private dataLoaderCacheHits: number = 0;
  private dataLoaderCacheMisses: number = 0;
  private activeSubscriptions: number = 0;
  private subscriptionMessages: number = 0;
  private connectionCount: number = 0;

  constructor() {
    this.metrics = this.initializeMetrics();
  }

  /**
   * Initialize performance service
   */
  async initialize(): Promise<void> {
    try {
      logger.info('🔄 Initializing Performance Service...');

      // Start metrics collection interval
      this.startMetricsCollection();

      this.isInitialized = true;
      logger.info('✅ Performance Service initialized successfully');
    } catch (error) {
      logger.error('❌ Failed to initialize Performance Service:', error);
      throw error;
    }
  }

  /**
   * Initialize metrics object
   */
  private initializeMetrics(): PerformanceMetrics {
    return {
      timestamp: new Date().toISOString(),
      requestCount: 0,
      averageResponseTime: 0,
      errorRate: 0,
      memoryUsage: process.memoryUsage(),
      cpuUsage: 0,
      activeConnections: 0,
      cacheHitRate: 0,
      dataLoaderStats: {
        batchCount: 0,
        averageBatchSize: 0,
        cacheHitRate: 0
      },
      subscriptionStats: {
        activeSubscriptions: 0,
        messagesPerSecond: 0,
        connectionCount: 0
      }
    };
  }

  /**
   * Start metrics collection interval
   */
  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(() => {
      this.updateMetrics();
    }, 10000); // Update every 10 seconds
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(): void {
    try {
      this.metrics = {
        timestamp: new Date().toISOString(),
        requestCount: this.requestCount,
        averageResponseTime: this.requestCount > 0 ? this.totalResponseTime / this.requestCount : 0,
        errorRate: this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0,
        memoryUsage: process.memoryUsage(),
        cpuUsage: this.getCpuUsage(),
        activeConnections: this.connectionCount,
        cacheHitRate: (this.cacheHits + this.cacheMisses) > 0 ? 
          (this.cacheHits / (this.cacheHits + this.cacheMisses)) * 100 : 0,
        dataLoaderStats: {
          batchCount: this.dataLoaderBatches,
          averageBatchSize: this.dataLoaderBatches > 0 ? this.requestCount / this.dataLoaderBatches : 0,
          cacheHitRate: (this.dataLoaderCacheHits + this.dataLoaderCacheMisses) > 0 ?
            (this.dataLoaderCacheHits / (this.dataLoaderCacheHits + this.dataLoaderCacheMisses)) * 100 : 0
        },
        subscriptionStats: {
          activeSubscriptions: this.activeSubscriptions,
          messagesPerSecond: this.subscriptionMessages / 10, // Messages per second over last 10 seconds
          connectionCount: this.connectionCount
        }
      };

      // Reset per-interval counters
      this.subscriptionMessages = 0;

      // Log metrics periodically
      if (this.requestCount % 100 === 0 && this.requestCount > 0) {
        this.logMetrics();
      }
    } catch (error) {
      logger.error('❌ Error updating metrics:', error);
    }
  }

  /**
   * Get CPU usage (simplified)
   */
  private getCpuUsage(): number {
    const usage = process.cpuUsage();
    return (usage.user + usage.system) / 1000000; // Convert to seconds
  }

  /**
   * Track GraphQL request start
   */
  trackRequestStart(query?: string, variables?: any, operationName?: string): string {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const requestMetrics: RequestMetrics = {
      startTime: Date.now(),
      query,
      variables,
      operationName,
      success: false
    };

    this.requestHistory.push(requestMetrics);
    
    // Keep history size manageable
    if (this.requestHistory.length > this.maxHistorySize) {
      this.requestHistory.shift();
    }

    this.requestCount++;
    
    return requestId;
  }

  /**
   * Track GraphQL request end
   */
  trackRequestEnd(requestId: string, success: boolean, errorMessage?: string): void {
    const request = this.requestHistory[this.requestHistory.length - 1];
    
    if (request) {
      request.endTime = Date.now();
      request.duration = request.endTime - request.startTime;
      request.success = success;
      request.errorMessage = errorMessage;

      this.totalResponseTime += request.duration;

      if (!success) {
        this.errorCount++;
      }
    }
  }

  /**
   * Track cache hit/miss
   */
  trackCacheHit(hit: boolean): void {
    if (hit) {
      this.cacheHits++;
    } else {
      this.cacheMisses++;
    }
  }

  /**
   * Track DataLoader usage
   */
  trackDataLoaderBatch(batchSize: number): void {
    this.dataLoaderBatches++;
  }

  /**
   * Track DataLoader cache hit/miss
   */
  trackDataLoaderCache(hit: boolean): void {
    if (hit) {
      this.dataLoaderCacheHits++;
    } else {
      this.dataLoaderCacheMisses++;
    }
  }

  /**
   * Track subscription events
   */
  trackSubscriptionEvent(event: 'connect' | 'disconnect' | 'message'): void {
    switch (event) {
      case 'connect':
        this.activeSubscriptions++;
        this.connectionCount++;
        break;
      case 'disconnect':
        this.activeSubscriptions--;
        break;
      case 'message':
        this.subscriptionMessages++;
        break;
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get request history
   */
  getRequestHistory(limit: number = 100): RequestMetrics[] {
    return this.requestHistory.slice(-limit);
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): any {
    const recentRequests = this.getRequestHistory(100);
    const successfulRequests = recentRequests.filter(r => r.success);
    const failedRequests = recentRequests.filter(r => !r.success);

    return {
      overview: {
        totalRequests: this.requestCount,
        successRate: this.requestCount > 0 ? ((this.requestCount - this.errorCount) / this.requestCount) * 100 : 0,
        averageResponseTime: this.metrics.averageResponseTime,
        cacheHitRate: this.metrics.cacheHitRate
      },
      recent: {
        last100Requests: recentRequests.length,
        successfulRequests: successfulRequests.length,
        failedRequests: failedRequests.length,
        averageResponseTime: successfulRequests.length > 0 ? 
          successfulRequests.reduce((sum, r) => sum + (r.duration || 0), 0) / successfulRequests.length : 0
      },
      dataLoader: this.metrics.dataLoaderStats,
      subscriptions: this.metrics.subscriptionStats,
      system: {
        memoryUsage: this.metrics.memoryUsage,
        cpuUsage: this.metrics.cpuUsage,
        uptime: process.uptime()
      }
    };
  }

  /**
   * Log performance metrics
   */
  private logMetrics(): void {
    const summary = this.getPerformanceSummary();
    
    logger.info('📊 Performance Metrics:', {
      requests: summary.overview.totalRequests,
      successRate: `${summary.overview.successRate.toFixed(2)}%`,
      avgResponseTime: `${summary.overview.averageResponseTime.toFixed(2)}ms`,
      cacheHitRate: `${summary.overview.cacheHitRate.toFixed(2)}%`,
      memoryMB: Math.round(summary.system.memoryUsage.heapUsed / 1024 / 1024),
      activeSubscriptions: summary.subscriptions.activeSubscriptions
    });
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.requestCount = 0;
    this.errorCount = 0;
    this.totalResponseTime = 0;
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.dataLoaderBatches = 0;
    this.dataLoaderCacheHits = 0;
    this.dataLoaderCacheMisses = 0;
    this.requestHistory = [];
    this.metrics = this.initializeMetrics();
    
    logger.info('🔄 Performance metrics reset');
  }

  /**
   * Check if service is ready
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    try {
      logger.info('🧹 Cleaning up Performance Service...');
      
      if (this.metricsInterval) {
        clearInterval(this.metricsInterval);
        this.metricsInterval = null;
      }
      
      this.isInitialized = false;
      logger.info('✅ Performance Service cleanup completed');
    } catch (error) {
      logger.error('❌ Failed to cleanup Performance Service:', error);
    }
  }
}

// Export singleton instance
export const performanceService = new PerformanceService();
export default performanceService;
