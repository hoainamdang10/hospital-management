/**
 * EventBusIntegration - Event Bus Integration
 * RabbitMQ-based event bus integration for cross-service communication
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture, Vietnamese Healthcare Standards
 */
import { NotificationEventHandlers, IntegrationEvent } from './NotificationEventHandlers';
import { RealTimeNotificationService } from '../realtime/RealTimeNotificationService';
export interface EventBusConfig {
    connectionUrl: string;
    exchangeName: string;
    queueName: string;
    routingKeys: string[];
    retryAttempts: number;
    retryDelay: number;
}
export declare class EventBusIntegration {
    private readonly config;
    private readonly eventHandlers;
    private readonly realTimeService;
    private connection;
    private channel;
    private isConnected;
    private reconnectAttempts;
    private maxReconnectAttempts;
    constructor(config: EventBusConfig, eventHandlers: NotificationEventHandlers, realTimeService: RealTimeNotificationService);
    /**
     * Initialize event bus connection
     */
    initialize(): Promise<void>;
    /**
     * Connect to RabbitMQ
     */
    private connect;
    /**
     * Setup exchange and queue
     */
    private setupExchangeAndQueue;
    /**
     * Setup dead letter queue for failed messages
     */
    private setupDeadLetterQueue;
    /**
     * Start consuming messages
     */
    private startConsuming;
    /**
     * Handle incoming message
     */
    private handleMessage;
    /**
     * Handle real-time notification for event
     */
    private handleRealTimeNotification;
    /**
     * Map integration event to real-time notification
     */
    private mapEventToRealTimeNotification;
    /**
     * Handle message processing error
     */
    private handleMessageError;
    /**
     * Get retry count from message headers
     */
    private getRetryCount;
    /**
     * Send message to dead letter queue
     */
    private sendToDeadLetterQueue;
    /**
     * Validate event structure
     */
    private isValidEvent;
    /**
     * Schedule reconnection
     */
    private scheduleReconnect;
    /**
     * Publish event to other services
     */
    publishEvent(event: IntegrationEvent, routingKey: string): Promise<void>;
    /**
     * Close connection
     */
    close(): Promise<void>;
    /**
     * Get connection status
     */
    getStatus(): {
        connected: boolean;
        reconnectAttempts: number;
        queueName: string;
        exchangeName: string;
    };
}
//# sourceMappingURL=EventBusIntegration.d.ts.map