/**
 * InvoiceUpdatedEvent - Domain Event
 * Raised when an invoice is updated
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */
import { DomainEvent } from '../../../../shared/domain/base/domain-event';
export declare class InvoiceUpdatedEvent extends DomainEvent {
    readonly invoiceId: string;
    readonly patientId: string;
    readonly updateType: string;
    readonly updateDetails: any;
    readonly updatedBy: string;
    constructor(invoiceId: string, patientId: string, updateType: string, updateDetails: any, updatedBy: string);
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
}
//# sourceMappingURL=InvoiceUpdatedEvent.d.ts.map