/**
 * RabbitMQ Publisher - Infrastructure Layer
 * Publishes events to RabbitMQ message broker
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { OutboxEvent } from '../../domain/repositories/IOutboxRepository';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
export interface RabbitMQConfig {
    url: string;
    exchangeName: string;
    routingKeyPrefix: string;
}
/**
 * RabbitMQ Publisher
 * Production-ready implementation with connection management
 */
export declare class RabbitMQPublisher {
    private config;
    private logger;
    private connection?;
    private channel?;
    private isConnected;
    private reconnectAttempts;
    private readonly maxReconnectAttempts;
    private readonly reconnectDelay;
    constructor(config: RabbitMQConfig, logger: ILogger);
    /**
     * Initialize connection to RabbitMQ
     */
    connect(): Promise<void>;
    /**
     * Reconnect to RabbitMQ with exponential backoff
     */
    private reconnect;
    /**
     * Publish event to RabbitMQ
     */
    publish(event: OutboxEvent): Promise<void>;
    /**
     * Disconnect from RabbitMQ
     */
    disconnect(): Promise<void>;
    /**
     * Check if connected
     */
    isReady(): boolean;
    /**
     * Extract action from event type
     * Example: "InvoiceCreatedEvent" -> "created"
     */
    private extractAction;
}
//# sourceMappingURL=RabbitMQPublisher.d.ts.map