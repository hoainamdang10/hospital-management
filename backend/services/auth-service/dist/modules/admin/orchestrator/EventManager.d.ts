import { EventEmitter } from 'events';
import { Logger } from 'winston';
import { RabbitMQClient } from './infrastructure/RabbitMQClient';
export interface OrchestrationEvent {
    id: string;
    type: string;
    source: string;
    timestamp: Date;
    data: any;
    correlationId?: string;
    userId?: string;
}
export interface EventSubscription {
    id: string;
    eventType: string;
    handler: (event: OrchestrationEvent) => Promise<void>;
    filter?: (event: OrchestrationEvent) => boolean;
    retryCount: number;
    maxRetries: number;
}
export declare class EventManager extends EventEmitter {
    private logger;
    private rabbitmq;
    private subscriptions;
    private eventHistory;
    private maxHistorySize;
    static readonly EVENTS: {
        readonly OPERATION_STARTED: "operation.started";
        readonly OPERATION_COMPLETED: "operation.completed";
        readonly OPERATION_FAILED: "operation.failed";
        readonly OPERATION_CANCELLED: "operation.cancelled";
        readonly SAGA_STARTED: "saga.started";
        readonly SAGA_COMPLETED: "saga.completed";
        readonly SAGA_FAILED: "saga.failed";
        readonly SAGA_COMPENSATING: "saga.compensating";
        readonly WORKFLOW_STARTED: "workflow.started";
        readonly WORKFLOW_COMPLETED: "workflow.completed";
        readonly WORKFLOW_FAILED: "workflow.failed";
        readonly WORKFLOW_PAUSED: "workflow.paused";
        readonly WORKFLOW_RESUMED: "workflow.resumed";
        readonly SERVICE_UNAVAILABLE: "service.unavailable";
        readonly SERVICE_RECOVERED: "service.recovered";
        readonly SYSTEM_MAINTENANCE_STARTED: "system.maintenance.started";
        readonly SYSTEM_MAINTENANCE_COMPLETED: "system.maintenance.completed";
        readonly BULK_OPERATION_PROGRESS: "bulk.operation.progress";
        readonly NOTIFICATION_SENT: "notification.sent";
        readonly NOTIFICATION_FAILED: "notification.failed";
    };
    constructor(logger: Logger, rabbitmq: RabbitMQClient);
    private setupRabbitMQEventHandling;
    private handleIncomingEvent;
    emitEvent(type: string, data: any, source?: string, correlationId?: string, userId?: string): Promise<void>;
    private processEvent;
    private executeHandler;
    subscribe(eventType: string, handler: (event: OrchestrationEvent) => Promise<void>, options?: {
        filter?: (event: OrchestrationEvent) => boolean;
        maxRetries?: number;
    }): string;
    unsubscribe(subscriptionId: string): boolean;
    private addToHistory;
    getEventHistory(filter?: {
        type?: string;
        source?: string;
        correlationId?: string;
        userId?: string;
        since?: Date;
        limit?: number;
    }): OrchestrationEvent[];
    getEventStatistics(): {
        totalEvents: number;
        eventsByType: Record<string, number>;
        eventsBySource: Record<string, number>;
        recentEvents: number;
        activeSubscriptions: number;
    };
    clearHistory(): void;
    healthCheck(): Promise<{
        status: string;
        subscriptions: number;
        eventHistory: number;
        rabbitmqConnected: boolean;
    }>;
    setupDefaultHandlers(): void;
}
//# sourceMappingURL=EventManager.d.ts.map