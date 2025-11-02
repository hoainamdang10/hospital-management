/**
 * NoteId Value Object - Clinical Note Identifier
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */
import { ValueObject } from '@shared/domain/base/value-object';
export interface NoteIdProps {
    value: string;
}
/**
 * Clinical Note ID Value Object
 * Format: NOTE-YYYYMM-XXX (e.g., NOTE-202501-001)
 */
export declare class NoteId extends ValueObject<NoteIdProps> {
    private static readonly FORMAT_REGEX;
    private constructor();
    /**
     * Create NoteId from string
     */
    static create(value: string): NoteId;
    /**
     * Generate new NoteId with current date
     */
    static generate(sequenceNumber: number): NoteId;
    protected validateFormat(): void;
    /**
     * Get the value as string
     */
    get value(): string;
    /**
     * Get year from NoteId
     */
    getYear(): number;
    /**
     * Get month from NoteId
     */
    getMonth(): number;
    /**
     * Get sequence number from NoteId
     */
    getSequence(): number;
    /**
     * Check if NoteId is from current month
     */
    isCurrentMonth(): boolean;
    /**
     * Check if NoteId is from current year
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
//# sourceMappingURL=NoteId.d.ts.map