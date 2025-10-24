/**
 * Event Subscriptions Setup
 * Configures event subscriptions for Scheduling Service
 *
 * @author Hospital Management Team
 * @version 3.0.0
 */
import { IEventBus, EventBusConfig } from '../../../../shared/infrastructure/event-bus/EventBus';
import { AppointmentReadModelEventHandler } from './AppointmentReadModelEventHandler';
/**
 * Setup event subscriptions for Scheduling Service
 */
export declare class EventSubscriptions {
    private readModelHandler;
    private config;
    private eventBus;
    private isConnected;
    private schedulerHandlers;
    private staffScheduleUpdatedHandler;
    constructor(readModelHandler: AppointmentReadModelEventHandler, config: EventBusConfig);
    /**
     * Connect to event bus and setup subscriptions
     */
    connect(): Promise<void>;
    /**
     * Disconnect from event bus
     */
    disconnect(): Promise<void>;
    /**
     * Setup all event subscriptions
     */
    private setupSubscriptions;
    /**
     * Get event bus instance
     */
    getEventBus(): IEventBus;
    /**
     * Check if connected
     */
    isEventBusConnected(): boolean;
}
/**
 * Create event subscriptions instance
 */
export declare function createEventSubscriptions(readModelHandler: AppointmentReadModelEventHandler): EventSubscriptions;
//# sourceMappingURL=EventSubscriptions.d.ts.map