/**
 * OutboxPublisher - Background Job for Publishing Events
 * 
 * Polls the outbox table periodically and publishes pending events to RabbitMQ
 * 
 * Flow:
 * 1. Poll outbox table for PENDING events
 * 2. Mark event as PUBLISHING (lock)
 * 3. Publish to RabbitMQ
 * 4. Mark as PUBLISHED on success
 * 5. Mark as FAILED (with retry count) on failure
 * 6. After max retries, event stays in FAILED status for manual intervention
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Event-Driven Architecture, Outbox Pattern
 */

import { ILogger } from '../../application/services/ILogger';
import { IEventPublisher } from '../../application/services/IEventPublisher';
import { OutboxService } from './OutboxService';

export interface OutboxPublisherConfig {
  pollingIntervalMs?: number; // Default: 5000ms (5 seconds)
  batchSize?: number; // Default: 100
  enabled?: boolean; // Default: true
}

/**
 * OutboxPublisher - Publishes events from outbox to message broker
 */
export class OutboxPublisher {
  private pollingIntervalMs: number;
  private batchSize: number;
  private enabled: boolean;
  private pollingTimer: NodeJS.Timeout | null = null;
  private isPublishing = false;

  constructor(
    private outboxService: OutboxService,
    private eventPublisher: IEventPublisher,
    private logger: ILogger,
    config: OutboxPublisherConfig = {}
  ) {
    this.pollingIntervalMs = config.pollingIntervalMs || 5000;
    this.batchSize = config.batchSize || 100;
    this.enabled = config.enabled !== false;
  }

  /**
   * Start the background job
   */
  async start(): Promise<void> {
    if (!this.enabled) {
      this.logger.info('OutboxPublisher is disabled');
      return;
    }

    this.logger.info('Starting OutboxPublisher', {
      pollingIntervalMs: this.pollingIntervalMs,
      batchSize: this.batchSize
    });

    // Start polling
    this.pollingTimer = setInterval(
      () => this.publishPendingEvents(),
      this.pollingIntervalMs
    );

    // Also run once immediately
    await this.publishPendingEvents();
  }

  /**
   * Stop the background job
   */
  async stop(): Promise<void> {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }

    this.logger.info('OutboxPublisher stopped');
  }

  /**
   * Publish pending events from outbox
   */
  private async publishPendingEvents(): Promise<void> {
    // Prevent concurrent publishing
    if (this.isPublishing) {
      return;
    }

    this.isPublishing = true;

    try {
      // Get pending events
      const pendingEvents = await this.outboxService.getPendingEvents(this.batchSize);

      if (pendingEvents.length === 0) {
        return;
      }

      this.logger.debug('Found pending events to publish', {
        count: pendingEvents.length
      });

      // Process each event
      for (const event of pendingEvents) {
        await this.publishEvent(event);
      }

      // Log statistics
      const stats = await this.outboxService.getStats();
      this.logger.debug('Outbox statistics', stats as Record<string, unknown>);
    } catch (error) {
      this.logger.error('Error publishing pending events', {
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      this.isPublishing = false;
    }
  }

  /**
   * Publish a single event
   */
  private async publishEvent(event: any): Promise<void> {
    try {
      // Mark as publishing (lock)
      await this.outboxService.markAsPublishing(event.outboxId as string);

      // Publish to RabbitMQ
      await this.eventPublisher.publishIntegrationEvent({
        eventType: event.eventType as string,
        aggregateId: event.aggregateId as string,
        aggregateType: event.aggregateType as string,
        occurredAt: event.occurredAt as Date,
        payload: event.payload as Record<string, unknown>,
        metadata: {
          correlationId: event.eventId as string
        }
      });

      // Mark as published
      await this.outboxService.markAsPublished(event.outboxId as string);

      this.logger.info('Event published from outbox', {
        outboxId: event.outboxId,
        eventId: event.eventId,
        eventType: event.eventType
      });
    } catch (error) {
      // Mark as failed (with retry logic)
      const errorMessage = error instanceof Error ? error.message : String(error);
      await this.outboxService.markAsFailed(event.outboxId as string, errorMessage);

      this.logger.warn('Failed to publish event from outbox', {
        outboxId: event.outboxId,
        eventId: event.eventId,
        eventType: event.eventType,
        error: errorMessage
      });
    }
  }

  /**
   * Get outbox statistics
   */
  async getStats(): Promise<any> {
    return this.outboxService.getStats();
  }

  /**
   * Get failed events (for monitoring)
   */
  async getFailedEvents(limit?: number): Promise<any[]> {
    return this.outboxService.getFailedEvents(limit);
  }
}
