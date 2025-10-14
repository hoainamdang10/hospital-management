/**
 * Aggregate Root Base Class
 * Clean Architecture + DDD Implementation
 */
import { Entity } from './Entity';
import { DomainEvent } from './DomainEvent';
export declare abstract class AggregateRoot<T> extends Entity<T> {
    private _domainEvents;
    protected constructor(props: T);
    addDomainEvent(domainEvent: DomainEvent): void;
    getDomainEvents(): DomainEvent[];
    clearDomainEvents(): void;
    hasDomainEvents(): boolean;
}
//# sourceMappingURL=AggregateRoot.d.ts.map