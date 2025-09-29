import { Logger } from 'winston';
import { RedisClient } from '../infrastructure/RedisClient';

export interface SagaStep {
  id: string;
  name: string;
  service: string;
  action: string;
  payload: any;
  compensationAction?: string;
  compensationPayload?: any;
  status: 'pending' | 'completed' | 'failed' | 'compensated';
  executedAt?: Date;
  error?: string;
}

export interface Saga {
  id: string;
  type: string;
  status: 'running' | 'completed' | 'failed' | 'compensating';
  steps: SagaStep[];
  createdAt: Date;
  completedAt?: Date;
  metadata: Record<string, any>;
}

export class SagaCoordinator {
  private logger: Logger;
  private redis: RedisClient;
  private sagaDefinitions: Map<string, SagaStep[]>;

  constructor(logger: Logger, redis: RedisClient) {
    this.logger = logger;
    this.redis = redis;
    this.sagaDefinitions = new Map();
    this.initializeSagaDefinitions();
  }

  /**
   * Initialize predefined saga workflows
   */
  private initializeSagaDefinitions(): void {
    // Doctor creation saga
    this.sagaDefinitions.set('create_doctor', [
      {
        id: 'validate_department',
        name: 'Validate Department Capacity',
        service: 'department-service',
        action: 'checkCapacity',
        payload: {},
        status: 'pending'
      },
      {
        id: 'create_user_profile',
        name: 'Create User Profile',
        service: 'auth-service',
        action: 'createUser',
        compensationAction: 'deleteUser',
        payload: {},
        status: 'pending'
      },
      {
        id: 'create_doctor_profile',
        name: 'Create Doctor Profile',
        service: 'doctor-service',
        action: 'createDoctor',
        compensationAction: 'deleteDoctor',
        payload: {},
        status: 'pending'
      },
      {
        id: 'update_department_capacity',
        name: 'Update Department Capacity',
        service: 'department-service',
        action: 'updateCapacity',
        compensationAction: 'revertCapacity',
        payload: {},
        status: 'pending'
      },
      {
        id: 'send_welcome_notification',
        name: 'Send Welcome Notification',
        service: 'notification-service',
        action: 'sendWelcomeEmail',
        payload: {},
        status: 'pending'
      }
    ]);

    // Bulk user import saga
    this.sagaDefinitions.set('bulk_user_import', [
      {
        id: 'validate_import_data',
        name: 'Validate Import Data',
        service: 'admin-orchestrator',
        action: 'validateBulkData',
        payload: {},
        status: 'pending'
      },
      {
        id: 'create_users_batch',
        name: 'Create Users in Batch',
        service: 'auth-service',
        action: 'createUsersBatch',
        compensationAction: 'deleteUsersBatch',
        payload: {},
        status: 'pending'
      },
      {
        id: 'create_profiles_batch',
        name: 'Create Role Profiles in Batch',
        service: 'multiple',
        action: 'createProfilesBatch',
        compensationAction: 'deleteProfilesBatch',
        payload: {},
        status: 'pending'
      },
      {
        id: 'send_bulk_notifications',
        name: 'Send Bulk Welcome Notifications',
        service: 'notification-service',
        action: 'sendBulkWelcomeEmails',
        payload: {},
        status: 'pending'
      }
    ]);
  }

  /**
   * Create a new saga instance
   */
  async createSaga(type: string, metadata: Record<string, any>): Promise<Saga> {
    const sagaId = `saga_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const stepTemplate = this.sagaDefinitions.get(type);
    if (!stepTemplate) {
      throw new Error(`Unknown saga type: ${type}`);
    }

    // Clone steps from template
    const steps: SagaStep[] = stepTemplate.map(step => ({
      ...step,
      id: `${sagaId}_${step.id}`,
      payload: this.populateStepPayload(step, metadata)
    }));

    const saga: Saga = {
      id: sagaId,
      type,
      status: 'running',
      steps,
      createdAt: new Date(),
      metadata
    };

    // Store saga in Redis
    await this.storeSaga(saga);

    this.logger.info('Saga created', { sagaId, type, stepsCount: steps.length });

    return saga;
  }

  /**
   * Execute saga step by step
   */
  async executeSaga(sagaId: string): Promise<void> {
    const saga = await this.getSaga(sagaId);
    if (!saga) {
      throw new Error(`Saga not found: ${sagaId}`);
    }

    this.logger.info('Executing saga', { sagaId, type: saga.type });

    try {
      for (const step of saga.steps) {
        if (step.status === 'completed') {
          continue; // Skip already completed steps
        }

        await this.executeStep(saga, step);
        
        // Update saga after each step
        await this.storeSaga(saga);
      }

      // Mark saga as completed
      saga.status = 'completed';
      saga.completedAt = new Date();
      await this.storeSaga(saga);

      this.logger.info('Saga completed successfully', { sagaId });

    } catch (error: any) {
      this.logger.error('Saga execution failed', { sagaId, error: error.message });
      
      // Start compensation
      await this.compensateSaga(sagaId, error.message);
      throw error;
    }
  }

  /**
   * Execute individual saga step
   */
  private async executeStep(saga: Saga, step: SagaStep): Promise<void> {
    this.logger.info('Executing saga step', { 
      sagaId: saga.id, 
      stepId: step.id, 
      stepName: step.name 
    });

    try {
      step.status = 'pending';
      step.executedAt = new Date();

      // Here you would call the actual service
      // For now, we'll simulate the execution
      const result = await this.callService(step.service, step.action, step.payload);
      
      step.status = 'completed';
      
      this.logger.info('Saga step completed', { 
        sagaId: saga.id, 
        stepId: step.id,
        result 
      });

    } catch (error: any) {
      step.status = 'failed';
      step.error = error.message;
      
      this.logger.error('Saga step failed', { 
        sagaId: saga.id, 
        stepId: step.id, 
        error: error.message 
      });
      
      throw error;
    }
  }

  /**
   * Compensate saga by executing compensation actions
   */
  async compensateSaga(sagaId: string, reason: string): Promise<void> {
    const saga = await this.getSaga(sagaId);
    if (!saga) {
      throw new Error(`Saga not found: ${sagaId}`);
    }

    this.logger.info('Starting saga compensation', { sagaId, reason });

    saga.status = 'compensating';
    await this.storeSaga(saga);

    // Execute compensation actions in reverse order
    const completedSteps = saga.steps
      .filter(step => step.status === 'completed')
      .reverse();

    for (const step of completedSteps) {
      if (step.compensationAction) {
        try {
          await this.executeCompensation(saga, step);
          step.status = 'compensated';
        } catch (error: any) {
          this.logger.error('Compensation failed', { 
            sagaId, 
            stepId: step.id, 
            error: error.message 
          });
          // Continue with other compensations even if one fails
        }
      }
    }

    saga.status = 'failed';
    saga.completedAt = new Date();
    await this.storeSaga(saga);

    this.logger.info('Saga compensation completed', { sagaId });
  }

  /**
   * Execute compensation action for a step
   */
  private async executeCompensation(saga: Saga, step: SagaStep): Promise<void> {
    if (!step.compensationAction) {
      return;
    }

    this.logger.info('Executing compensation', { 
      sagaId: saga.id, 
      stepId: step.id, 
      compensationAction: step.compensationAction 
    });

    const compensationPayload = step.compensationPayload || step.payload;
    await this.callService(step.service, step.compensationAction, compensationPayload);
  }

  /**
   * Complete saga manually (for external completion)
   */
  async completeSaga(sagaId: string): Promise<void> {
    const saga = await this.getSaga(sagaId);
    if (!saga) {
      throw new Error(`Saga not found: ${sagaId}`);
    }

    saga.status = 'completed';
    saga.completedAt = new Date();
    await this.storeSaga(saga);

    this.logger.info('Saga marked as completed', { sagaId });
  }

  /**
   * Get saga by ID
   */
  async getSaga(sagaId: string): Promise<Saga | null> {
    const sagaData = await this.redis.get(`saga:${sagaId}`);
    if (!sagaData) {
      return null;
    }

    return JSON.parse(sagaData);
  }

  /**
   * Store saga in Redis
   */
  private async storeSaga(saga: Saga): Promise<void> {
    const key = `saga:${saga.id}`;
    await this.redis.set(key, JSON.stringify(saga));
    await this.redis.expire(key, 86400); // 24 hours
  }

  /**
   * Populate step payload with metadata
   */
  private populateStepPayload(step: SagaStep, metadata: Record<string, any>): any {
    // This would contain logic to populate step payload based on metadata
    // For now, return metadata as payload
    return { ...step.payload, ...metadata };
  }

  /**
   * Call external service (mock implementation)
   */
  private async callService(service: string, action: string, payload: any): Promise<any> {
    // This would contain actual service calls
    // For now, simulate with delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    this.logger.debug('Service call simulated', { service, action, payload });
    
    return { success: true, timestamp: new Date() };
  }

  /**
   * Get all active sagas
   */
  async getActiveSagas(): Promise<Saga[]> {
    const keys = await this.redis.keys('saga:*');
    const sagas: Saga[] = [];

    for (const key of keys) {
      const sagaData = await this.redis.get(key);
      if (sagaData) {
        const saga = JSON.parse(sagaData);
        if (saga.status === 'running' || saga.status === 'compensating') {
          sagas.push(saga);
        }
      }
    }

    return sagas;
  }

  /**
   * Get saga statistics
   */
  async getSagaStatistics(): Promise<{
    total: number;
    running: number;
    completed: number;
    failed: number;
    compensating: number;
  }> {
    const keys = await this.redis.keys('saga:*');
    const stats = {
      total: 0,
      running: 0,
      completed: 0,
      failed: 0,
      compensating: 0
    };

    for (const key of keys) {
      const sagaData = await this.redis.get(key);
      if (sagaData) {
        const saga = JSON.parse(sagaData);
        stats.total++;
        stats[saga.status as keyof typeof stats]++;
      }
    }

    return stats;
  }
}
