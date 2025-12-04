/**
 * Event Bus for Inter-Service Communication
 * Hospital Management System V2
 *
 * Implements publish-subscribe pattern using RabbitMQ
 * Replaces cross-schema foreign keys with event-driven architecture
 */
import { DomainEvent } from "../../domain/base/domain-event";
export interface EventBusConfig {
    rabbitmqUrl: string;
    exchangeName: string;
    serviceName: string;
}
export interface EventHandler<T extends DomainEvent> {
    handle(event: T): Promise<void>;
}
export interface EventSubscription {
    eventType: string;
    handler: EventHandler<any>;
    queueName?: string;
}
/**
 * Event Bus Interface
 */
export interface IEventBus {
    /**
     * Publish a domain event to the event bus
     */
    publish(event: DomainEvent): Promise<void>;
    /**
     * Subscribe to a specific event type
     */
    subscribe<T extends DomainEvent>(eventType: string, handler: EventHandler<T>, queueName?: string): Promise<void>;
    /**
     * Connect to the event bus
     */
    connect(): Promise<void>;
    /**
     * Disconnect from the event bus
     */
    disconnect(): Promise<void>;
}
/**
 * RabbitMQ Event Bus Implementation
 */
export declare class RabbitMQEventBus implements IEventBus {
    private config;
    private connection;
    private channel;
    private subscriptions;
    private isReconnecting;
    private reconnectAttempts;
    private maxReconnectAttempts;
    private reconnectDelay;
    constructor(config: EventBusConfig);
    connect(): Promise<void>;
    private connectWithRetry;
    private handleConnectionLost;
    private restoreSubscriptions;
    private sleep;
    disconnect(): Promise<void>;
    publish(event: DomainEvent): Promise<void>;
    subscribe<T extends DomainEvent>(eventType: string, handler: EventHandler<T>, queueName?: string): Promise<void>;
    private getRoutingKey;
    private serializeEvent;
    private deserializeEvent;
}
/**
 * In-Memory Event Bus for Testing
 */
export declare class InMemoryEventBus implements IEventBus {
    private handlers;
    private publishedEvents;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    publish(event: DomainEvent): Promise<void>;
    subscribe<T extends DomainEvent>(eventType: string, handler: EventHandler<T>): Promise<void>;
    getPublishedEvents(): DomainEvent[];
    clearPublishedEvents(): void;
}
/**
 * Event Bus Factory
 */
export declare class EventBusFactory {
    static create(config: EventBusConfig, useInMemory?: boolean): IEventBus;
}
//# sourceMappingURL=EventBus.d.ts.map