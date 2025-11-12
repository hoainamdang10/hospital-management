/**
 * IdentityEventConsumer
 * Consumes events from Identity Service via RabbitMQ
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture
 */
import { ILogger } from '../../../../shared/application/services/logger.interface';
import { IdentityUserCreatedEventHandler } from './handlers/IdentityUserCreatedEventHandler';
import { IdentityUserDeletedEventHandler } from './handlers/IdentityUserDeletedEventHandler';
import { IdentityUserUpdatedEventHandler } from './handlers/IdentityUserUpdatedEventHandler';
import { UserActivatedEventHandler } from './handlers/UserActivatedEventHandler';
import { AuditService } from '../audit/AuditService';
/**
 * Identity Event Consumer Configuration
 */
export interface IdentityEventConsumerConfig {
    rabbitmqUrl: string;
    queueName: string;
    exchangeName: string;
    routingKeys: string[];
    deadLetterExchange?: string;
    deadLetterQueue?: string;
    maxRetries?: number;
    connectionRetries?: number;
    connectionRetryDelayMs?: number;
}
/**
 * Identity Event Consumer
 * Subscribes to identity.* events from Identity Service
 */
export declare class IdentityEventConsumer {
    private config;
    private logger;
    private userCreatedHandler;
    private userDeletedHandler;
    private userUpdatedHandler;
    private userActivatedHandler;
    private auditService?;
    private connection;
    private channel;
    private isConnected;
    private idempotentHandlers;
    constructor(config: IdentityEventConsumerConfig, logger: ILogger, userCreatedHandler: IdentityUserCreatedEventHandler, userDeletedHandler: IdentityUserDeletedEventHandler, userUpdatedHandler: IdentityUserUpdatedEventHandler, userActivatedHandler: UserActivatedEventHandler, auditService?: AuditService | undefined);
    /**
     * Connect to RabbitMQ and start consuming
     */
    connect(): Promise<void>;
    /**
     * Handle incoming message
     */
    private handleMessage;
    /**
     * Disconnect from RabbitMQ
     */
    disconnect(): Promise<void>;
    /**
     * Check if consumer is connected
     */
    isActive(): boolean;
}
//# sourceMappingURL=IdentityEventConsumer.d.ts.map