/**
 * MedicalImagingId - Value Object
 * Unique identifier for medical imaging records
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance DDD, Value Object Pattern
 */

import { v4 as uuidv4 } from 'uuid';

export class MedicalImagingId {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  get value(): string {
    return this._value;
  }

  /**
   * Create new MedicalImagingId
   */
  public static create(): MedicalImagingId {
    const uuid = uuidv4();
    return new MedicalImagingId(`IMG-${uuid}`);
  }

  /**
   * Create MedicalImagingId from existing string
   */
  public static fromString(value: string): MedicalImagingId {
    if (!value || value.trim().length === 0) {
      throw new Error('MedicalImagingId cannot be empty');
    }

    if (!value.startsWith('IMG-')) {
      throw new Error('MedicalImagingId must start with IMG- prefix');
    }

    return new MedicalImagingId(value);
  }

  /**
   * Check equality
   */
  public equals(other: MedicalImagingId): boolean {
    if (!other) {
      return false;
    }
    return this._value === other._value;
  }

  /**
   * Convert to string
   */
  public toString(): string {
    return this._value;
  }
}

