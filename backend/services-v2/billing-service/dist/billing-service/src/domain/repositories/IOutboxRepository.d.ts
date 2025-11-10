/**
 * IOutboxRepository - Domain Layer
 * Repository interface for Transactional Outbox Pattern
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Transactional Outbox Pattern, Event-Driven Architecture
 */
import { DomainEvent } from '../../../../shared/domain/base/domain-event';
/**
 * Outbox Event Status
 */
export declare enum OutboxEventStatus {
    PENDING = "PENDING",
    PUBLISHED = "PUBLISHED",
    FAILED = "FAILED"
}
/**
 * Outbox Event Entity
 */
export interface OutboxEvent {
    id: string;
    eventId: string;
    eventType: string;
    aggregateType: string;
    aggregateId: string;
    payload: any;
    metadata: any;
    createdAt: Date;
    publishedAt?: Date;
    status: OutboxEventStatus;
    retryCount: number;
    maxRetries: number;
    errorMessage?: string;
    sequenceNumber?: number;
    partitionKey?: string;
}
/**
 * Dead Letter Queue Event
 */
export interface DeadLetterEvent {
    id: string;
    originalEventId: string;
    eventType: string;
    aggregateType: string;
    aggregateId: string;
    payload: any;
    metadata: any;
    failureReason: string;
    finalErrorMessage?: string;
    totalRetryAttempts: number;
    firstAttemptedAt: Date;
    movedToDlqAt: Date;
    resolved: boolean;
    resolvedAt?: Date;
    resolvedBy?: string;
    resolutionNotes?: string;
}
/**
 * Outbox Repository Interface
 * Handles persistence of domain events using Transactional Outbox Pattern
 */
export interface IOutboxRepository {
    /**
     * Save domain events to outbox (in same transaction as aggregate)
     */
    saveEvents(events: DomainEvent[], transaction?: any): Promise<void>;
    /**
     * Get pending events for publishing
     */
    getPendingEvents(batchSize: number): Promise<OutboxEvent[]>;
    /**
     * Get retryable events (failed but still within retry limit)
     */
    getRetryableEvents(batchSize: number): Promise<OutboxEvent[]>;
    /**
     * Mark events as published
     */
    markAsPublished(eventIds: string[]): Promise<void>;
    /**
     * Mark event as failed and increment retry count
     */
    markAsFailed(eventId: string, errorMessage: string): Promise<void>;
    /**
     * Move permanently failed event to Dead Letter Queue
     */
    moveToDeadLetterQueue(eventId: string, failureReason: string): Promise<void>;
    /**
     * Cleanup old published events
     */
    cleanupPublishedEvents(retentionDays: number): Promise<number>;
    /**
     * Get Dead Letter Queue events
     */
    getDeadLetterEvents(limit?: number): Promise<DeadLetterEvent[]>;
    /**
     * Resolve a Dead Letter Queue event
     */
    resolveDeadLetterEvent(eventId: string, resolvedBy: string, resolutionNotes?: string): Promise<void>;
    /**
     * Get outbox statistics
     */
    getStatistics(): Promise<{
        pending: number;
        published: number;
        failed: number;
        deadLetter: number;
    }>;
}
//# sourceMappingURL=IOutboxRepository.d.ts.map