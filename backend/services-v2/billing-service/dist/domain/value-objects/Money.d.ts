/**
 * Money Value Object - Domain Layer
 * Represents monetary amounts in Vietnamese healthcare system
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Currency Standards
 */
import { ValueObject } from "../../../../shared/domain/ValueObject";
interface MoneyProps {
    amount: number;
    currency: string;
}
/**
 * Money Value Object
 * Handles Vietnamese Dong (VND) with proper precision and formatting
 */
export declare class Money extends ValueObject<MoneyProps> {
    private constructor();
    /**
     * Create Money from amount and currency
     */
    static create(amount: number, currency?: string): Money;
    /**
     * Create VND money
     */
    static createVND(amount: number): Money;
    /**
     * Create USD money
     */
    static createUSD(amount: number): Money;
    /**
     * Create zero money
     */
    static zero(currency?: string): Money;
    /**
     * Create from string representation
     */
    static fromString(value: string): Money;
    /**
     * Get amount
     */
    get amount(): number;
    /**
     * Get currency
     */
    get currency(): string;
    /**
     * Check if zero
     */
    isZero(): boolean;
    /**
     * Check if positive
     */
    isPositive(): boolean;
    /**
     * Check if negative (should not happen in our domain)
     */
    isNegative(): boolean;
    /**
     * Add money
     */
    add(other: Money): Money;
    /**
     * Subtract money
     */
    subtract(other: Money): Money;
    /**
     * Multiply by factor
     */
    multiply(factor: number): Money;
    /**
     * Divide by factor
     */
    divide(factor: number): Money;
    /**
     * Calculate percentage
     */
    percentage(percent: number): Money;
    /**
     * Apply discount
     */
    applyDiscount(discountPercent: number): Money;
    /**
     * Apply tax
     */
    applyTax(taxPercent: number): Money;
    /**
     * Apply Vietnamese VAT (10%)
     */
    applyVietnameseVAT(): Money;
    /**
     * Calculate Vietnamese VAT amount
     */
    getVietnameseVATAmount(): Money;
    /**
     * Get amount without VAT (reverse calculation)
     */
    getAmountWithoutVAT(): Money;
    /**
     * Compare with another Money
     */
    compareTo(other: Money): number;
    /**
     * Check if equal
     */
    equals(other: Money): boolean;
    /**
     * Check if greater than
     */
    greaterThan(other: Money): boolean;
    /**
     * Check if less than
     */
    lessThan(other: Money): boolean;
    /**
     * Check if greater than or equal
     */
    greaterThanOrEqual(other: Money): boolean;
    /**
     * Check if less than or equal
     */
    lessThanOrEqual(other: Money): boolean;
    /**
     * Get maximum of two Money values
     */
    max(other: Money): Money;
    /**
     * Get minimum of two Money values
     */
    min(other: Money): Money;
    /**
     * Format for display
     */
    format(): string;
    /**
     * Format VND
     */
    formatVND(): string;
    /**
     * Format USD
     */
    formatUSD(): string;
    /**
     * Format for Vietnamese invoice
     */
    formatVietnameseInvoice(): string;
    /**
     * Convert to words (Vietnamese)
     */
    toVietnameseWords(): string;
    /**
     * Get currency symbol
     */
    getCurrencySymbol(): string;
    /**
     * Convert to different currency (simplified - in real app would use exchange rates)
     */
    convertTo(targetCurrency: string, exchangeRate: number): Money;
    /**
     * Split into multiple parts
     */
    split(parts: number): Money[];
    /**
     * Allocate proportionally
     */
    allocate(ratios: number[]): Money[];
    /**
     * Check if valid currency
     */
    private static isValidCurrency;
    /**
     * Round to currency precision
     */
    private static roundToCurrencyPrecision;
    /**
     * Ensure same currency for operations
     */
    private ensureSameCurrency;
    /**
     * Convert VND to Vietnamese words
     */
    private convertVNDToWords;
    /**
     * Convert hundreds place
     */
    private convertHundreds;
    /**
     * Convert to JSON
     */
    toJSON(): any;
    /**
     * String representation
     */
    toString(): string;
}
export {};
//# sourceMappingURL=Money.d.ts.map