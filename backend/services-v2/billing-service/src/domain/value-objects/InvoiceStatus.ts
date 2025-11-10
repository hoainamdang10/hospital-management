import { ValueObject } from '@shared/domain/base/value-object';

export type InvoiceStatusType = 'draft' | 'pending' | 'partially_paid' | 'paid' | 'cancelled' | 'overdue';

export interface InvoiceStatusProps {
  value: InvoiceStatusType;
}

export class InvoiceStatus extends ValueObject<InvoiceStatusProps> {
  private constructor(props: InvoiceStatusProps) {
    super(props);
  }

  public static create(value: InvoiceStatusType): InvoiceStatus {
    return new InvoiceStatus({ value });
  }

  public static draft(): InvoiceStatus {
    return new InvoiceStatus({ value: 'draft' });
  }

  public static pending(): InvoiceStatus {
    return new InvoiceStatus({ value: 'pending' });
  }

  public static partiallyPaid(): InvoiceStatus {
    return new InvoiceStatus({ value: 'partially_paid' });
  }

  public static paid(): InvoiceStatus {
    return new InvoiceStatus({ value: 'paid' });
  }

  public static cancelled(): InvoiceStatus {
    return new InvoiceStatus({ value: 'cancelled' });
  }

  public static overdue(): InvoiceStatus {
    return new InvoiceStatus({ value: 'overdue' });
  }

  get value(): InvoiceStatusType {
    return this.props.value;
  }

  public isDraft(): boolean {
    return this.props.value === 'draft';
  }

  public isPending(): boolean {
    return this.props.value === 'pending';
  }

  public isPartiallyPaid(): boolean {
    return this.props.value === 'partially_paid';
  }

  public isPaid(): boolean {
    return this.props.value === 'paid';
  }

  public isCancelled(): boolean {
    return this.props.value === 'cancelled';
  }

  public isOverdue(): boolean {
    return this.props.value === 'overdue';
  }

  protected validateFormat(): void {
    const validStatuses: InvoiceStatusType[] = ['draft', 'pending', 'partially_paid', 'paid', 'cancelled', 'overdue'];
    if (!validStatuses.includes(this.props.value)) {
      throw new Error(`Invalid invoice status: ${this.props.value}`);
    }
  }
}
