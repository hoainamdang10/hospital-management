/**
 * MockEventPublisher - Test Mock
 * Mock implementation of IDomainEventPublisher for testing
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Testing Best Practices
 */

import { IDomainEventPublisher } from '../../../shared/domain/events/IDomainEventPublisher';
import { IDomainEvent } from '../../../shared/domain/events/IDomainEvent';
import { IntegrationEvent } from '../../../shared/domain/events/IntegrationEvent';

export class MockEventPublisher implements IDomainEventPublisher {
  private events: IDomainEvent[] = [];
  private integrationEvents: IntegrationEvent[] = [];
  private publishHistory: Array<{
    event: IDomainEvent | IntegrationEvent;
    timestamp: Date;
    success: boolean;
    error?: Error;
  }> = [];
  private subscribers: Map<string, Array<(event: IDomainEvent) => Promise<void>>> = new Map();

  constructor() {
    // Initialize empty
  }

  /**
   * Publish domain event
   */
  async publish(event: IDomainEvent): Promise<void> {
    try {
      // Store the event
      if (event instanceof IntegrationEvent) {
        this.integrationEvents.push(event);
      } else {
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
        } catch (error) {
          console.warn(`Subscriber failed for event ${eventType}:`, error);
        }
      }

      // Simulate async operation
      await this.simulateAsyncOperation(10);

    } catch (error) {
      this.publishHistory.push({
        event,
        timestamp: new Date(),
        success: false,
        error: error as Error
      });
      throw error;
    }
  }

  /**
   * Publish multiple events
   */
  async publishAll(events: IDomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }

  /**
   * Subscribe to events
   */
  subscribe(eventType: string, handler: (event: IDomainEvent) => Promise<void>): void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, []);
    }
    this.subscribers.get(eventType)!.push(handler);
  }

  /**
   * Unsubscribe from events
   */
  unsubscribe(eventType: string, handler: (event: IDomainEvent) => Promise<void>): void {
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
  get publishedEvents(): IDomainEvent[] {
    return [...this.events];
  }

  /**
   * Get all published integration events
   */
  get publishedIntegrationEvents(): IntegrationEvent[] {
    return [...this.integrationEvents];
  }

  /**
   * Get all events (domain + integration)
   */
  get allPublishedEvents(): (IDomainEvent | IntegrationEvent)[] {
    return [...this.events, ...this.integrationEvents];
  }

  /**
   * Get publish history
   */
  get publishHistory(): Array<{
    event: IDomainEvent | IntegrationEvent;
    timestamp: Date;
    success: boolean;
    error?: Error;
  }> {
    return [...this.publishHistory];
  }

  /**
   * Clear all events and history
   */
  clear(): void {
    this.events = [];
    this.integrationEvents = [];
    this.publishHistory = [];
  }

  /**
   * Get events by type
   */
  getEventsByType(eventType: string): IDomainEvent[] {
    return this.events.filter(event => this.getEventType(event) === eventType);
  }

  /**
   * Get integration events by type
   */
  getIntegrationEventsByType(eventType: string): IntegrationEvent[] {
    return this.integrationEvents.filter(event => event.eventType === eventType);
  }

  /**
   * Get events by aggregate ID
   */
  getEventsByAggregateId(aggregateId: string): IDomainEvent[] {
    return this.events.filter(event => event.aggregateId === aggregateId);
  }

  /**
   * Get events count
   */
  getEventsCount(): number {
    return this.events.length;
  }

  /**
   * Get integration events count
   */
  getIntegrationEventsCount(): number {
    return this.integrationEvents.length;
  }

  /**
   * Get total events count
   */
  getTotalEventsCount(): number {
    return this.events.length + this.integrationEvents.length;
  }

  /**
   * Check if event was published
   */
  wasEventPublished(eventType: string): boolean {
    return this.events.some(event => this.getEventType(event) === eventType) ||
           this.integrationEvents.some(event => event.eventType === eventType);
  }

  /**
   * Check if integration event was published
   */
  wasIntegrationEventPublished(eventType: string): boolean {
    return this.integrationEvents.some(event => event.eventType === eventType);
  }

  /**
   * Get last published event
   */
  getLastPublishedEvent(): IDomainEvent | IntegrationEvent | null {
    if (this.publishHistory.length === 0) return null;
    return this.publishHistory[this.publishHistory.length - 1].event;
  }

  /**
   * Get last published event of type
   */
  getLastPublishedEventOfType(eventType: string): IDomainEvent | IntegrationEvent | null {
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
  getEventsInTimeRange(startTime: Date, endTime: Date): (IDomainEvent | IntegrationEvent)[] {
    return this.publishHistory
      .filter(item => item.timestamp >= startTime && item.timestamp <= endTime)
      .map(item => item.event);
  }

  /**
   * Get failed publishes
   */
  getFailedPublishes(): Array<{
    event: IDomainEvent | IntegrationEvent;
    timestamp: Date;
    error: Error;
  }> {
    return this.publishHistory
      .filter(item => !item.success)
      .map(item => ({
        event: item.event,
        timestamp: item.timestamp,
        error: item.error!
      }));
  }

  /**
   * Get successful publishes
   */
  getSuccessfulPublishes(): Array<{
    event: IDomainEvent | IntegrationEvent;
    timestamp: Date;
  }> {
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
  getPublishSuccessRate(): number {
    if (this.publishHistory.length === 0) return 100;
    const successCount = this.publishHistory.filter(item => item.success).length;
    return (successCount / this.publishHistory.length) * 100;
  }

  /**
   * Simulate publish failure
   */
  private shouldSimulateFailure = false;
  private failureError: Error | null = null;

  simulatePublishFailure(error: Error): void {
    this.shouldSimulateFailure = true;
    this.failureError = error;
  }

  clearFailureSimulation(): void {
    this.shouldSimulateFailure = false;
    this.failureError = null;
  }

  /**
   * Get event statistics
   */
  getEventStatistics(): {
    totalEvents: number;
    domainEvents: number;
    integrationEvents: number;
    eventsByType: Record<string, number>;
    publishSuccessRate: number;
    averagePublishTime: number;
    recentEvents: Array<{
      eventType: string;
      timestamp: Date;
      success: boolean;
    }>;
  } {
    const eventsByType: Record<string, number> = {};
    
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
  async waitForEvents(count: number, timeoutMs: number = 5000): Promise<void> {
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
  async waitForEventType(eventType: string, timeoutMs: number = 5000): Promise<IDomainEvent | IntegrationEvent> {
    const startTime = Date.now();
    
    while (!this.wasEventPublished(eventType)) {
      if (Date.now() - startTime > timeoutMs) {
        throw new Error(`Timeout waiting for event type: ${eventType}`);
      }
      await this.simulateAsyncOperation(10);
    }
    
    return this.getLastPublishedEventOfType(eventType)!;
  }

  /**
   * Get event type from event object
   */
  private getEventType(event: IDomainEvent | IntegrationEvent): string {
    if (event instanceof IntegrationEvent) {
      return event.eventType;
    }
    return event.constructor.name;
  }

  /**
   * Simulate async operation
   */
  private async simulateAsyncOperation(delayMs: number): Promise<void> {
    return new Promise(resolve => {
      setTimeout(resolve, delayMs);
    });
  }

  /**
   * Create event matcher for testing
   */
  createEventMatcher(eventType: string, properties?: Record<string, any>): (event: IDomainEvent | IntegrationEvent) => boolean {
    return (event: IDomainEvent | IntegrationEvent) => {
      if (this.getEventType(event) !== eventType) {
        return false;
      }
      
      if (properties) {
        for (const [key, value] of Object.entries(properties)) {
          if ((event as any)[key] !== value) {
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
  findEvents(matcher: (event: IDomainEvent | IntegrationEvent) => boolean): (IDomainEvent | IntegrationEvent)[] {
    return this.allPublishedEvents.filter(matcher);
  }

  /**
   * Assert event was published (for testing)
   */
  assertEventPublished(eventType: string, properties?: Record<string, any>): void {
    const matcher = this.createEventMatcher(eventType, properties);
    const matchingEvents = this.findEvents(matcher);
    
    if (matchingEvents.length === 0) {
      throw new Error(`Expected event ${eventType} to be published${properties ? ` with properties ${JSON.stringify(properties)}` : ''}`);
    }
  }

  /**
   * Assert event was not published (for testing)
   */
  assertEventNotPublished(eventType: string, properties?: Record<string, any>): void {
    const matcher = this.createEventMatcher(eventType, properties);
    const matchingEvents = this.findEvents(matcher);
    
    if (matchingEvents.length > 0) {
      throw new Error(`Expected event ${eventType} not to be published${properties ? ` with properties ${JSON.stringify(properties)}` : ''}`);
    }
  }

  /**
   * Assert event count (for testing)
   */
  assertEventCount(eventType: string, expectedCount: number): void {
    const actualCount = this.getEventsByType(eventType).length + this.getIntegrationEventsByType(eventType).length;
    
    if (actualCount !== expectedCount) {
      throw new Error(`Expected ${expectedCount} events of type ${eventType}, but found ${actualCount}`);
    }
  }
}
