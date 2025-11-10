"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutboxPublisherWorker = void 0;
class OutboxPublisherWorker {
    constructor(repository, logger, publishEvent, config) {
        this.repository = repository;
        this.logger = logger;
        this.publishEvent = publishEvent;
        this.config = config;
        this.isRunning = false;
    }
    async start() {
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
    async stop() {
        this.isRunning = false;
        if (this.pollingTimer) {
            clearTimeout(this.pollingTimer);
            this.pollingTimer = undefined;
        }
    }
    scheduleNextPoll(delay) {
        if (!this.isRunning)
            return;
        this.pollingTimer = setTimeout(() => this.runCycle(), delay);
    }
    async runCycle() {
        if (!this.isRunning)
            return;
        try {
            await this.processBatch();
        }
        catch (error) {
            this.logger.error("[OutboxWorker] Batch processing failed", {
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
        finally {
            this.scheduleNextPoll(this.config.pollingIntervalMs);
        }
    }
    async processBatch() {
        const events = await this.repository.getPendingEvents(this.config.batchSize);
        if (!events.length) {
            return;
        }
        const published = [];
        for (const event of events) {
            try {
                await this.publishOutboxEvent(event);
                published.push(event.id);
            }
            catch (error) {
                this.logger.error("[OutboxWorker] Failed to publish event", {
                    eventId: event.id,
                    error: error instanceof Error ? error.message : "Unknown error",
                });
                await this.repository.markAsFailed(event.id, error instanceof Error ? error.message : "Unknown error");
            }
        }
        if (published.length) {
            await this.repository.markAsPublished(published);
        }
    }
    async publishOutboxEvent(outboxEvent) {
        const payload = outboxEvent.payload ?? {};
        const domainEvent = {
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
            getStreamName: () => `${outboxEvent.aggregate_type}-${outboxEvent.aggregate_id}`,
            getRoutingKey: () => `${outboxEvent.aggregate_type.toLowerCase()}.${outboxEvent.event_type.toLowerCase()}`,
            shouldPublishExternally: () => true,
            getPriority: () => "normal",
            isRetryable: () => true,
            toJSON: () => payload,
        };
        await this.publishEvent(domainEvent);
    }
}
exports.OutboxPublisherWorker = OutboxPublisherWorker;
