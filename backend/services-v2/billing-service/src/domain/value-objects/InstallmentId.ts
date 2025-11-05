/**
 * InstallmentId - Value Object
 * Unique identifier for installments
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance DDD, Value Object Pattern
 */

import { v4 as uuidv4 } from 'uuid';

export class InstallmentId {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  public static create(): InstallmentId {
    const uuid = uuidv4();
    return new InstallmentId(`INST-${uuid}`);
  }

  public static fromString(value: string): InstallmentId {
    if (!value || value.trim().length === 0) {
      throw new Error('InstallmentId cannot be empty');
    }
    return new InstallmentId(value);
  }

  public get value(): string {
    return this._value;
  }

  public equals(other: InstallmentId): boolean {
    if (!other) {
      return false;
    }
    return this._value === other._value;
  }

  public toString(): string {
    return this._value;
  }
}

