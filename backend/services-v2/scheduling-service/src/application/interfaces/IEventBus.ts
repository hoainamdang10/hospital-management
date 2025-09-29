/**
 * Event Bus Interface - Application Layer
 * V2 Clean Architecture + DDD + Event-Driven Implementation
 * Event publishing and handling contract
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */

import { DomainEvent } from '../../../shared/domain/base/domain-event';

/**
 * Event Bus Interface
 * Defines contract for event publishing and subscription
 */
export interface IEventBus {
  /**
   * Publish a domain event
   */
  publish(event: DomainEvent): Promise<void>;

  /**
   * Publish multiple domain events
   */
  publishAll(events: DomainEvent[]): Promise<void>;

  /**
   * Subscribe to an event type
   */
  subscribe<T extends DomainEvent>(
    eventType: string,
    handler: IEventHandler<T>
  ): void;

  /**
   * Unsubscribe from an event type
   */
  unsubscribe(eventType: string, handler: IEventHandler<any>): void;

  /**
   * Get event history for debugging/audit
   */
  getEventHistory(aggregateId: string): Promise<DomainEvent[]>;

  /**
   * Clear event history (for testing)
   */
  clearEventHistory(): Promise<void>;
}

/**
 * Event Handler Interface
 */
export interface IEventHandler<T extends DomainEvent> {
  /**
   * Handle the event
   */
  handle(event: T): Promise<void>;

  /**
   * Get handler name for logging/debugging
   */
  getHandlerName(): string;

  /**
   * Check if handler can handle the event
   */
  canHandle(event: DomainEvent): boolean;
}

/**
 * Event Publishing Options
 */
export interface EventPublishingOptions {
  /**
   * Retry count for failed events
   */
  retryCount?: number;

  /**
   * Delay between retries (in milliseconds)
   */
  retryDelay?: number;

  /**
   * Whether to publish synchronously or asynchronously
   */
  async?: boolean;

  /**
   * Event priority (higher numbers = higher priority)
   */
  priority?: number;

  /**
   * Event expiration time
   */
  expiresAt?: Date;

  /**
   * Additional metadata
   */
  metadata?: { [key: string]: any };
}

/**
 * Event Subscription Options
 */
export interface EventSubscriptionOptions {
  /**
   * Handler priority (higher numbers = higher priority)
   */
  priority?: number;

  /**
   * Whether to handle events asynchronously
   */
  async?: boolean;

  /**
   * Maximum retry count for failed handlers
   */
  maxRetries?: number;

  /**
   * Dead letter queue for failed events
   */
  deadLetterQueue?: string;

  /**
   * Event filter function
   */
  filter?: (event: DomainEvent) => boolean;
}

/**
 * Event Bus Configuration
 */
export interface EventBusConfiguration {
  /**
   * Default retry count
   */
  defaultRetryCount: number;

  /**
   * Default retry delay
   */
  defaultRetryDelay: number;

  /**
   * Maximum event history size
   */
  maxEventHistorySize: number;

  /**
   * Event persistence enabled
   */
  persistEvents: boolean;

  /**
   * Dead letter queue configuration
   */
  deadLetterQueue: {
    enabled: boolean;
    maxSize: number;
    retentionPeriod: number; // in milliseconds
  };

  /**
   * Event serialization options
   */
  serialization: {
    includeMetadata: boolean;
    compressEvents: boolean;
  };
}

/**
 * Event Processing Result
 */
export interface EventProcessingResult {
  /**
   * Whether the event was processed successfully
   */
  success: boolean;

  /**
   * Processing error if any
   */
  error?: Error;

  /**
   * Processing duration in milliseconds
   */
  duration: number;

  /**
   * Handler that processed the event
   */
  handlerName: string;

  /**
   * Retry count
   */
  retryCount: number;

  /**
   * Processing timestamp
   */
  processedAt: Date;
}

/**
 * Event Bus Statistics
 */
export interface EventBusStatistics {
  /**
   * Total events published
   */
  totalEventsPublished: number;

  /**
   * Total events processed
   */
  totalEventsProcessed: number;

  /**
   * Total failed events
   */
  totalFailedEvents: number;

  /**
   * Average processing time
   */
  averageProcessingTime: number;

  /**
   * Events by type
   */
  eventsByType: { [eventType: string]: number };

  /**
   * Handlers by event type
   */
  handlersByEventType: { [eventType: string]: string[] };

  /**
   * Dead letter queue size
   */
  deadLetterQueueSize: number;

  /**
   * Event history size
   */
  eventHistorySize: number;
}
