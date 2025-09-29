import { Event, EventType } from '../types/common.types';
export declare class EventBus {
    private connection;
    private channel;
    private readonly exchangeName;
    private readonly serviceName;
    constructor(serviceName: string, exchangeName?: string);
    connect(url: string): Promise<void>;
    disconnect(): Promise<void>;
    publish(eventType: EventType, data: any, routingKey?: string): Promise<void>;
    subscribe(pattern: string, handler: (event: Event) => Promise<void>, queueName?: string): Promise<void>;
    createQueue(queueName: string, options?: any): Promise<void>;
    bindQueue(queueName: string, pattern: string): Promise<void>;
    private generateEventId;
    isHealthy(): Promise<boolean>;
}
export declare const getEventBus: (serviceName: string) => EventBus;
export default EventBus;
//# sourceMappingURL=event-bus.d.ts.map