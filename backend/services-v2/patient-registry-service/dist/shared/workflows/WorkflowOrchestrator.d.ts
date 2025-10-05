/**
 * WorkflowOrchestrator - Cross-Service Workflow Orchestration Engine
 * Orchestrates complex healthcare workflows across multiple microservices
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Saga Pattern, Vietnamese Healthcare Standards, Event-Driven Architecture
 */
import { IntegrationEvent } from '../events/EventBusConfiguration';
import { BaseEventHandler } from '../events/BaseEventHandler';
export declare enum WorkflowStatus {
    PENDING = "PENDING",
    RUNNING = "RUNNING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    COMPENSATING = "COMPENSATING",
    COMPENSATED = "COMPENSATED"
}
export declare enum WorkflowStepStatus {
    PENDING = "PENDING",
    RUNNING = "RUNNING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    SKIPPED = "SKIPPED",
    COMPENSATED = "COMPENSATED"
}
export interface WorkflowStep {
    stepId: string;
    stepName: string;
    serviceName: string;
    action: string;
    input: any;
    output?: any;
    status: WorkflowStepStatus;
    startTime?: Date;
    endTime?: Date;
    error?: string;
    retryCount: number;
    maxRetries: number;
    compensationAction?: string;
    vietnameseDescription: string;
    healthcareContext: string;
}
export interface WorkflowDefinition {
    workflowId: string;
    workflowName: string;
    vietnameseWorkflowName: string;
    description: string;
    vietnameseDescription: string;
    steps: WorkflowStep[];
    compensationSteps: WorkflowStep[];
    timeout: number;
    retryPolicy: {
        maxRetries: number;
        retryDelay: number;
        backoffMultiplier: number;
    };
    healthcareCompliance: {
        hipaaRequired: boolean;
        auditRequired: boolean;
        vietnameseStandards: boolean;
    };
}
export interface WorkflowInstance {
    instanceId: string;
    workflowId: string;
    status: WorkflowStatus;
    currentStepIndex: number;
    steps: WorkflowStep[];
    compensationSteps: WorkflowStep[];
    startTime: Date;
    endTime?: Date;
    context: any;
    error?: string;
    metadata: {
        patientId?: string;
        doctorId?: string;
        appointmentId?: string;
        invoiceId?: string;
        correlationId: string;
        traceId: string;
        userId: string;
        vietnameseContext: any;
    };
}
export interface WorkflowExecutionResult {
    success: boolean;
    instanceId: string;
    status: WorkflowStatus;
    completedSteps: number;
    totalSteps: number;
    executionTime: number;
    error?: string;
    output?: any;
}
export declare class WorkflowOrchestrator extends BaseEventHandler {
    private static instance;
    private workflowDefinitions;
    private activeWorkflows;
    private completedWorkflows;
    private workflowMetrics;
    private constructor();
    static getInstance(): WorkflowOrchestrator;
    /**
     * Initialize workflow definitions
     */
    private initializeWorkflowDefinitions;
    /**
     * Register workflow definition
     */
    registerWorkflow(definition: WorkflowDefinition): void;
    /**
     * Start workflow execution
     */
    startWorkflow(workflowId: string, context: any, metadata: any): Promise<WorkflowExecutionResult>;
    /**
     * Create workflow instance
     */
    private createWorkflowInstance;
    /**
     * Execute workflow
     */
    private executeWorkflow;
    /**
     * Execute individual step
     */
    private executeStep;
    /**
     * Create service event for step execution
     */
    private createServiceEvent;
    /**
     * Execute service call
     */
    private executeServiceCall;
    /**
     * Compensate workflow (Saga pattern)
     */
    private compensateWorkflow;
    /**
     * Extract workflow output
     */
    private extractWorkflowOutput;
    /**
     * Update workflow metrics
     */
    private updateWorkflowMetrics;
    /**
     * Process workflow events
     */
    protected processEvent(event: IntegrationEvent): Promise<any>;
    /**
     * Get workflow status
     */
    getWorkflowStatus(instanceId: string): WorkflowInstance | null;
    /**
     * Get orchestrator status
     */
    getOrchestratorStatus(): any;
}
//# sourceMappingURL=WorkflowOrchestrator.d.ts.map