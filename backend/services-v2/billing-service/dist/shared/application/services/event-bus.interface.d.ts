/**
 * Event Bus contract used by application layer
 */
import { DomainEvent } from '../../domain/base/domain-event';
export interface EventHandler<T extends DomainEvent> {
    handle(event: T): Promise<void>;
}
export interface IEventBus {
    publish(event: DomainEvent): Promise<void>;
    subscribe<T extends DomainEvent>(eventType: string, handler: EventHandler<T>, queueName?: string): Promise<void>;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
}
//# sourceMappingURL=event-bus.interface.d.ts.map