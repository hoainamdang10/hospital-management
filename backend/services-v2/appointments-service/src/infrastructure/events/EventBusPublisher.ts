import { IEventPublisher, DomainEvent as AppDomainEvent } from '../../application/services/IEventPublisher';
import { IEventBus } from '@shared/infrastructure/event-bus/EventBus';

export class EventBusPublisher implements IEventPublisher {
  constructor(private readonly eventBus: IEventBus) {}

  async publish(event: AppDomainEvent): Promise<void> {
    await this.eventBus.publish({
      eventType: event.eventType,
      aggregateId: event.aggregateId,
      aggregateType: event.aggregateType,
      eventData: event.eventData,
      metadata: event.metadata,
    } as any);
  }

  async publishBatch(events: AppDomainEvent[]): Promise<void> {
    for (const e of events) {
      await this.publish(e);
    }
  }

  isConnected(): boolean {
    return true; // EventBus manages its own connection lifecycle
  }

  async connect(): Promise<void> {
    // No-op; DI initializes and connects EventBus via EventSubscriptions
  }

  async disconnect(): Promise<void> {
    // No-op
  }
}
