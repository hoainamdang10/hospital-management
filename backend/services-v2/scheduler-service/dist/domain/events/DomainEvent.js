"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseDomainEvent = void 0;
class BaseDomainEvent {
    constructor(aggregateId, aggregateType, eventType, eventData) {
        this.eventId = crypto.randomUUID();
        this.aggregateId = aggregateId;
        this.aggregateType = aggregateType;
        this.eventType = eventType;
        this.occurredAt = new Date();
        // Freeze eventData to ensure immutability
        this.eventData = Object.freeze({ ...eventData });
    }
}
exports.BaseDomainEvent = BaseDomainEvent;
//# sourceMappingURL=DomainEvent.js.map