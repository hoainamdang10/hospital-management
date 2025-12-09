import { OutboxRepository } from "./OutboxRepository";
import { RemoteSchedulerAdapter } from "../adapters/RemoteSchedulerAdapter";
export interface OutboxWorkerOptions {
    intervalMs?: number;
    batchSize?: number;
    maxAttempts?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
    rabbitmqUrl?: string;
    exchange?: string;
}
export declare class OutboxPublisherWorker {
    private outboxRepo;
    private scheduler?;
    private options;
    private timer?;
    private running;
    private amqpConn?;
    private amqpChannel?;
    constructor(outboxRepo: OutboxRepository, scheduler?: RemoteSchedulerAdapter | undefined, options?: OutboxWorkerOptions);
    start(): void;
    stop(): void;
    private computeNextRetry;
    private ensureConfirmChannel;
    private processOne;
    runOnce(): Promise<void>;
}
//# sourceMappingURL=OutboxPublisherWorker.d.ts.map