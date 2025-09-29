/**
 * Value Object Base Class - Clean Architecture + DDD
 * Enhanced version with healthcare-specific features
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, HIPAA, Vietnamese Healthcare Standards
 */

/**
 * Abstract Value Object Base Class
 */
export abstract class ValueObject<T> {
  protected readonly props: T;

  protected constructor(props: T) {
    this.props = Object.freeze(props);
    this.validateFormat();
  }

  /**
   * Validate value object format and business rules
   */
  protected abstract validateFormat(): void;

  /**
   * Check if this value object equals another
   */
  public equals(other: ValueObject<T>): boolean {
    if (!other || other.constructor !== this.constructor) {
      return false;
    }

    return this.deepEquals(this.props, other.props);
  }

  /**
   * Deep equality check for complex objects
   */
  private deepEquals(a: any, b: any): boolean {
    if (a === b) return true;
    
    if (a == null || b == null) return false;
    
    if (typeof a !== typeof b) return false;
    
    if (typeof a === 'object') {
      if (Array.isArray(a) !== Array.isArray(b)) return false;
      
      if (Array.isArray(a)) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
          if (!this.deepEquals(a[i], b[i])) return false;
        }
        return true;
      }
      
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      
      if (keysA.length !== keysB.length) return false;
      
      for (const key of keysA) {
        if (!keysB.includes(key)) return false;
        if (!this.deepEquals(a[key], b[key])) return false;
      }
      
      return true;
    }
    
    return false;
  }

  /**
   * Get hash code for this value object
   */
  public hashCode(): string {
    return JSON.stringify(this.props);
  }

  /**
   * Convert to string representation
   */
  public toString(): string {
    return JSON.stringify(this.props);
  }

  /**
   * Get a copy of the props (defensive copy)
   */
  protected getProps(): T {
    return { ...this.props };
  }
}

/**
 * Healthcare Value Object Base Class
 * Specialized for healthcare domain with HIPAA compliance
 */
export abstract class HealthcareValueObject<T> extends ValueObject<T> {
  protected constructor(props: T) {
    super(props);
  }

  /**
   * Check if this value object contains PHI (Protected Health Information)
   */
  public abstract containsPHI(): boolean;

  /**
   * Get anonymized version for logging/audit purposes
   */
  public abstract anonymize(): HealthcareValueObject<T>;

  /**
   * Validate healthcare-specific business rules
   */
  protected validateHealthcareRules(): void {
    // Common healthcare validations can be added here
  }

  /**
   * Get HIPAA audit information
   */
  public getHIPAAAuditInfo(): HIPAAAuditInfo {
    return {
      valueObjectType: this.constructor.name,
      containsPHI: this.containsPHI(),
      accessedAt: new Date(),
      auditType: 'VALUE_OBJECT_ACCESS'
    };
  }
}

/**
 * HIPAA Audit Information Interface
 */
export interface HIPAAAuditInfo {
  valueObjectType: string;
  containsPHI: boolean;
  accessedAt: Date;
  auditType: string;
}

/**
 * Vietnamese Healthcare Value Object
 * Specialized for Vietnamese healthcare standards
 */
export abstract class VietnameseHealthcareValueObject<T> extends HealthcareValueObject<T> {
  protected constructor(props: T) {
    super(props);
    this.validateVietnameseStandards();
  }

  /**
   * Validate Vietnamese healthcare standards
   */
  protected abstract validateVietnameseStandards(): void;

  /**
   * Get Vietnamese display name
   */
  public abstract getVietnameseDisplayName(): string;

  /**
   * Check if value object is valid according to Vietnamese standards
   */
  public abstract isValid(): boolean;
}
