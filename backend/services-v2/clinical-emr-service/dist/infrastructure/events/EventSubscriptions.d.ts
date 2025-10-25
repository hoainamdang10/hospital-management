/**
 * Event Subscriptions Setup - Infrastructure Layer
 * Configures event subscriptions for Clinical EMR Service
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture, DDD
 */
import { IEventBus, EventBusConfig } from '../../../shared/infrastructure/event-bus/EventBus';
import { ClinicalEMREventHandler } from './ClinicalEMREventHandler';
import { MedicalRecordDomainEventHandler } from './MedicalRecordDomainEventHandler';
import { ILogger } from '../../../shared/infrastructure/logging/logger.interface';
/**
 * Event Subscriptions Manager
 * Manages all event subscriptions for Clinical EMR Service
 */
export declare class EventSubscriptions {
    private clinicalEMREventHandler;
    private medicalRecordDomainEventHandler;
    private config;
    private logger;
    private eventBus;
    private isConnected;
    constructor(clinicalEMREventHandler: ClinicalEMREventHandler, medicalRecordDomainEventHandler: MedicalRecordDomainEventHandler, config: EventBusConfig, logger: ILogger);
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
    /**
     * Get subscription status
     */
    getStatus(): {
        connected: boolean;
        subscriptions: number;
        serviceName: string;
    };
}
/**
 * Create event subscriptions instance
 */
export declare function createEventSubscriptions(clinicalEMREventHandler: ClinicalEMREventHandler, medicalRecordDomainEventHandler: MedicalRecordDomainEventHandler, logger: ILogger): EventSubscriptions;
//# sourceMappingURL=EventSubscriptions.d.ts.map