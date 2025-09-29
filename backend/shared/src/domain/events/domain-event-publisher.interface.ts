/**
 * Domain Event Publisher Interface - Event-Driven Architecture
 * Interface for publishing domain events across the system
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Event-Driven Architecture, HIPAA, Microservices
 */

import { DomainEvent } from './domain-event';

/**
 * Domain Event Publisher Interface
 */
export interface IDomainEventPublisher {
  /**
   * Publish a single domain event
   */
  publish(event: DomainEvent): Promise<void>;

  /**
   * Publish multiple domain events
   */
  publishBatch(events: DomainEvent[]): Promise<void>;

  /**
   * Publish event with retry mechanism
   */
  publishWithRetry(
    event: DomainEvent, 
    maxRetries?: number, 
    retryDelay?: number
  ): Promise<void>;

  /**
   * Schedule event for future publishing
   */
  scheduleEvent(event: DomainEvent, publishAt: Date): Promise<void>;

  /**
   * Get publisher statistics
   */
  getStatistics(): Promise<PublisherStatistics>;
}

/**
 * Publisher Statistics Interface
 */
export interface PublisherStatistics {
  totalEventsPublished: number;
  successfulPublications: number;
  failedPublications: number;
  averagePublishTime: number;
  eventsByType: Record<string, number>;
  lastPublishedAt?: Date;
  isHealthy: boolean;
}

/**
 * Event Publication Result
 */
export interface PublicationResult {
  success: boolean;
  eventId: string;
  publishedAt: Date;
  error?: string;
  retryCount?: number;
}

/**
 * Event Handler Interface
 */
export interface IDomainEventHandler<T extends DomainEvent = DomainEvent> {
  /**
   * Handle domain event
   */
  handle(event: T): Promise<void>;

  /**
   * Get event types this handler can process
   */
  getHandledEventTypes(): string[];

  /**
   * Check if handler can handle specific event type
   */
  canHandle(eventType: string): boolean;
}

/**
 * Event Subscriber Interface
 */
export interface IDomainEventSubscriber {
  /**
   * Subscribe to specific event type
   */
  subscribe<T extends DomainEvent>(
    eventType: string,
    handler: IDomainEventHandler<T>
  ): Promise<void>;

  /**
   * Subscribe to multiple event types
   */
  subscribeToMultiple<T extends DomainEvent>(
    eventTypes: string[],
    handler: IDomainEventHandler<T>
  ): Promise<void>;

  /**
   * Unsubscribe from event type
   */
  unsubscribe(eventType: string, handler: IDomainEventHandler): Promise<void>;

  /**
   * Get all subscriptions
   */
  getSubscriptions(): Promise<EventSubscription[]>;

  /**
   * Start processing events
   */
  start(): Promise<void>;

  /**
   * Stop processing events
   */
  stop(): Promise<void>;
}

/**
 * Event Subscription Interface
 */
export interface EventSubscription {
  subscriptionId: string;
  eventType: string;
  handlerName: string;
  isActive: boolean;
  createdAt: Date;
  lastProcessedAt?: Date;
  processedEventCount: number;
  errorCount: number;
}

/**
 * Event Bus Interface
 */
export interface IDomainEventBus extends IDomainEventPublisher, IDomainEventSubscriber {
  /**
   * Register event handler
   */
  registerHandler<T extends DomainEvent>(
    eventType: string,
    handler: IDomainEventHandler<T>
  ): Promise<void>;

  /**
   * Unregister event handler
   */
  unregisterHandler(eventType: string, handler: IDomainEventHandler): Promise<void>;

  /**
   * Get registered handlers for event type
   */
  getHandlers(eventType: string): IDomainEventHandler[];

  /**
   * Check if event bus is healthy
   */
  isHealthy(): Promise<boolean>;
}

/**
 * Event Middleware Interface
 */
export interface IEventMiddleware {
  /**
   * Process event before publishing
   */
  beforePublish(event: DomainEvent): Promise<DomainEvent>;

  /**
   * Process event after publishing
   */
  afterPublish(event: DomainEvent, result: PublicationResult): Promise<void>;

  /**
   * Handle publication error
   */
  onError(event: DomainEvent, error: Error): Promise<void>;
}

/**
 * Event Store Integration Interface
 */
export interface IEventStoreIntegration {
  /**
   * Publish events from event store
   */
  publishFromEventStore(
    streamId: string,
    fromVersion?: number
  ): Promise<void>;

  /**
   * Replay events from event store
   */
  replayEvents(
    fromTimestamp: Date,
    toTimestamp?: Date,
    eventTypes?: string[]
  ): Promise<void>;

  /**
   * Get unpublished events
   */
  getUnpublishedEvents(): Promise<DomainEvent[]>;

  /**
   * Mark events as published
   */
  markEventsAsPublished(eventIds: string[]): Promise<void>;
}

/**
 * Healthcare-Specific Event Publisher
 */
export interface IHealthcareEventPublisher extends IDomainEventPublisher {
  /**
   * Publish patient-related event with HIPAA compliance
   */
  publishPatientEvent(event: DomainEvent): Promise<void>;

  /**
   * Publish medical event with audit trail
   */
  publishMedicalEvent(event: DomainEvent): Promise<void>;

  /**
   * Publish critical healthcare event (immediate processing)
   */
  publishCriticalEvent(event: DomainEvent): Promise<void>;

  /**
   * Get HIPAA audit log for published events
   */
  getHIPAAAuditLog(patientId: string): Promise<HIPAAAuditEntry[]>;
}

/**
 * HIPAA Audit Entry
 */
export interface HIPAAAuditEntry {
  eventId: string;
  eventType: string;
  patientId: string;
  userId?: string;
  publishedAt: Date;
  dataAccessed: string[];
  accessReason?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Event Publisher Configuration
 */
export interface EventPublisherConfig {
  // Message broker settings
  brokerUrl: string;
  exchangeName: string;
  routingKeyPrefix: string;
  
  // Retry settings
  maxRetries: number;
  retryDelay: number;
  exponentialBackoff: boolean;
  
  // Performance settings
  batchSize: number;
  batchTimeout: number;
  maxConcurrentPublications: number;
  
  // Healthcare compliance
  enableHIPAACompliance: boolean;
  enableAuditLogging: boolean;
  encryptSensitiveData: boolean;
  
  // Monitoring
  enableMetrics: boolean;
  metricsInterval: number;
  healthCheckInterval: number;
}

/**
 * Event Publisher Factory
 */
export interface IDomainEventPublisherFactory {
  createPublisher(config: EventPublisherConfig): IDomainEventPublisher;
  createHealthcarePublisher(config: EventPublisherConfig): IHealthcareEventPublisher;
  createEventBus(config: EventPublisherConfig): IDomainEventBus;
}
