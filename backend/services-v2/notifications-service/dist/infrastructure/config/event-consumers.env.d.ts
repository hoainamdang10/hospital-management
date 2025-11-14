/**
 * Event Consumers Environment Configuration
 * Notification Service Event Consumers Configuration - Simplified for Demo
 *
 * @author Hospital Management Team
 * @version 2.0.0-simplified
 * @compliance Clean Architecture, Environment Management
 */
export interface EventConsumersConfig {
    rabbitmqUrl: string;
    appointmentEventQueue: string;
    appointmentEventExchange: string;
    appointmentEventEnabled: boolean;
    staffEventQueue: string;
    staffEventExchange: string;
    staffEventEnabled: boolean;
    consumerPrefetchCount: number;
    consumerRetryAttempts: number;
    consumerRetryDelayMs: number;
    consumerConnectionTimeoutMs: number;
    consumerHeartbeatIntervalMs: number;
    healthCheckIntervalMs: number;
    healthCheckTimeoutMs: number;
}
/**
 * Load event consumers configuration from environment variables
 */
export declare function loadEventConsumersConfig(): EventConsumersConfig;
/**
 * Validate event consumers configuration
 */
export declare function validateEventConsumersConfig(config: EventConsumersConfig): void;
/**
 * Get routing keys for each event consumer
 */
export declare function getEventConsumerRoutingKeys(): {
    appointment: string[];
    staff: string[];
};
/**
 * Environment variable documentation
 */
export declare const EVENT_CONSUMERS_ENV_DOCS: {
    RABBITMQ_URL: string;
    APPOINTMENT_EVENT_QUEUE: string;
    APPOINTMENT_EVENT_EXCHANGE: string;
    APPOINTMENT_EVENT_ENABLED: string;
    STAFF_EVENT_QUEUE: string;
    STAFF_EVENT_EXCHANGE: string;
    STAFF_EVENT_ENABLED: string;
    EVENT_CONSUMER_PREFETCH_COUNT: string;
    EVENT_CONSUMER_RETRY_ATTEMPTS: string;
    EVENT_CONSUMER_RETRY_DELAY_MS: string;
    EVENT_CONSUMER_CONNECTION_TIMEOUT_MS: string;
    EVENT_CONSUMER_HEARTBEAT_INTERVAL_MS: string;
    HEALTH_CHECK_INTERVAL_MS: string;
    HEALTH_CHECK_TIMEOUT_MS: string;
};
//# sourceMappingURL=event-consumers.env.d.ts.map