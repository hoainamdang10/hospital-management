/**
 * InvoiceCreatedEvent - Domain Event
 * Raised when a new invoice is created
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */
import { IDomainEvent } from '../../../../shared/domain/events/IDomainEvent';
export declare class InvoiceCreatedEvent implements IDomainEvent {
    readonly invoiceId: string;
    readonly patientId: string;
    readonly medicalRecordId: string;
    readonly doctorId: string;
    readonly appointmentId: string;
    readonly issuedBy: string;
    readonly eventId: string;
    readonly aggregateId: string;
    readonly occurredAt: Date;
    readonly eventVersion: number;
    constructor(invoiceId: string, patientId: string, medicalRecordId: string, doctorId: string, appointmentId: string, issuedBy: string, occurredAt: Date);
    /**
     * Get event name
     */
    getEventName(): string;
    /**
     * Get aggregate type
     */
    getAggregateType(): string;
    /**
     * Get event data
     */
    getEventData(): any;
    /**
     * Serialize to JSON
     */
    toJSON(): any;
}
//# sourceMappingURL=InvoiceCreatedEvent.d.ts.map