/**
 * PatientDomainEventHandler - Domain Event Handler
 * V2 Clean Architecture + DDD Implementation
 * Handles domain events from Patient Aggregate with Vietnamese healthcare compliance
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture, Vietnamese Healthcare Standards
 */
import { ILogger } from '../../../../shared/application/services/logger.interface';
export interface PatientDomainEventHandlerConfig {
    logger: ILogger;
}
/**
 * Domain Event Handler for Patient Events
 * Simplified implementation - full event bus integration pending
 */
export declare class PatientDomainEventHandler {
    private readonly logger;
    constructor(config: PatientDomainEventHandlerConfig);
    /**
     * Handle domain events
     */
    handle(event: any): Promise<void>;
    /**
     * Handle PatientRegistered event
     */
    private handlePatientRegistered;
    /**
     * Handle PatientUpdated event
     */
    private handlePatientUpdated;
    /**
     * Handle PatientConsentGranted event
     */
    private handlePatientConsentGranted;
    /**
     * Check if updated fields contain critical information
     */
    private hasCriticalInfoChanges;
    /**
     * Handle PatientMerged event
     */
    private handlePatientMerged;
    /**
     * Handle PatientLinked event
     */
    private handlePatientLinked;
    /**
     * Handle PatientDeactivated event
     */
    private handlePatientDeactivated;
    /**
     * Check if handler can handle the event type
     */
    canHandle(eventType: string): boolean;
    /**
     * Get handler status
     */
    getStatus(): any;
}
//# sourceMappingURL=PatientDomainEventHandler.d.ts.map