/**
 * Value Object Base Class
 * Clean Architecture + DDD Implementation
 */

export abstract class ValueObject<T> {
  protected readonly props: T;

  protected constructor(props: T) {
    this.props = props;
  }

  public abstract equals(other: ValueObject<T>): boolean;
}
