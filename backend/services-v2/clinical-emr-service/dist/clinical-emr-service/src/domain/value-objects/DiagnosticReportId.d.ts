/**
 * DiagnosticReportId Value Object - Diagnostic Report Identifier
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */
import { ValueObject } from '@shared/domain/base/value-object';
export interface DiagnosticReportIdProps {
    value: string;
}
/**
 * Diagnostic Report ID Value Object
 * Format: DIAG-YYYYMM-XXX (e.g., DIAG-202501-001)
 */
export declare class DiagnosticReportId extends ValueObject<DiagnosticReportIdProps> {
    private static readonly FORMAT_REGEX;
    private constructor();
    /**
     * Create DiagnosticReportId from string
     */
    static create(value: string): DiagnosticReportId;
    /**
     * Generate new DiagnosticReportId with current date
     */
    static generate(sequenceNumber: number): DiagnosticReportId;
    protected validateFormat(): void;
    /**
     * Get the value as string
     */
    get value(): string;
    /**
     * Get year from DiagnosticReportId
     */
    getYear(): number;
    /**
     * Get month from DiagnosticReportId
     */
    getMonth(): number;
    /**
     * Get sequence number from DiagnosticReportId
     */
    getSequence(): number;
    /**
     * Check if DiagnosticReportId is from current month
     */
    isCurrentMonth(): boolean;
    /**
     * Check if DiagnosticReportId is from current year
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
//# sourceMappingURL=DiagnosticReportId.d.ts.map