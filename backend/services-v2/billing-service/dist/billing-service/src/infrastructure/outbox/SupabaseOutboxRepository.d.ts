/**
 * Supabase Outbox Repository - Infrastructure Layer
 * Implements Transactional Outbox Pattern using Supabase
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Transactional Outbox Pattern, HIPAA, Audit Trail
 */
import { SupabaseClient } from '@supabase/supabase-js';
import { IOutboxRepository, OutboxEvent, DeadLetterEvent } from '../../domain/repositories/IOutboxRepository';
import { DomainEvent } from '../../../../shared/domain/base/domain-event';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
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
     * Get dead letter queue events
     */
    getDeadLetterEvents(limit?: number): Promise<DeadLetterEvent[]>;
    /**
     * Mark dead letter event as resolved
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
    private mapToOutboxEvent;
    private mapToDeadLetterEvent;
}
//# sourceMappingURL=SupabaseOutboxRepository.d.ts.map