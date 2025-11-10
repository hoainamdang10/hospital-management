/**
 * InstallmentPaidEvent - Domain Event
 * Published when an installment is paid
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance DDD, Event-Driven Architecture
 */
import { DomainEvent } from '../../../../shared/domain/DomainEvent';
export interface InstallmentPaidEventPayload {
    planId: string;
    installmentNumber: number;
    amount: number;
    paymentMethod: string;
    timestamp: Date;
}
export declare class InstallmentPaidEvent extends DomainEvent<InstallmentPaidEventPayload> {
    constructor(payload: InstallmentPaidEventPayload);
}
//# sourceMappingURL=InstallmentPaidEvent.d.ts.map