/**
 * ConsoleEventPublisher - simple publisher for demo/wiring
 * Implements application IEventPublisher by logging events
 */
import { IEventPublisher, DomainEvent as AppDomainEvent } from '../../application/services/IEventPublisher';
export declare class ConsoleEventPublisher implements IEventPublisher {
    publish(event: AppDomainEvent): Promise<void>;
    publishBatch(events: AppDomainEvent[]): Promise<void>;
    isConnected(): boolean;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
}
//# sourceMappingURL=ConsoleEventPublisher.d.ts.map