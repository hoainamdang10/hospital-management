/**
 * Event Handler Interface - Shared Events
 * Defines contract for domain event handlers
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { DomainEvent } from '../domain/events/DomainEvent';

export interface IEventHandler<T extends DomainEvent = DomainEvent> {
  /**
   * Handle a domain event
   */
  handle(event: T): Promise<void>;
  
  /**
   * Get the event type this handler handles
   */
  getEventType(): string;
}

