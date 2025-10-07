"use strict";
/**
 * Email Value Object - Enhanced with Error Handling
 * Validates and encapsulates email addresses with Supabase compatibility
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Production-Ready, Anti-Pattern Mitigation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Email = void 0;
const value_object_1 = require("@shared/domain/base/value-object");
class Email extends value_object_1.ValueObject {
    constructor(props) {
        super(props);
    }
    /**
     * Validate email format - required by ValueObject base class
     */
    validateFormat() {
        // Validation is done in create() method before construction
        // This method is called by base class constructor
    }
    /**
     * Create Email with enhanced validation and error handling
     */
    static create(email) {
        try {
            if (!email || email.trim().length === 0) {
                throw new Error('Email không được để trống');
            }
            const normalizedEmail = email.trim().toLowerCase();
            if (!this.isValidEmail(normalizedEmail)) {
                throw new Error('Định dạng email không hợp lệ');
            }
            if (normalizedEmail.length > 254) {
                throw new Error('Email quá dài (tối đa 254 ký tự)');
            }
            return new Email({ value: normalizedEmail });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to create Email: ${message}`);
        }
    }
    /**
     * Create Email from string - strict validation
     * SECURITY FIX: No fallback, throws error on invalid email
     */
    static fromString(email) {
        // Always use strict validation - no fallback
        return this.create(email);
    }
    /**
     * Safe email validation
     */
    isValid() {
        try {
            return Email.isValidEmail(this.props.value);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.warn('Email validation failed', {
                error: message
            });
            return false;
        }
    }
    get value() {
        return this.props.value;
    }
    get domain() {
        try {
            const parts = this.props.value.split('@');
            return parts.length > 1 ? parts[1] : '';
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.warn('Failed to extract email domain', {
                error: message
            });
            return '';
        }
    }
    get localPart() {
        try {
            const parts = this.props.value.split('@');
            return parts.length > 0 ? parts[0] : '';
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.warn('Failed to extract email local part', {
                error: message
            });
            return '';
        }
    }
    /**
     * Enhanced email validation with Vietnamese healthcare domains
     */
    static isValidEmail(email) {
        try {
            // RFC 5322 compliant email regex (simplified)
            const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
            return emailRegex.test(email);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.warn('Email regex validation failed', {
                error: message
            });
            return false;
        }
    }
    /**
     * Check if email belongs to Vietnamese hospital
     */
    isVietnameseHospitalEmail() {
        try {
            const vietnameseHospitalDomains = [
                'benhvien.vn',
                'hospital.vn',
                'medic.vn',
                'bv.vn',
                'phongkham.vn',
                'clinic.vn',
                'yte.vn'
            ];
            return vietnameseHospitalDomains.includes(this.domain);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.warn('Vietnamese hospital email check failed', {
                error: message
            });
            return false;
        }
    }
    /**
     * Check if email belongs to healthcare staff
     */
    isHealthcareStaffEmail() {
        try {
            const domain = this.domain.toLowerCase();
            const localPart = this.localPart.toLowerCase();
            // Check domain patterns
            const healthcareDomains = ['hospital', 'clinic', 'medic', 'doctor', 'nurse', 'benhvien', 'phongkham'];
            const domainMatch = healthcareDomains.some(pattern => domain.includes(pattern));
            // Check local part patterns
            const healthcarePatterns = ['doctor', 'dr', 'nurse', 'bacsi', 'yta', 'admin'];
            const localMatch = healthcarePatterns.some(pattern => localPart.includes(pattern));
            return domainMatch || localMatch || this.isVietnameseHospitalEmail();
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.warn('Healthcare staff email check failed', {
                error: message
            });
            return false;
        }
    }
    /**
     * Get email type for role assignment
     */
    getEmailType() {
        try {
            const localPart = this.localPart.toLowerCase();
            if (localPart.includes('admin') || localPart.includes('quanly')) {
                return 'admin';
            }
            if (localPart.includes('doctor') || localPart.includes('dr') || localPart.includes('bacsi')) {
                return 'doctor';
            }
            if (localPart.includes('nurse') || localPart.includes('yta')) {
                return 'nurse';
            }
            if (this.isHealthcareStaffEmail()) {
                return 'staff';
            }
            return 'patient'; // Default to patient for public emails
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.warn('Email type detection failed', {
                error: message
            });
            return 'unknown';
        }
    }
    /**
     * Mask email for logging (HIPAA compliance)
     */
    getMaskedEmail() {
        try {
            const localPart = this.localPart;
            const domain = this.domain;
            if (localPart.length <= 2) {
                return `${localPart}***@${domain}`;
            }
            const maskedLocal = localPart.substring(0, 2) + '*'.repeat(localPart.length - 2);
            return `${maskedLocal}@${domain}`;
        }
        catch (error) {
            return 'masked@email.com';
        }
    }
    /**
     * Validate email for Supabase auth
     */
    isSupabaseCompatible() {
        try {
            // Supabase email requirements
            return (this.isValid() &&
                this.props.value.length <= 254 &&
                this.props.value.length >= 6 &&
                !this.props.value.includes('+') && // Some email providers don't support + aliases
                this.domain.includes('.') // Must have TLD
            );
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.warn('Supabase compatibility check failed', {
                error: message
            });
            return false;
        }
    }
    /**
     * Safe equality check
     */
    equals(other) {
        try {
            if (!other || !(other instanceof Email)) {
                return false;
            }
            return this.props.value === other.props.value;
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.warn('Email equality check failed', {
                error: message
            });
            return false;
        }
    }
    /**
     * Safe string conversion
     */
    toString() {
        try {
            return this.props.value;
        }
        catch (error) {
            return 'invalid@email.com';
        }
    }
    /**
     * Convert to Supabase format
     */
    toSupabaseFormat() {
        return this.props.value;
    }
}
exports.Email = Email;
//# sourceMappingURL=Email.js.map