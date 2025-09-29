import { Channel } from 'amqplib';
import { Logger } from 'winston';
import { EventEmitter } from 'events';
export interface RabbitMQMessage {
    content: any;
    properties: any;
    fields: any;
}
export interface QueueOptions {
    durable?: boolean;
    exclusive?: boolean;
    autoDelete?: boolean;
    arguments?: any;
}
export interface ExchangeOptions {
    type: 'direct' | 'topic' | 'fanout' | 'headers';
    durable?: boolean;
    autoDelete?: boolean;
    arguments?: any;
}
export declare class RabbitMQClient extends EventEmitter {
    private connection;
    private channel;
    private logger;
    private connectionUrl;
    private isConnected;
    private reconnectAttempts;
    private maxReconnectAttempts;
    private reconnectDelay;
    constructor(logger: Logger, connectionUrl?: string);
    connect(): Promise<void>;
    private setupConnectionHandlers;
    disconnect(): Promise<void>;
    isReady(): boolean;
    assertQueue(queue: string, options?: QueueOptions): Promise<void>;
    assertExchange(exchange: string, options: ExchangeOptions): Promise<void>;
    sendToQueue(queue: string, message: any, options?: any): Promise<boolean>;
    publish(exchange: string, routingKey: string, message: any, options?: any): Promise<boolean>;
    consume(queue: string, callback: (message: RabbitMQMessage | null) => void, options?: any): Promise<void>;
    bindQueue(queue: string, exchange: string, routingKey?: string): Promise<void>;
    getChannel(): Channel | null;
    healthCheck(): Promise<{
        status: string;
        connection: boolean;
        channel: boolean;
    }>;
}
//# sourceMappingURL=RabbitMQClient.d.ts.map