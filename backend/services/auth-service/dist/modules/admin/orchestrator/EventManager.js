"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventManager = void 0;
const events_1 = require("events");
class EventManager extends events_1.EventEmitter {
    constructor(logger, rabbitmq) {
        super();
        this.subscriptions = new Map();
        this.eventHistory = [];
        this.maxHistorySize = 1000;
        this.logger = logger;
        this.rabbitmq = rabbitmq;
        this.setupRabbitMQEventHandling();
    }
    async setupRabbitMQEventHandling() {
        try {
            if (this.rabbitmq.isReady()) {
                await this.rabbitmq.assertExchange('orchestration.events', { type: 'topic' });
                await this.rabbitmq.assertQueue('orchestration.events.queue', { durable: true });
                await this.rabbitmq.bindQueue('orchestration.events.queue', 'orchestration.events', '#');
                await this.rabbitmq.consume('orchestration.events.queue', (message) => {
                    if (message) {
                        this.handleIncomingEvent(message.content);
                    }
                });
                this.logger.info('RabbitMQ event handling setup completed');
            }
        }
        catch (error) {
            this.logger.error('Failed to setup RabbitMQ event handling:', error);
        }
    }
    handleIncomingEvent(eventData) {
        try {
            const event = {
                id: eventData.id || `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: eventData.type,
                source: eventData.source || 'unknown',
                timestamp: new Date(eventData.timestamp || Date.now()),
                data: eventData.data,
                correlationId: eventData.correlationId,
                userId: eventData.userId
            };
            this.processEvent(event);
        }
        catch (error) {
            this.logger.error('Failed to handle incoming event:', error);
        }
    }
    async emitEvent(type, data, source = 'orchestrator', correlationId, userId) {
        const event = {
            id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type,
            source,
            timestamp: new Date(),
            data,
            correlationId,
            userId
        };
        this.addToHistory(event);
        this.processEvent(event);
        if (this.rabbitmq.isReady()) {
            try {
                await this.rabbitmq.publish('orchestration.events', type, event);
                this.logger.debug('Event published to RabbitMQ', { eventId: event.id, type });
            }
            catch (error) {
                this.logger.error('Failed to publish event to RabbitMQ:', error);
            }
        }
        this.emit(type, event);
    }
    async processEvent(event) {
        this.logger.debug('Processing event', { eventId: event.id, type: event.type });
        const matchingSubscriptions = Array.from(this.subscriptions.values())
            .filter(sub => sub.eventType === event.type &&
            (!sub.filter || sub.filter(event)));
        for (const subscription of matchingSubscriptions) {
            try {
                await this.executeHandler(subscription, event);
            }
            catch (error) {
                this.logger.error('Event handler failed', {
                    subscriptionId: subscription.id,
                    eventId: event.id,
                    error: error.message
                });
                if (subscription.retryCount < subscription.maxRetries) {
                    subscription.retryCount++;
                    this.logger.info('Retrying event handler', {
                        subscriptionId: subscription.id,
                        retryCount: subscription.retryCount
                    });
                    setTimeout(() => {
                        this.executeHandler(subscription, event).catch(retryError => {
                            this.logger.error('Event handler retry failed', {
                                subscriptionId: subscription.id,
                                error: retryError.message
                            });
                        });
                    }, 1000 * subscription.retryCount);
                }
            }
        }
    }
    async executeHandler(subscription, event) {
        await subscription.handler(event);
        subscription.retryCount = 0;
    }
    subscribe(eventType, handler, options = {}) {
        const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const subscription = {
            id: subscriptionId,
            eventType,
            handler,
            filter: options.filter,
            retryCount: 0,
            maxRetries: options.maxRetries || 3
        };
        this.subscriptions.set(subscriptionId, subscription);
        this.logger.debug('Event subscription created', { subscriptionId, eventType });
        return subscriptionId;
    }
    unsubscribe(subscriptionId) {
        const removed = this.subscriptions.delete(subscriptionId);
        if (removed) {
            this.logger.debug('Event subscription removed', { subscriptionId });
        }
        return removed;
    }
    addToHistory(event) {
        this.eventHistory.push(event);
        if (this.eventHistory.length > this.maxHistorySize) {
            this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
        }
    }
    getEventHistory(filter) {
        let filteredEvents = this.eventHistory;
        if (filter) {
            filteredEvents = filteredEvents.filter(event => {
                if (filter.type && event.type !== filter.type)
                    return false;
                if (filter.source && event.source !== filter.source)
                    return false;
                if (filter.correlationId && event.correlationId !== filter.correlationId)
                    return false;
                if (filter.userId && event.userId !== filter.userId)
                    return false;
                if (filter.since && event.timestamp < filter.since)
                    return false;
                return true;
            });
        }
        if (filter?.limit) {
            filteredEvents = filteredEvents.slice(-filter.limit);
        }
        return filteredEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
    getEventStatistics() {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const eventsByType = {};
        const eventsBySource = {};
        let recentEvents = 0;
        this.eventHistory.forEach(event => {
            eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
            eventsBySource[event.source] = (eventsBySource[event.source] || 0) + 1;
            if (event.timestamp > oneHourAgo) {
                recentEvents++;
            }
        });
        return {
            totalEvents: this.eventHistory.length,
            eventsByType,
            eventsBySource,
            recentEvents,
            activeSubscriptions: this.subscriptions.size
        };
    }
    clearHistory() {
        this.eventHistory = [];
        this.logger.info('Event history cleared');
    }
    async healthCheck() {
        const rabbitmqHealth = await this.rabbitmq.healthCheck();
        return {
            status: rabbitmqHealth.status === 'healthy' ? 'healthy' : 'degraded',
            subscriptions: this.subscriptions.size,
            eventHistory: this.eventHistory.length,
            rabbitmqConnected: rabbitmqHealth.status === 'healthy'
        };
    }
    setupDefaultHandlers() {
        this.subscribe(EventManager.EVENTS.OPERATION_STARTED, async (event) => {
            this.logger.info('Operation started', {
                operationId: event.data.operationId,
                type: event.data.type
            });
        });
        this.subscribe(EventManager.EVENTS.OPERATION_COMPLETED, async (event) => {
            this.logger.info('Operation completed', {
                operationId: event.data.operationId,
                executionTime: event.data.executionTime
            });
        });
        this.subscribe(EventManager.EVENTS.OPERATION_FAILED, async (event) => {
            this.logger.error('Operation failed', {
                operationId: event.data.operationId,
                error: event.data.error
            });
        });
        this.subscribe(EventManager.EVENTS.SERVICE_UNAVAILABLE, async (event) => {
            this.logger.warn('Service unavailable', {
                service: event.data.service,
                reason: event.data.reason
            });
        });
        this.subscribe(EventManager.EVENTS.SERVICE_RECOVERED, async (event) => {
            this.logger.info('Service recovered', {
                service: event.data.service
            });
        });
        this.logger.info('Default event handlers setup completed');
    }
}
exports.EventManager = EventManager;
EventManager.EVENTS = {
    OPERATION_STARTED: 'operation.started',
    OPERATION_COMPLETED: 'operation.completed',
    OPERATION_FAILED: 'operation.failed',
    OPERATION_CANCELLED: 'operation.cancelled',
    SAGA_STARTED: 'saga.started',
    SAGA_COMPLETED: 'saga.completed',
    SAGA_FAILED: 'saga.failed',
    SAGA_COMPENSATING: 'saga.compensating',
    WORKFLOW_STARTED: 'workflow.started',
    WORKFLOW_COMPLETED: 'workflow.completed',
    WORKFLOW_FAILED: 'workflow.failed',
    WORKFLOW_PAUSED: 'workflow.paused',
    WORKFLOW_RESUMED: 'workflow.resumed',
    SERVICE_UNAVAILABLE: 'service.unavailable',
    SERVICE_RECOVERED: 'service.recovered',
    SYSTEM_MAINTENANCE_STARTED: 'system.maintenance.started',
    SYSTEM_MAINTENANCE_COMPLETED: 'system.maintenance.completed',
    BULK_OPERATION_PROGRESS: 'bulk.operation.progress',
    NOTIFICATION_SENT: 'notification.sent',
    NOTIFICATION_FAILED: 'notification.failed'
};
//# sourceMappingURL=EventManager.js.map