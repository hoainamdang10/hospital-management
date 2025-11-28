import { IEventBus } from "@shared/events/event-bus.interface";
import { DomainEvent } from "@shared/domain/base/domain-event";
import { ILogger } from "../../application/interfaces/ILogger";
import { OutboxEvent, OutboxService } from "./OutboxService";

export interface OutboxPublisherConfig {
  pollingIntervalMs?: number;
  batchSize?: number;
  enabled?: boolean;
}

export class OutboxPublisher {
  private readonly pollingIntervalMs: number;
  private readonly batchSize: number;
  private readonly enabled: boolean;
  private pollingTimer: NodeJS.Timeout | null = null;
  private isPublishing = false;

  constructor(
    private readonly outboxService: OutboxService,
    private readonly eventBus: IEventBus,
    private readonly logger: ILogger,
    config: OutboxPublisherConfig = {},
  ) {
    this.pollingIntervalMs = config.pollingIntervalMs ?? 5000;
    this.batchSize = config.batchSize ?? 100;
    this.enabled = config.enabled !== false;
  }

  async start(): Promise<void> {
    if (!this.enabled) {
      this.logger.info("OutboxPublisher is disabled");
      return;
    }

    if (this.pollingTimer) {
      return;
    }

    this.logger.info("Starting OutboxPublisher", {
      pollingIntervalMs: this.pollingIntervalMs,
      batchSize: this.batchSize,
    });

    await this.outboxService.requeueStuckPublishing();

    this.pollingTimer = setInterval(
      () =>
        this.publishPendingEvents().catch((err) =>
          this.logger.error("Outbox publish error", {
            error: err instanceof Error ? err.message : String(err),
          }),
        ),
      this.pollingIntervalMs,
    );

    await this.publishPendingEvents();
  }

  async stop(): Promise<void> {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
    this.logger.info("OutboxPublisher stopped");
  }

  private async publishPendingEvents(): Promise<void> {
    if (this.isPublishing) {
      return;
    }

    this.isPublishing = true;
    try {
      const events = await this.outboxService.getPendingEvents(this.batchSize);
      if (!events.length) {
        return;
      }

      this.logger.debug("Publishing pending outbox events", {
        count: events.length,
      });

      for (const evt of events) {
        await this.publishSingle(evt);
      }
    } catch (error) {
      this.logger.error("Error while processing outbox events", {
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      this.isPublishing = false;
    }
  }

  private async publishSingle(outboxEvent: OutboxEvent): Promise<void> {
    try {
      await this.outboxService.markAsPublishing(outboxEvent.outboxId);

      const domainEvent = this.rehydrateEvent(outboxEvent);
      await this.eventBus.publish(domainEvent);

      await this.outboxService.markAsPublished(outboxEvent.outboxId);

      this.logger.info("Outbox event published", {
        outboxId: outboxEvent.outboxId,
        eventType: outboxEvent.eventType,
        aggregateId: outboxEvent.aggregateId,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.outboxService.markAsFailed(outboxEvent.outboxId, message);
      this.logger.warn("Failed to publish outbox event, will retry", {
        outboxId: outboxEvent.outboxId,
        eventType: outboxEvent.eventType,
        error: message,
      });
    }
  }

  private rehydrateEvent(outboxEvent: OutboxEvent): DomainEvent {
    const payload = (outboxEvent.payload as any) || {};

    // Extract raw timestamp/occurredAt values
    const rawOccurredAt =
      payload.occurredAt ||
      payload.timestamp ||
      outboxEvent.occurredAt ||
      new Date();

    const rawTimestamp =
      payload.timestamp ||
      payload.occurredAt ||
      outboxEvent.occurredAt ||
      new Date();

    // Ensure both occurredAt and timestamp are Date objects
    const occurredAt =
      rawOccurredAt instanceof Date ? rawOccurredAt : new Date(rawOccurredAt);

    const timestamp =
      rawTimestamp instanceof Date ? rawTimestamp : new Date(rawTimestamp);

    const eventData =
      payload.eventData ||
      payload.data ||
      payload.updatedData ||
      payload.payload ||
      payload;

    return {
      ...payload,
      eventId: outboxEvent.eventId,
      eventType: outboxEvent.eventType,
      aggregateId: outboxEvent.aggregateId,
      aggregateType:
        outboxEvent.aggregateType || payload.aggregateType || "ProviderStaff",
      occurredAt,
      timestamp,
      metadata: payload.metadata || {},
      getEventData: () => eventData,
      containsPHI: () => true,
      getPatientId: () => null,
    } as unknown as DomainEvent;
  }
}
