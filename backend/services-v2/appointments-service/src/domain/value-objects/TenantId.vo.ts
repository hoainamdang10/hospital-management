/**
 * TenantId Value Object - Domain Layer
 * Multi-tenancy support for appointments service
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD
 */

import { HealthcareValueObject } from '@shared/domain/base/value-object';

export interface TenantIdProps {
  value: string;
}

/**
 * TenantId Value Object
 * Represents tenant identifier for multi-tenancy isolation
 */
export class TenantId extends HealthcareValueObject<TenantIdProps> {
  private constructor(props: TenantIdProps) {
    super(props);
  }

  /**
   * Create TenantId from string
   */
  public static create(value: string): TenantId {
    TenantId.validate(value);
    return new TenantId({ value });
  }

  /**
   * Create default tenant (hospital-1)
   */
  public static createDefault(): TenantId {
    return new TenantId({ value: 'hospital-1' });
  }

  /**
   * Validate value object format (required by ValueObject base class)
   */
  protected validateFormat(): void {
    TenantId.validate(this.props.value);
  }

  /**
   * Validate tenant ID format
   */
  private static validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new Error('Tenant ID cannot be empty');
    }

    if (value.length > 100) {
      throw new Error('Tenant ID cannot exceed 100 characters');
    }

    // Allow alphanumeric, hyphens, underscores
    const validPattern = /^[a-zA-Z0-9_-]+$/;
    if (!validPattern.test(value)) {
      throw new Error('Tenant ID can only contain alphanumeric characters, hyphens, and underscores');
    }
  }

  /**
   * Get tenant ID value
   */
  get value(): string {
    return this.props.value;
  }

  /**
   * Healthcare-specific: Contains PHI
   */
  override containsPHI(): boolean {
    return false; // Tenant ID is not PHI
  }

  /**
   * Anonymize for logging
   */
  override anonymize(): TenantId {
    return this; // Tenant ID is already anonymized
  }

  /**
   * String representation
   */
  override toString(): string {
    return this.props.value;
  }
}

