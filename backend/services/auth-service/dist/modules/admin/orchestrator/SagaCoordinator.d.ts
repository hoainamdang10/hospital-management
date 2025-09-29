import { Logger } from 'winston';
import { RedisClient } from './infrastructure/RedisClient';
import { ServiceAdapterFactory } from './adapters/ServiceAdapterFactory';
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
export declare class SagaCoordinator {
    private logger;
    private redis;
    private serviceAdapters;
    private sagaDefinitions;
    constructor(logger: Logger, redis: RedisClient, serviceAdapters: ServiceAdapterFactory);
    private initializeSagaDefinitions;
    createSaga(type: string, metadata: Record<string, any>): Promise<Saga>;
    executeSaga(sagaId: string): Promise<void>;
    private executeStep;
    private executeSingleServiceStep;
    private executeMultiServiceStep;
    private executeCreateProfilesBatch;
    private executeSystemHealthCheck;
    private executeDataConsistencyCheck;
    compensateSaga(sagaId: string, reason: string): Promise<void>;
    private executeCompensation;
    private executeMultiServiceCompensation;
    private populateStepPayload;
    private storeSaga;
    getSaga(sagaId: string): Promise<Saga | null>;
    getAllSagas(): Promise<Saga[]>;
    getSagaStatistics(): Promise<{
        total: number;
        running: number;
        completed: number;
        failed: number;
        compensating: number;
    }>;
    cleanupOldSagas(olderThanDays?: number): Promise<number>;
}
//# sourceMappingURL=SagaCoordinator.d.ts.map