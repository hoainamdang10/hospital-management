import { OutboxRepository, OutboxEventRecord } from './OutboxRepository';
import { RemoteSchedulerAdapter } from '../adapters/RemoteSchedulerAdapter';

export interface OutboxWorkerOptions {
  intervalMs?: number; // polling interval
  batchSize?: number;
  maxAttempts?: number; // stop retrying after this many attempts
  baseDelayMs?: number; // for exponential backoff
  maxDelayMs?: number;
}

export class OutboxPublisherWorker {
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(
    private outboxRepo: OutboxRepository,
    private scheduler: RemoteSchedulerAdapter,
    private options: OutboxWorkerOptions = {}
  ) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    const interval = this.options.intervalMs ?? 5000;
    this.timer = setInterval(() => this.runOnce().catch(err => console.error('[OutboxWorker] runOnce error', err)), interval);
    console.log(`[OutboxWorker] started with interval=${interval}ms`);
  }

  stop(): void {
    this.running = false;
    if (this.timer) clearInterval(this.timer);
    console.log('[OutboxWorker] stopped');
  }

  private computeNextRetry(attempts: number): number {
    const base = this.options.baseDelayMs ?? 5000;
    const max = this.options.maxDelayMs ?? 10 * 60 * 1000;
    const delay = Math.min(max, base * Math.pow(2, attempts - 1));
    return delay;
  }

  private async processOne(evt: OutboxEventRecord): Promise<void> {
    // Payload schema is designed to directly call Scheduler createOrUpdateByDedup/cancel
    const payload = evt.payload_json || {};
    const eventType = evt.event_type;

    try {
      if (eventType === 'SchedulerReminderCreate') {
        const req = { ...payload };
        if (typeof req.startAtUtc === 'string') {
          req.startAtUtc = new Date(req.startAtUtc);
        }
        await this.scheduler.createOrUpdateByDedup(req);
      } else if (eventType === 'SchedulerReminderCancelByOwner') {
        await this.scheduler.cancelByOwner(payload);
      } else {
        // Unknown event: mark sent to avoid poison
        console.warn(`[OutboxWorker] Unknown event_type=${eventType}, marking SENT`);
      }
      await this.outboxRepo.markSent(evt.id);
    } catch (e: any) {
      const attempts = (evt.attempts ?? 0) + 1;
      const next = new Date(Date.now() + this.computeNextRetry(attempts));
      await this.outboxRepo.markFailed(evt.id, String(e?.message || e), next, attempts);
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
        console.error('[OutboxWorker] processOne error:', err);
      }
    }
  }
}

