/**
 * Event Store Interface - Event Sourcing Infrastructure
 * Interface for event sourcing persistence
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Event Sourcing, HIPAA, Audit Trail
 */

import { DomainEvent } from '../../domain/events/domain-event';

/**
 * Event Stream Interface
 */
export interface EventStream {
  streamId: string;
  aggregateType: string;
  events: StoredEvent[];
  version: number;
  createdAt: Date;
  lastModified: Date;
}

/**
 * Stored Event Interface
 */
export interface StoredEvent {
  eventId: string;
  streamId: string;
  aggregateType: string;
  eventType: string;
  eventData: any;
  eventMetadata?: any;
  eventVersion: number;
  streamVersion: number;
  timestamp: Date;
  userId?: string;
  correlationId?: string;
  causationId?: string;
}

/**
 * Event Store Interface
 */
export interface IEventStore {
  /**
   * Save events to event stream
   */
  saveEvents(
    streamId: string,
    aggregateType: string,
    events: DomainEvent[],
    expectedVersion: number
  ): Promise<void>;

  /**
   * Get events from stream
   */
  getEvents(streamId: string, fromVersion?: number): Promise<StoredEvent[]>;

  /**
   * Get events by aggregate type
   */
  getEventsByAggregateType(
    aggregateType: string,
    fromTimestamp?: Date,
    toTimestamp?: Date
  ): Promise<StoredEvent[]>;

  /**
   * Get events by event type
   */
  getEventsByEventType(
    eventType: string,
    fromTimestamp?: Date,
    toTimestamp?: Date
  ): Promise<StoredEvent[]>;

  /**
   * Get all events in chronological order
   */
  getAllEvents(fromTimestamp?: Date, toTimestamp?: Date): Promise<StoredEvent[]>;

  /**
   * Get stream metadata
   */
  getStreamMetadata(streamId: string): Promise<StreamMetadata | null>;

  /**
   * Check if stream exists
   */
  streamExists(streamId: string): Promise<boolean>;

  /**
   * Get stream version
   */
  getStreamVersion(streamId: string): Promise<number>;

  /**
   * Create snapshot of aggregate state
   */
  saveSnapshot(snapshot: AggregateSnapshot): Promise<void>;

  /**
   * Get latest snapshot for aggregate
   */
  getSnapshot(streamId: string): Promise<AggregateSnapshot | null>;

  /**
   * Delete snapshot
   */
  deleteSnapshot(streamId: string, version: number): Promise<void>;

  /**
   * Get event store statistics
   */
  getStatistics(): Promise<EventStoreStatistics>;
}

/**
 * Stream Metadata Interface
 */
export interface StreamMetadata {
  streamId: string;
  aggregateType: string;
  version: number;
  eventCount: number;
  createdAt: Date;
  lastModified: Date;
  isDeleted: boolean;
  metadata?: Record<string, any>;
}

/**
 * Aggregate Snapshot Interface
 */
export interface AggregateSnapshot {
  streamId: string;
  aggregateType: string;
  aggregateData: any;
  version: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Event Store Statistics Interface
 */
export interface EventStoreStatistics {
  totalStreams: number;
  totalEvents: number;
  totalSnapshots: number;
  eventsByType: Record<string, number>;
  streamsByAggregateType: Record<string, number>;
  averageEventsPerStream: number;
  oldestEvent?: Date;
  newestEvent?: Date;
  storageSize?: number;
}

/**
 * Event Store Query Options
 */
export interface EventStoreQueryOptions {
  fromVersion?: number;
  toVersion?: number;
  fromTimestamp?: Date;
  toTimestamp?: Date;
  eventTypes?: string[];
  aggregateTypes?: string[];
  userId?: string;
  correlationId?: string;
  limit?: number;
  offset?: number;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Event Store Subscription Interface
 */
export interface IEventStoreSubscription {
  /**
   * Subscribe to all events
   */
  subscribeToAll(
    handler: (event: StoredEvent) => Promise<void>,
    options?: SubscriptionOptions
  ): Promise<Subscription>;

  /**
   * Subscribe to events by stream
   */
  subscribeToStream(
    streamId: string,
    handler: (event: StoredEvent) => Promise<void>,
    options?: SubscriptionOptions
  ): Promise<Subscription>;

  /**
   * Subscribe to events by event type
   */
  subscribeToEventType(
    eventType: string,
    handler: (event: StoredEvent) => Promise<void>,
    options?: SubscriptionOptions
  ): Promise<Subscription>;

  /**
   * Subscribe to events by aggregate type
   */
  subscribeToAggregateType(
    aggregateType: string,
    handler: (event: StoredEvent) => Promise<void>,
    options?: SubscriptionOptions
  ): Promise<Subscription>;
}

/**
 * Subscription Options
 */
export interface SubscriptionOptions {
  fromVersion?: number;
  fromTimestamp?: Date;
  batchSize?: number;
  maxRetries?: number;
  retryDelay?: number;
  resolveLinkTos?: boolean;
  subscriptionName?: string;
}

/**
 * Subscription Interface
 */
export interface Subscription {
  subscriptionId: string;
  isActive: boolean;
  lastProcessedEvent?: string;
  lastProcessedAt?: Date;
  errorCount: number;
  
  /**
   * Stop subscription
   */
  stop(): Promise<void>;

  /**
   * Get subscription statistics
   */
  getStatistics(): Promise<SubscriptionStatistics>;
}

/**
 * Subscription Statistics
 */
export interface SubscriptionStatistics {
  subscriptionId: string;
  eventsProcessed: number;
  lastProcessedEvent?: string;
  lastProcessedAt?: Date;
  errorCount: number;
  averageProcessingTime: number;
  isHealthy: boolean;
}

/**
 * Event Store Configuration
 */
export interface EventStoreConfig {
  connectionString: string;
  schema: string;
  enableSnapshots: boolean;
  snapshotFrequency: number;
  maxEventsPerStream?: number;
  enableEncryption: boolean;
  encryptionKey?: string;
  enableCompression: boolean;
  retentionPeriod?: number; // days
  enableAuditLog: boolean;
}

/**
 * Event Store Errors
 */
export class EventStoreError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'EventStoreError';
  }
}

export class ConcurrencyError extends EventStoreError {
  constructor(streamId: string, expectedVersion: number, actualVersion: number) {
    super(
      `Concurrency conflict for stream ${streamId}. Expected version: ${expectedVersion}, Actual version: ${actualVersion}`,
      'CONCURRENCY_ERROR'
    );
  }
}

export class StreamNotFoundError extends EventStoreError {
  constructor(streamId: string) {
    super(`Stream not found: ${streamId}`, 'STREAM_NOT_FOUND');
  }
}

export class InvalidEventError extends EventStoreError {
  constructor(message: string) {
    super(message, 'INVALID_EVENT');
  }
}

/**
 * Event Store Factory Interface
 */
export interface IEventStoreFactory {
  create(config: EventStoreConfig): IEventStore;
  createSubscription(config: EventStoreConfig): IEventStoreSubscription;
}
