"use strict";
/**
 * DomainEvent - Base class for all domain events
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomainEvent = void 0;
class DomainEvent {
    constructor(eventType, data, timestamp = new Date(), eventId = DomainEvent.generateEventId(), version = '1.0') {
        this.eventType = eventType;
        this.data = data;
        this.timestamp = timestamp;
        this.eventId = eventId;
        this.version = version;
    }
    /**
     * Generate unique event ID
     */
    static generateEventId() {
        const timestamp = Date.now().toString(36);
        const randomPart = Math.random().toString(36).substring(2, 15);
        return `evt_${timestamp}_${randomPart}`;
    }
    /**
     * Get event type
     */
    getEventType() {
        return this.eventType;
    }
    /**
     * Get event data
     */
    getData() {
        return this.data;
    }
    /**
     * Get event timestamp
     */
    getTimestamp() {
        return new Date(this.timestamp);
    }
    /**
     * Get event ID
     */
    getEventId() {
        return this.eventId;
    }
    /**
     * Get event version
     */
    getVersion() {
        return this.version;
    }
    /**
     * Get event age in milliseconds
     */
    getAge() {
        return Date.now() - this.timestamp.getTime();
    }
    /**
     * Check if event is recent (within last 5 minutes)
     */
    isRecent() {
        return this.getAge() < 5 * 60 * 1000; // 5 minutes
    }
    /**
     * Check if event is stale (older than 1 hour)
     */
    isStale() {
        return this.getAge() > 60 * 60 * 1000; // 1 hour
    }
    /**
     * Serialize to JSON
     */
    toJSON() {
        return {
            eventType: this.eventType,
            eventId: this.eventId,
            timestamp: this.timestamp.toISOString(),
            version: this.version,
            data: this.data
        };
    }
    /**
     * String representation
     */
    toString() {
        return `${this.eventType}(${this.eventId})`;
    }
    /**
     * Equality comparison
     */
    equals(other) {
        if (!other)
            return false;
        return this.eventId === other.eventId;
    }
}
exports.DomainEvent = DomainEvent;
//# sourceMappingURL=DomainEvent.js.map