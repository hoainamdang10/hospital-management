/**
 * Entity Base Class
 * Clean Architecture + DDD Implementation
 */

export abstract class Entity<T> {
  protected readonly props: T;

  protected constructor(props: T) {
    this.props = props;
  }

  public abstract equals(other: Entity<T>): boolean;
}
