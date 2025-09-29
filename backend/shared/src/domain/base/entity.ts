/**
 * Entity Base Class - Domain-Driven Design
 * Provides identity and equality for domain entities
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance DDD
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Abstract base class for all domain entities
 * Provides identity and equality semantics
 */
export abstract class Entity<T> {
  protected readonly _id: string;
  protected props: T;

  protected constructor(props: T, id?: string) {
    this._id = id || uuidv4();
    this.props = props;
  }

  /**
   * Get entity ID
   */
  get id(): string {
    return this._id;
  }

  /**
   * Check equality with another entity
   * Entities are equal if they have the same ID
   */
  public equals(entity?: Entity<T>): boolean {
    if (entity === null || entity === undefined) {
      return false;
    }

    if (this === entity) {
      return true;
    }

    if (!(entity instanceof Entity)) {
      return false;
    }

    return this._id === entity._id;
  }

  /**
   * Get entity properties (for serialization)
   */
  public getProps(): T {
    return { ...this.props };
  }

  /**
   * Convert entity to plain object
   */
  public toPlainObject(): any {
    return {
      id: this._id,
      ...this.props,
    };
  }
}
