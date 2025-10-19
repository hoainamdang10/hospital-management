/**
 * Email Value Object - Enhanced with Error Handling
 * Validates and encapsulates email addresses
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Production-Ready, Anti-Pattern Mitigation, Clean Architecture
 */
import { ValueObject } from '../../../../shared/domain/base/value-object';
interface EmailProps {
    value: string;
}
export declare class Email extends ValueObject<EmailProps> {
    private constructor();
    /**
     * Validate email format - required by ValueObject base class
     */
    protected validateFormat(): void;
    /**
     * Create Email with enhanced validation and error handling
     */
    static create(email: string): Email;
    /**
     * Create Email from string - strict validation
     * SECURITY FIX: No fallback, throws error on invalid email
     */
    static fromString(email: string): Email;
    /**
     * Email validation
     */
    isValid(): boolean;
    get value(): string;
    get domain(): string;
    get localPart(): string;
    /**
     * Enhanced email validation with Vietnamese healthcare domains
     */
    private static isValidEmail;
    /**
     * Check if email belongs to Vietnamese hospital
     */
    isVietnameseHospitalEmail(): boolean;
    /**
     * Check if email belongs to healthcare staff
     */
    isHealthcareStaffEmail(): boolean;
    /**
     * Get email type for role assignment
     */
    getEmailType(): 'patient' | 'doctor' | 'nurse' | 'admin' | 'staff' | 'unknown';
    /**
     * Mask email for logging (HIPAA compliance)
     */
    getMaskedEmail(): string;
    /**
     * Equality check
     */
    equals(other: Email): boolean;
    /**
     * String conversion
     */
    toString(): string;
}
export {};
//# sourceMappingURL=Email.d.ts.map