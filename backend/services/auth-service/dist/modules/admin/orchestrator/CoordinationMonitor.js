"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoordinationMonitor = void 0;
class CoordinationMonitor {
    constructor(logger, redis) {
        this.serviceHealthMap = new Map();
        this.operationMetrics = new Map();
        this.systemMetrics = [];
        this.maxMetricsHistory = 1000;
        this.healthCheckInterval = null;
        this.metricsCollectionInterval = null;
        this.logger = logger;
        this.redis = redis;
        this.startMonitoring();
    }
    startMonitoring() {
        this.healthCheckInterval = setInterval(() => {
            this.performHealthChecks().catch(error => {
                this.logger.error('Health check failed:', error);
            });
        }, 30000);
        this.metricsCollectionInterval = setInterval(() => {
            this.collectSystemMetrics().catch(error => {
                this.logger.error('Metrics collection failed:', error);
            });
        }, 60000);
        this.logger.info('Coordination monitoring started');
    }
    stopMonitoring() {
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
    registerService(serviceName, healthCheckUrl) {
        const serviceHealth = {
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
    updateServiceHealth(serviceName, status, responseTime, error) {
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
        }
        else {
            serviceHealth.consecutiveFailures = 0;
        }
        if (previousStatus !== status) {
            this.logger.info('Service health status changed', {
                serviceName,
                previousStatus,
                newStatus: status,
                consecutiveFailures: serviceHealth.consecutiveFailures
            });
            this.storeHealthChange(serviceName, previousStatus, status).catch(error => {
                this.logger.error('Failed to store health change:', error);
            });
        }
    }
    startOperationTracking(operationId, type, totalSteps) {
        const metrics = {
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
    updateOperationProgress(operationId, stepsCompleted, errors, retries) {
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
        metrics.resourceUsage.memory = process.memoryUsage().heapUsed;
        metrics.resourceUsage.networkCalls++;
        this.logger.debug('Operation progress updated', {
            operationId,
            progress: `${stepsCompleted}/${metrics.totalSteps}`,
            errors: metrics.errorCount
        });
    }
    completeOperationTracking(operationId, status) {
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
        this.storeOperationMetrics(metrics).catch(error => {
            this.logger.error('Failed to store operation metrics:', error);
        });
    }
    getServiceHealth(serviceName) {
        if (serviceName) {
            return this.serviceHealthMap.get(serviceName) || null;
        }
        return Array.from(this.serviceHealthMap.values());
    }
    getOperationMetrics(operationId) {
        if (operationId) {
            return this.operationMetrics.get(operationId) || null;
        }
        return Array.from(this.operationMetrics.values());
    }
    getSystemMetrics(limit) {
        const metrics = this.systemMetrics.slice();
        if (limit) {
            return metrics.slice(-limit);
        }
        return metrics;
    }
    getCurrentSystemStatus() {
        const services = Array.from(this.serviceHealthMap.values());
        const activeOps = Array.from(this.operationMetrics.values()).filter(op => op.status === 'running');
        const healthyServices = services.filter(s => s.status === 'healthy').length;
        const degradedServices = services.filter(s => s.status === 'degraded').length;
        const unhealthyServices = services.filter(s => s.status === 'unhealthy').length;
        let overallHealth = 'healthy';
        if (unhealthyServices > 0) {
            overallHealth = 'unhealthy';
        }
        else if (degradedServices > 0) {
            overallHealth = 'degraded';
        }
        const avgResponseTime = services.length > 0
            ? services.reduce((sum, s) => sum + s.responseTime, 0) / services.length
            : 0;
        const totalErrors = services.reduce((sum, s) => sum + s.errorCount, 0);
        const totalChecks = services.length * 100;
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
    async performHealthChecks() {
        const services = Array.from(this.serviceHealthMap.keys());
        for (const serviceName of services) {
            try {
                const startTime = Date.now();
                const isHealthy = await this.checkServiceHealth(serviceName);
                const responseTime = Date.now() - startTime;
                this.updateServiceHealth(serviceName, isHealthy ? 'healthy' : 'unhealthy', responseTime);
            }
            catch (error) {
                this.updateServiceHealth(serviceName, 'unhealthy', 0, error.message);
            }
        }
    }
    async checkServiceHealth(serviceName) {
        return true;
    }
    async collectSystemMetrics() {
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
        const throughput = completedOperations;
        const serviceHealthMap = {};
        services.forEach(service => {
            serviceHealthMap[service.serviceName] = service;
        });
        const metrics = {
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
        if (this.systemMetrics.length > this.maxMetricsHistory) {
            this.systemMetrics = this.systemMetrics.slice(-this.maxMetricsHistory);
        }
        await this.storeSystemMetrics(metrics);
    }
    async storeHealthChange(serviceName, previousStatus, newStatus) {
        const key = `health_change:${serviceName}:${Date.now()}`;
        const data = {
            serviceName,
            previousStatus,
            newStatus,
            timestamp: new Date().toISOString()
        };
        await this.redis.set(key, JSON.stringify(data), 86400);
    }
    async storeOperationMetrics(metrics) {
        const key = `operation_metrics:${metrics.operationId}`;
        await this.redis.set(key, JSON.stringify(metrics), 86400);
    }
    async storeSystemMetrics(metrics) {
        const key = `system_metrics:${metrics.timestamp.getTime()}`;
        await this.redis.set(key, JSON.stringify(metrics), 86400);
    }
    async healthCheck() {
        const redisHealth = await this.redis.healthCheck();
        return {
            status: redisHealth.status === 'healthy' ? 'healthy' : 'degraded',
            monitoredServices: this.serviceHealthMap.size,
            activeOperations: Array.from(this.operationMetrics.values()).filter(op => op.status === 'running').length,
            redisConnected: redisHealth.status === 'healthy'
        };
    }
}
exports.CoordinationMonitor = CoordinationMonitor;
//# sourceMappingURL=CoordinationMonitor.js.map