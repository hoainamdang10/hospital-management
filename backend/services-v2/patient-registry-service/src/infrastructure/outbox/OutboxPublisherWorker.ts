/**
 * OutboxPublisherWorker - Infrastructure Layer
 * Background worker that polls outbox table and publishes events to RabbitMQ
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Event-Driven Architecture, Transactional Outbox Pattern
 */

import { ILogger } from '@shared/application/services/logger.interface';
import { DomainEvent, buildRoutingKey } from '@shared/domain/base/domain-event';
import { IOutboxRepository, OutboxEvent } from './SupabaseOutboxRepository';

export interface OutboxWorkerConfig {
  enabled: boolean;
  pollingIntervalMs: number;
  batchSize: number;
}

export class OutboxPublisherWorker {
  private isRunning = false;
  private pollingTimer?: NodeJS.Timeout;

  constructor(
    private outboxRepository: IOutboxRepository,
    private logger: ILogger,
    private publishEvent: (event: DomainEvent) => Promise<void>,
    private config: OutboxWorkerConfig
  ) {}

  /**
   * Start the outbox publisher worker
   */
  async start(): Promise<void> {
    if (!this.config.enabled) {
      this.logger.info('[OutboxWorker] Outbox worker disabled');
      return;
    }

    if (this.isRunning) {
      this.logger.warn('[OutboxWorker] Worker already running');
      return;
    }

    this.isRunning = true;
    this.logger.info('[OutboxWorker] Starting outbox publisher worker', {
      pollingIntervalMs: this.config.pollingIntervalMs,
      batchSize: this.config.batchSize,
    });

    // Start polling
    this.poll();
  }

  /**
   * Stop the outbox publisher worker
   */
  async stop(): Promise<void> {
    this.isRunning = false;

    if (this.pollingTimer) {
      clearTimeout(this.pollingTimer);
      this.pollingTimer = undefined;
    }

    this.logger.info('[OutboxWorker] Outbox publisher worker stopped');
  }

  /**
   * Poll outbox table for pending events
   */
  private async poll(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      await this.processBatch();
    } catch (error) {
      this.logger.error('[OutboxWorker] Error processing batch', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Schedule next poll
    if (this.isRunning) {
      this.pollingTimer = setTimeout(
        () => this.poll(),
        this.config.pollingIntervalMs
      );
    }
  }

  /**
   * Process a batch of pending events
   */
  private async processBatch(): Promise<void> {
    try {
      // Get pending events
      const events = await this.outboxRepository.getPendingEvents(this.config.batchSize);

      if (events.length === 0) {
        this.logger.debug('[OutboxWorker] No pending events');
        return;
      }

      this.logger.info('[OutboxWorker] Processing batch', { count: events.length });

      // Process each event
      const publishedIds: string[] = [];

      for (const event of events) {
        try {
          await this.publishOutboxEvent(event);
          publishedIds.push(event.id);
        } catch (error) {
          this.logger.error('[OutboxWorker] Failed to publish event', {
            eventId: event.id,
            eventType: event.event_type,
            error: error instanceof Error ? error.message : 'Unknown error',
          });

          // Mark as failed
          await this.outboxRepository.markAsFailed(
            event.id,
            error instanceof Error ? error.message : 'Unknown error'
          );
        }
      }

      // Mark successfully published events
      if (publishedIds.length > 0) {
        await this.outboxRepository.markAsPublished(publishedIds);
        this.logger.info('[OutboxWorker] Batch processed successfully', {
          published: publishedIds.length,
          failed: events.length - publishedIds.length,
        });
      }
    } catch (error) {
      this.logger.error('[OutboxWorker] Error processing batch', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Publish a single outbox event to RabbitMQ
   */
  private async publishOutboxEvent(outboxEvent: OutboxEvent): Promise<void> {
    try {
      // Reconstruct domain event from outbox payload
      const domainEvent = this.reconstructDomainEvent(outboxEvent);

      // Publish to RabbitMQ
      await this.publishEvent(domainEvent);

      this.logger.debug('[OutboxWorker] Event published', {
        eventId: outboxEvent.event_id,
        eventType: outboxEvent.event_type,
      });
    } catch (error) {
      this.logger.error('[OutboxWorker] Failed to publish event', {
        eventId: outboxEvent.event_id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Reconstruct domain event from outbox payload
   */
  private reconstructDomainEvent(outboxEvent: OutboxEvent): DomainEvent {
    const rawPayload = outboxEvent.payload || {};
    const serializedPayload = rawPayload.eventData
      ? rawPayload
      : {
        eventId: rawPayload.eventId ?? outboxEvent.event_id,
        eventType: rawPayload.eventType ?? outboxEvent.event_type,
        aggregateId: rawPayload.aggregateId ?? outboxEvent.aggregate_id,
        aggregateType: rawPayload.aggregateType ?? outboxEvent.aggregate_type,
        eventVersion:
            rawPayload.eventVersion ?? outboxEvent.metadata?.version ?? 1,
        occurredAt: rawPayload.occurredAt ?? outboxEvent.created_at,
        eventData: rawPayload.payload ?? rawPayload,
        correlationId:
            rawPayload.correlationId ?? outboxEvent.metadata?.correlationId,
        causationId: rawPayload.causationId,
        userId: rawPayload.userId,
        metadata: rawPayload.metadata ?? outboxEvent.metadata ?? {},
      };

    const occurredAt = new Date(
      serializedPayload.occurredAt ?? outboxEvent.created_at
    );
    const metadata = {
      source: 'domain',
      priority: 'normal',
      retryable: true,
      ...serializedPayload.metadata,
    };
    const eventData =
      serializedPayload.eventData ?? rawPayload.payload ?? rawPayload ?? {};

    const aggregateType =
      serializedPayload.aggregateType ?? outboxEvent.aggregate_type;
    const aggregateId =
      serializedPayload.aggregateId ?? outboxEvent.aggregate_id;
    const eventType = serializedPayload.eventType ?? outboxEvent.event_type;
    const eventVersion =
      serializedPayload.eventVersion ?? outboxEvent.metadata?.version ?? 1;
    const correlationId =
      serializedPayload.correlationId ?? outboxEvent.metadata?.correlationId;

    const containsPHI =
      typeof (metadata as any).containsPHI === 'boolean'
        ? (metadata as any).containsPHI
        : Array.isArray((metadata as any).tags) &&
          (metadata as any).tags.includes('phi');

    return {
      eventId: serializedPayload.eventId ?? outboxEvent.event_id,
      eventType,
      aggregateId,
      aggregateType,
      eventVersion,
      occurredAt,
      correlationId,
      causationId: serializedPayload.causationId,
      userId: serializedPayload.userId,
      metadata,
      getEventData: () => eventData,
      containsPHI: () => containsPHI,
      getPatientId: () => {
        if (typeof (metadata as any).patientId === 'string') {
          return (metadata as any).patientId;
        }
        if (typeof (eventData as any)?.patientId === 'string') {
          return (eventData as any).patientId;
        }
        return null;
      },
      getStreamName: () => `${aggregateType}-${aggregateId}`,
      getRoutingKey: () => buildRoutingKey(aggregateType, eventType),
      shouldPublishExternally: () =>
        (metadata as any).publishExternal !== false,
      getPriority: () => (metadata as any).priority ?? 'normal',
      isRetryable: () => (metadata as any).retryable !== false,
      toJSON: () => ({
        eventId: serializedPayload.eventId ?? outboxEvent.event_id,
        eventType,
        aggregateId,
        aggregateType,
        eventVersion,
        occurredAt: occurredAt.toISOString(),
        eventData,
        correlationId,
        causationId: serializedPayload.causationId,
        userId: serializedPayload.userId,
        metadata,
      }),
    } as DomainEvent;
  }

}
