import { IOutboxRepository } from '../../domain/repositories/IOutboxRepository';
import { RabbitMQPublisher, MessageHeaders } from '../messaging/RabbitMQPublisher';

export interface OutboxPublisherConfig {
  interval: number;
  batchSize: number;
  maxRetries: number;
}

export class OutboxPublisher {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(
    private readonly outboxRepo: IOutboxRepository,
    private readonly rabbitmq: RabbitMQPublisher,
    private readonly config: OutboxPublisherConfig
  ) {}

  async start(): Promise<void> {
    if (this.isRunning) {
      console.warn('⚠️ Outbox Publisher already running');
      return;
    }

    console.log('🚀 Starting Outbox Publisher', {
      interval: `${this.config.interval}ms`,
      batchSize: this.config.batchSize,
      maxRetries: this.config.maxRetries
    });

    this.isRunning = true;

    await this.publish();

    this.intervalId = setInterval(async () => {
      await this.publish();
    }, this.config.interval);
  }

  async stop(): Promise<void> {
    console.log('🛑 Stopping Outbox Publisher...');

    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    console.log('✅ Outbox Publisher stopped');
  }

  private async publish(): Promise<void> {
    const startTime = Date.now();

    try {
      const entries = await this.outboxRepo.findUnpublished(this.config.batchSize);

      if (entries.length === 0) {
        return;
      }

      console.log(`📤 Publishing ${entries.length} outbox entries...`);

      let successCount = 0;
      let failureCount = 0;

      for (const entry of entries) {
        try {
          if (!entry.shouldRetry(this.config.maxRetries)) {
            console.warn(`⚠️ Entry ${entry.getOutboxId()} exceeded max retries, skipping`);
            failureCount++;
            continue;
          }

          const headers = entry.getHeadersJson() as MessageHeaders;
          const payload = entry.getPayloadJson();
          const topic = entry.getEventType();

          await this.rabbitmq.publish(topic, payload, headers);

          entry.markAsPublished();
          await this.outboxRepo.update(entry);

          successCount++;

          console.log(`✅ Published entry ${entry.getOutboxId()}`);
        } catch (error) {
          console.error(`❌ Failed to publish entry ${entry.getOutboxId()}:`, error);

          entry.recordPublishAttempt(error instanceof Error ? error.message : 'Unknown error');
          await this.outboxRepo.update(entry);

          failureCount++;
        }
      }

      const duration = Date.now() - startTime;

      console.log(`✅ Publish cycle completed`, {
        duration: `${duration}ms`,
        total: entries.length,
        success: successCount,
        failure: failureCount
      });
    } catch (error) {
      console.error('❌ Publish cycle failed:', error);
    }
  }

  getStatus(): { isRunning: boolean; config: OutboxPublisherConfig } {
    return {
      isRunning: this.isRunning,
      config: this.config
    };
  }
}

