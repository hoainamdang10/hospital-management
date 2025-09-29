import { Logger } from 'winston';
import { RedisClient } from './infrastructure/RedisClient';

export interface ServiceHealth {
  serviceName: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: Date;
  responseTime: number;
  errorCount: number;
  consecutiveFailures: number;
  metadata: Record<string, any>;
}

export interface OperationMetrics {
  operationId: string;
  type: string;
  status: 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  stepsCompleted: number;
  totalSteps: number;
  errorCount: number;
  retryCount: number;
  resourceUsage: {
    memory: number;
    cpu: number;
    networkCalls: number;
  };
}

export interface SystemMetrics {
  timestamp: Date;
  activeOperations: number;
  completedOperations: number;
  failedOperations: number;
  averageResponseTime: number;
  errorRate: number;
  throughput: number;
  serviceHealth: Record<string, ServiceHealth>;
}

export class CoordinationMonitor {
  private logger: Logger;
  private redis: RedisClient;
  private serviceHealthMap: Map<string, ServiceHealth> = new Map();
  private operationMetrics: Map<string, OperationMetrics> = new Map();
  private systemMetrics: SystemMetrics[] = [];
  private maxMetricsHistory: number = 1000;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private metricsCollectionInterval: NodeJS.Timeout | null = null;

  constructor(logger: Logger, redis: RedisClient) {
    this.logger = logger;
    this.redis = redis;
    this.startMonitoring();
  }

  /**
   * Start monitoring services and operations
   */
  private startMonitoring(): void {
    // Health check interval (every 30 seconds)
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks().catch(error => {
        this.logger.error('Health check failed:', error);
      });
    }, 30000);

    // Metrics collection interval (every 60 seconds)
    this.metricsCollectionInterval = setInterval(() => {
      this.collectSystemMetrics().catch(error => {
        this.logger.error('Metrics collection failed:', error);
      });
    }, 60000);

    this.logger.info('Coordination monitoring started');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    if (this.metricsCollectionInterval) {
      clearInterval(this.metricsCollectionInterval);
      this.metricsCollectionInterval = null;
    }

    this.logger.info('Coordination monitoring stopped');
  }

  /**
   * Register a service for monitoring
   */
  registerService(serviceName: string, healthCheckUrl?: string): void {
    const serviceHealth: ServiceHealth = {
      serviceName,
      status: 'healthy',
      lastCheck: new Date(),
      responseTime: 0,
      errorCount: 0,
      consecutiveFailures: 0,
      metadata: { healthCheckUrl }
    };

    this.serviceHealthMap.set(serviceName, serviceHealth);
    this.logger.info('Service registered for monitoring', { serviceName });
  }

  /**
   * Update service health status
   */
  updateServiceHealth(serviceName: string, status: 'healthy' | 'degraded' | 'unhealthy', responseTime: number, error?: string): void {
    const serviceHealth = this.serviceHealthMap.get(serviceName);
    if (!serviceHealth) {
      this.logger.warn('Attempted to update health for unregistered service', { serviceName });
      return;
    }

    const previousStatus = serviceHealth.status;
    serviceHealth.status = status;
    serviceHealth.lastCheck = new Date();
    serviceHealth.responseTime = responseTime;

    if (status === 'unhealthy') {
      serviceHealth.errorCount++;
      serviceHealth.consecutiveFailures++;
      if (error) {
        serviceHealth.metadata.lastError = error;
      }
    } else {
      serviceHealth.consecutiveFailures = 0;
    }

    // Log status changes
    if (previousStatus !== status) {
      this.logger.info('Service health status changed', { 
        serviceName, 
        previousStatus, 
        newStatus: status,
        consecutiveFailures: serviceHealth.consecutiveFailures
      });

      // Store health change in Redis for persistence
      this.storeHealthChange(serviceName, previousStatus, status).catch(error => {
        this.logger.error('Failed to store health change:', error);
      });
    }
  }

  /**
   * Start tracking an operation
   */
  startOperationTracking(operationId: string, type: string, totalSteps: number): void {
    const metrics: OperationMetrics = {
      operationId,
      type,
      status: 'running',
      startTime: new Date(),
      stepsCompleted: 0,
      totalSteps,
      errorCount: 0,
      retryCount: 0,
      resourceUsage: {
        memory: process.memoryUsage().heapUsed,
        cpu: 0,
        networkCalls: 0
      }
    };

    this.operationMetrics.set(operationId, metrics);
    this.logger.debug('Operation tracking started', { operationId, type });
  }

  /**
   * Update operation progress
   */
  updateOperationProgress(operationId: string, stepsCompleted: number, errors?: number, retries?: number): void {
    const metrics = this.operationMetrics.get(operationId);
    if (!metrics) {
      this.logger.warn('Attempted to update progress for unknown operation', { operationId });
      return;
    }

    metrics.stepsCompleted = stepsCompleted;
    if (errors !== undefined) {
      metrics.errorCount += errors;
    }
    if (retries !== undefined) {
      metrics.retryCount += retries;
    }

    // Update resource usage
    metrics.resourceUsage.memory = process.memoryUsage().heapUsed;
    metrics.resourceUsage.networkCalls++;

    this.logger.debug('Operation progress updated', { 
      operationId, 
      progress: `${stepsCompleted}/${metrics.totalSteps}`,
      errors: metrics.errorCount
    });
  }

  /**
   * Complete operation tracking
   */
  completeOperationTracking(operationId: string, status: 'completed' | 'failed'): void {
    const metrics = this.operationMetrics.get(operationId);
    if (!metrics) {
      this.logger.warn('Attempted to complete tracking for unknown operation', { operationId });
      return;
    }

    metrics.status = status;
    metrics.endTime = new Date();
    metrics.duration = metrics.endTime.getTime() - metrics.startTime.getTime();

    this.logger.info('Operation tracking completed', { 
      operationId, 
      status, 
      duration: metrics.duration,
      stepsCompleted: metrics.stepsCompleted,
      totalSteps: metrics.totalSteps,
      errorCount: metrics.errorCount
    });

    // Store completed operation metrics in Redis
    this.storeOperationMetrics(metrics).catch(error => {
      this.logger.error('Failed to store operation metrics:', error);
    });
  }

  /**
   * Get service health status
   */
  getServiceHealth(serviceName?: string): ServiceHealth | ServiceHealth[] {
    if (serviceName) {
      return this.serviceHealthMap.get(serviceName) || null;
    }
    return Array.from(this.serviceHealthMap.values());
  }

  /**
   * Get operation metrics
   */
  getOperationMetrics(operationId?: string): OperationMetrics | OperationMetrics[] {
    if (operationId) {
      return this.operationMetrics.get(operationId) || null;
    }
    return Array.from(this.operationMetrics.values());
  }

  /**
   * Get system metrics
   */
  getSystemMetrics(limit?: number): SystemMetrics[] {
    const metrics = this.systemMetrics.slice();
    if (limit) {
      return metrics.slice(-limit);
    }
    return metrics;
  }

  /**
   * Get current system status
   */
  getCurrentSystemStatus(): {
    overallHealth: 'healthy' | 'degraded' | 'unhealthy';
    activeOperations: number;
    healthyServices: number;
    totalServices: number;
    averageResponseTime: number;
    errorRate: number;
  } {
    const services = Array.from(this.serviceHealthMap.values());
    const activeOps = Array.from(this.operationMetrics.values()).filter(op => op.status === 'running');
    
    const healthyServices = services.filter(s => s.status === 'healthy').length;
    const degradedServices = services.filter(s => s.status === 'degraded').length;
    const unhealthyServices = services.filter(s => s.status === 'unhealthy').length;

    let overallHealth: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (unhealthyServices > 0) {
      overallHealth = 'unhealthy';
    } else if (degradedServices > 0) {
      overallHealth = 'degraded';
    }

    const avgResponseTime = services.length > 0 
      ? services.reduce((sum, s) => sum + s.responseTime, 0) / services.length 
      : 0;

    const totalErrors = services.reduce((sum, s) => sum + s.errorCount, 0);
    const totalChecks = services.length * 100; // Approximate
    const errorRate = totalChecks > 0 ? (totalErrors / totalChecks) * 100 : 0;

    return {
      overallHealth,
      activeOperations: activeOps.length,
      healthyServices,
      totalServices: services.length,
      averageResponseTime: Math.round(avgResponseTime),
      errorRate: Math.round(errorRate * 100) / 100
    };
  }

  /**
   * Perform health checks on registered services
   */
  private async performHealthChecks(): Promise<void> {
    const services = Array.from(this.serviceHealthMap.keys());
    
    for (const serviceName of services) {
      try {
        const startTime = Date.now();
        
        // This would make actual HTTP calls to service health endpoints
        // For now, we'll simulate health checks
        const isHealthy = await this.checkServiceHealth(serviceName);
        const responseTime = Date.now() - startTime;
        
        this.updateServiceHealth(
          serviceName, 
          isHealthy ? 'healthy' : 'unhealthy', 
          responseTime
        );
        
      } catch (error: any) {
        this.updateServiceHealth(serviceName, 'unhealthy', 0, error.message);
      }
    }
  }

  /**
   * Check individual service health (placeholder implementation)
   */
  private async checkServiceHealth(serviceName: string): Promise<boolean> {
    // This would make actual HTTP calls to service health endpoints
    // For now, return true to simulate healthy services
    return true;
  }

  /**
   * Collect system metrics
   */
  private async collectSystemMetrics(): Promise<void> {
    const operations = Array.from(this.operationMetrics.values());
    const services = Array.from(this.serviceHealthMap.values());

    const activeOperations = operations.filter(op => op.status === 'running').length;
    const completedOperations = operations.filter(op => op.status === 'completed').length;
    const failedOperations = operations.filter(op => op.status === 'failed').length;

    const completedOpsWithDuration = operations.filter(op => op.duration !== undefined);
    const averageResponseTime = completedOpsWithDuration.length > 0
      ? completedOpsWithDuration.reduce((sum, op) => sum + (op.duration || 0), 0) / completedOpsWithDuration.length
      : 0;

    const totalOperations = operations.length;
    const errorRate = totalOperations > 0 ? (failedOperations / totalOperations) * 100 : 0;

    const throughput = completedOperations; // Operations per collection interval

    const serviceHealthMap: Record<string, ServiceHealth> = {};
    services.forEach(service => {
      serviceHealthMap[service.serviceName] = service;
    });

    const metrics: SystemMetrics = {
      timestamp: new Date(),
      activeOperations,
      completedOperations,
      failedOperations,
      averageResponseTime,
      errorRate,
      throughput,
      serviceHealth: serviceHealthMap
    };

    this.systemMetrics.push(metrics);

    // Maintain metrics history size
    if (this.systemMetrics.length > this.maxMetricsHistory) {
      this.systemMetrics = this.systemMetrics.slice(-this.maxMetricsHistory);
    }

    // Store metrics in Redis
    await this.storeSystemMetrics(metrics);
  }

  /**
   * Store health change in Redis
   */
  private async storeHealthChange(serviceName: string, previousStatus: string, newStatus: string): Promise<void> {
    const key = `health_change:${serviceName}:${Date.now()}`;
    const data = {
      serviceName,
      previousStatus,
      newStatus,
      timestamp: new Date().toISOString()
    };

    await this.redis.set(key, JSON.stringify(data), 86400); // 24 hours TTL
  }

  /**
   * Store operation metrics in Redis
   */
  private async storeOperationMetrics(metrics: OperationMetrics): Promise<void> {
    const key = `operation_metrics:${metrics.operationId}`;
    await this.redis.set(key, JSON.stringify(metrics), 86400); // 24 hours TTL
  }

  /**
   * Store system metrics in Redis
   */
  private async storeSystemMetrics(metrics: SystemMetrics): Promise<void> {
    const key = `system_metrics:${metrics.timestamp.getTime()}`;
    await this.redis.set(key, JSON.stringify(metrics), 86400); // 24 hours TTL
  }

  /**
   * Health check for the monitor itself
   */
  async healthCheck(): Promise<{
    status: string;
    monitoredServices: number;
    activeOperations: number;
    redisConnected: boolean;
  }> {
    const redisHealth = await this.redis.healthCheck();
    
    return {
      status: redisHealth.status === 'healthy' ? 'healthy' : 'degraded',
      monitoredServices: this.serviceHealthMap.size,
      activeOperations: Array.from(this.operationMetrics.values()).filter(op => op.status === 'running').length,
      redisConnected: redisHealth.status === 'healthy'
    };
  }
}
