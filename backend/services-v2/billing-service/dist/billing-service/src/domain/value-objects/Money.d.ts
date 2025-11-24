import { ValueObject } from "../../../../shared/domain/base/value-object";
export interface MoneyProps {
    amount: number;
    currency: string;
}
export declare class Money extends ValueObject<MoneyProps> {
    private readonly allowNegative;
    private constructor();
    /**
     * Create Money with positive amount only
     * Use this for regular payments, invoices, etc.
     */
    static create(amount: number, currency?: string): Money;
    /**
     * Create Money with signed amount (positive or negative)
     * Use this for refunds, adjustments, etc.
     */
    static createSigned(amount: number, currency?: string): Money;
    static zero(currency?: string): Money;
    get amount(): number;
    get currency(): string;
    add(other: Money): Money;
    subtract(other: Money): Money;
    multiply(factor: number): Money;
    protected validateFormat(): void;
}
//# sourceMappingURL=Money.d.ts.map