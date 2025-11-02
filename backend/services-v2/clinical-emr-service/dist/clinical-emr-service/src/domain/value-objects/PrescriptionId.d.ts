/**
 * PrescriptionId Value Object - Prescription Identifier
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */
import { ValueObject } from '@shared/domain/base/value-object';
export interface PrescriptionIdProps {
    value: string;
}
/**
 * Prescription ID Value Object
 * Format: PRESC-YYYYMM-XXX (e.g., PRESC-202501-001)
 */
export declare class PrescriptionId extends ValueObject<PrescriptionIdProps> {
    private static readonly FORMAT_REGEX;
    private constructor();
    /**
     * Create PrescriptionId from string
     */
    static create(value: string): PrescriptionId;
    /**
     * Generate new PrescriptionId with current date
     */
    static generate(sequenceNumber: number): PrescriptionId;
    protected validateFormat(): void;
    /**
     * Get the value as string
     */
    get value(): string;
    /**
     * Get year from PrescriptionId
     */
    getYear(): number;
    /**
     * Get month from PrescriptionId
     */
    getMonth(): number;
    /**
     * Get sequence number from PrescriptionId
     */
    getSequence(): number;
    /**
     * Check if PrescriptionId is from current month
     */
    isCurrentMonth(): boolean;
    /**
     * Check if PrescriptionId is from current year
     */
    isCurrentYear(): boolean;
    /**
     * Convert to JSON
     */
    toJSON(): any;
    /**
     * Convert to string
     */
    toString(): string;
}
//# sourceMappingURL=PrescriptionId.d.ts.map