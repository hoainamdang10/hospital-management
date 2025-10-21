import { IOutboxRepository } from '../../domain/repositories/IOutboxRepository';
import { RabbitMQPublisher } from '../messaging/RabbitMQPublisher';
export interface OutboxPublisherConfig {
    interval: number;
    batchSize: number;
    maxRetries: number;
}
export declare class OutboxPublisher {
    private readonly outboxRepo;
    private readonly rabbitmq;
    private readonly config;
    private isRunning;
    private intervalId;
    constructor(outboxRepo: IOutboxRepository, rabbitmq: RabbitMQPublisher, config: OutboxPublisherConfig);
    start(): Promise<void>;
    stop(): Promise<void>;
    private publish;
    getStatus(): {
        isRunning: boolean;
        config: OutboxPublisherConfig;
    };
}
//# sourceMappingURL=OutboxPublisher.d.ts.map