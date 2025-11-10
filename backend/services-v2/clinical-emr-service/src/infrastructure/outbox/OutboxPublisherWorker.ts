import { ILogger } from "../../shared/logger";
import { DomainEvent } from "../../shared/domain-event";
import { IOutboxRepository, OutboxEvent } from "./SupabaseOutboxRepository";

export interface OutboxWorkerConfig {
  enabled: boolean;
  pollingIntervalMs: number;
  batchSize: number;
}

export class OutboxPublisherWorker {
  private isRunning = false;
  private pollingTimer?: NodeJS.Timeout;

  constructor(
    private readonly repository: IOutboxRepository,
    private readonly logger: ILogger,
    private readonly publishEvent: (event: DomainEvent) => Promise<void>,
    private readonly config: OutboxWorkerConfig,
  ) {}

  async start(): Promise<void> {
    if (!this.config.enabled) {
      this.logger.info("[OutboxWorker] Worker disabled via config");
      return;
    }

    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.logger.info("[OutboxWorker] Starting worker", {
      pollingIntervalMs: this.config.pollingIntervalMs,
      batchSize: this.config.batchSize,
    });

    this.scheduleNextPoll(0);
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    if (this.pollingTimer) {
      clearTimeout(this.pollingTimer);
      this.pollingTimer = undefined;
    }
  }

  private scheduleNextPoll(delay: number): void {
    if (!this.isRunning) return;
    this.pollingTimer = setTimeout(() => this.runCycle(), delay);
  }

  private async runCycle(): Promise<void> {
    if (!this.isRunning) return;

    try {
      await this.processBatch();
    } catch (error) {
      this.logger.error("[OutboxWorker] Batch processing failed", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      this.scheduleNextPoll(this.config.pollingIntervalMs);
    }
  }

  private async processBatch(): Promise<void> {
    const events = await this.repository.getPendingEvents(
      this.config.batchSize,
    );

    if (!events.length) {
      return;
    }

    const published: string[] = [];

    for (const event of events) {
      try {
        await this.publishOutboxEvent(event);
        published.push(event.id);
      } catch (error) {
        this.logger.error("[OutboxWorker] Failed to publish event", {
          eventId: event.id,
          error: error instanceof Error ? error.message : "Unknown error",
        });

        await this.repository.markAsFailed(
          event.id,
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    }

    if (published.length) {
      await this.repository.markAsPublished(published);
    }
  }

  private async publishOutboxEvent(outboxEvent: OutboxEvent): Promise<void> {
    const payload = outboxEvent.payload ?? {};

    const domainEvent: DomainEvent = {
      eventId: payload.eventId ?? outboxEvent.event_id,
      eventType: payload.eventType ?? outboxEvent.event_type,
      aggregateId: payload.aggregateId ?? outboxEvent.aggregate_id,
      aggregateType: payload.aggregateType ?? outboxEvent.aggregate_type,
      eventVersion: payload.eventVersion ?? 1,
      occurredAt: new Date(outboxEvent.created_at),
      correlationId: payload.correlationId,
      causationId: payload.causationId,
      userId: payload.userId,
      metadata: payload.metadata ?? outboxEvent.metadata ?? {},
      getEventData: () => payload.eventData ?? payload.payload ?? payload,
      containsPHI: () => true,
      getPatientId: () => payload.metadata?.patientId ?? null,
      getStreamName: () =>
        `${outboxEvent.aggregate_type}-${outboxEvent.aggregate_id}`,
      getRoutingKey: () =>
        `${outboxEvent.aggregate_type.toLowerCase()}.${outboxEvent.event_type.toLowerCase()}`,
      shouldPublishExternally: () => true,
      getPriority: () => "normal",
      isRetryable: () => true,
      toJSON: () => payload,
    } as DomainEvent;

    await this.publishEvent(domainEvent);
  }
}
