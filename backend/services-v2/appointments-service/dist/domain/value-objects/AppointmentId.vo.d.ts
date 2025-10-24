/**
 * AppointmentId Value Object - Domain Layer
 * V3 Clean Architecture + DDD Implementation
 * Format: XXXX-APT-XXXXXX-XXX (matches database appointment_id column)
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */
import { HealthcareValueObject } from '../../shared/domain/base/value-object';
export interface AppointmentIdProps {
    value: string;
}
/**
 * AppointmentId Value Object
 * Unique identifier for appointments
 * Format: XXXX-APT-XXXXXX-XXX
 * Example: 2025-APT-010001-001
 */
export declare class AppointmentId extends HealthcareValueObject<AppointmentIdProps> {
    private constructor();
    /**
     * Create AppointmentId from string
     */
    static create(value: string): AppointmentId;
    /**
     * Generate new AppointmentId
     * Format: YYYY-APT-MMDDSS-NNN
     * YYYY: Year
     * MM: Month
     * DD: Day
     * SS: Second (for uniqueness)
     * NNN: Random 3-digit number
     */
    static generate(): AppointmentId;
    /**
     * Validate appointment ID format
     */
    private static isValid;
    /**
     * Get appointment ID value
     */
    get value(): string;
    /**
     * Extract year from appointment ID
     */
    get year(): number;
    /**
     * Extract month from appointment ID
     */
    get month(): number;
    /**
     * Extract day from appointment ID
     */
    get day(): number;
    /**
     * Healthcare-specific: Contains PHI
     */
    containsPHI(): boolean;
    /**
     * Anonymize for logging
     */
    anonymize(): AppointmentId;
    /**
     * String representation
     */
    toString(): string;
}
//# sourceMappingURL=AppointmentId.vo.d.ts.map