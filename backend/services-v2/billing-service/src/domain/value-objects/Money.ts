import { ValueObject } from '@shared/domain/base/value-object';

export interface MoneyProps {
  amount: number;
  currency: string;
}

export class Money extends ValueObject<MoneyProps> {
  private constructor(props: MoneyProps) {
    super(props);
  }

  public static create(amount: number, currency: string = 'VND'): Money {
    if (amount < 0) {
      throw new Error('Amount cannot be negative');
    }
    return new Money({ amount, currency });
  }

  public static zero(currency: string = 'VND'): Money {
    return new Money({ amount: 0, currency });
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
    return Money.create(this.amount + other.amount, this.currency);
  }

  public subtract(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error('Cannot subtract money with different currencies');
    }
    return Money.create(this.amount - other.amount, this.currency);
  }

  public multiply(factor: number): Money {
    return Money.create(this.amount * factor, this.currency);
  }

  protected validateFormat(): void {
    if (this.props.amount < 0) {
      throw new Error('Amount cannot be negative');
    }
    if (!this.props.currency || this.props.currency.trim().length === 0) {
      throw new Error('Currency cannot be empty');
    }
  }
}
