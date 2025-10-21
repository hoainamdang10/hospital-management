import { IScheduleRepository } from '../../domain/repositories/IScheduleRepository';
import { IScheduleRunRepository } from '../../domain/repositories/IScheduleRunRepository';
import { IOutboxRepository } from '../../domain/repositories/IOutboxRepository';
export interface ExecutionWorkerConfig {
    workerId: string;
    pollInterval: number;
    concurrency: number;
    segment?: number;
    leaseTtl: number;
    graceWindowMs: number;
}
export declare class ExecutionWorker {
    private readonly scheduleRepo;
    private readonly runRepo;
    private readonly outboxRepo;
    private readonly config;
    private isRunning;
    private intervalId;
    private activeExecutions;
    private readonly logger;
    private readonly metrics;
    constructor(scheduleRepo: IScheduleRepository, runRepo: IScheduleRunRepository, outboxRepo: IOutboxRepository, config: ExecutionWorkerConfig);
    start(): Promise<void>;
    stop(): Promise<void>;
    private poll;
    private executeRun;
    getStatus(): {
        isRunning: boolean;
        activeExecutions: number;
        config: ExecutionWorkerConfig;
    };
}
//# sourceMappingURL=ExecutionWorker.d.ts.map