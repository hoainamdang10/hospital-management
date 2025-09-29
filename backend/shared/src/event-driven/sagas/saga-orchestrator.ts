/**
 * Saga Orchestrator - Event-Driven Architecture
 * Orchestrates complex healthcare workflows using saga pattern
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Saga Pattern, Healthcare Workflows, HIPAA
 */

import { DomainEvent } from '../../domain/events/domain-event';
import { IDomainEventBus } from '../../domain/events/domain-event-publisher.interface';
import { IEventStore } from '../../infrastructure/event-store/event-store.interface';

/**
 * Saga State Enumeration
 */
export enum SagaState {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  COMPENSATING = 'compensating',
  COMPENSATED = 'compensated',
  TIMEOUT = 'timeout'
}

/**
 * Saga Step Interface
 */
export interface SagaStep {
  stepId: string;
  stepName: string;
  stepType: 'command' | 'event' | 'compensation';
  targetService: string;
  payload: any;
  timeout?: number; // milliseconds
  retryCount?: number;
  compensationStep?: SagaStep;
  isCompleted: boolean;
  isFailed: boolean;
  executedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
}

/**
 * Saga Instance Interface
 */
export interface SagaInstance {
  sagaId: string;
  sagaType: string;
  sagaState: SagaState;
  currentStepIndex: number;
  steps: SagaStep[];
  sagaData: any;
  startedAt: Date;
  completedAt?: Date;
  lastUpdatedAt: Date;
  timeoutAt?: Date;
  correlationId?: string;
  userId?: string;
  patientId?: string;
  metadata?: Record<string, any>;
}

/**
 * Saga Definition Interface
 */
export interface SagaDefinition {
  sagaType: string;
  description: string;
  steps: Omit<SagaStep, 'isCompleted' | 'isFailed' | 'executedAt' | 'completedAt' | 'errorMessage'>[];
  timeout?: number; // milliseconds
  enableCompensation: boolean;
  enableRetry: boolean;
  maxRetries: number;
  retryDelay: number;
}

/**
 * Saga Event Interface
 */
export interface SagaEvent extends DomainEvent {
  sagaId: string;
  stepId?: string;
  sagaType: string;
}

/**
 * Healthcare-Specific Saga Types
 */
export enum HealthcareSagaType {
  PATIENT_ADMISSION = 'patient_admission',
  APPOINTMENT_SCHEDULING = 'appointment_scheduling',
  MEDICAL_RECORD_CREATION = 'medical_record_creation',
  PRESCRIPTION_PROCESSING = 'prescription_processing',
  INSURANCE_VERIFICATION = 'insurance_verification',
  DISCHARGE_PROCESS = 'discharge_process',
  EMERGENCY_RESPONSE = 'emergency_response',
  LAB_RESULT_PROCESSING = 'lab_result_processing'
}

/**
 * Saga Orchestrator Implementation
 */
export class SagaOrchestrator {
  private sagaDefinitions = new Map<string, SagaDefinition>();
  private activeSagas = new Map<string, SagaInstance>();
  private sagaTimeouts = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly eventBus: IDomainEventBus,
    private readonly eventStore?: IEventStore
  ) {
    this.initializeHealthcareSagas();
    this.setupEventHandlers();
  }

  /**
   * Register saga definition
   */
  public registerSaga(definition: SagaDefinition): void {
    this.sagaDefinitions.set(definition.sagaType, definition);
    console.log(`Saga definition registered: ${definition.sagaType}`);
  }

  /**
   * Start new saga instance
   */
  public async startSaga(
    sagaType: string,
    sagaData: any,
    correlationId?: string,
    userId?: string,
    patientId?: string
  ): Promise<string> {
    const definition = this.sagaDefinitions.get(sagaType);
    if (!definition) {
      throw new Error(`Saga definition not found: ${sagaType}`);
    }

    const sagaId = this.generateSagaId();
    const now = new Date();

    const sagaInstance: SagaInstance = {
      sagaId,
      sagaType,
      sagaState: SagaState.NOT_STARTED,
      currentStepIndex: 0,
      steps: definition.steps.map(step => ({
        ...step,
        isCompleted: false,
        isFailed: false
      })),
      sagaData,
      startedAt: now,
      lastUpdatedAt: now,
      timeoutAt: definition.timeout ? new Date(now.getTime() + definition.timeout) : undefined,
      correlationId,
      userId,
      patientId,
      metadata: {
        definition: definition.sagaType,
        enableCompensation: definition.enableCompensation,
        enableRetry: definition.enableRetry,
        maxRetries: definition.maxRetries
      }
    };

    // Store saga instance
    this.activeSagas.set(sagaId, sagaInstance);

    // Set timeout if configured
    if (definition.timeout) {
      this.setSagaTimeout(sagaId, definition.timeout);
    }

    // Store in event store if available
    if (this.eventStore) {
      await this.storeSagaEvent(sagaInstance, 'SagaStarted', {
        sagaType,
        sagaData,
        correlationId,
        userId,
        patientId
      });
    }

    // Start executing saga
    await this.executeSaga(sagaId);

    console.log(`Saga started: ${sagaType} (${sagaId})`);
    return sagaId;
  }

  /**
   * Handle saga event
   */
  public async handleSagaEvent(event: SagaEvent): Promise<void> {
    const sagaInstance = this.activeSagas.get(event.sagaId);
    if (!sagaInstance) {
      console.warn(`Saga instance not found: ${event.sagaId}`);
      return;
    }

    try {
      await this.processSagaEvent(sagaInstance, event);
    } catch (error) {
      console.error(`Error processing saga event for ${event.sagaId}:`, error);
      await this.handleSagaError(sagaInstance, error as Error);
    }
  }

  /**
   * Get saga instance
   */
  public getSagaInstance(sagaId: string): SagaInstance | undefined {
    return this.activeSagas.get(sagaId);
  }

  /**
   * Get active sagas
   */
  public getActiveSagas(): SagaInstance[] {
    return Array.from(this.activeSagas.values());
  }

  /**
   * Get sagas by type
   */
  public getSagasByType(sagaType: string): SagaInstance[] {
    return Array.from(this.activeSagas.values())
      .filter(saga => saga.sagaType === sagaType);
  }

  /**
   * Get sagas by patient
   */
  public getSagasByPatient(patientId: string): SagaInstance[] {
    return Array.from(this.activeSagas.values())
      .filter(saga => saga.patientId === patientId);
  }

  /**
   * Cancel saga
   */
  public async cancelSaga(sagaId: string, reason: string): Promise<void> {
    const sagaInstance = this.activeSagas.get(sagaId);
    if (!sagaInstance) {
      throw new Error(`Saga instance not found: ${sagaId}`);
    }

    if (sagaInstance.sagaState === SagaState.COMPLETED || 
        sagaInstance.sagaState === SagaState.COMPENSATED) {
      throw new Error(`Cannot cancel saga in state: ${sagaInstance.sagaState}`);
    }

    // Start compensation if enabled
    const definition = this.sagaDefinitions.get(sagaInstance.sagaType);
    if (definition?.enableCompensation) {
      await this.startCompensation(sagaInstance, reason);
    } else {
      // Mark as failed
      sagaInstance.sagaState = SagaState.FAILED;
      sagaInstance.lastUpdatedAt = new Date();
      sagaInstance.metadata = {
        ...sagaInstance.metadata,
        cancellationReason: reason
      };

      await this.completeSaga(sagaInstance);
    }

    console.log(`Saga cancelled: ${sagaId}, reason: ${reason}`);
  }

  /**
   * Execute saga steps
   */
  private async executeSaga(sagaId: string): Promise<void> {
    const sagaInstance = this.activeSagas.get(sagaId);
    if (!sagaInstance) return;

    sagaInstance.sagaState = SagaState.IN_PROGRESS;
    sagaInstance.lastUpdatedAt = new Date();

    try {
      while (sagaInstance.currentStepIndex < sagaInstance.steps.length) {
        const currentStep = sagaInstance.steps[sagaInstance.currentStepIndex];
        
        if (currentStep.isCompleted) {
          sagaInstance.currentStepIndex++;
          continue;
        }

        await this.executeStep(sagaInstance, currentStep);
        
        // Wait for step completion (handled by event)
        break;
      }

      // Check if all steps are completed
      if (sagaInstance.steps.every(step => step.isCompleted)) {
        await this.completeSaga(sagaInstance);
      }

    } catch (error) {
      await this.handleSagaError(sagaInstance, error as Error);
    }
  }

  /**
   * Execute individual saga step
   */
  private async executeStep(sagaInstance: SagaInstance, step: SagaStep): Promise<void> {
    step.executedAt = new Date();

    try {
      // Create step execution event
      const stepEvent: SagaEvent = {
        eventId: this.generateEventId(),
        eventType: `${sagaInstance.sagaType}_${step.stepName}`,
        aggregateId: sagaInstance.sagaId,
        aggregateType: 'Saga',
        eventData: {
          sagaId: sagaInstance.sagaId,
          stepId: step.stepId,
          stepName: step.stepName,
          targetService: step.targetService,
          payload: step.payload,
          sagaData: sagaInstance.sagaData
        },
        eventVersion: 1,
        timestamp: new Date(),
        userId: sagaInstance.userId,
        correlationId: sagaInstance.correlationId,
        sagaId: sagaInstance.sagaId,
        stepId: step.stepId,
        sagaType: sagaInstance.sagaType
      };

      // Set step timeout if configured
      if (step.timeout) {
        setTimeout(() => {
          if (!step.isCompleted && !step.isFailed) {
            this.handleStepTimeout(sagaInstance, step);
          }
        }, step.timeout);
      }

      // Publish step execution event
      await this.eventBus.publish(stepEvent);

      console.log(`Saga step executed: ${sagaInstance.sagaType}.${step.stepName} (${sagaInstance.sagaId})`);

    } catch (error) {
      step.isFailed = true;
      step.errorMessage = (error as Error).message;
      throw error;
    }
  }

  /**
   * Process saga event response
   */
  private async processSagaEvent(sagaInstance: SagaInstance, event: SagaEvent): Promise<void> {
    const stepId = event.stepId;
    if (!stepId) return;

    const step = sagaInstance.steps.find(s => s.stepId === stepId);
    if (!step) {
      console.warn(`Step not found: ${stepId} in saga ${sagaInstance.sagaId}`);
      return;
    }

    // Handle step completion
    if (event.eventType.endsWith('_Completed')) {
      step.isCompleted = true;
      step.completedAt = new Date();
      sagaInstance.currentStepIndex++;
      sagaInstance.lastUpdatedAt = new Date();

      // Continue with next step
      await this.executeSaga(sagaInstance.sagaId);

    } else if (event.eventType.endsWith('_Failed')) {
      step.isFailed = true;
      step.errorMessage = event.eventData?.error || 'Step execution failed';
      
      // Handle step failure
      await this.handleStepFailure(sagaInstance, step);
    }
  }

  /**
   * Handle step failure
   */
  private async handleStepFailure(sagaInstance: SagaInstance, step: SagaStep): Promise<void> {
    const definition = this.sagaDefinitions.get(sagaInstance.sagaType);
    
    // Retry if enabled and retries available
    if (definition?.enableRetry && (step.retryCount || 0) < definition.maxRetries) {
      step.retryCount = (step.retryCount || 0) + 1;
      step.isFailed = false;
      step.errorMessage = undefined;

      // Wait before retry
      await this.sleep(definition.retryDelay || 1000);
      
      // Retry step
      await this.executeStep(sagaInstance, step);
      return;
    }

    // Start compensation if enabled
    if (definition?.enableCompensation) {
      await this.startCompensation(sagaInstance, step.errorMessage || 'Step execution failed');
    } else {
      // Mark saga as failed
      sagaInstance.sagaState = SagaState.FAILED;
      sagaInstance.lastUpdatedAt = new Date();
      await this.completeSaga(sagaInstance);
    }
  }

  /**
   * Start compensation process
   */
  private async startCompensation(sagaInstance: SagaInstance, reason: string): Promise<void> {
    sagaInstance.sagaState = SagaState.COMPENSATING;
    sagaInstance.lastUpdatedAt = new Date();
    sagaInstance.metadata = {
      ...sagaInstance.metadata,
      compensationReason: reason
    };

    // Execute compensation steps in reverse order
    const completedSteps = sagaInstance.steps
      .filter(step => step.isCompleted && step.compensationStep)
      .reverse();

    for (const step of completedSteps) {
      if (step.compensationStep) {
        try {
          await this.executeStep(sagaInstance, step.compensationStep);
        } catch (error) {
          console.error(`Compensation step failed for ${step.stepName}:`, error);
          // Continue with other compensation steps
        }
      }
    }

    sagaInstance.sagaState = SagaState.COMPENSATED;
    sagaInstance.lastUpdatedAt = new Date();
    await this.completeSaga(sagaInstance);
  }

  /**
   * Complete saga
   */
  private async completeSaga(sagaInstance: SagaInstance): Promise<void> {
    if (sagaInstance.sagaState === SagaState.IN_PROGRESS) {
      sagaInstance.sagaState = SagaState.COMPLETED;
    }
    
    sagaInstance.completedAt = new Date();
    sagaInstance.lastUpdatedAt = new Date();

    // Clear timeout
    const timeout = this.sagaTimeouts.get(sagaInstance.sagaId);
    if (timeout) {
      clearTimeout(timeout);
      this.sagaTimeouts.delete(sagaInstance.sagaId);
    }

    // Store completion event
    if (this.eventStore) {
      await this.storeSagaEvent(sagaInstance, 'SagaCompleted', {
        sagaState: sagaInstance.sagaState,
        completedAt: sagaInstance.completedAt
      });
    }

    // Remove from active sagas
    this.activeSagas.delete(sagaInstance.sagaId);

    console.log(`Saga completed: ${sagaInstance.sagaType} (${sagaInstance.sagaId}) - State: ${sagaInstance.sagaState}`);
  }

  /**
   * Handle saga error
   */
  private async handleSagaError(sagaInstance: SagaInstance, error: Error): Promise<void> {
    console.error(`Saga error: ${sagaInstance.sagaId}`, error);
    
    sagaInstance.sagaState = SagaState.FAILED;
    sagaInstance.lastUpdatedAt = new Date();
    sagaInstance.metadata = {
      ...sagaInstance.metadata,
      error: error.message
    };

    await this.completeSaga(sagaInstance);
  }

  /**
   * Handle step timeout
   */
  private async handleStepTimeout(sagaInstance: SagaInstance, step: SagaStep): Promise<void> {
    step.isFailed = true;
    step.errorMessage = 'Step execution timeout';
    
    await this.handleStepFailure(sagaInstance, step);
  }

  /**
   * Set saga timeout
   */
  private setSagaTimeout(sagaId: string, timeout: number): void {
    const timeoutHandle = setTimeout(async () => {
      const sagaInstance = this.activeSagas.get(sagaId);
      if (sagaInstance && sagaInstance.sagaState === SagaState.IN_PROGRESS) {
        sagaInstance.sagaState = SagaState.TIMEOUT;
        await this.handleSagaError(sagaInstance, new Error('Saga execution timeout'));
      }
    }, timeout);

    this.sagaTimeouts.set(sagaId, timeoutHandle);
  }

  /**
   * Store saga event in event store
   */
  private async storeSagaEvent(sagaInstance: SagaInstance, eventType: string, eventData: any): Promise<void> {
    if (!this.eventStore) return;

    const sagaEvent: DomainEvent = {
      eventId: this.generateEventId(),
      eventType,
      aggregateId: sagaInstance.sagaId,
      aggregateType: 'Saga',
      eventData: {
        ...eventData,
        sagaInstance: {
          sagaId: sagaInstance.sagaId,
          sagaType: sagaInstance.sagaType,
          sagaState: sagaInstance.sagaState,
          currentStepIndex: sagaInstance.currentStepIndex
        }
      },
      eventVersion: 1,
      timestamp: new Date(),
      userId: sagaInstance.userId,
      correlationId: sagaInstance.correlationId
    };

    await this.eventStore.saveEvents(
      sagaInstance.sagaId,
      'Saga',
      [sagaEvent],
      0
    );
  }

  /**
   * Initialize healthcare-specific sagas
   */
  private initializeHealthcareSagas(): void {
    // Patient Admission Saga
    this.registerSaga({
      sagaType: HealthcareSagaType.PATIENT_ADMISSION,
      description: 'Complete patient admission workflow',
      steps: [
        {
          stepId: 'verify_insurance',
          stepName: 'VerifyInsurance',
          stepType: 'command',
          targetService: 'insurance-service',
          payload: {},
          timeout: 30000
        },
        {
          stepId: 'create_medical_record',
          stepName: 'CreateMedicalRecord',
          stepType: 'command',
          targetService: 'medical-records-service',
          payload: {},
          timeout: 15000
        },
        {
          stepId: 'assign_room',
          stepName: 'AssignRoom',
          stepType: 'command',
          targetService: 'facility-service',
          payload: {},
          timeout: 10000
        },
        {
          stepId: 'notify_staff',
          stepName: 'NotifyStaff',
          stepType: 'event',
          targetService: 'notification-service',
          payload: {},
          timeout: 5000
        }
      ],
      timeout: 300000, // 5 minutes
      enableCompensation: true,
      enableRetry: true,
      maxRetries: 3,
      retryDelay: 2000
    });

    // Add more healthcare sagas...
  }

  /**
   * Setup event handlers for saga orchestration
   */
  private setupEventHandlers(): void {
    // Register handlers for saga events
    this.eventBus.subscribe('SagaStepCompleted', {
      handle: async (event: SagaEvent) => {
        await this.handleSagaEvent(event);
      },
      getHandledEventTypes: () => ['SagaStepCompleted'],
      canHandle: (eventType: string) => eventType === 'SagaStepCompleted'
    });

    this.eventBus.subscribe('SagaStepFailed', {
      handle: async (event: SagaEvent) => {
        await this.handleSagaEvent(event);
      },
      getHandledEventTypes: () => ['SagaStepFailed'],
      canHandle: (eventType: string) => eventType === 'SagaStepFailed'
    });
  }

  // Helper methods
  private generateSagaId(): string {
    return `saga_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
