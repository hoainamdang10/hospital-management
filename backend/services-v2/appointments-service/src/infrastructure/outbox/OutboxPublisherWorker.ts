import { OutboxRepository, OutboxEventRecord } from "./OutboxRepository";
import { RemoteSchedulerAdapter } from "../adapters/RemoteSchedulerAdapter";
import * as amqplib from "amqplib";
import { Channel, Connection } from "amqplib";

export interface OutboxWorkerOptions {
  intervalMs?: number; // polling interval
  batchSize?: number;
  maxAttempts?: number; // stop retrying after this many attempts
  baseDelayMs?: number; // for exponential backoff
  maxDelayMs?: number;
  rabbitmqUrl?: string;
  exchange?: string;
}

export class OutboxPublisherWorker {
  private timer?: NodeJS.Timeout;
  private running = false;
  private amqpConn?: any;
  private amqpChannel?: any;

  constructor(
    private outboxRepo: OutboxRepository,
    // Optional scheduler; if absent, scheduler-specific events will be skipped
    private scheduler?: RemoteSchedulerAdapter,
    private options: OutboxWorkerOptions = {},
  ) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    const interval = this.options.intervalMs ?? 5000;
    this.timer = setInterval(
      () =>
        this.runOnce().catch((err) =>
          console.error("[OutboxWorker] runOnce error", err),
        ),
      interval,
    );
    console.log(`[OutboxWorker] started with interval=${interval}ms`);
  }

  stop(): void {
    this.running = false;
    if (this.timer) clearInterval(this.timer);
    console.log("[OutboxWorker] stopped");
  }

  private computeNextRetry(attempts: number): number {
    const base = this.options.baseDelayMs ?? 5000;
    const max = this.options.maxDelayMs ?? 10 * 60 * 1000;
    const delay = Math.min(max, base * Math.pow(2, attempts - 1));
    return delay;
  }

  private async ensureChannel(): Promise<Channel> {
    if (this.amqpChannel) return this.amqpChannel as Channel;
    const url =
      this.options.rabbitmqUrl ||
      process.env.RABBITMQ_URL ||
      "amqp://admin:admin@rabbitmq-v2:5672";
    this.amqpConn = await amqplib.connect(url);
    this.amqpChannel = await this.amqpConn.createChannel();
    await this.amqpChannel.assertExchange(
      this.options.exchange || "hospital.events",
      "topic",
      { durable: true },
    );
    return this.amqpChannel as Channel;
  }

  private async processOne(evt: OutboxEventRecord): Promise<void> {
    // Payload schema is designed to directly call Scheduler createOrUpdateByDedup/cancel
    const payload = evt.payload_json || {};
    const eventType = evt.event_type;

    try {
      if (eventType === "SchedulerReminderCreate") {
        console.warn(
          "[OutboxWorker] Skip SchedulerReminderCreate (scheduler disabled)",
          { id: evt.id },
        );
      } else if (eventType === "SchedulerReminderCancelByOwner") {
        console.warn(
          "[OutboxWorker] Skip SchedulerReminderCancelByOwner (scheduler disabled)",
          { id: evt.id },
        );
      } else if (eventType.startsWith("appointment")) {
        // Generic relay to RabbitMQ for appointment.* events (billing/notifications)
        const channel = await this.ensureChannel();
        const routingKey = eventType;
        channel.publish(
          this.options.exchange || "hospital.events",
          routingKey,
          Buffer.from(JSON.stringify(payload)),
          { persistent: true },
        );
        console.log("[OutboxWorker] published", {
          id: evt.id,
          routingKey,
        });
      } else {
        // Unknown event: mark sent to avoid poison
        console.warn(
          `[OutboxWorker] Unknown event_type=${eventType}, marking SENT`,
        );
      }
      await this.outboxRepo.markSent(evt.id);
    } catch (e: any) {
      const attempts = (evt.attempts ?? 0) + 1;
      const next = new Date(Date.now() + this.computeNextRetry(attempts));
      await this.outboxRepo.markFailed(
        evt.id,
        String(e?.message || e),
        next,
        attempts,
      );
      throw e;
    }
  }

  async runOnce(): Promise<void> {
    const batchSize = this.options.batchSize ?? 50;
    const events = await this.outboxRepo.claimBatch(batchSize);
    if (!events.length) return;

    for (const evt of events) {
      try {
        await this.processOne(evt);
      } catch (err) {
        // already marked failed with backoff; continue processing next
        console.error("[OutboxWorker] processOne error:", err);
      }
    }
  }
}
