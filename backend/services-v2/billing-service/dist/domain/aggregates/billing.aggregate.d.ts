/**
 * Billing Aggregate - Domain Layer
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { HealthcareAggregateRoot } from '../../../shared/domain/base/aggregate-root';
import { DomainEvent } from '../../../shared/domain/base/domain-event';
export interface BillingProps {
    id: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare class BillingAggregate extends HealthcareAggregateRoot<BillingProps> {
    private constructor();
    static create(): BillingAggregate;
    protected validateBusinessInvariants(): void;
    protected applyEvent(event: DomainEvent): void;
    getPatientId(): string | null;
    toPersistence(): any;
}
//# sourceMappingURL=billing.aggregate.d.ts.map