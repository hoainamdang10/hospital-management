import { ValueObject } from '../../../../shared/domain/base/value-object';
export type InvoiceStatusType = 'draft' | 'pending' | 'partially_paid' | 'paid' | 'cancelled' | 'overdue' | 'refunded';
export interface InvoiceStatusProps {
    value: InvoiceStatusType;
}
export declare class InvoiceStatus extends ValueObject<InvoiceStatusProps> {
    private constructor();
    static create(value: InvoiceStatusType): InvoiceStatus;
    static draft(): InvoiceStatus;
    static pending(): InvoiceStatus;
    static partiallyPaid(): InvoiceStatus;
    static paid(): InvoiceStatus;
    static cancelled(): InvoiceStatus;
    static overdue(): InvoiceStatus;
    static refunded(): InvoiceStatus;
    get value(): InvoiceStatusType;
    isDraft(): boolean;
    isPending(): boolean;
    isPartiallyPaid(): boolean;
    isPaid(): boolean;
    isCancelled(): boolean;
    isOverdue(): boolean;
    isRefunded(): boolean;
    protected validateFormat(): void;
}
//# sourceMappingURL=InvoiceStatus.d.ts.map