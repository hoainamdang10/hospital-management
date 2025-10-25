/**
 * BasicVitalSigns Value Object - Clinical EMR Service
 * Simplified vital signs for student-friendly implementation
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */
import { ValueObject } from '@shared/domain/base/value-object';
interface BasicVitalSignsProps {
    temperature?: number;
    bloodPressure?: string;
    heartRate?: number;
    weight?: number;
    height?: number;
}
export declare class BasicVitalSigns extends ValueObject<BasicVitalSignsProps> {
    private constructor();
    protected validateFormat(): void;
    /**
     * Create BasicVitalSigns
     */
    static create(props: BasicVitalSignsProps): BasicVitalSigns;
    /**
     * Create empty vital signs
     */
    static createEmpty(): BasicVitalSigns;
    /**
     * Create from partial data
     */
    static createPartial(props: Partial<BasicVitalSignsProps>): BasicVitalSigns;
    /**
     * Validate vital signs values
     */
    private validate;
    /**
     * Get temperature in Celsius
     */
    get temperature(): number | undefined;
    /**
     * Get blood pressure string
     */
    get bloodPressure(): string | undefined;
    /**
     * Get systolic blood pressure
     */
    getSystolic(): number | undefined;
    /**
     * Get diastolic blood pressure
     */
    getDiastolic(): number | undefined;
    /**
     * Get heart rate in BPM
     */
    get heartRate(): number | undefined;
    /**
     * Get weight in KG
     */
    get weight(): number | undefined;
    /**
     * Get height in CM
     */
    get height(): number | undefined;
    /**
     * Calculate BMI if weight and height are available
     */
    calculateBMI(): number | undefined;
    /**
     * Get BMI category in Vietnamese
     */
    getBMICategory(): string | undefined;
    /**
     * Check if vital signs are complete
     */
    isComplete(): boolean;
    /**
     * Check if vital signs are empty
     */
    isEmpty(): boolean;
    /**
     * Get available vital signs count
     */
    getAvailableCount(): number;
    /**
     * Update vital signs
     */
    update(updates: Partial<BasicVitalSignsProps>): BasicVitalSigns;
    /**
     * Convert to plain object
     */
    toPlainObject(): BasicVitalSignsProps;
    /**
     * Convert to JSON
     */
    toJSON(): BasicVitalSignsProps;
    /**
     * Create from database value
     */
    static fromDatabase(value: any): BasicVitalSigns | null;
    /**
     * Convert to database value
     */
    toDatabase(): any;
    /**
     * Get summary string in Vietnamese
     */
    getSummary(): string;
}
export {};
//# sourceMappingURL=BasicVitalSigns.d.ts.map