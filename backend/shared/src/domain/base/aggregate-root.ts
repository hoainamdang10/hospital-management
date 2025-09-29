/**
 * Aggregate Root Base Class - Domain-Driven Design
 * Provides common functionality for all aggregates
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance DDD, Event Sourcing
 */

import { Entity } from './entity';
import { DomainEvent } from '../events/domain-event';

/**
 * Abstract base class for all aggregate roots
 * Manages domain events and provides common aggregate functionality
 */
export abstract class AggregateRoot<T> extends Entity<T> {
  private _domainEvents: DomainEvent[] = [];
  private _version: number = 0;

  protected constructor(props: T, id?: string) {
    super(props, id);
  }

  /**
   * Add domain event to be published
   */
  protected addDomainEvent(domainEvent: DomainEvent): void {
    this._domainEvents.push(domainEvent);
  }

  /**
   * Get all unpublished domain events
   */
  public getUncommittedEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }

  /**
   * Mark all domain events as published
   */
  public markEventsAsCommitted(): void {
    this._domainEvents = [];
  }

  /**
   * Get aggregate version for optimistic concurrency control
   */
  public getVersion(): number {
    return this._version;
  }

  /**
   * Set aggregate version (used when reconstituting from events)
   */
  public setVersion(version: number): void {
    this._version = version;
  }

  /**
   * Increment version (called after event is persisted)
   */
  public incrementVersion(): void {
    this._version++;
  }

  /**
   * Check if aggregate has uncommitted events
   */
  public hasUncommittedEvents(): boolean {
    return this._domainEvents.length > 0;
  }

  /**
   * Get the number of uncommitted events
   */
  public getUncommittedEventCount(): number {
    return this._domainEvents.length;
  }

  /**
   * Clear all domain events (use with caution)
   */
  protected clearEvents(): void {
    this._domainEvents = [];
  }

  /**
   * Apply domain event to aggregate state
   * Used for event sourcing reconstruction
   */
  public abstract applyEvent(event: DomainEvent): void;

  /**
   * Get aggregate type name for event sourcing
   */
  public abstract getAggregateType(): string;

  /**
   * Create snapshot of current aggregate state
   */
  public abstract createSnapshot(): any;

  /**
   * Restore aggregate from snapshot
   */
  public abstract restoreFromSnapshot(snapshot: any): void;
}
