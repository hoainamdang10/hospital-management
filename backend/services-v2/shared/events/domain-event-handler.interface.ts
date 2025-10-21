/**
 * Domain Event Handler Interface
 * Hospital Management System V2
 * 
 * Interface for handling domain events in event-driven architecture
 */

import { DomainEvent } from '../domain/base/domain-event';

/**
 * Domain Event Handler Interface
 * Implement this interface to handle specific domain events
 */
export interface IDomainEventHandler<T extends DomainEvent = DomainEvent> {
  /**
   * Handle a domain event
   * @param event - The domain event to handle
   */
  handle(event: T): Promise<void>;
}

/**
 * Event Handler Metadata
 * Used for registering event handlers
 */
export interface EventHandlerMetadata {
  eventType: string;
  handler: IDomainEventHandler;
  priority?: number;
}

/**
 * Event Handler Registry
 * Manages event handler registrations
 */
export interface IEventHandlerRegistry {
  /**
   * Register an event handler
   */
  register<T extends DomainEvent>(
    eventType: string,
    handler: IDomainEventHandler<T>,
    priority?: number
  ): void;

  /**
   * Get handlers for a specific event type
   */
  getHandlers(eventType: string): IDomainEventHandler[];

  /**
   * Clear all handlers
   */
  clear(): void;
}

