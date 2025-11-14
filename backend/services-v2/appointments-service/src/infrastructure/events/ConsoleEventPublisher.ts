/**
 * ConsoleEventPublisher - simple publisher for demo/wiring
 * Implements application IEventPublisher by logging events
 */
import { IEventPublisher, DomainEvent as AppDomainEvent } from '../../application/services/IEventPublisher';

export class ConsoleEventPublisher implements IEventPublisher {
  async publish(event: AppDomainEvent): Promise<void> {
    // eslint-disable-next-line no-console
    console.log('[ConsoleEventPublisher] publish', {
      eventType: event.eventType,
      aggregateId: event.aggregateId,
      metadata: event.metadata,
    });
  }

  async publishBatch(events: AppDomainEvent[]): Promise<void> {
    for (const e of events) {
      await this.publish(e);
    }
  }

  isConnected(): boolean {
    return true;
  }

  async connect(): Promise<void> {
    return;
  }

  async disconnect(): Promise<void> {
    return;
  }
}
