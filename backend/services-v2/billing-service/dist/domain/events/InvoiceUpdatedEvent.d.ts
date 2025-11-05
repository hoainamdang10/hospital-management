/**
 * InvoiceUpdatedEvent - Domain Event
 * Raised when an invoice is updated
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */
import { IDomainEvent } from '../../../../shared/domain/events/IDomainEvent';
export declare class InvoiceUpdatedEvent implements IDomainEvent {
    readonly invoiceId: string;
    readonly patientId: string;
    readonly updateType: string;
    readonly updateDetails: any;
    readonly updatedBy: string;
    readonly eventId: string;
    readonly aggregateId: string;
    readonly occurredAt: Date;
    readonly eventVersion: number;
    constructor(invoiceId: string, patientId: string, updateType: string, updateDetails: any, updatedBy: string, occurredAt: Date);
    /**
     * Get event name
     */
    getEventName(): string;
    /**
     * Get aggregate type
     */
    getAggregateType(): string;
    /**
     * Get Vietnamese update type
     */
    getVietnameseUpdateType(): string;
    /**
     * Get event data
     */
    getEventData(): any;
    /**
     * Serialize to JSON
     */
    toJSON(): any;
}
//# sourceMappingURL=InvoiceUpdatedEvent.d.ts.map