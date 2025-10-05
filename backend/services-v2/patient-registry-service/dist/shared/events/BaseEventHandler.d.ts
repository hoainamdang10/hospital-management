/**
 * BaseEventHandler - Base Event Handler
 * Abstract base class for all service event handlers
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Event-Driven Architecture, Vietnamese Healthcare Standards
 */
import * as amqp from 'amqplib';
import { EventBusConfiguration, IntegrationEvent, ServiceEventConfig } from './EventBusConfiguration';
export interface EventHandlerMetrics {
    totalProcessed: number;
    totalSuccessful: number;
    totalFailed: number;
    averageProcessingTime: number;
    lastProcessedAt?: Date;
    errorRate: number;
}
export interface EventProcessingResult {
    success: boolean;
    processingTime: number;
    error?: Error;
    retryable?: boolean;
    metadata?: any;
}
export declare abstract class BaseEventHandler {
    protected serviceName: string;
    protected logger?: any | undefined;
    protected connection: amqp.Connection | null;
    protected channel: amqp.Channel | null;
    protected isConnected: boolean;
    protected metrics: EventHandlerMetrics;
    protected eventBusConfig: EventBusConfiguration;
    protected serviceConfig: ServiceEventConfig;
    constructor(serviceName: string, logger?: any | undefined);
    /**
     * Initialize event handler
     */
    initialize(): Promise<void>;
    /**
     * Connect to RabbitMQ
     */
    protected connect(): Promise<void>;
    /**
     * Setup RabbitMQ infrastructure
     */
    protected setupInfrastructure(): Promise<void>;
    /**
     * Start consuming messages
     */
    protected startConsuming(): Promise<void>;
    /**
     * Handle incoming message
     */
    protected handleMessage(message: amqp.ConsumeMessage): Promise<void>;
    /**
     * Process event - to be implemented by concrete handlers
     */
    protected abstract processEvent(event: IntegrationEvent): Promise<EventProcessingResult>;
    /**
     * Handle processing error
     */
    protected handleProcessingError(message: amqp.ConsumeMessage, event: IntegrationEvent | null, error: Error): Promise<void>;
    /**
     * Send message to dead letter queue
     */
    protected sendToDeadLetterQueue(message: amqp.ConsumeMessage, event: IntegrationEvent | null, error: Error): Promise<void>;
    /**
     * Publish integration event
     */
    publishEvent(event: IntegrationEvent): Promise<void>;
    /**
     * Get retry count from message headers
     */
    protected getRetryCount(message: amqp.ConsumeMessage): number;
    /**
     * Check if error is retryable
     */
    protected isRetryableError(error: Error): boolean;
    /**
     * Update processing metrics
     */
    protected updateMetrics(success: boolean, processingTime: number): void;
    /**
     * Schedule reconnection
     */
    protected scheduleReconnect(): void;
    /**
     * Get handler metrics
     */
    getMetrics(): EventHandlerMetrics;
    /**
     * Get connection status
     */
    getStatus(): {
        connected: boolean;
        serviceName: string;
        queueName: string;
        metrics: EventHandlerMetrics;
    };
    /**
     * Close connection
     */
    close(): Promise<void>;
    /**
     * Logging helper
     */
    protected log(level: string, message: string, ...args: any[]): void;
}
//# sourceMappingURL=BaseEventHandler.d.ts.map