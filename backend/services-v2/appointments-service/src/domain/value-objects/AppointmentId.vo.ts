/**
 * AppointmentId Value Object - Domain Layer
 * V3 Clean Architecture + DDD Implementation
 * Format: XXXX-APT-XXXXXX-XXX (matches database appointment_id column)
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */

import { HealthcareValueObject } from '@shared/domain/base/value-object';

export interface AppointmentIdProps {
  value: string;
}

/**
 * AppointmentId Value Object
 * Unique identifier for appointments
 * Format: XXXX-APT-XXXXXX-XXX
 * Example: 2025-APT-010001-001
 */
export class AppointmentId extends HealthcareValueObject<AppointmentIdProps> {
  private constructor(props: AppointmentIdProps) {
    super(props);
  }

  /**
   * Create AppointmentId from string
   */
  public static create(value: string): AppointmentId {
    if (!AppointmentId.isValid(value)) {
      throw new Error(
        `Invalid appointment ID format: ${value}. Expected format: XXXX-APT-XXXXXX-XXX`
      );
    }

    return new AppointmentId({ value: value.toUpperCase() });
  }

  /**
   * Generate new AppointmentId
   * Format: YYYY-APT-MMDDSS-NNN
   * YYYY: Year
   * MM: Month
   * DD: Day
   * SS: Second (for uniqueness)
   * NNN: Random 3-digit number
   */
  public static generate(): AppointmentId {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const second = String(now.getSeconds()).padStart(2, '0');
    const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');

    const value = `${year}-APT-${month}${day}${second}-${random}`;
    return new AppointmentId({ value });
  }

  /**
   * Validate value object format (required by ValueObject base class)
   */
  protected validateFormat(): void {
    if (!AppointmentId.isValid(this.props.value)) {
      throw new Error(
        `Invalid appointment ID format: ${this.props.value}. Expected format: XXXX-APT-XXXXXX-XXX`
      );
    }
  }

  /**
   * Validate appointment ID format
   */
  private static isValid(value: string): boolean {
    // Format: XXXX-APT-XXXXXX-XXX
    const regex = /^\d{4}-APT-\d{6}-\d{3}$/;
    return regex.test(value);
  }

  /**
   * Get appointment ID value
   */
  get value(): string {
    return this.props.value;
  }

  /**
   * Extract year from appointment ID
   */
  get year(): number {
    return parseInt(this.props.value.substring(0, 4));
  }

  /**
   * Extract month from appointment ID
   */
  get month(): number {
    return parseInt(this.props.value.substring(8, 10));
  }

  /**
   * Extract day from appointment ID
   */
  get day(): number {
    return parseInt(this.props.value.substring(10, 12));
  }

  /**
   * Healthcare-specific: Contains PHI
   */
  override containsPHI(): boolean {
    return false; // Appointment ID itself doesn't contain PHI
  }

  /**
   * Anonymize for logging
   */
  override anonymize(): AppointmentId {
    return this; // Appointment ID is already anonymized
  }

  /**
   * String representation
   */
  override toString(): string {
    return this.props.value;
  }
}

