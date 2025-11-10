"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomainEvent = void 0;
const uuid_1 = require("uuid");
class DomainEvent {
    constructor(eventType, aggregateId, aggregateType, version = 1, userId, metadata = {}) {
        this.eventId = (0, uuid_1.v4)();
        this.eventType = eventType;
        this.aggregateId = aggregateId;
        this.aggregateType = aggregateType;
        this.eventVersion = version;
        this.occurredAt = new Date();
        this.userId = userId;
        this.metadata = metadata;
    }
    getRoutingKey() {
        return this.eventType;
    }
    toJSON() {
        return {
            eventId: this.eventId,
            eventType: this.eventType,
            aggregateId: this.aggregateId,
            aggregateType: this.aggregateType,
            eventVersion: this.eventVersion,
            occurredAt: this.occurredAt.toISOString(),
            eventData: this.getEventData(),
            userId: this.userId,
            metadata: this.metadata,
        };
    }
}
exports.DomainEvent = DomainEvent;
