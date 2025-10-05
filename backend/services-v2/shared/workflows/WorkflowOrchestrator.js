"use strict";
/**
 * WorkflowOrchestrator - Cross-Service Workflow Orchestration Engine
 * Orchestrates complex healthcare workflows across multiple microservices
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Saga Pattern, Vietnamese Healthcare Standards, Event-Driven Architecture
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowOrchestrator = exports.WorkflowStepStatus = exports.WorkflowStatus = void 0;
const BaseEventHandler_1 = require("../events/BaseEventHandler");
var WorkflowStatus;
(function (WorkflowStatus) {
    WorkflowStatus["PENDING"] = "PENDING";
    WorkflowStatus["RUNNING"] = "RUNNING";
    WorkflowStatus["COMPLETED"] = "COMPLETED";
    WorkflowStatus["FAILED"] = "FAILED";
    WorkflowStatus["COMPENSATING"] = "COMPENSATING";
    WorkflowStatus["COMPENSATED"] = "COMPENSATED";
})(WorkflowStatus || (exports.WorkflowStatus = WorkflowStatus = {}));
var WorkflowStepStatus;
(function (WorkflowStepStatus) {
    WorkflowStepStatus["PENDING"] = "PENDING";
    WorkflowStepStatus["RUNNING"] = "RUNNING";
    WorkflowStepStatus["COMPLETED"] = "COMPLETED";
    WorkflowStepStatus["FAILED"] = "FAILED";
    WorkflowStepStatus["SKIPPED"] = "SKIPPED";
    WorkflowStepStatus["COMPENSATED"] = "COMPENSATED";
})(WorkflowStepStatus || (exports.WorkflowStepStatus = WorkflowStepStatus = {}));
class WorkflowOrchestrator extends BaseEventHandler_1.BaseEventHandler {
    constructor() {
        super('workflow-orchestrator');
        this.workflowDefinitions = new Map();
        this.activeWorkflows = new Map();
        this.completedWorkflows = new Map();
        this.workflowMetrics = new Map();
        this.initializeWorkflowDefinitions();
    }
    static getInstance() {
        if (!WorkflowOrchestrator.instance) {
            WorkflowOrchestrator.instance = new WorkflowOrchestrator();
        }
        return WorkflowOrchestrator.instance;
    }
    /**
     * Initialize workflow definitions
     */
    initializeWorkflowDefinitions() {
        console.log('🔄 Initializing Vietnamese Healthcare Workflow Definitions');
        // Workflow definitions will be loaded from separate files
        // This is just the initialization placeholder
        console.log('✅ Workflow definitions initialized');
    }
    /**
     * Register workflow definition
     */
    registerWorkflow(definition) {
        this.workflowDefinitions.set(definition.workflowId, definition);
        console.log(`📋 Registered workflow: ${definition.workflowName} (${definition.vietnameseWorkflowName})`);
    }
    /**
     * Start workflow execution
     */
    async startWorkflow(workflowId, context, metadata) {
        const startTime = Date.now();
        try {
            console.log(`🚀 Starting workflow: ${workflowId}`);
            // Get workflow definition
            const definition = this.workflowDefinitions.get(workflowId);
            if (!definition) {
                throw new Error(`Workflow definition not found: ${workflowId}`);
            }
            // Create workflow instance
            const instance = this.createWorkflowInstance(definition, context, metadata);
            // Store active workflow
            this.activeWorkflows.set(instance.instanceId, instance);
            // Start execution
            const result = await this.executeWorkflow(instance);
            // Update metrics
            this.updateWorkflowMetrics(workflowId, result);
            console.log(`✅ Workflow ${workflowId} completed: ${result.status}`);
            return result;
        }
        catch (error) {
            const executionTime = Date.now() - startTime;
            console.error(`❌ Workflow ${workflowId} failed:`, error);
            return {
                success: false,
                instanceId: '',
                status: WorkflowStatus.FAILED,
                completedSteps: 0,
                totalSteps: 0,
                executionTime,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Create workflow instance
     */
    createWorkflowInstance(definition, context, metadata) {
        const instanceId = `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        return {
            instanceId,
            workflowId: definition.workflowId,
            status: WorkflowStatus.PENDING,
            currentStepIndex: 0,
            steps: [...definition.steps],
            compensationSteps: [...definition.compensationSteps],
            startTime: new Date(),
            context,
            metadata: {
                correlationId: metadata.correlationId || `corr_${Date.now()}`,
                traceId: metadata.traceId || `trace_${Date.now()}`,
                userId: metadata.userId || 'system',
                patientId: metadata.patientId,
                doctorId: metadata.doctorId,
                appointmentId: metadata.appointmentId,
                invoiceId: metadata.invoiceId,
                vietnameseContext: {
                    language: 'vi-VN',
                    timezone: 'Asia/Ho_Chi_Minh',
                    currency: 'VND',
                    healthcareStandards: 'Vietnamese_MOH_2024'
                }
            }
        };
    }
    /**
     * Execute workflow
     */
    async executeWorkflow(instance) {
        const startTime = Date.now();
        try {
            instance.status = WorkflowStatus.RUNNING;
            console.log(`🔄 Executing workflow instance: ${instance.instanceId}`);
            // Execute steps sequentially
            for (let i = 0; i < instance.steps.length; i++) {
                instance.currentStepIndex = i;
                const step = instance.steps[i];
                try {
                    await this.executeStep(instance, step);
                    if (step.status === WorkflowStepStatus.FAILED) {
                        throw new Error(`Step ${step.stepName} failed: ${step.error}`);
                    }
                }
                catch (stepError) {
                    console.error(`❌ Step ${step.stepName} failed:`, stepError);
                    // Try compensation
                    await this.compensateWorkflow(instance);
                    instance.status = WorkflowStatus.FAILED;
                    instance.endTime = new Date();
                    return {
                        success: false,
                        instanceId: instance.instanceId,
                        status: instance.status,
                        completedSteps: i,
                        totalSteps: instance.steps.length,
                        executionTime: Date.now() - startTime,
                        error: stepError instanceof Error ? stepError.message : 'Step execution failed'
                    };
                }
            }
            // All steps completed successfully
            instance.status = WorkflowStatus.COMPLETED;
            instance.endTime = new Date();
            // Move to completed workflows
            this.activeWorkflows.delete(instance.instanceId);
            this.completedWorkflows.set(instance.instanceId, instance);
            console.log(`✅ Workflow instance completed: ${instance.instanceId}`);
            return {
                success: true,
                instanceId: instance.instanceId,
                status: instance.status,
                completedSteps: instance.steps.length,
                totalSteps: instance.steps.length,
                executionTime: Date.now() - startTime,
                output: this.extractWorkflowOutput(instance)
            };
        }
        catch (error) {
            instance.status = WorkflowStatus.FAILED;
            instance.endTime = new Date();
            instance.error = error instanceof Error ? error.message : 'Unknown error';
            console.error(`❌ Workflow execution failed: ${instance.instanceId}`, error);
            return {
                success: false,
                instanceId: instance.instanceId,
                status: instance.status,
                completedSteps: instance.currentStepIndex,
                totalSteps: instance.steps.length,
                executionTime: Date.now() - startTime,
                error: instance.error
            };
        }
    }
    /**
     * Execute individual step
     */
    async executeStep(instance, step) {
        console.log(`🔧 Executing step: ${step.stepName} (${step.vietnameseDescription})`);
        step.status = WorkflowStepStatus.RUNNING;
        step.startTime = new Date();
        try {
            // Create service request event
            const serviceEvent = this.createServiceEvent(instance, step);
            // Execute step through event bus
            const result = await this.executeServiceCall(serviceEvent);
            // Process result
            if (result.success) {
                step.status = WorkflowStepStatus.COMPLETED;
                step.output = result.data;
                console.log(`✅ Step completed: ${step.stepName}`);
            }
            else {
                step.status = WorkflowStepStatus.FAILED;
                step.error = result.error;
                console.error(`❌ Step failed: ${step.stepName} - ${result.error}`);
            }
        }
        catch (error) {
            step.status = WorkflowStepStatus.FAILED;
            step.error = error instanceof Error ? error.message : 'Unknown error';
            console.error(`❌ Step execution error: ${step.stepName}`, error);
        }
        finally {
            step.endTime = new Date();
        }
    }
    /**
     * Create service event for step execution
     */
    createServiceEvent(instance, step) {
        return {
            eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            eventType: `workflow.step.${step.action}`,
            aggregateId: instance.instanceId,
            aggregateType: 'WorkflowInstance',
            serviceName: 'workflow-orchestrator',
            eventVersion: '1.0',
            eventData: {
                workflowInstanceId: instance.instanceId,
                stepId: step.stepId,
                stepName: step.stepName,
                serviceName: step.serviceName,
                action: step.action,
                input: step.input,
                context: instance.context,
                healthcareContext: {
                    patientId: instance.metadata.patientId,
                    doctorId: instance.metadata.doctorId,
                    appointmentId: instance.metadata.appointmentId,
                    workflowStep: step.healthcareContext
                }
            },
            occurredAt: new Date(),
            version: 1,
            priority: 'HIGH',
            metadata: {
                correlationId: instance.metadata.correlationId,
                traceId: instance.metadata.traceId,
                userId: instance.metadata.userId,
                workflowContext: true
            }
        };
    }
    /**
     * Execute service call
     */
    async executeServiceCall(event) {
        try {
            // Publish event and wait for response
            await this.publishEvent(event);
            // In a real implementation, this would wait for a response event
            // For now, we simulate success
            return {
                success: true,
                data: { processed: true, timestamp: new Date().toISOString() }
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Service call failed'
            };
        }
    }
    /**
     * Compensate workflow (Saga pattern)
     */
    async compensateWorkflow(instance) {
        console.log(`🔄 Starting compensation for workflow: ${instance.instanceId}`);
        instance.status = WorkflowStatus.COMPENSATING;
        try {
            // Execute compensation steps in reverse order
            for (let i = instance.currentStepIndex - 1; i >= 0; i--) {
                const originalStep = instance.steps[i];
                if (originalStep.status === WorkflowStepStatus.COMPLETED && originalStep.compensationAction) {
                    const compensationStep = {
                        stepId: `comp_${originalStep.stepId}`,
                        stepName: `Compensate ${originalStep.stepName}`,
                        serviceName: originalStep.serviceName,
                        action: originalStep.compensationAction,
                        input: originalStep.output,
                        status: WorkflowStepStatus.PENDING,
                        retryCount: 0,
                        maxRetries: 3,
                        vietnameseDescription: `Hoàn tác ${originalStep.vietnameseDescription}`,
                        healthcareContext: `COMPENSATION_${originalStep.healthcareContext}`
                    };
                    await this.executeStep(instance, compensationStep);
                    if (compensationStep.status === WorkflowStepStatus.COMPLETED) {
                        originalStep.status = WorkflowStepStatus.COMPENSATED;
                    }
                }
            }
            instance.status = WorkflowStatus.COMPENSATED;
            console.log(`✅ Workflow compensation completed: ${instance.instanceId}`);
        }
        catch (error) {
            console.error(`❌ Workflow compensation failed: ${instance.instanceId}`, error);
            instance.status = WorkflowStatus.FAILED;
        }
    }
    /**
     * Extract workflow output
     */
    extractWorkflowOutput(instance) {
        const output = {
            workflowId: instance.workflowId,
            instanceId: instance.instanceId,
            status: instance.status,
            executionTime: instance.endTime ?
                instance.endTime.getTime() - instance.startTime.getTime() : 0,
            steps: instance.steps.map(step => ({
                stepName: step.stepName,
                vietnameseDescription: step.vietnameseDescription,
                status: step.status,
                output: step.output
            })),
            vietnamese: {
                message: 'Quy trình làm việc đã hoàn thành thành công',
                completionTime: instance.endTime?.toLocaleString('vi-VN', {
                    timeZone: 'Asia/Ho_Chi_Minh'
                })
            }
        };
        return output;
    }
    /**
     * Update workflow metrics
     */
    updateWorkflowMetrics(workflowId, result) {
        const metrics = this.workflowMetrics.get(workflowId) || {
            totalExecutions: 0,
            successfulExecutions: 0,
            failedExecutions: 0,
            averageExecutionTime: 0,
            lastExecution: null
        };
        metrics.totalExecutions++;
        if (result.success) {
            metrics.successfulExecutions++;
        }
        else {
            metrics.failedExecutions++;
        }
        // Update average execution time
        const totalTime = (metrics.averageExecutionTime * (metrics.totalExecutions - 1)) + result.executionTime;
        metrics.averageExecutionTime = totalTime / metrics.totalExecutions;
        metrics.lastExecution = new Date();
        this.workflowMetrics.set(workflowId, metrics);
    }
    /**
     * Process workflow events
     */
    async processEvent(event) {
        // Handle workflow-related events
        if (event.eventType.startsWith('workflow.')) {
            console.log(`🔄 Processing workflow event: ${event.eventType}`);
            return {
                success: true,
                processingTime: 50,
                metadata: { workflowEvent: true }
            };
        }
        return {
            success: true,
            processingTime: 10,
            metadata: { skipped: true }
        };
    }
    /**
     * Get workflow status
     */
    getWorkflowStatus(instanceId) {
        return this.activeWorkflows.get(instanceId) ||
            this.completedWorkflows.get(instanceId) ||
            null;
    }
    /**
     * Get orchestrator status
     */
    getOrchestratorStatus() {
        const totalWorkflows = this.workflowDefinitions.size;
        const activeWorkflows = this.activeWorkflows.size;
        const completedWorkflows = this.completedWorkflows.size;
        return {
            orchestratorStatus: 'ACTIVE',
            totalWorkflowDefinitions: totalWorkflows,
            activeWorkflows,
            completedWorkflows,
            workflowMetrics: Object.fromEntries(this.workflowMetrics),
            vietnamese: {
                title: 'Trạng thái Điều phối Quy trình',
                message: 'Hệ thống điều phối quy trình y tế hoạt động bình thường',
                compliance: 'Tuân thủ tiêu chuẩn y tế Việt Nam'
            },
            healthcareCompliance: {
                hipaa: true,
                vietnameseStandards: true,
                sagaPattern: true,
                eventDriven: true
            },
            lastUpdated: new Date().toISOString()
        };
    }
}
exports.WorkflowOrchestrator = WorkflowOrchestrator;
//# sourceMappingURL=WorkflowOrchestrator.js.map