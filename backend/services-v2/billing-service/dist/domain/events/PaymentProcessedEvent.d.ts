/**
 * PaymentProcessedEvent - Domain Event
 * Raised when a payment is processed for an invoice
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */
import { IDomainEvent } from '../../../../shared/domain/events/IDomainEvent';
export declare class PaymentProcessedEvent implements IDomainEvent {
    readonly invoiceId: string;
    readonly patientId: string;
    readonly paymentId: string;
    readonly amount: number;
    readonly currency: string;
    readonly paymentMethod: string;
    readonly transactionId: string | undefined;
    readonly processedBy: string;
    readonly eventId: string;
    readonly aggregateId: string;
    readonly occurredAt: Date;
    readonly eventVersion: number;
    constructor(invoiceId: string, patientId: string, paymentId: string, amount: number, currency: string, paymentMethod: string, transactionId: string | undefined, processedBy: string, occurredAt: Date);
    /**
     * Get event name
     */
    getEventName(): string;
    /**
     * Get aggregate type
     */
    getAggregateType(): string;
    /**
     * Get Vietnamese payment method
     */
    getVietnamesePaymentMethod(): string;
    /**
     * Format amount for Vietnamese display
     */
    getVietnameseAmountDisplay(): string;
    /**
     * Get event data
     */
    getEventData(): any;
    /**
     * Check if payment is via PayOS
     */
    isPayOSPayment(): boolean;
    /**
     * Check if payment is cash
     */
    isCashPayment(): boolean;
    /**
     * Check if payment is via insurance
     */
    isInsurancePayment(): boolean;
    /**
     * Get payment category for reporting
     */
    getPaymentCategory(): 'electronic' | 'cash' | 'insurance';
    /**
     * Serialize to JSON
     */
    toJSON(): any;
}
//# sourceMappingURL=PaymentProcessedEvent.d.ts.map