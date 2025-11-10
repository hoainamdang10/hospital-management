import { Entity } from '../../../../shared/domain/base/entity';
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
export declare class Payment extends Entity<PaymentProps> {
    private constructor();
    static create(amount: Money, method: PaymentMethod, transactionId?: string, id?: string): Payment;
    get amount(): Money;
    get method(): PaymentMethod;
    get status(): PaymentStatus;
    get transactionId(): string | undefined;
    get paidAt(): Date | undefined;
    complete(): void;
    fail(): void;
    refund(): void;
    validate(): void;
    toPersistence(): any;
}
//# sourceMappingURL=Payment.d.ts.map