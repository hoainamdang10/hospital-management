/**
 * Outbox Repository Interface - Domain Layer
 * Defines contract for storing and retrieving outbox events
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Transactional Outbox Pattern, Domain-Driven Design
 */

import { DomainEvent } from '@shared/domain/events/domain-events';

/**
 * Outbox Event Status
 */
export enum OutboxEventStatus {
  PENDING = 'PENDING',
  PUBLISHED = 'PUBLISHED',
  FAILED = 'FAILED',
}

/**
 * Outbox Event Entity
 */
export interface OutboxEvent {
  id: string;
  eventId: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  payload: any;
  metadata: any;
  createdAt: Date;
  publishedAt?: Date;
  status: OutboxEventStatus;
  retryCount: number;
  maxRetries: number;
  errorMessage?: string;
  sequenceNumber: number;
  partitionKey?: string;
}

/**
 * Dead Letter Queue Event
 */
export interface DeadLetterEvent {
  id: string;
  originalEventId: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  payload: any;
  metadata: any;
  failureReason: string;
  finalErrorMessage?: string;
  totalRetryAttempts: number;
  firstAttemptedAt: Date;
  movedToDlqAt: Date;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolutionNotes?: string;
}

/**
 * Outbox Repository Interface
 * Handles persistence of domain events using Transactional Outbox Pattern
 */
export interface IOutboxRepository {
  /**
   * Save domain events to outbox (in same transaction as aggregate)
   * @param events - Domain events to save
   * @param transaction - Optional transaction context
   */
  saveEvents(events: DomainEvent[], transaction?: any): Promise<void>;

  /**
   * Get pending events for publishing
   * @param batchSize - Number of events to retrieve
   * @returns Array of pending outbox events
   */
  getPendingEvents(batchSize: number): Promise<OutboxEvent[]>;

  /**
   * Mark events as published
   * @param eventIds - Array of event IDs to mark as published
   */
  markAsPublished(eventIds: string[]): Promise<void>;

  /**
   * Mark event as failed and increment retry count
   * @param eventId - Event ID
   * @param errorMessage - Error message
   */
  markAsFailed(eventId: string, errorMessage: string): Promise<void>;

  /**
   * Move permanently failed event to Dead Letter Queue
   * @param eventId - Event ID
   * @param failureReason - Reason for permanent failure
   */
  moveToDeadLetterQueue(eventId: string, failureReason: string): Promise<void>;

  /**
   * Get events ready for retry (failed but under max retries)
   * @param batchSize - Number of events to retrieve
   */
  getRetryableEvents(batchSize: number): Promise<OutboxEvent[]>;

  /**
   * Cleanup old published events (housekeeping)
   * @param retentionDays - Number of days to retain published events
   * @returns Number of deleted events
   */
  cleanupPublishedEvents(retentionDays: number): Promise<number>;

  /**
   * Get dead letter queue events (for monitoring/alerting)
   * @param limit - Maximum number of events to retrieve
   */
  getDeadLetterEvents(limit: number): Promise<DeadLetterEvent[]>;

  /**
   * Mark dead letter event as resolved
   * @param eventId - Dead letter event ID
   * @param resolvedBy - User/system that resolved it
   * @param notes - Resolution notes
   */
  resolveDeadLetterEvent(eventId: string, resolvedBy: string, notes: string): Promise<void>;
}
