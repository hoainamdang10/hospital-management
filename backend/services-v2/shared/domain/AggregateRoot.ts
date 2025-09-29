/**
 * Aggregate Root Base Class
 * Clean Architecture + DDD Implementation
 */

import { Entity } from './Entity';
import { DomainEvent } from './DomainEvent';

export abstract class AggregateRoot<T> extends Entity<T> {
  private _domainEvents: DomainEvent[] = [];

  protected constructor(props: T) {
    super(props);
  }

  public addDomainEvent(domainEvent: DomainEvent): void {
    this._domainEvents.push(domainEvent);
  }

  public getDomainEvents(): DomainEvent[] {
    return this._domainEvents.slice();
  }

  public clearDomainEvents(): void {
    this._domainEvents = [];
  }

  public hasDomainEvents(): boolean {
    return this._domainEvents.length > 0;
  }
}
