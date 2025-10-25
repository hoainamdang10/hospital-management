"use strict";
/**
 * In-Memory Domain Event Publisher - Shared Infrastructure
 * Simple in-memory implementation for domain events
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryDomainEventPublisher = void 0;
class InMemoryDomainEventPublisher {
    constructor() {
        this.handlers = new Map();
    }
    async publish(event) {
        const eventType = event.eventType;
        const handlers = this.handlers.get(eventType) || [];
        for (const handler of handlers) {
            try {
                await handler(event);
            }
            catch (error) {
                console.error(`Error handling event ${eventType}:`, error);
            }
        }
    }
    async publishBatch(events) {
        for (const event of events) {
            await this.publish(event);
        }
    }
    async publishWithRetry(event, maxRetries = 3) {
        let lastError;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                await this.publish(event);
                return;
            }
            catch (error) {
                lastError = error instanceof Error ? error : new Error('Unknown error');
                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
                }
            }
        }
        throw lastError || new Error('Failed to publish event after retries');
    }
    async scheduleEvent(event, publishAt) {
        const delay = publishAt.getTime() - Date.now();
        if (delay > 0) {
            setTimeout(() => {
                this.publish(event).catch(error => {
                    console.error(`Error publishing scheduled event:`, error);
                });
            }, delay);
        }
        else {
            await this.publish(event);
        }
    }
    async isHealthy() {
        return true;
    }
    subscribe(eventType, handler) {
        if (!this.handlers.has(eventType)) {
            this.handlers.set(eventType, []);
        }
        this.handlers.get(eventType).push(handler);
    }
}
exports.InMemoryDomainEventPublisher = InMemoryDomainEventPublisher;
//# sourceMappingURL=InMemoryDomainEventPublisher.js.map