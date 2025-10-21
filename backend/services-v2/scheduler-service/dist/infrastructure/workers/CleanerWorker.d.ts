import { IScheduleRunRepository } from '../../domain/repositories/IScheduleRunRepository';
import { IOutboxRepository } from '../../domain/repositories/IOutboxRepository';
import { IDeadLetterRepository } from '../../domain/repositories/IDeadLetterRepository';
export interface CleanerWorkerConfig {
    /**
     * Cleanup interval in milliseconds
     * Default: 24 hours (86400000ms)
     */
    interval: number;
    /**
     * Delete completed runs older than this many days
     * Default: 30 days
     */
    completedRunsRetentionDays: number;
    /**
     * Delete published outbox older than this many days
     * Default: 7 days
     */
    publishedOutboxRetentionDays: number;
    /**
     * Delete dead letters older than this many days
     * Default: 90 days
     */
    deadLettersRetentionDays: number;
}
export declare class CleanerWorker {
    private readonly runRepo;
    private readonly outboxRepo;
    private readonly deadLetterRepo;
    private readonly config;
    private isRunning;
    private intervalId;
    private readonly logger;
    private readonly metrics;
    constructor(runRepo: IScheduleRunRepository, outboxRepo: IOutboxRepository, deadLetterRepo: IDeadLetterRepository, config: CleanerWorkerConfig);
    start(): Promise<void>;
    stop(): Promise<void>;
    private cleanup;
    getStatus(): {
        isRunning: boolean;
        config: CleanerWorkerConfig;
    };
}
//# sourceMappingURL=CleanerWorker.d.ts.map