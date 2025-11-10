import { ValueObject } from '../../../../shared/domain/base/value-object';
export interface InvoiceIdProps {
    value: string;
}
export declare class InvoiceId extends ValueObject<InvoiceIdProps> {
    private constructor();
    static create(value: string): InvoiceId;
    static generate(): InvoiceId;
    get value(): string;
    protected validateFormat(): void;
}
//# sourceMappingURL=InvoiceId.d.ts.map