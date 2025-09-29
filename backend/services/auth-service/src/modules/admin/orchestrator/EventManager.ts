import { EventEmitter } from 'events';
import { Logger } from 'winston';
import { RabbitMQClient } from './infrastructure/RabbitMQClient';

export interface OrchestrationEvent {
  id: string;
  type: string;
  source: string;
  timestamp: Date;
  data: any;
  correlationId?: string;
  userId?: string;
}

export interface EventSubscription {
  id: string;
  eventType: string;
  handler: (event: OrchestrationEvent) => Promise<void>;
  filter?: (event: OrchestrationEvent) => boolean;
  retryCount: number;
  maxRetries: number;
}

export class EventManager extends EventEmitter {
  private logger: Logger;
  private rabbitmq: RabbitMQClient;
  private subscriptions: Map<string, EventSubscription> = new Map();
  private eventHistory: OrchestrationEvent[] = [];
  private maxHistorySize: number = 1000;

  // Event type constants
  static readonly EVENTS = {
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
  } as const;

  constructor(logger: Logger, rabbitmq: RabbitMQClient) {
    super();
    this.logger = logger;
    this.rabbitmq = rabbitmq;
    this.setupRabbitMQEventHandling();
  }

  /**
   * Setup RabbitMQ event handling
   */
  private async setupRabbitMQEventHandling(): Promise<void> {
    try {
      if (this.rabbitmq.isReady()) {
        // Assert exchanges and queues for event handling
        await this.rabbitmq.assertExchange('orchestration.events', { type: 'topic' });
        await this.rabbitmq.assertQueue('orchestration.events.queue', { durable: true });
        
        // Bind queue to exchange with wildcard routing key
        await this.rabbitmq.bindQueue('orchestration.events.queue', 'orchestration.events', '#');
        
        // Start consuming events
        await this.rabbitmq.consume('orchestration.events.queue', (message) => {
          if (message) {
            this.handleIncomingEvent(message.content);
          }
        });

        this.logger.info('RabbitMQ event handling setup completed');
      }
    } catch (error: any) {
      this.logger.error('Failed to setup RabbitMQ event handling:', error);
    }
  }

  /**
   * Handle incoming events from RabbitMQ
   */
  private handleIncomingEvent(eventData: any): void {
    try {
      const event: OrchestrationEvent = {
        id: eventData.id || `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: eventData.type,
        source: eventData.source || 'unknown',
        timestamp: new Date(eventData.timestamp || Date.now()),
        data: eventData.data,
        correlationId: eventData.correlationId,
        userId: eventData.userId
      };

      this.processEvent(event);
    } catch (error: any) {
      this.logger.error('Failed to handle incoming event:', error);
    }
  }

  /**
   * Emit an orchestration event
   */
  async emitEvent(
    type: string, 
    data: any, 
    source: string = 'orchestrator',
    correlationId?: string,
    userId?: string
  ): Promise<void> {
    const event: OrchestrationEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      source,
      timestamp: new Date(),
      data,
      correlationId,
      userId
    };

    // Add to history
    this.addToHistory(event);

    // Process locally
    this.processEvent(event);

    // Publish to RabbitMQ for distributed processing
    if (this.rabbitmq.isReady()) {
      try {
        await this.rabbitmq.publish('orchestration.events', type, event);
        this.logger.debug('Event published to RabbitMQ', { eventId: event.id, type });
      } catch (error: any) {
        this.logger.error('Failed to publish event to RabbitMQ:', error);
      }
    }

    // Emit locally for immediate handlers
    this.emit(type, event);
  }

  /**
   * Process event through subscriptions
   */
  private async processEvent(event: OrchestrationEvent): Promise<void> {
    this.logger.debug('Processing event', { eventId: event.id, type: event.type });

    // Find matching subscriptions
    const matchingSubscriptions = Array.from(this.subscriptions.values())
      .filter(sub => 
        sub.eventType === event.type && 
        (!sub.filter || sub.filter(event))
      );

    // Execute handlers
    for (const subscription of matchingSubscriptions) {
      try {
        await this.executeHandler(subscription, event);
      } catch (error: any) {
        this.logger.error('Event handler failed', { 
          subscriptionId: subscription.id, 
          eventId: event.id, 
          error: error.message 
        });

        // Retry logic
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
          }, 1000 * subscription.retryCount); // Exponential backoff
        }
      }
    }
  }

  /**
   * Execute event handler
   */
  private async executeHandler(subscription: EventSubscription, event: OrchestrationEvent): Promise<void> {
    await subscription.handler(event);
    subscription.retryCount = 0; // Reset retry count on success
  }

  /**
   * Subscribe to events
   */
  subscribe(
    eventType: string, 
    handler: (event: OrchestrationEvent) => Promise<void>,
    options: {
      filter?: (event: OrchestrationEvent) => boolean;
      maxRetries?: number;
    } = {}
  ): string {
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const subscription: EventSubscription = {
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

  /**
   * Unsubscribe from events
   */
  unsubscribe(subscriptionId: string): boolean {
    const removed = this.subscriptions.delete(subscriptionId);
    if (removed) {
      this.logger.debug('Event subscription removed', { subscriptionId });
    }
    return removed;
  }

  /**
   * Add event to history
   */
  private addToHistory(event: OrchestrationEvent): void {
    this.eventHistory.push(event);
    
    // Maintain history size limit
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Get event history
   */
  getEventHistory(
    filter?: {
      type?: string;
      source?: string;
      correlationId?: string;
      userId?: string;
      since?: Date;
      limit?: number;
    }
  ): OrchestrationEvent[] {
    let filteredEvents = this.eventHistory;

    if (filter) {
      filteredEvents = filteredEvents.filter(event => {
        if (filter.type && event.type !== filter.type) return false;
        if (filter.source && event.source !== filter.source) return false;
        if (filter.correlationId && event.correlationId !== filter.correlationId) return false;
        if (filter.userId && event.userId !== filter.userId) return false;
        if (filter.since && event.timestamp < filter.since) return false;
        return true;
      });
    }

    // Apply limit
    if (filter?.limit) {
      filteredEvents = filteredEvents.slice(-filter.limit);
    }

    return filteredEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get event statistics
   */
  getEventStatistics(): {
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsBySource: Record<string, number>;
    recentEvents: number;
    activeSubscriptions: number;
  } {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const eventsByType: Record<string, number> = {};
    const eventsBySource: Record<string, number> = {};
    let recentEvents = 0;

    this.eventHistory.forEach(event => {
      // Count by type
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      
      // Count by source
      eventsBySource[event.source] = (eventsBySource[event.source] || 0) + 1;
      
      // Count recent events
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

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = [];
    this.logger.info('Event history cleared');
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    status: string;
    subscriptions: number;
    eventHistory: number;
    rabbitmqConnected: boolean;
  }> {
    const rabbitmqHealth = await this.rabbitmq.healthCheck();
    
    return {
      status: rabbitmqHealth.status === 'healthy' ? 'healthy' : 'degraded',
      subscriptions: this.subscriptions.size,
      eventHistory: this.eventHistory.length,
      rabbitmqConnected: rabbitmqHealth.status === 'healthy'
    };
  }

  /**
   * Setup default event handlers
   */
  setupDefaultHandlers(): void {
    // Operation lifecycle handlers
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

    // Service health handlers
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
}
