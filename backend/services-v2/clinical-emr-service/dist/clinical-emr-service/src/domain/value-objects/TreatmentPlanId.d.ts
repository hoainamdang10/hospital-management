/**
 * TreatmentPlanId Value Object - Treatment Plan Identifier
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */
import { ValueObject } from '@shared/domain/base/value-object';
export interface TreatmentPlanIdProps {
    value: string;
}
/**
 * Treatment Plan ID Value Object
 * Format: PLAN-YYYYMM-XXX (e.g., PLAN-202501-001)
 */
export declare class TreatmentPlanId extends ValueObject<TreatmentPlanIdProps> {
    private static readonly FORMAT_REGEX;
    private constructor();
    /**
     * Create TreatmentPlanId from string
     */
    static create(value: string): TreatmentPlanId;
    /**
     * Generate new TreatmentPlanId with current date
     */
    static generate(sequenceNumber: number): TreatmentPlanId;
    protected validateFormat(): void;
    /**
     * Get the value as string
     */
    get value(): string;
    /**
     * Get year from TreatmentPlanId
     */
    getYear(): number;
    /**
     * Get month from TreatmentPlanId
     */
    getMonth(): number;
    /**
     * Get sequence number from TreatmentPlanId
     */
    getSequence(): number;
    /**
     * Check if TreatmentPlanId is from current month
     */
    isCurrentMonth(): boolean;
    /**
     * Check if TreatmentPlanId is from current year
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
//# sourceMappingURL=TreatmentPlanId.d.ts.map