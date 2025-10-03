/**
 * PatientDomainEventHandler - Domain Event Handler
 * V2 Clean Architecture + DDD Implementation
 * Handles domain events from Patient Aggregate with Vietnamese healthcare compliance
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture, Vietnamese Healthcare Standards
 */
import { DomainEvent } from '../../../../shared/domain/base/domain-event';
import { IEventHandler } from '../../../../shared/events/event-handler.interface';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
import { IAuditService } from '../../../../shared/application/services/audit.service.interface';
import { IEventBus } from '../../../../shared/events/event-bus.interface';
export interface PatientDomainEventHandlerConfig {
    logger: ILogger;
    auditService: IAuditService;
    eventBus: IEventBus;
}
/**
 * Domain Event Handler for Patient Events
 * Follows pattern from other V2 services
 */
export declare class PatientDomainEventHandler implements IEventHandler<DomainEvent> {
    private readonly logger;
    private readonly auditService;
    private readonly eventBus;
    constructor(config: PatientDomainEventHandlerConfig);
    /**
     * Handle domain events
     */
    handle(event: DomainEvent): Promise<void>;
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
     * Check if handler can handle the event type
     */
    canHandle(eventType: string): boolean;
    /**
     * Get handler status
     */
    getStatus(): any;
}
//# sourceMappingURL=PatientDomainEventHandler.d.ts.map