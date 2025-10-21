/**
 * RecordId Value Object - Clinical EMR Service
 * Vietnamese Medical Record ID format: MED-YYYYMM-XXX
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */
import { ValueObject } from '../../../shared/domain/ValueObject';
interface RecordIdProps {
    value: string;
}
export declare class RecordId extends ValueObject<RecordIdProps> {
    private constructor();
    /**
     * Create RecordId from string value
     */
    static create(value: string): RecordId;
    /**
     * Generate new RecordId with Vietnamese format: MED-YYYYMM-XXX
     */
    static generate(): RecordId;
    /**
     * Generate RecordId with specific sequence (for testing)
     */
    static generateWithSequence(sequence: number): RecordId;
    /**
     * Validate RecordId format
     */
    private validate;
    /**
     * Get string value
     */
    get value(): string;
    /**
     * Get year from RecordId
     */
    getYear(): number;
    /**
     * Get month from RecordId
     */
    getMonth(): number;
    /**
     * Get sequence number from RecordId
     */
    getSequence(): number;
    /**
     * Get year-month string (YYYYMM)
     */
    getYearMonth(): string;
    /**
     * Check if RecordId is from current month
     */
    isCurrentMonth(): boolean;
    /**
     * Check if RecordId is from current year
     */
    isCurrentYear(): boolean;
    /**
     * Convert to string
     */
    toString(): string;
    /**
     * Convert to JSON
     */
    toJSON(): string;
    /**
     * Create from database value
     */
    static fromDatabase(value: string | null | undefined): RecordId | null;
    /**
     * Convert to database value
     */
    toDatabase(): string;
}
export {};
//# sourceMappingURL=RecordId.d.ts.map