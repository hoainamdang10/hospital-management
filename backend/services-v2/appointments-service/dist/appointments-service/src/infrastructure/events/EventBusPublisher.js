"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventBusPublisher = void 0;
class EventBusPublisher {
    constructor(eventBus) {
        this.eventBus = eventBus;
    }
    async publish(event) {
        await this.eventBus.publish({
            eventType: event.eventType,
            aggregateId: event.aggregateId,
            aggregateType: event.aggregateType,
            eventData: event.eventData,
            metadata: event.metadata,
        });
    }
    async publishBatch(events) {
        for (const e of events) {
            await this.publish(e);
        }
    }
    isConnected() {
        return true; // EventBus manages its own connection lifecycle
    }
    async connect() {
        // No-op; DI initializes and connects EventBus via EventSubscriptions
    }
    async disconnect() {
        // No-op
    }
}
exports.EventBusPublisher = EventBusPublisher;
//# sourceMappingURL=EventBusPublisher.js.map