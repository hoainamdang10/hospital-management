"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminOrchestrator = void 0;
const events_1 = require("events");
const SagaCoordinator_1 = require("./SagaCoordinator");
const WorkflowManager_1 = require("./WorkflowManager");
const EventManager_1 = require("./EventManager");
const CoordinationMonitor_1 = require("./CoordinationMonitor");
const ServiceAdapterFactory_1 = require("./adapters/ServiceAdapterFactory");
const RedisClient_1 = require("./infrastructure/RedisClient");
const RabbitMQClient_1 = require("./infrastructure/RabbitMQClient");
class AdminOrchestrator extends events_1.EventEmitter {
    constructor(logger) {
        super();
        this.isInitialized = false;
        this.logger = logger;
        this.redis = new RedisClient_1.RedisClient(logger);
        this.rabbitmq = new RabbitMQClient_1.RabbitMQClient(logger);
        this.serviceAdapters = new ServiceAdapterFactory_1.ServiceAdapterFactory(logger);
        this.sagaCoordinator = new SagaCoordinator_1.SagaCoordinator(logger, this.redis, this.serviceAdapters);
        this.workflowManager = new WorkflowManager_1.WorkflowManager(logger, this.rabbitmq);
        this.eventManager = new EventManager_1.EventManager(logger, this.rabbitmq);
        this.monitor = new CoordinationMonitor_1.CoordinationMonitor(logger, this.redis);
        this.setupEventHandlers();
    }
    async initialize() {
        if (this.isInitialized) {
            return;
        }
        try {
            this.logger.info('Initializing Admin Orchestrator...');
            await this.redis.connect();
            await this.rabbitmq.connect();
            this.eventManager.setupDefaultHandlers();
            this.registerServicesForMonitoring();
            this.isInitialized = true;
            this.logger.info('Admin Orchestrator initialized successfully');
        }
        catch (error) {
            this.logger.error('Failed to initialize Admin Orchestrator:', error);
            throw error;
        }
    }
    registerServicesForMonitoring() {
        const services = [
            'auth-service',
            'doctor-service',
            'patient-service',
            'appointment-service',
            'medical-records-service',
            'payment-service',
            'file-service'
        ];
        services.forEach(serviceName => {
            this.monitor.registerService(serviceName);
        });
    }
    async executeOperation(operation) {
        if (!this.isInitialized) {
            await this.initialize();
        }
        const startTime = Date.now();
        const operationId = operation.id;
        try {
            this.logger.info('Starting admin operation', { operationId, type: operation.type });
            this.monitor.startOperationTracking(operationId, operation.type, this.getOperationStepCount(operation.type));
            await this.updateOperationStatus(operationId, 'running', 0);
            await this.eventManager.emitEvent(EventManager_1.EventManager.EVENTS.OPERATION_STARTED, {
                operationId,
                type: operation.type,
                userId: operation.userId
            }, 'admin-orchestrator', operationId, operation.userId);
            let result;
            switch (operation.type) {
                case 'create_doctor':
                    result = await this.handleCreateDoctor(operation);
                    break;
                case 'bulk_user_import':
                    result = await this.handleBulkUserImport(operation);
                    break;
                case 'system_maintenance':
                    result = await this.handleSystemMaintenance(operation);
                    break;
                case 'cross_service_sync':
                    result = await this.handleCrossServiceSync(operation);
                    break;
                default:
                    throw new Error(`Unknown operation type: ${operation.type}`);
            }
            await this.updateOperationStatus(operationId, 'completed', 100);
            this.monitor.completeOperationTracking(operationId, 'completed');
            const executionTime = Date.now() - startTime;
            await this.eventManager.emitEvent(EventManager_1.EventManager.EVENTS.OPERATION_COMPLETED, {
                operationId,
                result,
                executionTime
            }, 'admin-orchestrator', operationId, operation.userId);
            return {
                success: true,
                operationId,
                result,
                executionTime,
                affectedServices: this.getAffectedServices(operation.type)
            };
        }
        catch (error) {
            this.logger.error('Admin operation failed', {
                operationId,
                error: error.message,
                stack: error.stack
            });
            await this.updateOperationStatus(operationId, 'failed', 0);
            this.monitor.completeOperationTracking(operationId, 'failed');
            await this.eventManager.emitEvent(EventManager_1.EventManager.EVENTS.OPERATION_FAILED, {
                operationId,
                error: error.message
            }, 'admin-orchestrator', operationId, operation.userId);
            return {
                success: false,
                operationId,
                error: error.message,
                executionTime: Date.now() - startTime,
                affectedServices: this.getAffectedServices(operation.type)
            };
        }
    }
    async handleCreateDoctor(operation) {
        this.logger.info('Handling doctor creation', { operationId: operation.id });
        const saga = await this.sagaCoordinator.createSaga('create_doctor', {
            ...operation.payload,
            operationId: operation.id,
            userId: operation.userId
        });
        await this.sagaCoordinator.executeSaga(saga.id);
        this.monitor.updateOperationProgress(operation.id, 5, 0, 0);
        return {
            sagaId: saga.id,
            doctorId: operation.payload.doctorId,
            status: 'completed',
            message: 'Doctor created successfully'
        };
    }
    async handleBulkUserImport(operation) {
        this.logger.info('Handling bulk user import', {
            operationId: operation.id,
            userCount: operation.payload.users?.length || 0
        });
        const saga = await this.sagaCoordinator.createSaga('bulk_user_import', {
            ...operation.payload,
            operationId: operation.id,
            userId: operation.userId
        });
        await this.sagaCoordinator.executeSaga(saga.id);
        this.monitor.updateOperationProgress(operation.id, 4, 0, 0);
        return {
            sagaId: saga.id,
            importedCount: operation.payload.users?.length || 0,
            status: 'completed',
            message: 'Bulk user import completed successfully'
        };
    }
    async handleSystemMaintenance(operation) {
        this.logger.info('Handling system maintenance', { operationId: operation.id });
        const saga = await this.sagaCoordinator.createSaga('system_maintenance', {
            ...operation.payload,
            operationId: operation.id,
            userId: operation.userId
        });
        await this.sagaCoordinator.executeSaga(saga.id);
        this.monitor.updateOperationProgress(operation.id, 5, 0, 0);
        return {
            sagaId: saga.id,
            maintenanceType: operation.payload.type,
            status: 'completed',
            message: 'System maintenance completed successfully'
        };
    }
    async handleCrossServiceSync(operation) {
        this.logger.info('Handling cross-service sync', { operationId: operation.id });
        const saga = await this.sagaCoordinator.createSaga('cross_service_sync', {
            ...operation.payload,
            operationId: operation.id,
            userId: operation.userId
        });
        await this.sagaCoordinator.executeSaga(saga.id);
        this.monitor.updateOperationProgress(operation.id, 5, 0, 0);
        return {
            sagaId: saga.id,
            syncedServices: this.getAffectedServices('cross_service_sync'),
            status: 'completed',
            message: 'Cross-service sync completed successfully'
        };
    }
    async updateOperationStatus(operationId, status, progress) {
        const key = `operation:${operationId}`;
        const operationData = {
            id: operationId,
            status,
            progress,
            updatedAt: new Date().toISOString()
        };
        await this.redis.set(key, JSON.stringify(operationData), 86400);
    }
    getOperationStepCount(operationType) {
        const stepCounts = {
            'create_doctor': 5,
            'bulk_user_import': 4,
            'system_maintenance': 5,
            'cross_service_sync': 5
        };
        return stepCounts[operationType] || 1;
    }
    getAffectedServices(operationType) {
        const serviceMap = {
            'create_doctor': ['auth-service', 'doctor-service'],
            'bulk_user_import': ['auth-service', 'doctor-service', 'patient-service'],
            'system_maintenance': ['auth-service', 'doctor-service', 'patient-service', 'appointment-service', 'medical-records-service', 'payment-service', 'file-service'],
            'cross_service_sync': ['auth-service', 'doctor-service', 'patient-service', 'appointment-service']
        };
        return serviceMap[operationType] || [];
    }
    setupEventHandlers() {
        this.eventManager.on('service.unavailable', async (data) => {
            this.logger.warn('Service unavailable detected', data);
        });
        this.eventManager.on('operation.timeout', async (data) => {
            this.logger.error('Operation timeout detected', data);
        });
    }
    async getOperationStatus(operationId) {
        const key = `operation:${operationId}`;
        const operationData = await this.redis.get(key);
        if (!operationData) {
            return null;
        }
        return JSON.parse(operationData);
    }
    async cancelOperation(operationId) {
        try {
            await this.updateOperationStatus(operationId, 'cancelled', 0);
            await this.eventManager.emitEvent(EventManager_1.EventManager.EVENTS.OPERATION_CANCELLED, { operationId }, 'admin-orchestrator', operationId);
            this.logger.info('Operation cancelled', { operationId });
            return true;
        }
        catch (error) {
            this.logger.error('Failed to cancel operation', { operationId, error: error.message });
            return false;
        }
    }
    async getHealthStatus() {
        const components = {
            redis: await this.redis.healthCheck(),
            rabbitmq: await this.rabbitmq.healthCheck(),
            eventManager: await this.eventManager.healthCheck(),
            monitor: await this.monitor.healthCheck()
        };
        const allHealthy = Object.values(components).every((component) => component.status === 'healthy');
        return {
            status: allHealthy ? 'healthy' : 'degraded',
            components,
            timestamp: new Date()
        };
    }
    async getStatistics() {
        return {
            sagas: await this.sagaCoordinator.getSagaStatistics(),
            operations: this.monitor.getCurrentSystemStatus(),
            services: this.monitor.getServiceHealth(),
            events: this.eventManager.getEventStatistics()
        };
    }
    async shutdown() {
        try {
            this.logger.info('Shutting down Admin Orchestrator...');
            this.monitor.stopMonitoring();
            await this.rabbitmq.disconnect();
            await this.redis.disconnect();
            this.isInitialized = false;
            this.logger.info('Admin Orchestrator shutdown completed');
        }
        catch (error) {
            this.logger.error('Error during orchestrator shutdown:', error);
        }
    }
}
exports.AdminOrchestrator = AdminOrchestrator;
//# sourceMappingURL=AdminOrchestrator.js.map