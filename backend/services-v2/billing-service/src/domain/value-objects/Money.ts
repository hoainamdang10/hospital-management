import { ValueObject } from '@shared/domain/base/value-object';

export interface MoneyProps {
  amount: number;
  currency: string;
}

export class Money extends ValueObject<MoneyProps> {
  private readonly allowNegative: boolean;

  private constructor(props: MoneyProps, allowNegative: boolean = false) {
    super(props);
    this.allowNegative = allowNegative;
  }

  /**
   * Create Money with positive amount only
   * Use this for regular payments, invoices, etc.
   */
  public static create(amount: number, currency: string = 'VND'): Money {
    if (amount < 0) {
      throw new Error('Amount cannot be negative');
    }
    return new Money({ amount, currency }, false);
  }

  /**
   * Create Money with signed amount (positive or negative)
   * Use this for refunds, adjustments, etc.
   */
  public static createSigned(amount: number, currency: string = 'VND'): Money {
    return new Money({ amount, currency }, true);
  }

  public static zero(currency: string = 'VND'): Money {
    return new Money({ amount: 0, currency }, false);
  }

  get amount(): number {
    return this.props.amount;
  }

  get currency(): string {
    return this.props.currency;
  }

  public add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error('Cannot add money with different currencies');
    }
    const result = this.amount + other.amount;
    // Use createSigned if either operand allows negative or result is negative
    if (this.allowNegative || other.allowNegative || result < 0) {
      return Money.createSigned(result, this.currency);
    }
    return Money.create(result, this.currency);
  }

  public subtract(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error('Cannot subtract money with different currencies');
    }
    const result = this.amount - other.amount;
    // Use createSigned if either operand allows negative or result is negative
    if (this.allowNegative || other.allowNegative || result < 0) {
      return Money.createSigned(result, this.currency);
    }
    return Money.create(result, this.currency);
  }

  public multiply(factor: number): Money {
    const result = this.amount * factor;
    // Use createSigned if original allows negative or result is negative
    if (this.allowNegative || result < 0) {
      return Money.createSigned(result, this.currency);
    }
    return Money.create(result, this.currency);
  }

  protected validateFormat(): void {
    // Only validate negative amounts if not explicitly allowed
    if (!this.allowNegative && this.props.amount < 0) {
      throw new Error('Amount cannot be negative');
    }
    if (!this.props.currency || this.props.currency.trim().length === 0) {
      throw new Error('Currency cannot be empty');
    }
  }
}
