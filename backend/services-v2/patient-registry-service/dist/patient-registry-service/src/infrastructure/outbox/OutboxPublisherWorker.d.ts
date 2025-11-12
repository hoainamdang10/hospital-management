/**
 * OutboxPublisherWorker - Infrastructure Layer
 * Background worker that polls outbox table and publishes events to RabbitMQ
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Event-Driven Architecture, Transactional Outbox Pattern
 */
import { ILogger } from '@shared/application/services/logger.interface';
import { DomainEvent } from '@shared/domain/base/domain-event';
import { IOutboxRepository } from './SupabaseOutboxRepository';
export interface OutboxWorkerConfig {
    enabled: boolean;
    pollingIntervalMs: number;
    batchSize: number;
}
export declare class OutboxPublisherWorker {
    private outboxRepository;
    private logger;
    private publishEvent;
    private config;
    private isRunning;
    private pollingTimer?;
    constructor(outboxRepository: IOutboxRepository, logger: ILogger, publishEvent: (event: DomainEvent) => Promise<void>, config: OutboxWorkerConfig);
    /**
     * Start the outbox publisher worker
     */
    start(): Promise<void>;
    /**
     * Stop the outbox publisher worker
     */
    stop(): Promise<void>;
    /**
     * Poll outbox table for pending events
     */
    private poll;
    /**
     * Process a batch of pending events
     */
    private processBatch;
    /**
     * Publish a single outbox event to RabbitMQ
     */
    private publishOutboxEvent;
    /**
     * Reconstruct domain event from outbox payload
     */
    private reconstructDomainEvent;
}
//# sourceMappingURL=OutboxPublisherWorker.d.ts.map