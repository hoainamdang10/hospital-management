import { EventEmitter } from 'events';
import { Logger } from 'winston';
import { SagaCoordinator } from './SagaCoordinator';
import { WorkflowManager } from './WorkflowManager';
import { EventManager } from './EventManager';
import { CoordinationMonitor } from './CoordinationMonitor';
import { ServiceAdapterFactory } from '../adapters/ServiceAdapterFactory';
import { RedisClient } from '../infrastructure/RedisClient';
import { RabbitMQClient } from '../infrastructure/RabbitMQClient';

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

  constructor(
    logger: Logger,
    redis: RedisClient,
    rabbitmq: RabbitMQClient
  ) {
    super();
    this.logger = logger;
    this.redis = redis;
    this.rabbitmq = rabbitmq;
    
    // Initialize core components
    this.sagaCoordinator = new SagaCoordinator(logger, redis);
    this.workflowManager = new WorkflowManager(logger, rabbitmq);
    this.eventManager = new EventManager(logger, rabbitmq);
    this.monitor = new CoordinationMonitor(logger, redis);
    this.serviceAdapters = new ServiceAdapterFactory(logger);

    this.setupEventHandlers();
  }

  /**
   * Execute complex admin operation with full orchestration
   */
  async executeOperation(operation: AdminOperation): Promise<OrchestrationResult> {
    const startTime = Date.now();
    const operationId = operation.id;

    try {
      this.logger.info('Starting admin operation', { operationId, type: operation.type });

      // Update operation status
      await this.updateOperationStatus(operationId, 'running', 0);

      // Emit operation started event
      this.eventManager.emit('operation.started', {
        operationId,
        type: operation.type,
        userId: operation.userId
      });

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

      const executionTime = Date.now() - startTime;
      
      this.eventManager.emit('operation.completed', {
        operationId,
        result,
        executionTime
      });

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

      this.eventManager.emit('operation.failed', {
        operationId,
        error: error.message
      });

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
   * Handle doctor creation with department assignment
   */
  private async handleCreateDoctor(operation: AdminOperation): Promise<any> {
    const { doctorData } = operation.payload;
    
    // Create saga for doctor creation workflow
    const saga = await this.sagaCoordinator.createSaga('create_doctor', {
      operationId: operation.id,
      doctorData
    });

    try {
      // Step 1: Validate department capacity
      await this.updateOperationStatus(operation.id, 'running', 20);
      const departmentAdapter = this.serviceAdapters.getDepartmentAdapter();
      const departmentCapacity = await departmentAdapter.checkCapacity(doctorData.departmentId);
      
      if (!departmentCapacity.available) {
        throw new Error('Department has reached maximum capacity');
      }

      // Step 2: Create user profile via Auth Service
      await this.updateOperationStatus(operation.id, 'running', 40);
      const authAdapter = this.serviceAdapters.getAuthAdapter();
      const userProfile = await authAdapter.createUser({
        email: doctorData.email,
        role: 'doctor',
        full_name: doctorData.full_name,
        phone_number: doctorData.phone_number
      });

      // Step 3: Create doctor profile via Doctor Service
      await this.updateOperationStatus(operation.id, 'running', 60);
      const doctorAdapter = this.serviceAdapters.getDoctorAdapter();
      const doctor = await doctorAdapter.createDoctor({
        ...doctorData,
        profile_id: userProfile.id
      });

      // Step 4: Update department capacity
      await this.updateOperationStatus(operation.id, 'running', 80);
      await departmentAdapter.updateCapacity(doctorData.departmentId, -1);

      // Step 5: Send welcome notification
      await this.updateOperationStatus(operation.id, 'running', 90);
      const notificationAdapter = this.serviceAdapters.getNotificationAdapter();
      await notificationAdapter.sendWelcomeEmail({
        email: doctorData.email,
        name: doctorData.full_name,
        role: 'doctor'
      });

      // Mark saga as completed
      await this.sagaCoordinator.completeSaga(saga.id);

      return {
        doctor,
        userProfile,
        departmentUpdated: true,
        notificationSent: true
      };

    } catch (error: any) {
      // Compensate saga on failure
      await this.sagaCoordinator.compensateSaga(saga.id, error.message);
      throw error;
    }
  }

  /**
   * Handle bulk user import operation
   */
  private async handleBulkUserImport(operation: AdminOperation): Promise<any> {
    const { users, options } = operation.payload;
    const results = {
      successful: 0,
      failed: 0,
      errors: [] as any[]
    };

    const totalUsers = users.length;
    
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const progress = Math.round(((i + 1) / totalUsers) * 100);
      
      try {
        await this.updateOperationStatus(operation.id, 'running', progress);
        
        // Create individual user operation
        const userOperation: AdminOperation = {
          id: `${operation.id}_user_${i}`,
          type: 'create_doctor', // or other user type
          payload: { doctorData: user },
          userId: operation.userId,
          timestamp: new Date(),
          status: 'pending',
          progress: 0
        };

        await this.executeOperation(userOperation);
        results.successful++;

      } catch (error: any) {
        results.failed++;
        results.errors.push({
          user: user.email,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Handle system maintenance operations
   */
  private async handleSystemMaintenance(operation: AdminOperation): Promise<any> {
    const { maintenanceType, options } = operation.payload;

    switch (maintenanceType) {
      case 'database_cleanup':
        return await this.performDatabaseCleanup(operation, options);
      case 'cache_refresh':
        return await this.performCacheRefresh(operation, options);
      case 'service_restart':
        return await this.performServiceRestart(operation, options);
      default:
        throw new Error(`Unknown maintenance type: ${maintenanceType}`);
    }
  }

  /**
   * Handle cross-service synchronization
   */
  private async handleCrossServiceSync(operation: AdminOperation): Promise<any> {
    const { syncType, services } = operation.payload;
    
    // Implementation for cross-service sync
    // This would coordinate data synchronization across multiple services
    
    return {
      syncType,
      servicesProcessed: services.length,
      timestamp: new Date()
    };
  }

  /**
   * Update operation status in Redis
   */
  private async updateOperationStatus(
    operationId: string, 
    status: AdminOperation['status'], 
    progress: number
  ): Promise<void> {
    const key = `admin:operation:${operationId}`;
    await this.redis.hset(key, {
      status,
      progress: progress.toString(),
      updated_at: new Date().toISOString()
    });
    
    // Set expiration for completed/failed operations
    if (status === 'completed' || status === 'failed') {
      await this.redis.expire(key, 3600); // 1 hour
    }
  }

  /**
   * Get affected services for operation type
   */
  private getAffectedServices(operationType: string): string[] {
    const serviceMap: Record<string, string[]> = {
      'create_doctor': ['auth-service', 'doctor-service', 'department-service', 'notification-service'],
      'bulk_user_import': ['auth-service', 'doctor-service', 'patient-service'],
      'system_maintenance': ['all-services'],
      'cross_service_sync': ['all-services']
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
   * Database cleanup maintenance
   */
  private async performDatabaseCleanup(operation: AdminOperation, options: any): Promise<any> {
    // Implementation for database cleanup
    await this.updateOperationStatus(operation.id, 'running', 50);
    // Cleanup logic here
    return { cleaned: true, recordsRemoved: 0 };
  }

  /**
   * Cache refresh maintenance
   */
  private async performCacheRefresh(operation: AdminOperation, options: any): Promise<any> {
    // Implementation for cache refresh
    await this.updateOperationStatus(operation.id, 'running', 50);
    await this.redis.flushall();
    return { cacheRefreshed: true };
  }

  /**
   * Service restart maintenance
   */
  private async performServiceRestart(operation: AdminOperation, options: any): Promise<any> {
    // Implementation for service restart coordination
    await this.updateOperationStatus(operation.id, 'running', 50);
    // Service restart logic here
    return { servicesRestarted: options.services || [] };
  }
}
