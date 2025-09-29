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
export declare class WorkflowManager {
    private logger;
    private rabbitmq;
    private workflows;
    private executions;
    constructor(logger: Logger, rabbitmq: RabbitMQClient);
    private initializeDefaultWorkflows;
    executeWorkflow(workflowId: string, context: Record<string, any>): Promise<string>;
    private processWorkflow;
    private areDependenciesMet;
    private executeStep;
    private executeValidationStep;
    private executeServiceCallStep;
    private executeNotificationStep;
    private executeDataTransformStep;
    private executeConditionalStep;
    private executeParallelStep;
    getExecution(executionId: string): WorkflowExecution | undefined;
    getWorkflows(): Workflow[];
    getWorkflow(workflowId: string): Workflow | undefined;
    pauseExecution(executionId: string): boolean;
    resumeExecution(executionId: string): boolean;
}
//# sourceMappingURL=WorkflowManager.d.ts.map