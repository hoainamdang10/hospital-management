"use strict";
/**
 * Domain Event Base Class
 * Event-Driven Architecture Implementation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomainEvent = void 0;
class DomainEvent {
    constructor(eventType) {
        this.occurredOn = new Date();
        this.eventId = this.generateEventId();
        this.eventType = eventType;
    }
    generateEventId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}
exports.DomainEvent = DomainEvent;
//# sourceMappingURL=DomainEvent.js.map