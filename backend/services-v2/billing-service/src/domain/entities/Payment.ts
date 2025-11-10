import { Entity } from '@shared/domain/base/entity';
import { Money } from '../value-objects/Money';

export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'payos' | 'insurance';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface PaymentProps {
  id: string;
  amount: Money;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  paidAt?: Date;
  refundedAt?: Date;
}

export class Payment extends Entity<PaymentProps> {
  private constructor(props: PaymentProps, id?: string) {
    super(props, id);
  }

  public static create(
    amount: Money,
    method: PaymentMethod,
    transactionId?: string,
    id?: string
  ): Payment {
    return new Payment({
      id: id || '',
      amount,
      method,
      status: 'pending',
      transactionId,
      paidAt: undefined,
      refundedAt: undefined
    }, id);
  }

  get amount(): Money {
    return this.props.amount;
  }

  get method(): PaymentMethod {
    return this.props.method;
  }

  get status(): PaymentStatus {
    return this.props.status;
  }

  get transactionId(): string | undefined {
    return this.props.transactionId;
  }

  get paidAt(): Date | undefined {
    return this.props.paidAt;
  }

  public complete(): void {
    if (this.props.status !== 'pending') {
      throw new Error('Can only complete pending payments');
    }
    this.props.status = 'completed';
    this.props.paidAt = new Date();
  }

  public fail(): void {
    if (this.props.status !== 'pending') {
      throw new Error('Can only fail pending payments');
    }
    this.props.status = 'failed';
  }

  public refund(): void {
    if (this.props.status !== 'completed') {
      throw new Error('Can only refund completed payments');
    }
    this.props.status = 'refunded';
    this.props.refundedAt = new Date();
  }

  public validate(): void {
    if (this.props.amount.amount <= 0) {
      throw new Error('Payment amount must be greater than 0');
    }
  }

  public toPersistence(): any {
    return {
      id: this.id,
      amount: this.props.amount.amount,
      currency: this.props.amount.currency,
      method: this.props.method,
      status: this.props.status,
      transactionId: this.props.transactionId,
      paidAt: this.props.paidAt,
      refundedAt: this.props.refundedAt
    };
  }
}
