import { ValueObject } from '@shared/domain/base/value-object';
import { v4 as uuidv4 } from 'uuid';

export interface InvoiceIdProps {
  value: string;
}

export class InvoiceId extends ValueObject<InvoiceIdProps> {
  private constructor(props: InvoiceIdProps) {
    super(props);
  }

  public static create(value: string): InvoiceId {
    if (!value || value.trim().length === 0) {
      throw new Error('InvoiceId cannot be empty');
    }
    return new InvoiceId({ value: value.trim() });
  }

  public static generate(): InvoiceId {
    return new InvoiceId({ value: uuidv4() });
  }

  get value(): string {
    return this.props.value;
  }

  protected validateFormat(): void {
    if (!this.props.value || this.props.value.trim().length === 0) {
      throw new Error('InvoiceId cannot be empty');
    }
  }
}
