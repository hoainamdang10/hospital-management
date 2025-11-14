/**
 * Inbox Repository - Idempotent Event Processing
 * Prevents duplicate event processing using inbox pattern
 *
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Event-Driven Architecture, Idempotency
 */
export interface InboxEvent {
    id?: string;
    eventId: string;
    eventType: string;
    sourceService: string;
    payloadJson: any;
    processedAt?: Date;
    createdAt?: Date;
}
/**
 * Inbox Repository
 * Stores processed events to ensure idempotency
 */
export declare class InboxRepository {
    private supabase;
    private readonly table;
    constructor(supabaseUrl: string, supabaseKey: string);
    /**
     * Check if event already processed
     */
    exists(eventId: string): Promise<boolean>;
    /**
     * Save processed event
     */
    save(event: InboxEvent): Promise<void>;
    /**
     * Get recent events by type (for monitoring/debugging)
     */
    getRecentByType(eventType: string, limit?: number): Promise<InboxEvent[]>;
    /**
     * Get recent events by source service
     */
    getRecentBySource(sourceService: string, limit?: number): Promise<InboxEvent[]>;
    /**
     * Cleanup old events (retention policy: 30 days)
     */
    cleanup(retentionDays?: number): Promise<number>;
    /**
     * Get sync statistics (monitoring)
     */
    getStats(): Promise<{
        totalEvents: number;
        eventsByType: Record<string, number>;
        eventsBySource: Record<string, number>;
        lastProcessedAt: Date | null;
    }>;
    /**
     * Map database row to InboxEvent
     */
    private mapToInboxEvent;
    /**
     * Store event in inbox (alias for save)
     * Used by event consumers for idempotent processing
     */
    store(event: InboxEvent): Promise<void>;
}
//# sourceMappingURL=InboxRepository.d.ts.map