/**
 * BillingDomainEventHandler - Domain Event Handler
 * V2 Clean Architecture + DDD Implementation
 * Handles domain events from Billing Aggregate with Vietnamese healthcare compliance
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
export interface BillingDomainEventHandlerConfig {
    logger: ILogger;
    auditService: IAuditService;
    eventBus: IEventBus;
}
/**
 * Domain Event Handler for Billing Events
 * Follows pattern from Clinical EMR MedicalRecordDomainEventHandler
 */
export declare class BillingDomainEventHandler implements IEventHandler<DomainEvent> {
    private readonly logger;
    private readonly auditService;
    private readonly eventBus;
    constructor(config: BillingDomainEventHandlerConfig);
    /**
     * Handle domain events
     */
    handle(event: DomainEvent): Promise<void>;
    /**
     * Handle InvoiceCreated event
     */
    private handleInvoiceCreated;
    /**
     * Handle PaymentProcessed event
     */
    private handlePaymentProcessed;
    /**
     * Handle InvoiceUpdated event
     */
    private handleInvoiceUpdated;
    /**
     * Handle InsuranceClaimSubmitted event
     */
    private handleInsuranceClaimSubmitted;
    /**
     * Check if handler can handle the event type
     */
    canHandle(eventType: string): boolean;
    /**
     * Get handler status
     */
    getStatus(): any;
}
//# sourceMappingURL=BillingDomainEventHandler.d.ts.map