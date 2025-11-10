import { Entity } from '../../../../shared/domain/base/entity';
import { Money } from '../value-objects/Money';
export interface InvoiceItemProps {
    id: string;
    description: string;
    quantity: number;
    unitPrice: Money;
    totalPrice: Money;
}
export declare class InvoiceItem extends Entity<InvoiceItemProps> {
    private constructor();
    static create(description: string, quantity: number, unitPrice: Money, id?: string): InvoiceItem;
    get description(): string;
    get quantity(): number;
    get unitPrice(): Money;
    get totalPrice(): Money;
    validate(): void;
    toPersistence(): any;
}
//# sourceMappingURL=InvoiceItem.d.ts.map