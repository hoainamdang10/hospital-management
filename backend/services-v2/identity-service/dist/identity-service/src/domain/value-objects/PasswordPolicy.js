"use strict";
/**
 * Password Policy Value Object
 * Defines password requirements and validation rules
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordPolicy = void 0;
class PasswordPolicy {
    constructor(props) {
        this._minLength = props.minLength;
        this._requireUppercase = props.requireUppercase;
        this._requireLowercase = props.requireLowercase;
        this._requireNumbers = props.requireNumbers;
        this._requireSpecialChars = props.requireSpecialChars;
        this._expirationDays = props.expirationDays;
        this._preventReuse = props.preventReuse;
        this._updatedAt = props.updatedAt || new Date();
        this._updatedBy = props.updatedBy || null;
    }
    /**
     * Create a new PasswordPolicy with validation
     */
    static create(props) {
        // Validate minLength
        if (props.minLength < 6) {
            throw new Error('Minimum password length must be at least 6 characters');
        }
        if (props.minLength > 128) {
            throw new Error('Minimum password length cannot exceed 128 characters');
        }
        // Validate expirationDays
        if (props.expirationDays !== null) {
            if (props.expirationDays < 1) {
                throw new Error('Password expiration days must be at least 1');
            }
            if (props.expirationDays > 365) {
                throw new Error('Password expiration days cannot exceed 365');
            }
        }
        // Validate preventReuse
        if (props.preventReuse < 0) {
            throw new Error('Prevent reuse count cannot be negative');
        }
        if (props.preventReuse > 24) {
            throw new Error('Prevent reuse count cannot exceed 24');
        }
        return new PasswordPolicy(props);
    }
    /**
     * Create default password policy
     */
    static createDefault() {
        return new PasswordPolicy({
            minLength: 8,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecialChars: false,
            expirationDays: null,
            preventReuse: 3,
            updatedAt: new Date(),
            updatedBy: 'system'
        });
    }
    /**
     * Validate a password against this policy
     */
    validate(password) {
        const errors = [];
        // Check minimum length
        if (password.length < this._minLength) {
            errors.push(`Mật khẩu phải có ít nhất ${this._minLength} ký tự`);
        }
        // Check uppercase requirement
        if (this._requireUppercase && !/[A-Z]/.test(password)) {
            errors.push('Mật khẩu phải chứa ít nhất một chữ cái viết hoa');
        }
        // Check lowercase requirement
        if (this._requireLowercase && !/[a-z]/.test(password)) {
            errors.push('Mật khẩu phải chứa ít nhất một chữ cái viết thường');
        }
        // Check numbers requirement
        if (this._requireNumbers && !/[0-9]/.test(password)) {
            errors.push('Mật khẩu phải chứa ít nhất một chữ số');
        }
        // Check special characters requirement
        if (this._requireSpecialChars && !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
            errors.push('Mật khẩu phải chứa ít nhất một ký tự đặc biệt');
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    /**
     * Get password strength description
     */
    getStrengthDescription() {
        const requirements = [];
        requirements.push(`Tối thiểu ${this._minLength} ký tự`);
        if (this._requireUppercase)
            requirements.push('chữ hoa');
        if (this._requireLowercase)
            requirements.push('chữ thường');
        if (this._requireNumbers)
            requirements.push('số');
        if (this._requireSpecialChars)
            requirements.push('ký tự đặc biệt');
        return `Mật khẩu phải có ${requirements.join(', ')}`;
    }
    // Getters
    get minLength() {
        return this._minLength;
    }
    get requireUppercase() {
        return this._requireUppercase;
    }
    get requireLowercase() {
        return this._requireLowercase;
    }
    get requireNumbers() {
        return this._requireNumbers;
    }
    get requireSpecialChars() {
        return this._requireSpecialChars;
    }
    get expirationDays() {
        return this._expirationDays;
    }
    get preventReuse() {
        return this._preventReuse;
    }
    get updatedAt() {
        return this._updatedAt;
    }
    get updatedBy() {
        return this._updatedBy;
    }
    /**
     * Convert to plain object
     */
    toObject() {
        return {
            minLength: this._minLength,
            requireUppercase: this._requireUppercase,
            requireLowercase: this._requireLowercase,
            requireNumbers: this._requireNumbers,
            requireSpecialChars: this._requireSpecialChars,
            expirationDays: this._expirationDays,
            preventReuse: this._preventReuse,
            updatedAt: this._updatedAt,
            updatedBy: this._updatedBy || undefined
        };
    }
    /**
     * Check if two policies are equal
     */
    equals(other) {
        return (this._minLength === other._minLength &&
            this._requireUppercase === other._requireUppercase &&
            this._requireLowercase === other._requireLowercase &&
            this._requireNumbers === other._requireNumbers &&
            this._requireSpecialChars === other._requireSpecialChars &&
            this._expirationDays === other._expirationDays &&
            this._preventReuse === other._preventReuse);
    }
}
exports.PasswordPolicy = PasswordPolicy;
//# sourceMappingURL=PasswordPolicy.js.map