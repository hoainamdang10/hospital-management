/**
 * In-Memory Domain Event Publisher - Shared Infrastructure
 * Simple in-memory implementation for domain events
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { IDomainEventPublisher } from '../../domain/events/IDomainEventPublisher';
import { DomainEvent } from '../../domain/base/domain-event';

export class InMemoryDomainEventPublisher implements IDomainEventPublisher {
  private handlers: Map<string, Array<(event: DomainEvent) => Promise<void>>> = new Map();

  async publish(event: DomainEvent): Promise<void> {
    const eventType = event.eventType;
    const handlers = this.handlers.get(eventType) || [];
    
    for (const handler of handlers) {
      try {
        await handler(event);
      } catch (error) {
        console.error(`Error handling event ${eventType}:`, error);
      }
    }
  }

  async publishBatch(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }

  async publishWithRetry(event: DomainEvent, maxRetries: number = 3): Promise<void> {
    let lastError: Error | undefined;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        await this.publish(event);
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
        }
      }
    }
    
    throw lastError || new Error('Failed to publish event after retries');
  }

  async scheduleEvent(event: DomainEvent, publishAt: Date): Promise<void> {
    const delay = publishAt.getTime() - Date.now();
    if (delay > 0) {
      setTimeout(() => {
        this.publish(event).catch(error => {
          console.error(`Error publishing scheduled event:`, error);
        });
      }, delay);
    } else {
      await this.publish(event);
    }
  }

  async isHealthy(): Promise<boolean> {
    return true;
  }

  subscribe(eventType: string, handler: (event: DomainEvent) => Promise<void>): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
  }
}

