import { Logger } from 'winston';
import { RabbitMQClient } from './infrastructure/RabbitMQClient';

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'service_call' | 'validation' | 'notification' | 'data_transform' | 'conditional' | 'parallel';
  service?: string;
  action?: string;
  config: {
    timeout: number;
    retries: number;
    retryDelay?: number;
    condition?: string;
    parallelSteps?: string[];
  };
  payload?: any;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  result?: any;
  error?: string;
  executedAt?: Date;
  completedAt?: Date;
  dependencies?: string[];
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  version: string;
  steps: WorkflowStep[];
  status: 'draft' | 'active' | 'running' | 'completed' | 'failed' | 'paused';
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  metadata: Record<string, any>;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  currentStep?: string;
  startedAt: Date;
  completedAt?: Date;
  context: Record<string, any>;
  results: Record<string, any>;
  errors: Array<{
    stepId: string;
    error: string;
    timestamp: Date;
  }>;
}

export class WorkflowManager {
  private logger: Logger;
  private rabbitmq: RabbitMQClient;
  private workflows: Map<string, Workflow> = new Map();
  private executions: Map<string, WorkflowExecution> = new Map();

  constructor(logger: Logger, rabbitmq: RabbitMQClient) {
    this.logger = logger;
    this.rabbitmq = rabbitmq;
    this.initializeDefaultWorkflows();
  }

  /**
   * Initialize default workflow definitions
   */
  private initializeDefaultWorkflows(): void {
    // Doctor creation workflow
    const doctorCreationWorkflow: Workflow = {
      id: 'doctor_creation_workflow',
      name: 'Doctor Creation Workflow',
      description: 'Complete workflow for creating a new doctor',
      version: '1.0.0',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system',
      metadata: { category: 'user_management' },
      steps: [
        {
          id: 'validate_input',
          name: 'Validate Input Data',
          type: 'validation',
          config: { timeout: 5000, retries: 1 },
          status: 'pending'
        },
        {
          id: 'check_department_capacity',
          name: 'Check Department Capacity',
          type: 'service_call',
          service: 'auth-service',
          action: 'checkDepartmentCapacity',
          config: { timeout: 10000, retries: 2 },
          status: 'pending',
          dependencies: ['validate_input']
        },
        {
          id: 'create_user_profile',
          name: 'Create User Profile',
          type: 'service_call',
          service: 'auth-service',
          action: 'createUser',
          config: { timeout: 15000, retries: 3 },
          status: 'pending',
          dependencies: ['check_department_capacity']
        },
        {
          id: 'create_doctor_profile',
          name: 'Create Doctor Profile',
          type: 'service_call',
          service: 'doctor-service',
          action: 'createDoctor',
          config: { timeout: 15000, retries: 3 },
          status: 'pending',
          dependencies: ['create_user_profile']
        },
        {
          id: 'update_department_capacity',
          name: 'Update Department Capacity',
          type: 'service_call',
          service: 'auth-service',
          action: 'updateDepartmentCapacity',
          config: { timeout: 10000, retries: 2 },
          status: 'pending',
          dependencies: ['create_doctor_profile']
        },
        {
          id: 'send_welcome_notification',
          name: 'Send Welcome Notification',
          type: 'notification',
          config: { timeout: 10000, retries: 2 },
          status: 'pending',
          dependencies: ['update_department_capacity']
        }
      ]
    };

    this.workflows.set(doctorCreationWorkflow.id, doctorCreationWorkflow);

    // Bulk user import workflow
    const bulkImportWorkflow: Workflow = {
      id: 'bulk_user_import_workflow',
      name: 'Bulk User Import Workflow',
      description: 'Workflow for importing multiple users',
      version: '1.0.0',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system',
      metadata: { category: 'bulk_operations' },
      steps: [
        {
          id: 'validate_import_data',
          name: 'Validate Import Data',
          type: 'validation',
          config: { timeout: 30000, retries: 1 },
          status: 'pending'
        },
        {
          id: 'process_users_batch',
          name: 'Process Users in Batches',
          type: 'parallel',
          config: { 
            timeout: 300000, 
            retries: 2,
            parallelSteps: ['create_users_batch', 'create_profiles_batch']
          },
          status: 'pending',
          dependencies: ['validate_import_data']
        },
        {
          id: 'send_completion_report',
          name: 'Send Completion Report',
          type: 'notification',
          config: { timeout: 10000, retries: 2 },
          status: 'pending',
          dependencies: ['process_users_batch']
        }
      ]
    };

    this.workflows.set(bulkImportWorkflow.id, bulkImportWorkflow);

    this.logger.info('Default workflows initialized', { 
      count: this.workflows.size,
      workflows: Array.from(this.workflows.keys())
    });
  }

  /**
   * Create a new workflow execution
   */
  async executeWorkflow(workflowId: string, context: Record<string, any>): Promise<string> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const executionId = `exec_${workflowId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const execution: WorkflowExecution = {
      id: executionId,
      workflowId,
      status: 'running',
      startedAt: new Date(),
      context,
      results: {},
      errors: []
    };

    this.executions.set(executionId, execution);

    this.logger.info('Workflow execution started', { 
      executionId, 
      workflowId, 
      stepsCount: workflow.steps.length 
    });

    // Start workflow execution asynchronously
    this.processWorkflow(execution, workflow).catch(error => {
      this.logger.error('Workflow execution failed', { executionId, error: error.message });
      execution.status = 'failed';
      execution.completedAt = new Date();
      execution.errors.push({
        stepId: 'workflow',
        error: error.message,
        timestamp: new Date()
      });
    });

    return executionId;
  }

  /**
   * Process workflow steps
   */
  private async processWorkflow(execution: WorkflowExecution, workflow: Workflow): Promise<void> {
    const completedSteps = new Set<string>();
    const failedSteps = new Set<string>();

    while (completedSteps.size < workflow.steps.length && execution.status === 'running') {
      const readySteps = workflow.steps.filter(step => 
        !completedSteps.has(step.id) && 
        !failedSteps.has(step.id) &&
        this.areDependenciesMet(step, completedSteps)
      );

      if (readySteps.length === 0) {
        // No more steps can be executed
        break;
      }

      // Execute ready steps
      const stepPromises = readySteps.map(step => this.executeStep(execution, step));
      const results = await Promise.allSettled(stepPromises);

      // Process results
      results.forEach((result, index) => {
        const step = readySteps[index];
        if (result.status === 'fulfilled') {
          completedSteps.add(step.id);
          execution.results[step.id] = result.value;
        } else {
          failedSteps.add(step.id);
          execution.errors.push({
            stepId: step.id,
            error: result.reason?.message || 'Unknown error',
            timestamp: new Date()
          });
        }
      });

      // Check if workflow should continue
      if (failedSteps.size > 0) {
        execution.status = 'failed';
        break;
      }
    }

    // Complete workflow
    if (execution.status === 'running') {
      execution.status = completedSteps.size === workflow.steps.length ? 'completed' : 'failed';
    }
    
    execution.completedAt = new Date();

    this.logger.info('Workflow execution completed', {
      executionId: execution.id,
      status: execution.status,
      completedSteps: completedSteps.size,
      totalSteps: workflow.steps.length,
      errors: execution.errors.length
    });

    // Emit workflow completion event
    if (this.rabbitmq.isReady()) {
      await this.rabbitmq.publish('workflow.events', 'workflow.completed', {
        executionId: execution.id,
        workflowId: execution.workflowId,
        status: execution.status,
        results: execution.results,
        errors: execution.errors
      });
    }
  }

  /**
   * Check if step dependencies are met
   */
  private areDependenciesMet(step: WorkflowStep, completedSteps: Set<string>): boolean {
    if (!step.dependencies || step.dependencies.length === 0) {
      return true;
    }

    return step.dependencies.every(dep => completedSteps.has(dep));
  }

  /**
   * Execute a single workflow step
   */
  private async executeStep(execution: WorkflowExecution, step: WorkflowStep): Promise<any> {
    this.logger.debug('Executing workflow step', { 
      executionId: execution.id, 
      stepId: step.id, 
      stepName: step.name 
    });

    step.status = 'running';
    step.executedAt = new Date();

    try {
      let result: any;

      switch (step.type) {
        case 'validation':
          result = await this.executeValidationStep(execution, step);
          break;
        case 'service_call':
          result = await this.executeServiceCallStep(execution, step);
          break;
        case 'notification':
          result = await this.executeNotificationStep(execution, step);
          break;
        case 'data_transform':
          result = await this.executeDataTransformStep(execution, step);
          break;
        case 'conditional':
          result = await this.executeConditionalStep(execution, step);
          break;
        case 'parallel':
          result = await this.executeParallelStep(execution, step);
          break;
        default:
          throw new Error(`Unknown step type: ${step.type}`);
      }

      step.status = 'completed';
      step.completedAt = new Date();
      step.result = result;

      this.logger.debug('Workflow step completed', { 
        executionId: execution.id, 
        stepId: step.id 
      });

      return result;

    } catch (error: any) {
      step.status = 'failed';
      step.completedAt = new Date();
      step.error = error.message;

      this.logger.error('Workflow step failed', { 
        executionId: execution.id, 
        stepId: step.id, 
        error: error.message 
      });

      throw error;
    }
  }

  /**
   * Execute validation step
   */
  private async executeValidationStep(execution: WorkflowExecution, step: WorkflowStep): Promise<any> {
    // Implement validation logic based on step configuration
    return { validated: true, timestamp: new Date() };
  }

  /**
   * Execute service call step
   */
  private async executeServiceCallStep(execution: WorkflowExecution, step: WorkflowStep): Promise<any> {
    // This would integrate with ServiceAdapterFactory to make actual service calls
    return { 
      service: step.service, 
      action: step.action, 
      executed: true, 
      timestamp: new Date() 
    };
  }

  /**
   * Execute notification step
   */
  private async executeNotificationStep(execution: WorkflowExecution, step: WorkflowStep): Promise<any> {
    // Implement notification logic
    return { notificationSent: true, timestamp: new Date() };
  }

  /**
   * Execute data transform step
   */
  private async executeDataTransformStep(execution: WorkflowExecution, step: WorkflowStep): Promise<any> {
    // Implement data transformation logic
    return { transformed: true, timestamp: new Date() };
  }

  /**
   * Execute conditional step
   */
  private async executeConditionalStep(execution: WorkflowExecution, step: WorkflowStep): Promise<any> {
    // Implement conditional logic
    return { conditionMet: true, timestamp: new Date() };
  }

  /**
   * Execute parallel step
   */
  private async executeParallelStep(execution: WorkflowExecution, step: WorkflowStep): Promise<any> {
    // Implement parallel execution logic
    return { parallelStepsCompleted: step.config.parallelSteps?.length || 0, timestamp: new Date() };
  }

  /**
   * Get workflow execution status
   */
  getExecution(executionId: string): WorkflowExecution | undefined {
    return this.executions.get(executionId);
  }

  /**
   * Get all workflows
   */
  getWorkflows(): Workflow[] {
    return Array.from(this.workflows.values());
  }

  /**
   * Get workflow by ID
   */
  getWorkflow(workflowId: string): Workflow | undefined {
    return this.workflows.get(workflowId);
  }

  /**
   * Pause workflow execution
   */
  pauseExecution(executionId: string): boolean {
    const execution = this.executions.get(executionId);
    if (execution && execution.status === 'running') {
      execution.status = 'paused';
      this.logger.info('Workflow execution paused', { executionId });
      return true;
    }
    return false;
  }

  /**
   * Resume workflow execution
   */
  resumeExecution(executionId: string): boolean {
    const execution = this.executions.get(executionId);
    if (execution && execution.status === 'paused') {
      execution.status = 'running';
      this.logger.info('Workflow execution resumed', { executionId });
      
      // Resume processing
      const workflow = this.workflows.get(execution.workflowId);
      if (workflow) {
        this.processWorkflow(execution, workflow).catch(error => {
          this.logger.error('Resumed workflow execution failed', { executionId, error: error.message });
        });
      }
      
      return true;
    }
    return false;
  }
}
