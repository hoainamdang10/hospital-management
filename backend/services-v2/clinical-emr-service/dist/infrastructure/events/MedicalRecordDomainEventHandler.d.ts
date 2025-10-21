/**
 * MedicalRecordDomainEventHandler - Domain Event Handler
 * Handles domain events from Medical Record Aggregate
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */
import { DomainEvent } from '../../../shared/domain/base/domain-event';
import { IEventHandler } from '../../../shared/events/event-handler.interface';
import { ILogger } from '../../../shared/infrastructure/logging/logger.interface';
import { IAuditService } from '../../../shared/application/services/audit.service.interface';
import { IEventBus } from '../../../shared/events/event-bus.interface';
export interface MedicalRecordDomainEventHandlerConfig {
    logger: ILogger;
    auditService: IAuditService;
    eventBus: IEventBus;
}
/**
 * Domain Event Handler for Medical Record Events
 * Follows pattern from SchedulingEventHandler
 */
export declare class MedicalRecordDomainEventHandler implements IEventHandler<DomainEvent> {
    private readonly logger;
    private readonly auditService;
    private readonly eventBus;
    constructor(config: MedicalRecordDomainEventHandlerConfig);
    /**
     * Handle domain events
     */
    handle(event: DomainEvent): Promise<void>;
    /**
     * Handle MedicalRecordCreated event
     */
    private handleMedicalRecordCreated;
    /**
     * Handle MedicalRecordUpdated event
     */
    private handleMedicalRecordUpdated;
    /**
     * Check if handler can handle the event type
     */
    canHandle(eventType: string): boolean;
    /**
     * Get handler status
     */
    getStatus(): any;
}
//# sourceMappingURL=MedicalRecordDomainEventHandler.d.ts.map