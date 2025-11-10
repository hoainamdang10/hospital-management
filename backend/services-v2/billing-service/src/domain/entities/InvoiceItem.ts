import { Entity } from '@shared/domain/base/entity';
import { Money } from '../value-objects/Money';

export interface InvoiceItemProps {
  id: string;
  description: string;
  quantity: number;
  unitPrice: Money;
  totalPrice: Money;
}

export class InvoiceItem extends Entity<InvoiceItemProps> {
  private constructor(props: InvoiceItemProps, id?: string) {
    super(props, id);
  }

  public static create(
    description: string,
    quantity: number,
    unitPrice: Money,
    id?: string
  ): InvoiceItem {
    if (quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }
    const totalPrice = unitPrice.multiply(quantity);
    return new InvoiceItem({ id: id || '', description, quantity, unitPrice, totalPrice }, id);
  }

  get description(): string {
    return this.props.description;
  }

  get quantity(): number {
    return this.props.quantity;
  }

  get unitPrice(): Money {
    return this.props.unitPrice;
  }

  get totalPrice(): Money {
    return this.props.totalPrice;
  }

  public validate(): void {
    if (!this.props.description || this.props.description.trim().length === 0) {
      throw new Error('Description cannot be empty');
    }
    if (this.props.quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }
  }

  public toPersistence(): any {
    return {
      id: this.id,
      description: this.props.description,
      quantity: this.props.quantity,
      unitPrice: this.props.unitPrice.amount,
      totalPrice: this.props.totalPrice.amount,
      currency: this.props.unitPrice.currency
    };
  }
}
