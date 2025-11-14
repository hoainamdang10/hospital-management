"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsoleEventPublisher = void 0;
class ConsoleEventPublisher {
    async publish(event) {
        // eslint-disable-next-line no-console
        console.log('[ConsoleEventPublisher] publish', {
            eventType: event.eventType,
            aggregateId: event.aggregateId,
            metadata: event.metadata,
        });
    }
    async publishBatch(events) {
        for (const e of events) {
            await this.publish(e);
        }
    }
    isConnected() {
        return true;
    }
    async connect() {
        return;
    }
    async disconnect() {
        return;
    }
}
exports.ConsoleEventPublisher = ConsoleEventPublisher;
//# sourceMappingURL=ConsoleEventPublisher.js.map