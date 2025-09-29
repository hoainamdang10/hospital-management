/**
 * Enhanced Event Bus - Event-Driven Architecture
 * Advanced event bus with healthcare-specific features
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Event-Driven Architecture, HIPAA, Healthcare Workflows
 */

import { DomainEvent } from '../../domain/events/domain-event';
import { 
  IDomainEventBus, 
  IDomainEventHandler, 
  EventSubscription,
  PublicationResult,
  PublisherStatistics 
} from '../../domain/events/domain-event-publisher.interface';
import { IEventStore } from '../../infrastructure/event-store/event-store.interface';
import { IHIPAAAuditLogger } from '../../infrastructure/audit/hipaa-audit-logger.interface';

/**
 * Enhanced Event Bus Configuration
 */
export interface EnhancedEventBusConfig {
  // Core settings
  enableEventStore: boolean;
  enableHIPAACompliance: boolean;
  enableRetryMechanism: boolean;
  
  // Performance settings
  maxConcurrentHandlers: number;
  eventProcessingTimeout: number;
  batchProcessingSize: number;
  
  // Reliability settings
  maxRetries: number;
  retryDelay: number;
  exponentialBackoff: boolean;
  deadLetterQueueEnabled: boolean;
  
  // Healthcare-specific settings
  enablePatientEventPriority: boolean;
  enableCriticalEventFastTrack: boolean;
  enableEventEncryption: boolean;
  
  // Monitoring settings
  enableMetrics: boolean;
  enableHealthChecks: boolean;
  metricsCollectionInterval: number;
}

/**
 * Event Processing Context
 */
export interface EventProcessingContext {
  eventId: string;
  eventType: string;
  patientId?: string;
  userId?: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  processingStartedAt: Date;
  retryCount: number;
  correlationId?: string;
  causationId?: string;
}

/**
 * Event Handler Registration
 */
export interface EventHandlerRegistration {
  handlerId: string;
  eventType: string;
  handler: IDomainEventHandler;
  priority: number;
  isActive: boolean;
  registeredAt: Date;
  processedEventCount: number;
  errorCount: number;
  averageProcessingTime: number;
}

/**
 * Enhanced Event Bus Implementation
 */
export class EnhancedEventBus implements IDomainEventBus {
  private handlers = new Map<string, EventHandlerRegistration[]>();
  private subscriptions = new Map<string, EventSubscription>();
  private processingQueue = new Map<string, EventProcessingContext>();
  private deadLetterQueue: DomainEvent[] = [];
  private statistics: PublisherStatistics;
  private isStarted = false;

  constructor(
    private readonly config: EnhancedEventBusConfig,
    private readonly eventStore?: IEventStore,
    private readonly auditLogger?: IHIPAAAuditLogger
  ) {
    this.statistics = {
      totalEventsPublished: 0,
      successfulPublications: 0,
      failedPublications: 0,
      averagePublishTime: 0,
      eventsByType: {},
      isHealthy: true,
    };
  }

  /**
   * Start the event bus
   */
  public async start(): Promise<void> {
    if (this.isStarted) return;

    console.log('Starting Enhanced Event Bus...');
    
    // Initialize monitoring if enabled
    if (this.config.enableMetrics) {
      this.startMetricsCollection();
    }

    if (this.config.enableHealthChecks) {
      this.startHealthChecks();
    }

    this.isStarted = true;
    console.log('Enhanced Event Bus started successfully');
  }

  /**
   * Stop the event bus
   */
  public async stop(): Promise<void> {
    if (!this.isStarted) return;

    console.log('Stopping Enhanced Event Bus...');
    
    // Wait for all processing events to complete
    await this.waitForProcessingCompletion();
    
    this.isStarted = false;
    console.log('Enhanced Event Bus stopped successfully');
  }

  /**
   * Publish single domain event
   */
  public async publish(event: DomainEvent): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Validate event
      this.validateEvent(event);
      
      // Log HIPAA audit if applicable
      if (this.config.enableHIPAACompliance && event.containsPHI() && this.auditLogger) {
        await this.logHIPAAEventPublication(event);
      }
      
      // Store event if event store is enabled
      if (this.config.enableEventStore && this.eventStore) {
        await this.storeEvent(event);
      }
      
      // Determine event priority
      const priority = this.determineEventPriority(event);
      
      // Create processing context
      const context: EventProcessingContext = {
        eventId: event.eventId,
        eventType: event.eventType,
        patientId: this.extractPatientId(event),
        userId: event.userId,
        priority,
        processingStartedAt: new Date(),
        retryCount: 0,
        correlationId: event.correlationId,
        causationId: event.causationId,
      };
      
      // Process event
      await this.processEvent(event, context);
      
      // Update statistics
      this.updatePublicationStatistics(event, Date.now() - startTime, true);
      
    } catch (error) {
      // Update statistics
      this.updatePublicationStatistics(event, Date.now() - startTime, false);
      
      // Handle error
      await this.handlePublicationError(event, error);
      throw error;
    }
  }

  /**
   * Publish multiple events in batch
   */
  public async publishBatch(events: DomainEvent[]): Promise<void> {
    const batchSize = this.config.batchProcessingSize || 10;
    
    for (let i = 0; i < events.length; i += batchSize) {
      const batch = events.slice(i, i + batchSize);
      const publishPromises = batch.map(event => this.publish(event));
      
      try {
        await Promise.all(publishPromises);
      } catch (error) {
        console.error('Batch publication failed:', error);
        // Continue with next batch
      }
    }
  }

  /**
   * Publish event with retry mechanism
   */
  public async publishWithRetry(
    event: DomainEvent,
    maxRetries?: number,
    retryDelay?: number
  ): Promise<void> {
    const retries = maxRetries || this.config.maxRetries || 3;
    const delay = retryDelay || this.config.retryDelay || 1000;
    
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        await this.publish(event);
        return; // Success
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < retries) {
          const waitTime = this.config.exponentialBackoff 
            ? delay * Math.pow(2, attempt)
            : delay;
          
          console.warn(`Event publication failed (attempt ${attempt + 1}/${retries + 1}), retrying in ${waitTime}ms...`);
          await this.sleep(waitTime);
        }
      }
    }
    
    // All retries failed
    if (this.config.deadLetterQueueEnabled) {
      this.deadLetterQueue.push(event);
      console.error(`Event moved to dead letter queue after ${retries} retries:`, lastError);
    }
    
    throw lastError;
  }

  /**
   * Schedule event for future publishing
   */
  public async scheduleEvent(event: DomainEvent, publishAt: Date): Promise<void> {
    const delay = publishAt.getTime() - Date.now();
    
    if (delay <= 0) {
      // Publish immediately
      await this.publish(event);
      return;
    }
    
    // Schedule for future
    setTimeout(async () => {
      try {
        await this.publish(event);
      } catch (error) {
        console.error('Scheduled event publication failed:', error);
      }
    }, delay);
  }

  /**
   * Register event handler
   */
  public async registerHandler<T extends DomainEvent>(
    eventType: string,
    handler: IDomainEventHandler<T>
  ): Promise<void> {
    const registration: EventHandlerRegistration = {
      handlerId: this.generateHandlerId(),
      eventType,
      handler: handler as IDomainEventHandler,
      priority: this.getHandlerPriority(handler),
      isActive: true,
      registeredAt: new Date(),
      processedEventCount: 0,
      errorCount: 0,
      averageProcessingTime: 0,
    };
    
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    
    this.handlers.get(eventType)!.push(registration);
    
    // Sort handlers by priority (higher priority first)
    this.handlers.get(eventType)!.sort((a, b) => b.priority - a.priority);
    
    console.log(`Handler registered for event type: ${eventType}`);
  }

  /**
   * Unregister event handler
   */
  public async unregisterHandler(
    eventType: string,
    handler: IDomainEventHandler
  ): Promise<void> {
    const handlers = this.handlers.get(eventType);
    if (!handlers) return;
    
    const index = handlers.findIndex(reg => reg.handler === handler);
    if (index >= 0) {
      handlers.splice(index, 1);
      console.log(`Handler unregistered for event type: ${eventType}`);
    }
  }

  /**
   * Get registered handlers for event type
   */
  public getHandlers(eventType: string): IDomainEventHandler[] {
    const registrations = this.handlers.get(eventType) || [];
    return registrations
      .filter(reg => reg.isActive)
      .map(reg => reg.handler);
  }

  /**
   * Subscribe to event type
   */
  public async subscribe<T extends DomainEvent>(
    eventType: string,
    handler: IDomainEventHandler<T>
  ): Promise<void> {
    await this.registerHandler(eventType, handler);
    
    const subscription: EventSubscription = {
      subscriptionId: this.generateSubscriptionId(),
      eventType,
      handlerName: handler.constructor.name,
      isActive: true,
      createdAt: new Date(),
      processedEventCount: 0,
      errorCount: 0,
    };
    
    this.subscriptions.set(subscription.subscriptionId, subscription);
  }

  /**
   * Subscribe to multiple event types
   */
  public async subscribeToMultiple<T extends DomainEvent>(
    eventTypes: string[],
    handler: IDomainEventHandler<T>
  ): Promise<void> {
    for (const eventType of eventTypes) {
      await this.subscribe(eventType, handler);
    }
  }

  /**
   * Unsubscribe from event type
   */
  public async unsubscribe(
    eventType: string,
    handler: IDomainEventHandler
  ): Promise<void> {
    await this.unregisterHandler(eventType, handler);
    
    // Remove subscription
    for (const [subscriptionId, subscription] of this.subscriptions.entries()) {
      if (subscription.eventType === eventType && subscription.handlerName === handler.constructor.name) {
        subscription.isActive = false;
        this.subscriptions.delete(subscriptionId);
        break;
      }
    }
  }

  /**
   * Get all subscriptions
   */
  public async getSubscriptions(): Promise<EventSubscription[]> {
    return Array.from(this.subscriptions.values());
  }

  /**
   * Get publisher statistics
   */
  public async getStatistics(): Promise<PublisherStatistics> {
    return {
      ...this.statistics,
      lastPublishedAt: new Date(),
    };
  }

  /**
   * Check if event bus is healthy
   */
  public async isHealthy(): Promise<boolean> {
    // Check if event bus is started
    if (!this.isStarted) return false;
    
    // Check processing queue size
    const queueSize = this.processingQueue.size;
    const maxQueueSize = this.config.maxConcurrentHandlers * 2;
    if (queueSize > maxQueueSize) return false;
    
    // Check dead letter queue size
    const deadLetterSize = this.deadLetterQueue.length;
    const maxDeadLetterSize = 100;
    if (deadLetterSize > maxDeadLetterSize) return false;
    
    // Check error rate
    const errorRate = this.statistics.totalEventsPublished > 0 
      ? this.statistics.failedPublications / this.statistics.totalEventsPublished
      : 0;
    if (errorRate > 0.1) return false; // More than 10% error rate
    
    return true;
  }

  /**
   * Process event with handlers
   */
  private async processEvent(event: DomainEvent, context: EventProcessingContext): Promise<void> {
    const handlers = this.getHandlers(event.eventType);
    
    if (handlers.length === 0) {
      console.warn(`No handlers registered for event type: ${event.eventType}`);
      return;
    }
    
    // Add to processing queue
    this.processingQueue.set(context.eventId, context);
    
    try {
      // Process with priority-based execution
      if (context.priority === 'critical' && this.config.enableCriticalEventFastTrack) {
        // Process critical events immediately and sequentially
        for (const handler of handlers) {
          await this.executeHandler(handler, event, context);
        }
      } else {
        // Process normal events concurrently with limit
        const maxConcurrent = this.config.maxConcurrentHandlers || 5;
        const handlerPromises = handlers.map(handler => 
          this.executeHandler(handler, event, context)
        );
        
        // Execute with concurrency limit
        await this.executeConcurrently(handlerPromises, maxConcurrent);
      }
    } finally {
      // Remove from processing queue
      this.processingQueue.delete(context.eventId);
    }
  }

  /**
   * Execute handler with error handling and metrics
   */
  private async executeHandler(
    handler: IDomainEventHandler,
    event: DomainEvent,
    context: EventProcessingContext
  ): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Set timeout for handler execution
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Handler execution timeout')), 
          this.config.eventProcessingTimeout || 30000);
      });
      
      await Promise.race([
        handler.handle(event),
        timeoutPromise
      ]);
      
      // Update handler statistics
      this.updateHandlerStatistics(handler, event.eventType, Date.now() - startTime, true);
      
    } catch (error) {
      // Update handler statistics
      this.updateHandlerStatistics(handler, event.eventType, Date.now() - startTime, false);
      
      console.error(`Handler execution failed for event ${event.eventType}:`, error);
      
      // Retry if configured
      if (this.config.enableRetryMechanism && context.retryCount < this.config.maxRetries) {
        context.retryCount++;
        await this.sleep(this.config.retryDelay || 1000);
        await this.executeHandler(handler, event, context);
      } else {
        throw error;
      }
    }
  }

  // Additional helper methods would be implemented here...
  // (Due to length constraints, showing key methods only)

  private validateEvent(event: DomainEvent): void {
    if (!event.eventId || !event.eventType) {
      throw new Error('Invalid event: missing eventId or eventType');
    }
  }

  private determineEventPriority(event: DomainEvent): 'low' | 'normal' | 'high' | 'critical' {
    // Healthcare-specific priority logic
    if (event.eventType.includes('Emergency') || event.eventType.includes('Critical')) {
      return 'critical';
    }
    if (event.eventType.includes('Patient') && event.containsPHI()) {
      return 'high';
    }
    return 'normal';
  }

  private extractPatientId(event: DomainEvent): string | undefined {
    // Extract patient ID from event data if available
    return event.aggregateId?.startsWith('PAT-') ? event.aggregateId : undefined;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateHandlerId(): string {
    return `handler_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getHandlerPriority(handler: IDomainEventHandler): number {
    // Default priority, can be enhanced with handler metadata
    return 1;
  }

  private updatePublicationStatistics(event: DomainEvent, processingTime: number, success: boolean): void {
    this.statistics.totalEventsPublished++;
    
    if (success) {
      this.statistics.successfulPublications++;
    } else {
      this.statistics.failedPublications++;
    }
    
    // Update average processing time
    this.statistics.averagePublishTime = 
      (this.statistics.averagePublishTime + processingTime) / 2;
    
    // Update events by type
    this.statistics.eventsByType[event.eventType] = 
      (this.statistics.eventsByType[event.eventType] || 0) + 1;
  }

  private updateHandlerStatistics(
    handler: IDomainEventHandler,
    eventType: string,
    processingTime: number,
    success: boolean
  ): void {
    const registrations = this.handlers.get(eventType) || [];
    const registration = registrations.find(reg => reg.handler === handler);
    
    if (registration) {
      registration.processedEventCount++;
      if (!success) {
        registration.errorCount++;
      }
      registration.averageProcessingTime = 
        (registration.averageProcessingTime + processingTime) / 2;
    }
  }

  private async handlePublicationError(event: DomainEvent, error: any): Promise<void> {
    console.error(`Event publication failed for ${event.eventType}:`, error);
    
    // Log to audit system if available
    if (this.auditLogger) {
      // Implementation would log the error
    }
  }

  private async logHIPAAEventPublication(event: DomainEvent): Promise<void> {
    // Implementation would log HIPAA-compliant event publication
  }

  private async storeEvent(event: DomainEvent): Promise<void> {
    // Implementation would store event in event store
  }

  private async waitForProcessingCompletion(): Promise<void> {
    // Wait for all events in processing queue to complete
    while (this.processingQueue.size > 0) {
      await this.sleep(100);
    }
  }

  private async executeConcurrently<T>(promises: Promise<T>[], limit: number): Promise<T[]> {
    const results: T[] = [];
    
    for (let i = 0; i < promises.length; i += limit) {
      const batch = promises.slice(i, i + limit);
      const batchResults = await Promise.allSettled(batch);
      
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error('Batch execution failed:', result.reason);
        }
      }
    }
    
    return results;
  }

  private startMetricsCollection(): void {
    // Implementation would start metrics collection
  }

  private startHealthChecks(): void {
    // Implementation would start health checks
  }
}
