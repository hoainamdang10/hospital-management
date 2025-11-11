import { DomainEvent } from '../../../../shared/domain/base/domain-event';
export interface IntegrationEventPayload {
    eventType: string;
    aggregateId: string;
    aggregateType: string;
    occurredAt: Date;
    payload: Record<string, unknown>;
    metadata?: {
        userId?: string;
        correlationId?: string;
        causationId?: string;
    };
}
/**
 * Application-level contract for publishing domain and integration events.
 * Infrastructure adapters (RabbitMQ, Kafka, etc.) should implement this interface
 * and handle protocol-specific mapping internally.
 */
export interface IEventPublisher {
    publishDomainEvents(events: DomainEvent[]): Promise<void>;
    publishIntegrationEvent(event: IntegrationEventPayload): Promise<void>;
    initialize?(): Promise<void>;
    close?(): Promise<void>;
}
//# sourceMappingURL=IEventPublisher.d.ts.map