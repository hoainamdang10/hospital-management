/**
 * PaymentPlanId - Value Object
 * Unique identifier for payment plans
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance DDD, Value Object Pattern
 */

import { v4 as uuidv4 } from 'uuid';

export class PaymentPlanId {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  public static create(): PaymentPlanId {
    const uuid = uuidv4();
    return new PaymentPlanId(`PLAN-${uuid}`);
  }

  public static fromString(value: string): PaymentPlanId {
    if (!value || value.trim().length === 0) {
      throw new Error('PaymentPlanId cannot be empty');
    }
    return new PaymentPlanId(value);
  }

  public get value(): string {
    return this._value;
  }

  public equals(other: PaymentPlanId): boolean {
    if (!other) {
      return false;
    }
    return this._value === other._value;
  }

  public toString(): string {
    return this._value;
  }
}

