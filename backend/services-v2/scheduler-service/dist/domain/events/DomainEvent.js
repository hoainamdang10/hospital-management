"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseDomainEvent = void 0;
class BaseDomainEvent {
    constructor(aggregateId, aggregateType, eventType, eventData) {
        this.eventData = eventData;
        this.eventId = crypto.randomUUID();
        this.aggregateId = aggregateId;
        this.aggregateType = aggregateType;
        this.eventType = eventType;
        this.occurredAt = new Date();
    }
}
exports.BaseDomainEvent = BaseDomainEvent;
//# sourceMappingURL=DomainEvent.js.map