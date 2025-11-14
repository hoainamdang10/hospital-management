import { IEventPublisher, DomainEvent as AppDomainEvent } from '../../application/services/IEventPublisher';
import { IEventBus } from '../../../../shared/infrastructure/event-bus/EventBus';
export declare class EventBusPublisher implements IEventPublisher {
    private readonly eventBus;
    constructor(eventBus: IEventBus);
    publish(event: AppDomainEvent): Promise<void>;
    publishBatch(events: AppDomainEvent[]): Promise<void>;
    isConnected(): boolean;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
}
//# sourceMappingURL=EventBusPublisher.d.ts.map