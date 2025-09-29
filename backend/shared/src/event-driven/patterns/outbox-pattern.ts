/**
 * Outbox Pattern Implementation - Event-Driven Architecture
 * Ensures transactional consistency between business operations and event publishing
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Event-Driven Architecture, Transactional Consistency, HIPAA
 */

import { DomainEvent } from '../../domain/events/domain-event';
import { AggregateRoot } from '../../domain/base/aggregate-root';
import { IDomainEventPublisher } from '../../domain/events/domain-event-publisher.interface';

/**
 * Outbox Event Entry
 */
export interface OutboxEvent {
  id: string;
  aggregateId: string;
  aggregateType: string;
  eventType: string;
  eventData: any;
  eventMetadata?: any;
  createdAt: Date;
  processedAt?: Date;
  status: 'pending' | 'processing' | 'published' | 'failed';
  retryCount: number;
  lastError?: string;
  correlationId?: string;
  userId?: string;
}

/**
 * Outbox Repository Interface
 */
export interface IOutboxRepository {
  /**
   * Store events in outbox table within transaction
   */
  storeEvents(events: DomainEvent[], transactionContext?: any): Promise<void>;

  /**
   * Get pending events for publishing
   */
  getPendingEvents(limit?: number): Promise<OutboxEvent[]>;

  /**
   * Mark event as published
   */
  markAsPublished(eventId: string): Promise<void>;

  /**
   * Mark event as failed
   */
  markAsFailed(eventId: string, error: string): Promise<void>;

  /**
   * Increment retry count
   */
  incrementRetryCount(eventId: string): Promise<void>;

  /**
   * Clean up old processed events
   */
  cleanupProcessedEvents(olderThan: Date): Promise<number>;
}

/**
 * Outbox Service Interface
 */
export interface IOutboxService {
  /**
   * Execute business operation with outbox pattern
   */
  executeWithOutbox<T>(
    operation: () => Promise<T>,
    aggregates: AggregateRoot<any>[]
  ): Promise<T>;

  /**
   * Publish pending events from outbox
   */
  publishPendingEvents(): Promise<void>;

  /**
   * Start background event publisher
   */
  startEventPublisher(intervalMs?: number): void;

  /**
   * Stop background event publisher
   */
  stopEventPublisher(): void;
}

/**
 * Outbox Service Implementation
 */
export class OutboxService implements IOutboxService {
  private publisherInterval?: NodeJS.Timeout;
  private isPublishing = false;

  constructor(
    private readonly outboxRepository: IOutboxRepository,
    private readonly eventPublisher: IDomainEventPublisher,
    private readonly transactionManager: ITransactionManager
  ) {}

  /**
   * Execute business operation with outbox pattern
   */
  async executeWithOutbox<T>(
    operation: () => Promise<T>,
    aggregates: AggregateRoot<any>[]
  ): Promise<T> {
    return await this.transactionManager.executeInTransaction(async (transactionContext) => {
      // 1. Execute business operation
      const result = await operation();

      // 2. Collect all domain events from aggregates
      const allEvents: DomainEvent[] = [];
      for (const aggregate of aggregates) {
        const events = aggregate.getUncommittedEvents();
        allEvents.push(...events);
      }

      // 3. Store events in outbox table (within same transaction)
      if (allEvents.length > 0) {
        await this.outboxRepository.storeEvents(allEvents, transactionContext);

        // 4. Mark events as committed in aggregates
        for (const aggregate of aggregates) {
          aggregate.markEventsAsCommitted();
        }
      }

      return result;
    });
  }

  /**
   * Publish pending events from outbox
   */
  async publishPendingEvents(): Promise<void> {
    if (this.isPublishing) {
      return; // Prevent concurrent publishing
    }

    this.isPublishing = true;

    try {
      const pendingEvents = await this.outboxRepository.getPendingEvents(50);

      for (const outboxEvent of pendingEvents) {
        try {
          // Reconstruct domain event
          const domainEvent = this.reconstructDomainEvent(outboxEvent);

          // Publish event
          await this.eventPublisher.publish(domainEvent);

          // Mark as published
          await this.outboxRepository.markAsPublished(outboxEvent.id);

          console.log(`Published outbox event: ${outboxEvent.eventType}`, {
            eventId: outboxEvent.id,
            aggregateId: outboxEvent.aggregateId
          });

        } catch (error) {
          console.error(`Failed to publish outbox event: ${outboxEvent.id}`, error);

          // Increment retry count
          await this.outboxRepository.incrementRetryCount(outboxEvent.id);

          // Mark as failed if max retries exceeded
          if (outboxEvent.retryCount >= 3) {
            await this.outboxRepository.markAsFailed(
              outboxEvent.id,
              error instanceof Error ? error.message : 'Unknown error'
            );
          }
        }
      }
    } finally {
      this.isPublishing = false;
    }
  }

  /**
   * Start background event publisher
   */
  startEventPublisher(intervalMs: number = 5000): void {
    if (this.publisherInterval) {
      return; // Already started
    }

    this.publisherInterval = setInterval(async () => {
      try {
        await this.publishPendingEvents();
      } catch (error) {
        console.error('Error in background event publisher:', error);
      }
    }, intervalMs);

    console.log(`Outbox event publisher started with ${intervalMs}ms interval`);
  }

  /**
   * Stop background event publisher
   */
  stopEventPublisher(): void {
    if (this.publisherInterval) {
      clearInterval(this.publisherInterval);
      this.publisherInterval = undefined;
      console.log('Outbox event publisher stopped');
    }
  }

  /**
   * Reconstruct domain event from outbox entry
   */
  private reconstructDomainEvent(outboxEvent: OutboxEvent): DomainEvent {
    // This would need to be implemented based on your event types
    // For now, return a generic domain event structure
    return {
      eventId: outboxEvent.id,
      eventType: outboxEvent.eventType,
      aggregateId: outboxEvent.aggregateId,
      aggregateType: outboxEvent.aggregateType,
      eventVersion: 1,
      occurredAt: outboxEvent.createdAt,
      correlationId: outboxEvent.correlationId,
      userId: outboxEvent.userId,
      getEventData: () => outboxEvent.eventData,
      containsPHI: () => true, // Assume healthcare events contain PHI
      getPatientId: () => outboxEvent.eventData?.patientId || null
    } as DomainEvent;
  }
}

/**
 * Transaction Manager Interface
 */
export interface ITransactionManager {
  executeInTransaction<T>(operation: (transactionContext: any) => Promise<T>): Promise<T>;
}

/**
 * Supabase Transaction Manager Implementation
 */
export class SupabaseTransactionManager implements ITransactionManager {
  constructor(private readonly supabaseClient: any) {}

  async executeInTransaction<T>(operation: (transactionContext: any) => Promise<T>): Promise<T> {
    // Supabase doesn't have explicit transactions, but we can use RPC functions
    // that handle transactions internally, or implement optimistic concurrency
    
    // For now, execute without explicit transaction
    // In production, you'd want to use database-level transactions
    return await operation(null);
  }
}

/**
 * Healthcare Outbox Service
 * Specialized outbox service for healthcare domain
 */
export class HealthcareOutboxService extends OutboxService {
  constructor(
    outboxRepository: IOutboxRepository,
    eventPublisher: IDomainEventPublisher,
    transactionManager: ITransactionManager,
    private readonly hipaaAuditLogger: any
  ) {
    super(outboxRepository, eventPublisher, transactionManager);
  }

  /**
   * Execute healthcare operation with HIPAA audit
   */
  async executeHealthcareOperationWithOutbox<T>(
    operation: () => Promise<T>,
    aggregates: AggregateRoot<any>[],
    userId: string,
    auditAction: string
  ): Promise<T> {
    // Log HIPAA audit before operation
    await this.hipaaAuditLogger.logAccess({
      action: `${auditAction}_STARTED`,
      userId,
      timestamp: new Date(),
      details: { aggregateIds: aggregates.map(a => a.id) }
    });

    try {
      const result = await this.executeWithOutbox(operation, aggregates);

      // Log successful completion
      await this.hipaaAuditLogger.logAccess({
        action: `${auditAction}_COMPLETED`,
        userId,
        timestamp: new Date(),
        details: { aggregateIds: aggregates.map(a => a.id) }
      });

      return result;
    } catch (error) {
      // Log failure
      await this.hipaaAuditLogger.logAccess({
        action: `${auditAction}_FAILED`,
        userId,
        timestamp: new Date(),
        details: { 
          error: error instanceof Error ? error.message : 'Unknown error',
          aggregateIds: aggregates.map(a => a.id)
        }
      });

      throw error;
    }
  }
}
