/**
 * EventBusConfiguration - Shared Event Bus Configuration
 * Centralized event bus configuration for all microservices
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Event-Driven Architecture, Vietnamese Healthcare Standards
 */
import * as amqp from 'amqplib';
export interface EventBusConfig {
    connectionUrl: string;
    exchangeName: string;
    deadLetterExchange: string;
    retryAttempts: number;
    retryDelay: number;
    messageTimeout: number;
    prefetchCount: number;
}
export interface ServiceEventConfig {
    serviceName: string;
    queueName: string;
    routingKeys: string[];
    publishingKeys: string[];
    deadLetterQueue: string;
}
export interface DomainEvent {
    eventId: string;
    eventType: string;
    aggregateId: string;
    aggregateType: string;
    eventData: any;
    occurredAt: Date;
    version: number;
    metadata?: {
        correlationId?: string;
        causationId?: string;
        userId?: string;
        source?: string;
        traceId?: string;
    };
}
export interface IntegrationEvent extends DomainEvent {
    serviceName: string;
    eventVersion: string;
    targetServices?: string[];
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    expiresAt?: Date;
}
export declare class EventBusConfiguration {
    private static instance;
    private config;
    private constructor();
    static getInstance(): EventBusConfiguration;
    getConfig(): EventBusConfig;
    getServiceConfig(serviceName: string): ServiceEventConfig;
    /**
     * Get Vietnamese healthcare event routing patterns
     */
    getHealthcareRoutingPatterns(): Record<string, string[]>;
    /**
     * Create RabbitMQ connection with retry logic
     */
    createConnection(): Promise<amqp.Connection>;
    /**
     * Setup exchange and queues for a service
     */
    setupServiceInfrastructure(channel: amqp.Channel, serviceConfig: ServiceEventConfig): Promise<void>;
    /**
     * Validate event structure
     */
    validateEvent(event: any): event is IntegrationEvent;
    /**
     * Create integration event
     */
    createIntegrationEvent(eventType: string, aggregateId: string, aggregateType: string, serviceName: string, eventData: any, metadata?: any): IntegrationEvent;
    /**
     * Get event routing key
     */
    getRoutingKey(eventType: string, priority?: string): string;
    /**
     * Check if event should be processed by service
     */
    shouldProcessEvent(event: IntegrationEvent, serviceConfig: ServiceEventConfig): boolean;
    /**
     * Get Vietnamese healthcare event metadata
     */
    getVietnameseHealthcareMetadata(event: IntegrationEvent): any;
}
//# sourceMappingURL=EventBusConfiguration.d.ts.map