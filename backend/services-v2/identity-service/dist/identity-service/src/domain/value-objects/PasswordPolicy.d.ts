/**
 * Password Policy Value Object
 * Defines password requirements and validation rules
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
export interface PasswordPolicyProps {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    expirationDays: number | null;
    preventReuse: number;
    updatedAt?: Date;
    updatedBy?: string;
}
export interface PasswordValidationResult {
    isValid: boolean;
    errors: string[];
}
export declare class PasswordPolicy {
    private readonly _minLength;
    private readonly _requireUppercase;
    private readonly _requireLowercase;
    private readonly _requireNumbers;
    private readonly _requireSpecialChars;
    private readonly _expirationDays;
    private readonly _preventReuse;
    private readonly _updatedAt;
    private readonly _updatedBy;
    private constructor();
    /**
     * Create a new PasswordPolicy with validation
     */
    static create(props: PasswordPolicyProps): PasswordPolicy;
    /**
     * Create default password policy
     */
    static createDefault(): PasswordPolicy;
    /**
     * Validate a password against this policy
     */
    validate(password: string): PasswordValidationResult;
    /**
     * Get password strength description
     */
    getStrengthDescription(): string;
    get minLength(): number;
    get requireUppercase(): boolean;
    get requireLowercase(): boolean;
    get requireNumbers(): boolean;
    get requireSpecialChars(): boolean;
    get expirationDays(): number | null;
    get preventReuse(): number;
    get updatedAt(): Date;
    get updatedBy(): string | null;
    /**
     * Convert to plain object
     */
    toObject(): PasswordPolicyProps;
    /**
     * Check if two policies are equal
     */
    equals(other: PasswordPolicy): boolean;
}
//# sourceMappingURL=PasswordPolicy.d.ts.map