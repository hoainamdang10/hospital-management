/**
 * SupabaseOutboxRepository - Infrastructure Layer
 * Implements transactional outbox pattern for reliable event publishing
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture
 */
import { SupabaseClient } from '@supabase/supabase-js';
import { ILogger } from '../../../../shared/application/services/logger.interface';
import { DomainEvent } from '../../../../shared/domain/base/domain-event';
export declare enum OutboxEventStatus {
    PENDING = "PENDING",
    PUBLISHED = "PUBLISHED",
    FAILED = "FAILED"
}
export interface OutboxEvent {
    id: string;
    event_id: string;
    event_type: string;
    aggregate_type: string;
    aggregate_id: string;
    payload: any;
    metadata: any;
    status: OutboxEventStatus;
    retry_count: number;
    max_retries: number;
    last_error?: string;
    created_at: string;
    published_at?: string;
    sequence_number: number;
    partition_key?: string;
}
export interface IOutboxRepository {
    saveEvents(events: DomainEvent[], transaction?: any): Promise<void>;
    getPendingEvents(batchSize?: number): Promise<OutboxEvent[]>;
    markAsPublished(eventIds: string[]): Promise<void>;
    markAsFailed(eventId: string, errorMessage: string): Promise<void>;
    moveToDeadLetterQueue(eventId: string, failureReason: string): Promise<void>;
    cleanupPublishedEvents(retentionDays?: number): Promise<number>;
}
export declare class SupabaseOutboxRepository implements IOutboxRepository {
    private supabase;
    private logger;
    private readonly TABLE_NAME;
    private readonly DLQ_TABLE;
    private readonly SCHEMA;
    constructor(supabase: SupabaseClient, logger: ILogger);
    /**
     * Save domain events to outbox table
     * CRITICAL: Must be called in same transaction as aggregate save
     */
    saveEvents(events: DomainEvent[], transaction?: any): Promise<void>;
    /**
     * Get pending events for publishing (batch processing)
     */
    getPendingEvents(batchSize?: number): Promise<OutboxEvent[]>;
    /**
     * Mark events as successfully published
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
     * Cleanup old published events (housekeeping)
     */
    cleanupPublishedEvents(retentionDays?: number): Promise<number>;
    /**
     * Extract aggregate type from event type
     * Example: 'patient.patient_registered' -> 'Patient'
     */
    private extractAggregateType;
}
//# sourceMappingURL=SupabaseOutboxRepository.d.ts.map