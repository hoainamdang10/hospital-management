import { OutboxRepository } from './OutboxRepository';
import { RemoteSchedulerAdapter } from '../adapters/RemoteSchedulerAdapter';
export interface OutboxWorkerOptions {
    intervalMs?: number;
    batchSize?: number;
    maxAttempts?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
}
export declare class OutboxPublisherWorker {
    private outboxRepo;
    private scheduler;
    private options;
    private timer?;
    private running;
    constructor(outboxRepo: OutboxRepository, scheduler: RemoteSchedulerAdapter, options?: OutboxWorkerOptions);
    start(): void;
    stop(): void;
    private computeNextRetry;
    private processOne;
    runOnce(): Promise<void>;
}
//# sourceMappingURL=OutboxPublisherWorker.d.ts.map