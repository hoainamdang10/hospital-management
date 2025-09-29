import { EventEmitter } from 'events';
import { Logger } from 'winston';
import { SagaCoordinator } from './SagaCoordinator';
import { WorkflowManager } from './WorkflowManager';
import { EventManager } from './EventManager';
import { CoordinationMonitor } from './CoordinationMonitor';
import { ServiceAdapterFactory } from './adapters/ServiceAdapterFactory';
import { RedisClient } from './infrastructure/RedisClient';
import { RabbitMQClient } from './infrastructure/RabbitMQClient';

export interface AdminOperation {
  id: string;
  type: 'create_doctor' | 'bulk_user_import' | 'system_maintenance' | 'cross_service_sync';
  payload: any;
  userId: string;
  timestamp: Date;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  metadata?: Record<string, any>;
}

export interface OrchestrationResult {
  success: boolean;
  operationId: string;
  result?: any;
  error?: string;
  executionTime: number;
  affectedServices: string[];
}

export class AdminOrchestrator extends EventEmitter {
  private sagaCoordinator: SagaCoordinator;
  private workflowManager: WorkflowManager;
  private eventManager: EventManager;
  private monitor: CoordinationMonitor;
  private serviceAdapters: ServiceAdapterFactory;
  private redis: RedisClient;
  private rabbitmq: RabbitMQClient;
  private logger: Logger;
  private isInitialized: boolean = false;

  constructor(logger: Logger) {
    super();
    this.logger = logger;
    
    // Initialize infrastructure
    this.redis = new RedisClient(logger);
    this.rabbitmq = new RabbitMQClient(logger);
    this.serviceAdapters = new ServiceAdapterFactory(logger);
    
    // Initialize core components
    this.sagaCoordinator = new SagaCoordinator(logger, this.redis, this.serviceAdapters);
    this.workflowManager = new WorkflowManager(logger, this.rabbitmq);
    this.eventManager = new EventManager(logger, this.rabbitmq);
    this.monitor = new CoordinationMonitor(logger, this.redis);

    this.setupEventHandlers();
  }

  /**
   * Initialize the orchestrator
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      this.logger.info('Initializing Admin Orchestrator...');

      // Connect to infrastructure
      await this.redis.connect();
      await this.rabbitmq.connect();

      // Setup event handlers
      this.eventManager.setupDefaultHandlers();

      // Register services for monitoring
      this.registerServicesForMonitoring();

      this.isInitialized = true;
      this.logger.info('Admin Orchestrator initialized successfully');

    } catch (error: any) {
      this.logger.error('Failed to initialize Admin Orchestrator:', error);
      throw error;
    }
  }

  /**
   * Register services for monitoring
   */
  private registerServicesForMonitoring(): void {
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

  /**
   * Execute complex admin operation with full orchestration
   */
  async executeOperation(operation: AdminOperation): Promise<OrchestrationResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startTime = Date.now();
    const operationId = operation.id;

    try {
      this.logger.info('Starting admin operation', { operationId, type: operation.type });

      // Start operation tracking
      this.monitor.startOperationTracking(operationId, operation.type, this.getOperationStepCount(operation.type));

      // Update operation status
      await this.updateOperationStatus(operationId, 'running', 0);

      // Emit operation started event
      await this.eventManager.emitEvent(
        EventManager.EVENTS.OPERATION_STARTED,
        {
          operationId,
          type: operation.type,
          userId: operation.userId
        },
        'admin-orchestrator',
        operationId,
        operation.userId
      );

      let result: any;

      // Route to appropriate handler based on operation type
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

      // Update operation status to completed
      await this.updateOperationStatus(operationId, 'completed', 100);
      this.monitor.completeOperationTracking(operationId, 'completed');

      const executionTime = Date.now() - startTime;
      
      await this.eventManager.emitEvent(
        EventManager.EVENTS.OPERATION_COMPLETED,
        {
          operationId,
          result,
          executionTime
        },
        'admin-orchestrator',
        operationId,
        operation.userId
      );

      return {
        success: true,
        operationId,
        result,
        executionTime,
        affectedServices: this.getAffectedServices(operation.type)
      };

    } catch (error: any) {
      this.logger.error('Admin operation failed', { 
        operationId, 
        error: error.message,
        stack: error.stack 
      });

      await this.updateOperationStatus(operationId, 'failed', 0);
      this.monitor.completeOperationTracking(operationId, 'failed');

      await this.eventManager.emitEvent(
        EventManager.EVENTS.OPERATION_FAILED,
        {
          operationId,
          error: error.message
        },
        'admin-orchestrator',
        operationId,
        operation.userId
      );

      return {
        success: false,
        operationId,
        error: error.message,
        executionTime: Date.now() - startTime,
        affectedServices: this.getAffectedServices(operation.type)
      };
    }
  }

  /**
   * Handle doctor creation operation
   */
  private async handleCreateDoctor(operation: AdminOperation): Promise<any> {
    this.logger.info('Handling doctor creation', { operationId: operation.id });

    // Create and execute saga
    const saga = await this.sagaCoordinator.createSaga('create_doctor', {
      ...operation.payload,
      operationId: operation.id,
      userId: operation.userId
    });

    await this.sagaCoordinator.executeSaga(saga.id);

    // Update progress
    this.monitor.updateOperationProgress(operation.id, 5, 0, 0);

    return {
      sagaId: saga.id,
      doctorId: operation.payload.doctorId,
      status: 'completed',
      message: 'Doctor created successfully'
    };
  }

  /**
   * Handle bulk user import operation
   */
  private async handleBulkUserImport(operation: AdminOperation): Promise<any> {
    this.logger.info('Handling bulk user import', { 
      operationId: operation.id,
      userCount: operation.payload.users?.length || 0
    });

    // Create and execute saga
    const saga = await this.sagaCoordinator.createSaga('bulk_user_import', {
      ...operation.payload,
      operationId: operation.id,
      userId: operation.userId
    });

    await this.sagaCoordinator.executeSaga(saga.id);

    // Update progress
    this.monitor.updateOperationProgress(operation.id, 4, 0, 0);

    return {
      sagaId: saga.id,
      importedCount: operation.payload.users?.length || 0,
      status: 'completed',
      message: 'Bulk user import completed successfully'
    };
  }

  /**
   * Handle system maintenance operation
   */
  private async handleSystemMaintenance(operation: AdminOperation): Promise<any> {
    this.logger.info('Handling system maintenance', { operationId: operation.id });

    // Create and execute saga
    const saga = await this.sagaCoordinator.createSaga('system_maintenance', {
      ...operation.payload,
      operationId: operation.id,
      userId: operation.userId
    });

    await this.sagaCoordinator.executeSaga(saga.id);

    // Update progress
    this.monitor.updateOperationProgress(operation.id, 5, 0, 0);

    return {
      sagaId: saga.id,
      maintenanceType: operation.payload.type,
      status: 'completed',
      message: 'System maintenance completed successfully'
    };
  }

  /**
   * Handle cross-service sync operation
   */
  private async handleCrossServiceSync(operation: AdminOperation): Promise<any> {
    this.logger.info('Handling cross-service sync', { operationId: operation.id });

    // Create and execute saga
    const saga = await this.sagaCoordinator.createSaga('cross_service_sync', {
      ...operation.payload,
      operationId: operation.id,
      userId: operation.userId
    });

    await this.sagaCoordinator.executeSaga(saga.id);

    // Update progress
    this.monitor.updateOperationProgress(operation.id, 5, 0, 0);

    return {
      sagaId: saga.id,
      syncedServices: this.getAffectedServices('cross_service_sync'),
      status: 'completed',
      message: 'Cross-service sync completed successfully'
    };
  }

  /**
   * Update operation status in Redis
   */
  private async updateOperationStatus(operationId: string, status: string, progress: number): Promise<void> {
    const key = `operation:${operationId}`;
    const operationData = {
      id: operationId,
      status,
      progress,
      updatedAt: new Date().toISOString()
    };

    await this.redis.set(key, JSON.stringify(operationData), 86400); // 24 hours TTL
  }

  /**
   * Get operation step count for monitoring
   */
  private getOperationStepCount(operationType: string): number {
    const stepCounts: Record<string, number> = {
      'create_doctor': 5,
      'bulk_user_import': 4,
      'system_maintenance': 5,
      'cross_service_sync': 5
    };

    return stepCounts[operationType] || 1;
  }

  /**
   * Get affected services for operation type
   */
  private getAffectedServices(operationType: string): string[] {
    const serviceMap: Record<string, string[]> = {
      'create_doctor': ['auth-service', 'doctor-service'],
      'bulk_user_import': ['auth-service', 'doctor-service', 'patient-service'],
      'system_maintenance': ['auth-service', 'doctor-service', 'patient-service', 'appointment-service', 'medical-records-service', 'payment-service', 'file-service'],
      'cross_service_sync': ['auth-service', 'doctor-service', 'patient-service', 'appointment-service']
    };

    return serviceMap[operationType] || [];
  }

  /**
   * Setup event handlers for orchestration events
   */
  private setupEventHandlers(): void {
    this.eventManager.on('service.unavailable', async (data) => {
      this.logger.warn('Service unavailable detected', data);
      // Implement circuit breaker logic
    });

    this.eventManager.on('operation.timeout', async (data) => {
      this.logger.error('Operation timeout detected', data);
      // Implement timeout handling
    });
  }

  /**
   * Get operation status
   */
  async getOperationStatus(operationId: string): Promise<any> {
    const key = `operation:${operationId}`;
    const operationData = await this.redis.get(key);
    
    if (!operationData) {
      return null;
    }

    return JSON.parse(operationData);
  }

  /**
   * Cancel operation
   */
  async cancelOperation(operationId: string): Promise<boolean> {
    try {
      // Update operation status
      await this.updateOperationStatus(operationId, 'cancelled', 0);

      // Emit cancellation event
      await this.eventManager.emitEvent(
        EventManager.EVENTS.OPERATION_CANCELLED,
        { operationId },
        'admin-orchestrator',
        operationId
      );

      this.logger.info('Operation cancelled', { operationId });
      return true;

    } catch (error: any) {
      this.logger.error('Failed to cancel operation', { operationId, error: error.message });
      return false;
    }
  }

  /**
   * Get orchestrator health status
   */
  async getHealthStatus(): Promise<{
    status: string;
    components: Record<string, any>;
    timestamp: Date;
  }> {
    const components = {
      redis: await this.redis.healthCheck(),
      rabbitmq: await this.rabbitmq.healthCheck(),
      eventManager: await this.eventManager.healthCheck(),
      monitor: await this.monitor.healthCheck()
    };

    const allHealthy = Object.values(components).every(
      (component: any) => component.status === 'healthy'
    );

    return {
      status: allHealthy ? 'healthy' : 'degraded',
      components,
      timestamp: new Date()
    };
  }

  /**
   * Get orchestrator statistics
   */
  async getStatistics(): Promise<{
    sagas: any;
    operations: any;
    services: any;
    events: any;
  }> {
    return {
      sagas: await this.sagaCoordinator.getSagaStatistics(),
      operations: this.monitor.getCurrentSystemStatus(),
      services: this.monitor.getServiceHealth(),
      events: this.eventManager.getEventStatistics()
    };
  }

  /**
   * Shutdown orchestrator
   */
  async shutdown(): Promise<void> {
    try {
      this.logger.info('Shutting down Admin Orchestrator...');

      // Stop monitoring
      this.monitor.stopMonitoring();

      // Disconnect from infrastructure
      await this.rabbitmq.disconnect();
      await this.redis.disconnect();

      this.isInitialized = false;
      this.logger.info('Admin Orchestrator shutdown completed');

    } catch (error: any) {
      this.logger.error('Error during orchestrator shutdown:', error);
    }
  }
}
