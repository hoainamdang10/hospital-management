"use strict";
/**
 * MockEventPublisher - Test Mock
 * Mock implementation of IDomainEventPublisher for testing
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Testing Best Practices
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockEventPublisher = void 0;
const IntegrationEvent_1 = require("../../../shared/domain/events/IntegrationEvent");
class MockEventPublisher {
    constructor() {
        this.events = [];
        this.integrationEvents = [];
        this.publishHistory = [];
        this.subscribers = new Map();
        /**
         * Simulate publish failure
         */
        this.shouldSimulateFailure = false;
        this.failureError = null;
        // Initialize empty
    }
    /**
     * Publish domain event
     */
    async publish(event) {
        try {
            // Store the event
            if (event instanceof IntegrationEvent_1.IntegrationEvent) {
                this.integrationEvents.push(event);
            }
            else {
                this.events.push(event);
            }
            // Log the publish attempt
            this.publishHistory.push({
                event,
                timestamp: new Date(),
                success: true
            });
            // Notify subscribers
            const eventType = this.getEventType(event);
            const eventSubscribers = this.subscribers.get(eventType) || [];
            for (const subscriber of eventSubscribers) {
                try {
                    await subscriber(event);
                }
                catch (error) {
                    console.warn(`Subscriber failed for event ${eventType}:`, error);
                }
            }
            // Simulate async operation
            await this.simulateAsyncOperation(10);
        }
        catch (error) {
            this.publishHistory.push({
                event,
                timestamp: new Date(),
                success: false,
                error: error
            });
            throw error;
        }
    }
    /**
     * Publish multiple events
     */
    async publishAll(events) {
        for (const event of events) {
            await this.publish(event);
        }
    }
    /**
     * Subscribe to events
     */
    subscribe(eventType, handler) {
        if (!this.subscribers.has(eventType)) {
            this.subscribers.set(eventType, []);
        }
        this.subscribers.get(eventType).push(handler);
    }
    /**
     * Unsubscribe from events
     */
    unsubscribe(eventType, handler) {
        const handlers = this.subscribers.get(eventType);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }
    // Test utility methods
    /**
     * Get all published events
     */
    get publishedEvents() {
        return [...this.events];
    }
    /**
     * Get all published integration events
     */
    get publishedIntegrationEvents() {
        return [...this.integrationEvents];
    }
    /**
     * Get all events (domain + integration)
     */
    get allPublishedEvents() {
        return [...this.events, ...this.integrationEvents];
    }
    /**
     * Get publish history
     */
    get publishHistory() {
        return [...this.publishHistory];
    }
    /**
     * Clear all events and history
     */
    clear() {
        this.events = [];
        this.integrationEvents = [];
        this.publishHistory = [];
    }
    /**
     * Get events by type
     */
    getEventsByType(eventType) {
        return this.events.filter(event => this.getEventType(event) === eventType);
    }
    /**
     * Get integration events by type
     */
    getIntegrationEventsByType(eventType) {
        return this.integrationEvents.filter(event => event.eventType === eventType);
    }
    /**
     * Get events by aggregate ID
     */
    getEventsByAggregateId(aggregateId) {
        return this.events.filter(event => event.aggregateId === aggregateId);
    }
    /**
     * Get events count
     */
    getEventsCount() {
        return this.events.length;
    }
    /**
     * Get integration events count
     */
    getIntegrationEventsCount() {
        return this.integrationEvents.length;
    }
    /**
     * Get total events count
     */
    getTotalEventsCount() {
        return this.events.length + this.integrationEvents.length;
    }
    /**
     * Check if event was published
     */
    wasEventPublished(eventType) {
        return this.events.some(event => this.getEventType(event) === eventType) ||
            this.integrationEvents.some(event => event.eventType === eventType);
    }
    /**
     * Check if integration event was published
     */
    wasIntegrationEventPublished(eventType) {
        return this.integrationEvents.some(event => event.eventType === eventType);
    }
    /**
     * Get last published event
     */
    getLastPublishedEvent() {
        if (this.publishHistory.length === 0)
            return null;
        return this.publishHistory[this.publishHistory.length - 1].event;
    }
    /**
     * Get last published event of type
     */
    getLastPublishedEventOfType(eventType) {
        for (let i = this.publishHistory.length - 1; i >= 0; i--) {
            const historyItem = this.publishHistory[i];
            if (this.getEventType(historyItem.event) === eventType) {
                return historyItem.event;
            }
        }
        return null;
    }
    /**
     * Get events published in time range
     */
    getEventsInTimeRange(startTime, endTime) {
        return this.publishHistory
            .filter(item => item.timestamp >= startTime && item.timestamp <= endTime)
            .map(item => item.event);
    }
    /**
     * Get failed publishes
     */
    getFailedPublishes() {
        return this.publishHistory
            .filter(item => !item.success)
            .map(item => ({
            event: item.event,
            timestamp: item.timestamp,
            error: item.error
        }));
    }
    /**
     * Get successful publishes
     */
    getSuccessfulPublishes() {
        return this.publishHistory
            .filter(item => item.success)
            .map(item => ({
            event: item.event,
            timestamp: item.timestamp
        }));
    }
    /**
     * Get publish success rate
     */
    getPublishSuccessRate() {
        if (this.publishHistory.length === 0)
            return 100;
        const successCount = this.publishHistory.filter(item => item.success).length;
        return (successCount / this.publishHistory.length) * 100;
    }
    simulatePublishFailure(error) {
        this.shouldSimulateFailure = true;
        this.failureError = error;
    }
    clearFailureSimulation() {
        this.shouldSimulateFailure = false;
        this.failureError = null;
    }
    /**
     * Get event statistics
     */
    getEventStatistics() {
        const eventsByType = {};
        // Count domain events by type
        for (const event of this.events) {
            const eventType = this.getEventType(event);
            eventsByType[eventType] = (eventsByType[eventType] || 0) + 1;
        }
        // Count integration events by type
        for (const event of this.integrationEvents) {
            eventsByType[event.eventType] = (eventsByType[event.eventType] || 0) + 1;
        }
        const recentEvents = this.publishHistory
            .slice(-10)
            .map(item => ({
            eventType: this.getEventType(item.event),
            timestamp: item.timestamp,
            success: item.success
        }));
        return {
            totalEvents: this.getTotalEventsCount(),
            domainEvents: this.events.length,
            integrationEvents: this.integrationEvents.length,
            eventsByType,
            publishSuccessRate: this.getPublishSuccessRate(),
            averagePublishTime: 10, // Simulated average
            recentEvents
        };
    }
    /**
     * Wait for events to be published
     */
    async waitForEvents(count, timeoutMs = 5000) {
        const startTime = Date.now();
        while (this.getTotalEventsCount() < count) {
            if (Date.now() - startTime > timeoutMs) {
                throw new Error(`Timeout waiting for ${count} events. Only ${this.getTotalEventsCount()} events published.`);
            }
            await this.simulateAsyncOperation(10);
        }
    }
    /**
     * Wait for specific event type
     */
    async waitForEventType(eventType, timeoutMs = 5000) {
        const startTime = Date.now();
        while (!this.wasEventPublished(eventType)) {
            if (Date.now() - startTime > timeoutMs) {
                throw new Error(`Timeout waiting for event type: ${eventType}`);
            }
            await this.simulateAsyncOperation(10);
        }
        return this.getLastPublishedEventOfType(eventType);
    }
    /**
     * Get event type from event object
     */
    getEventType(event) {
        if (event instanceof IntegrationEvent_1.IntegrationEvent) {
            return event.eventType;
        }
        return event.constructor.name;
    }
    /**
     * Simulate async operation
     */
    async simulateAsyncOperation(delayMs) {
        return new Promise(resolve => {
            setTimeout(resolve, delayMs);
        });
    }
    /**
     * Create event matcher for testing
     */
    createEventMatcher(eventType, properties) {
        return (event) => {
            if (this.getEventType(event) !== eventType) {
                return false;
            }
            if (properties) {
                for (const [key, value] of Object.entries(properties)) {
                    if (event[key] !== value) {
                        return false;
                    }
                }
            }
            return true;
        };
    }
    /**
     * Find events matching criteria
     */
    findEvents(matcher) {
        return this.allPublishedEvents.filter(matcher);
    }
    /**
     * Assert event was published (for testing)
     */
    assertEventPublished(eventType, properties) {
        const matcher = this.createEventMatcher(eventType, properties);
        const matchingEvents = this.findEvents(matcher);
        if (matchingEvents.length === 0) {
            throw new Error(`Expected event ${eventType} to be published${properties ? ` with properties ${JSON.stringify(properties)}` : ''}`);
        }
    }
    /**
     * Assert event was not published (for testing)
     */
    assertEventNotPublished(eventType, properties) {
        const matcher = this.createEventMatcher(eventType, properties);
        const matchingEvents = this.findEvents(matcher);
        if (matchingEvents.length > 0) {
            throw new Error(`Expected event ${eventType} not to be published${properties ? ` with properties ${JSON.stringify(properties)}` : ''}`);
        }
    }
    /**
     * Assert event count (for testing)
     */
    assertEventCount(eventType, expectedCount) {
        const actualCount = this.getEventsByType(eventType).length + this.getIntegrationEventsByType(eventType).length;
        if (actualCount !== expectedCount) {
            throw new Error(`Expected ${expectedCount} events of type ${eventType}, but found ${actualCount}`);
        }
    }
}
exports.MockEventPublisher = MockEventPublisher;
//# sourceMappingURL=MockEventPublisher.js.map