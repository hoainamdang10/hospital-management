/**
 * Outbox Publisher Worker - Infrastructure Layer
 * Background worker that publishes events from outbox to RabbitMQ
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Transactional Outbox Pattern, Guaranteed Delivery
 */
import { SupabaseClient } from '@supabase/supabase-js';
import { IOutboxRepository, OutboxEvent } from '../../domain/repositories/IOutboxRepository';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
/**
 * Worker Configuration
 */
export interface OutboxWorkerConfig {
    pollingIntervalMs: number;
    batchSize: number;
    retryIntervalMs: number;
    cleanupIntervalMs: number;
    retentionDays: number;
    enabled: boolean;
}
export declare class OutboxPublisherWorker {
    private outboxRepository;
    private supabase;
    private logger;
    private publishToRabbitMQ;
    private config;
    private isRunning;
    private pollingTimer?;
    private retryTimer?;
    private cleanupTimer?;
    private workerId;
    private readonly SCHEMA;
    constructor(outboxRepository: IOutboxRepository, supabase: SupabaseClient, logger: ILogger, publishToRabbitMQ: (event: OutboxEvent) => Promise<void>, config?: Partial<OutboxWorkerConfig>);
    /**
     * Start the worker
     */
    start(): Promise<void>;
    /**
     * Stop the worker
     */
    stop(): Promise<void>;
    /**
     * Main polling loop - processes pending events
     */
    private startPolling;
    /**
     * Retry loop - processes failed events
     */
    private startRetryLoop;
    /**
     * Cleanup loop - removes old published events
     */
    private startCleanupLoop;
    /**
     * Process pending events batch
     */
    private processPendingEvents;
    /**
     * Process retryable events
     */
    private processRetryableEvents;
    /**
     * Publish single event to RabbitMQ
     */
    private publishEvent;
    /**
     * Acquire distributed lock (prevent multiple workers)
     */
    private acquireLock;
    /**
     * Release distributed lock
     */
    private releaseLock;
    /**
     * Update heartbeat to keep lock alive
     */
    private updateHeartbeat;
    /**
     * Get worker status
     */
    getStatus(): {
        isRunning: boolean;
        workerId: string;
        config: OutboxWorkerConfig;
    };
}
//# sourceMappingURL=OutboxPublisherWorker.d.ts.map