/**
 * PaymentPlanCreatedEvent - Domain Event
 * Published when a new payment plan is created
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance DDD, Event-Driven Architecture
 */
import { DomainEvent } from '../../../../shared/domain/DomainEvent';
export interface PaymentPlanCreatedEventPayload {
    planId: string;
    patientId: string;
    invoiceId: string;
    totalAmount: number;
    numberOfInstallments: number;
    timestamp: Date;
}
export declare class PaymentPlanCreatedEvent extends DomainEvent<PaymentPlanCreatedEventPayload> {
    constructor(payload: PaymentPlanCreatedEventPayload);
}
//# sourceMappingURL=PaymentPlanCreatedEvent.d.ts.map