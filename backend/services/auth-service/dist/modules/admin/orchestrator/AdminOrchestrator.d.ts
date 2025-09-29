import { EventEmitter } from 'events';
import { Logger } from 'winston';
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
export declare class AdminOrchestrator extends EventEmitter {
    private sagaCoordinator;
    private workflowManager;
    private eventManager;
    private monitor;
    private serviceAdapters;
    private redis;
    private rabbitmq;
    private logger;
    private isInitialized;
    constructor(logger: Logger);
    initialize(): Promise<void>;
    private registerServicesForMonitoring;
    executeOperation(operation: AdminOperation): Promise<OrchestrationResult>;
    private handleCreateDoctor;
    private handleBulkUserImport;
    private handleSystemMaintenance;
    private handleCrossServiceSync;
    private updateOperationStatus;
    private getOperationStepCount;
    private getAffectedServices;
    private setupEventHandlers;
    getOperationStatus(operationId: string): Promise<any>;
    cancelOperation(operationId: string): Promise<boolean>;
    getHealthStatus(): Promise<{
        status: string;
        components: Record<string, any>;
        timestamp: Date;
    }>;
    getStatistics(): Promise<{
        sagas: any;
        operations: any;
        services: any;
        events: any;
    }>;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=AdminOrchestrator.d.ts.map