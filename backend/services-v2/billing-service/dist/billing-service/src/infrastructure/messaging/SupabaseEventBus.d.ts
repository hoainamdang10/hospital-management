/**
 * SupabaseEventBus - Event Bus Implementation
 * Uses Supabase Realtime for event publishing/subscribing
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { OptimizedSupabaseClient } from '../../../../shared/infrastructure/database/optimized-supabase-client';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
export interface DomainEvent {
    eventId: string;
    eventType: string;
    aggregateId: string;
    aggregateType: string;
    payload: any;
    occurredAt: Date;
    version: number;
}
export interface IEventBus {
    publish(event: DomainEvent): Promise<void>;
    publishBatch(events: DomainEvent[]): Promise<void>;
    subscribe(eventType: string, handler: (event: DomainEvent) => Promise<void>): void;
}
export declare class SupabaseEventBus implements IEventBus {
    private readonly supabaseClient;
    private readonly logger;
    private readonly schema;
    private handlers;
    constructor(supabaseClient: OptimizedSupabaseClient, logger: ILogger, schema?: string);
    /**
     * Publish a single domain event to outbox
     */
    publish(event: DomainEvent): Promise<void>;
    /**
     * Publish multiple events in batch
     */
    publishBatch(events: DomainEvent[]): Promise<void>;
    /**
     * Subscribe to event type (in-memory handler registration)
     */
    subscribe(eventType: string, handler: (event: DomainEvent) => Promise<void>): void;
    /**
     * Dispatch event to registered handlers (called by outbox worker)
     */
    dispatch(event: DomainEvent): Promise<void>;
}
//# sourceMappingURL=SupabaseEventBus.d.ts.map