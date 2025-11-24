"use strict";
/**
 * EventBusAdapter - Adapter Pattern
 * Adapts IEventBus to IDomainEventPublisher interface
 *
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Clean Architecture, Adapter Pattern
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventBusAdapter = void 0;
/**
 * Adapter that wraps IEventBus to implement IDomainEventPublisher
 * This allows us to use the existing EventBus infrastructure for domain event publishing
 */
class EventBusAdapter {
    constructor(eventBus) {
        this.eventBus = eventBus;
    }
    /**
     * Publish a single domain event
     */
    async publish(event) {
        await this.eventBus.publish(event);
    }
    /**
     * Publish multiple domain events in batch
     */
    async publishBatch(events) {
        // Publish events sequentially to maintain order
        for (const event of events) {
            await this.eventBus.publish(event);
        }
    }
    /**
     * Publish event with retry mechanism
     * Note: Retry logic is handled by the underlying EventBus/RabbitMQ
     */
    async publishWithRetry(event, maxRetries = 3) {
        let lastError = null;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                await this.eventBus.publish(event);
                return; // Success
            }
            catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                if (attempt < maxRetries) {
                    // Exponential backoff: 100ms, 200ms, 400ms, etc.
                    const delayMs = 100 * Math.pow(2, attempt - 1);
                    await new Promise(resolve => setTimeout(resolve, delayMs));
                }
            }
        }
        throw new Error(`Failed to publish event after ${maxRetries} attempts: ${lastError?.message}`);
    }
    /**
     * Schedule event for future publishing
     */
    async scheduleEvent(event, publishAt) {
        const delayMs = publishAt.getTime() - Date.now();
        if (delayMs <= 0) {
            // Publish immediately if time has passed
            await this.eventBus.publish(event);
            return;
        }
        // Schedule for future
        setTimeout(async () => {
            try {
                await this.eventBus.publish(event);
            }
            catch (error) {
                console.error('Failed to publish scheduled event:', {
                    eventType: event.eventType,
                    eventId: event.eventId,
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        }, delayMs);
    }
    /**
     * Check if publisher is healthy
     * Note: This is a simple check - EventBus doesn't expose health status
     */
    async isHealthy() {
        try {
            // If we can access the eventBus, assume it's healthy
            // In a real implementation, we might want to add a ping/health check to IEventBus
            return this.eventBus !== null && this.eventBus !== undefined;
        }
        catch {
            return false;
        }
    }
}
exports.EventBusAdapter = EventBusAdapter;
//# sourceMappingURL=EventBusAdapter.js.map