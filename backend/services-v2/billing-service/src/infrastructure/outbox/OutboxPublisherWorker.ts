/**
 * Outbox Publisher Worker - Infrastructure Layer
 * Background worker that publishes events from outbox to RabbitMQ
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Transactional Outbox Pattern, Guaranteed Delivery
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { IOutboxRepository, OutboxEvent } from '../../domain/repositories/IOutboxRepository';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';

/**
 * Worker Configuration
 */
export interface OutboxWorkerConfig {
  pollingIntervalMs: number; // How often to poll for events
  batchSize: number; // Events to process per batch
  retryIntervalMs: number; // Delay before retrying failed events
  cleanupIntervalMs: number; // How often to cleanup old events
  retentionDays: number; // Days to retain published events
  enabled: boolean; // Enable/disable worker
}

/**
 * Default Configuration
 */
const DEFAULT_CONFIG: OutboxWorkerConfig = {
  pollingIntervalMs: 5000, // Poll every 5 seconds
  batchSize: 50, // Process 50 events per batch
  retryIntervalMs: 10000, // Retry after 10 seconds
  cleanupIntervalMs: 3600000, // Cleanup every hour
  retentionDays: 30, // Keep 30 days
  enabled: true,
};

export class OutboxPublisherWorker {
  private config: OutboxWorkerConfig;
  private isRunning: boolean = false;
  private pollingTimer?: NodeJS.Timeout;
  private retryTimer?: NodeJS.Timeout;
  private cleanupTimer?: NodeJS.Timeout;
  private workerId: string;
  private readonly SCHEMA = 'billing_schema';

  constructor(
    private outboxRepository: IOutboxRepository,
    private supabase: SupabaseClient,
    private logger: ILogger,
    private publishToRabbitMQ: (event: OutboxEvent) => Promise<void>,
    config?: Partial<OutboxWorkerConfig>
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.workerId = `billing-worker-${process.pid}-${Date.now()}`;
  }

  /**
   * Start the worker
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('[OutboxWorker] Already running');
      return;
    }

    if (!this.config.enabled) {
      this.logger.info('[OutboxWorker] Worker disabled by configuration');
      return;
    }

    this.logger.info('[OutboxWorker] 🚀 Starting Outbox Publisher Worker', {
      workerId: this.workerId,
      config: this.config,
    });

    this.isRunning = true;

    // Start polling loop
    this.startPolling();

    // Start retry loop
    this.startRetryLoop();

    // Start cleanup loop
    this.startCleanupLoop();

    this.logger.info('[OutboxWorker] ✅ Worker started successfully');
  }

  /**
   * Stop the worker
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.logger.info('[OutboxWorker] 🛑 Stopping worker...');
    
    this.isRunning = false;

    // Clear timers
    if (this.pollingTimer) clearTimeout(this.pollingTimer);
    if (this.retryTimer) clearTimeout(this.retryTimer);
    if (this.cleanupTimer) clearTimeout(this.cleanupTimer);

    // Release lock
    await this.releaseLock();

    this.logger.info('[OutboxWorker] ✅ Worker stopped');
  }

  /**
   * Main polling loop - processes pending events
   */
  private startPolling(): void {
    const poll = async () => {
      if (!this.isRunning) return;

      try {
        // Try to acquire distributed lock
        const lockAcquired = await this.acquireLock();

        if (lockAcquired) {
          await this.processPendingEvents();
          await this.updateHeartbeat();
        }
      } catch (error) {
        this.logger.error('[OutboxWorker] Error in polling loop', { error });
      } finally {
        // Schedule next poll
        if (this.isRunning) {
          this.pollingTimer = setTimeout(poll, this.config.pollingIntervalMs);
        }
      }
    };

    // Start polling
    poll();
  }

  /**
   * Retry loop - processes failed events
   */
  private startRetryLoop(): void {
    const retry = async () => {
      if (!this.isRunning) return;

      try {
        await this.processRetryableEvents();
      } catch (error) {
        this.logger.error('[OutboxWorker] Error in retry loop', { error });
      } finally {
        if (this.isRunning) {
          this.retryTimer = setTimeout(retry, this.config.retryIntervalMs);
        }
      }
    };

    // Start retry loop
    setTimeout(retry, this.config.retryIntervalMs);
  }

  /**
   * Cleanup loop - removes old published events
   */
  private startCleanupLoop(): void {
    const cleanup = async () => {
      if (!this.isRunning) return;

      try {
        const deleted = await this.outboxRepository.cleanupPublishedEvents(this.config.retentionDays);
        if (deleted > 0) {
          this.logger.info('[OutboxWorker] Cleaned up old events', { deleted });
        }
      } catch (error) {
        this.logger.error('[OutboxWorker] Error in cleanup loop', { error });
      } finally {
        if (this.isRunning) {
          this.cleanupTimer = setTimeout(cleanup, this.config.cleanupIntervalMs);
        }
      }
    };

    // Start cleanup loop
    setTimeout(cleanup, this.config.cleanupIntervalMs);
  }

  /**
   * Process pending events batch
   */
  private async processPendingEvents(): Promise<void> {
    try {
      const events = await this.outboxRepository.getPendingEvents(this.config.batchSize);

      if (events.length === 0) {
        return; // No events to process
      }

      this.logger.debug('[OutboxWorker] Processing batch', { count: events.length });

      // Publish events to RabbitMQ
      const results = await Promise.allSettled(
        events.map(event => this.publishEvent(event))
      );

      // Handle results
      const published: string[] = [];
      const failed: Array<{ eventId: string; error: string }> = [];

      results.forEach((result, index) => {
        const event = events[index];
        if (result.status === 'fulfilled') {
          published.push(event.eventId);
        } else {
          failed.push({
            eventId: event.eventId,
            error: result.reason?.message || 'Unknown error',
          });
        }
      });

      // Update statuses
      if (published.length > 0) {
        await this.outboxRepository.markAsPublished(published);
      }

      for (const fail of failed) {
        await this.outboxRepository.markAsFailed(fail.eventId, fail.error);
      }

      this.logger.info('[OutboxWorker] Batch processed', {
        total: events.length,
        published: published.length,
        failed: failed.length,
      });
    } catch (error) {
      this.logger.error('[OutboxWorker] Error processing batch', { error });
    }
  }

  /**
   * Process retryable events
   */
  private async processRetryableEvents(): Promise<void> {
    try {
      const events = await this.outboxRepository.getRetryableEvents(this.config.batchSize);

      if (events.length === 0) return;

      this.logger.debug('[OutboxWorker] Retrying failed events', { count: events.length });

      for (const event of events) {
        try {
          await this.publishEvent(event);
          await this.outboxRepository.markAsPublished([event.eventId]);
        } catch (error: any) {
          await this.outboxRepository.markAsFailed(event.eventId, error.message);
        }
      }
    } catch (error) {
      this.logger.error('[OutboxWorker] Error processing retryable events', { error });
    }
  }

  /**
   * Publish single event to RabbitMQ
   */
  private async publishEvent(event: OutboxEvent): Promise<void> {
    try {
      await this.publishToRabbitMQ(event);

      this.logger.debug('[OutboxWorker] Published event', {
        eventId: event.eventId,
        eventType: event.eventType,
      });
    } catch (error) {
      this.logger.error('[OutboxWorker] Failed to publish event', {
        eventId: event.eventId,
        error,
      });
      throw error;
    }
  }

  /**
   * Acquire distributed lock (prevent multiple workers)
   */
  private async acquireLock(): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .schema(this.SCHEMA)
        .rpc('acquire_outbox_lock', {
          p_worker_id: this.workerId,
          p_lock_timeout_seconds: 30,
        });

      if (error) {
        this.logger.error('[OutboxWorker] Failed to acquire lock', { error });
        return false;
      }

      return data === true;
    } catch (error) {
      this.logger.error('[OutboxWorker] Error acquiring lock', { error });
      return false;
    }
  }

  /**
   * Release distributed lock
   */
  private async releaseLock(): Promise<void> {
    try {
      await this.supabase
        .schema(this.SCHEMA)
        .rpc('release_outbox_lock', {
          p_worker_id: this.workerId,
        });
    } catch (error) {
      this.logger.error('[OutboxWorker] Error releasing lock', { error });
    }
  }

  /**
   * Update heartbeat to keep lock alive
   */
  private async updateHeartbeat(): Promise<void> {
    try {
      await this.supabase
        .schema(this.SCHEMA)
        .rpc('update_outbox_heartbeat', {
          p_worker_id: this.workerId,
        });
    } catch (error) {
      this.logger.error('[OutboxWorker] Error updating heartbeat', { error });
    }
  }

  /**
   * Get worker status
   */
  getStatus(): { isRunning: boolean; workerId: string; config: OutboxWorkerConfig } {
    return {
      isRunning: this.isRunning,
      workerId: this.workerId,
      config: this.config,
    };
  }
}
