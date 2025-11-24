"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutboxPublisherWorker = void 0;
const amqplib = __importStar(require("amqplib"));
class OutboxPublisherWorker {
    constructor(outboxRepo, scheduler, options = {}) {
        this.outboxRepo = outboxRepo;
        this.scheduler = scheduler;
        this.options = options;
        this.running = false;
    }
    start() {
        if (this.running)
            return;
        this.running = true;
        const interval = this.options.intervalMs ?? 5000;
        this.timer = setInterval(() => this.runOnce().catch((err) => console.error("[OutboxWorker] runOnce error", err)), interval);
        console.log(`[OutboxWorker] started with interval=${interval}ms`);
    }
    stop() {
        this.running = false;
        if (this.timer)
            clearInterval(this.timer);
        console.log("[OutboxWorker] stopped");
    }
    computeNextRetry(attempts) {
        const base = this.options.baseDelayMs ?? 5000;
        const max = this.options.maxDelayMs ?? 10 * 60 * 1000;
        const delay = Math.min(max, base * Math.pow(2, attempts - 1));
        return delay;
    }
    async ensureChannel() {
        if (this.amqpChannel)
            return this.amqpChannel;
        const url = this.options.rabbitmqUrl ||
            process.env.RABBITMQ_URL ||
            "amqp://admin:admin@rabbitmq-v2:5672";
        this.amqpConn = await amqplib.connect(url);
        this.amqpChannel = await this.amqpConn.createChannel();
        await this.amqpChannel.assertExchange(this.options.exchange || "hospital.events", "topic", { durable: true });
        return this.amqpChannel;
    }
    async processOne(evt) {
        // Payload schema is designed to directly call Scheduler createOrUpdateByDedup/cancel
        const payload = evt.payload_json || {};
        const eventType = evt.event_type;
        try {
            if (eventType === "SchedulerReminderCreate") {
                console.warn("[OutboxWorker] Skip SchedulerReminderCreate (scheduler disabled)", { id: evt.id });
            }
            else if (eventType === "SchedulerReminderCancelByOwner") {
                console.warn("[OutboxWorker] Skip SchedulerReminderCancelByOwner (scheduler disabled)", { id: evt.id });
            }
            else if (eventType.startsWith("appointment")) {
                // Generic relay to RabbitMQ for appointment.* events (billing/notifications)
                const channel = await this.ensureChannel();
                const routingKey = eventType;
                channel.publish(this.options.exchange || "hospital.events", routingKey, Buffer.from(JSON.stringify(payload)), { persistent: true });
            }
            else {
                // Unknown event: mark sent to avoid poison
                console.warn(`[OutboxWorker] Unknown event_type=${eventType}, marking SENT`);
            }
            await this.outboxRepo.markSent(evt.id);
        }
        catch (e) {
            const attempts = (evt.attempts ?? 0) + 1;
            const next = new Date(Date.now() + this.computeNextRetry(attempts));
            await this.outboxRepo.markFailed(evt.id, String(e?.message || e), next, attempts);
            throw e;
        }
    }
    async runOnce() {
        const batchSize = this.options.batchSize ?? 50;
        const events = await this.outboxRepo.claimBatch(batchSize);
        if (!events.length)
            return;
        for (const evt of events) {
            try {
                await this.processOne(evt);
            }
            catch (err) {
                // already marked failed with backoff; continue processing next
                console.error("[OutboxWorker] processOne error:", err);
            }
        }
    }
}
exports.OutboxPublisherWorker = OutboxPublisherWorker;
//# sourceMappingURL=OutboxPublisherWorker.js.map