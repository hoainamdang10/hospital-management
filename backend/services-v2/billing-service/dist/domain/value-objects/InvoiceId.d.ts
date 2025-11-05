/**
 * InvoiceId Value Object - Domain Layer
 * Represents a unique identifier for invoices in Vietnamese healthcare system
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Invoice Standards
 */
import { ValueObject } from "../../../../shared/domain/ValueObject";
interface InvoiceIdProps {
    value: string;
}
/**
 * InvoiceId Value Object
 * Format: INV-YYYYMM-XXXXXX (e.g., INV-202412-000001)
 * - INV: Invoice prefix
 * - YYYYMM: Year and month
 * - XXXXXX: Sequential number (6 digits)
 */
export declare class InvoiceId extends ValueObject<InvoiceIdProps> {
    private constructor();
    /**
     * Create InvoiceId from string
     */
    static create(value: string): InvoiceId;
    /**
     * Generate new InvoiceId
     */
    static generate(): InvoiceId;
    /**
     * Generate InvoiceId for specific month
     */
    static generateForMonth(year: number, month: number, sequence: number): InvoiceId;
    /**
     * Create InvoiceId from components
     */
    static fromComponents(year: number, month: number, sequence: number): InvoiceId;
    /**
     * Get the string value
     */
    get value(): string;
    /**
     * Get year from invoice ID
     */
    get year(): number;
    /**
     * Get month from invoice ID
     */
    get month(): number;
    /**
     * Get sequence number from invoice ID
     */
    get sequence(): number;
    /**
     * Get year-month string (YYYYMM)
     */
    get yearMonth(): string;
    /**
     * Get formatted display string
     */
    get displayValue(): string;
    /**
     * Get Vietnamese formatted display
     */
    get vietnameseDisplay(): string;
    /**
     * Check if invoice is from current month
     */
    isCurrentMonth(): boolean;
    /**
     * Check if invoice is from current year
     */
    isCurrentYear(): boolean;
    /**
     * Get age in days
     */
    getAgeInDays(): number;
    /**
     * Check if invoice is overdue (older than 30 days)
     */
    isOverdue(): boolean;
    /**
     * Get next invoice ID in sequence
     */
    getNext(): InvoiceId;
    /**
     * Get previous invoice ID in sequence
     */
    getPrevious(): InvoiceId;
    /**
     * Compare with another InvoiceId
     */
    compareTo(other: InvoiceId): number;
    /**
     * Check if this invoice is newer than another
     */
    isNewerThan(other: InvoiceId): boolean;
    /**
     * Check if this invoice is older than another
     */
    isOlderThan(other: InvoiceId): boolean;
    /**
     * Validate invoice ID format
     */
    private static isValidFormat;
    /**
     * Generate sequence number (simulated - in real implementation would come from database)
     */
    private static generateSequenceNumber;
    /**
     * Parse invoice ID components
     */
    static parseComponents(value: string): {
        prefix: string;
        year: number;
        month: number;
        sequence: number;
        yearMonth: string;
    };
    /**
     * Create range of invoice IDs
     */
    static createRange(start: InvoiceId, end: InvoiceId): InvoiceId[];
    /**
     * Get invoice IDs for specific month
     */
    static getMonthRange(year: number, month: number, startSequence?: number, endSequence?: number): InvoiceId[];
    /**
     * Validate Vietnamese invoice number standards
     */
    isVietnameseCompliant(): boolean;
    /**
     * Get tax period (quarter) for Vietnamese tax reporting
     */
    getTaxQuarter(): number;
    /**
     * Get Vietnamese tax period display
     */
    getVietnameseTaxPeriod(): string;
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
//# sourceMappingURL=InvoiceId.d.ts.map