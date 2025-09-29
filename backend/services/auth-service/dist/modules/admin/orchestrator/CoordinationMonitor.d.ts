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
export declare class CoordinationMonitor {
    private logger;
    private redis;
    private serviceHealthMap;
    private operationMetrics;
    private systemMetrics;
    private maxMetricsHistory;
    private healthCheckInterval;
    private metricsCollectionInterval;
    constructor(logger: Logger, redis: RedisClient);
    private startMonitoring;
    stopMonitoring(): void;
    registerService(serviceName: string, healthCheckUrl?: string): void;
    updateServiceHealth(serviceName: string, status: 'healthy' | 'degraded' | 'unhealthy', responseTime: number, error?: string): void;
    startOperationTracking(operationId: string, type: string, totalSteps: number): void;
    updateOperationProgress(operationId: string, stepsCompleted: number, errors?: number, retries?: number): void;
    completeOperationTracking(operationId: string, status: 'completed' | 'failed'): void;
    getServiceHealth(serviceName?: string): ServiceHealth | ServiceHealth[];
    getOperationMetrics(operationId?: string): OperationMetrics | OperationMetrics[];
    getSystemMetrics(limit?: number): SystemMetrics[];
    getCurrentSystemStatus(): {
        overallHealth: 'healthy' | 'degraded' | 'unhealthy';
        activeOperations: number;
        healthyServices: number;
        totalServices: number;
        averageResponseTime: number;
        errorRate: number;
    };
    private performHealthChecks;
    private checkServiceHealth;
    private collectSystemMetrics;
    private storeHealthChange;
    private storeOperationMetrics;
    private storeSystemMetrics;
    healthCheck(): Promise<{
        status: string;
        monitoredServices: number;
        activeOperations: number;
        redisConnected: boolean;
    }>;
}
//# sourceMappingURL=CoordinationMonitor.d.ts.map