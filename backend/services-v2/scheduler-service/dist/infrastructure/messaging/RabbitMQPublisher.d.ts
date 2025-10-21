import { IDeadLetterRepository } from '../../domain/repositories/IDeadLetterRepository';
import { AlertService } from '../alerting/AlertService';
export interface RabbitMQConfig {
    url: string;
    exchange: string;
    exchangeType: string;
    durable: boolean;
}
export interface MessageHeaders {
    correlation_id: string;
    causation_id: string;
    schedule_id: string;
    run_id: string;
    tenant_id: string;
    idempotency_key: string;
    emitted_at: string;
}
export declare class RabbitMQPublisher {
    private readonly config;
    private readonly deadLetterRepo?;
    private readonly alertService?;
    private connection;
    private channel;
    private isConnected;
    private reconnectAttempts;
    private maxReconnectAttempts;
    private reconnectDelay;
    constructor(config: RabbitMQConfig, deadLetterRepo?: IDeadLetterRepository | undefined, alertService?: AlertService | undefined);
    connect(): Promise<void>;
    private reconnect;
    publish(topic: string, payload: any, headers: MessageHeaders): Promise<void>;
    close(): Promise<void>;
    getConnectionStatus(): boolean;
    /**
     * Handle unroutable message by saving to dead_letters table
     */
    private handleUnroutableMessage;
}
//# sourceMappingURL=RabbitMQPublisher.d.ts.map