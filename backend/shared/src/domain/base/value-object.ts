/**
 * Value Object Base Class - Domain-Driven Design
 * Provides immutability and equality for value objects
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance DDD
 */

/**
 * Abstract base class for all value objects
 * Value objects are immutable and compared by value equality
 */
export abstract class ValueObject<T> {
  protected readonly props: T;

  protected constructor(props: T) {
    this.props = Object.freeze(props);
  }

  /**
   * Check equality with another value object
   * Value objects are equal if all their properties are equal
   */
  public equals(vo?: ValueObject<T>): boolean {
    if (vo === null || vo === undefined) {
      return false;
    }

    if (vo.props === undefined) {
      return false;
    }

    return this.deepEquals(this.props, vo.props);
  }

  /**
   * Get value object properties
   */
  public getProps(): T {
    return this.props;
  }

  /**
   * Convert value object to plain object
   */
  public toPlainObject(): any {
    return { ...this.props };
  }

  /**
   * Deep equality check for nested objects
   */
  private deepEquals(obj1: any, obj2: any): boolean {
    if (obj1 === obj2) {
      return true;
    }

    if (obj1 == null || obj2 == null) {
      return false;
    }

    if (typeof obj1 !== typeof obj2) {
      return false;
    }

    if (typeof obj1 !== 'object') {
      return obj1 === obj2;
    }

    if (Array.isArray(obj1) !== Array.isArray(obj2)) {
      return false;
    }

    if (Array.isArray(obj1)) {
      if (obj1.length !== obj2.length) {
        return false;
      }
      for (let i = 0; i < obj1.length; i++) {
        if (!this.deepEquals(obj1[i], obj2[i])) {
          return false;
        }
      }
      return true;
    }

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) {
      return false;
    }

    for (const key of keys1) {
      if (!keys2.includes(key)) {
        return false;
      }
      if (!this.deepEquals(obj1[key], obj2[key])) {
        return false;
      }
    }

    return true;
  }

  /**
   * Abstract method to validate value object
   */
  public abstract isValid(): boolean;
}
