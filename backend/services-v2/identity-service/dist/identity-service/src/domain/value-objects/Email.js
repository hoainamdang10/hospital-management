"use strict";
/**
 * Email Value Object - Enhanced with Error Handling
 * Validates and encapsulates email addresses
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Production-Ready, Anti-Pattern Mitigation, Clean Architecture
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Email = void 0;
const value_object_1 = require("../../../../shared/domain/base/value-object");
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
     * Email validation
     */
    isValid() {
        return Email.isValidEmail(this.props.value);
    }
    get value() {
        return this.props.value;
    }
    get domain() {
        const parts = this.props.value.split('@');
        return parts.length > 1 ? parts[1] : '';
    }
    get localPart() {
        const parts = this.props.value.split('@');
        return parts.length > 0 ? parts[0] : '';
    }
    /**
     * Enhanced email validation with Vietnamese healthcare domains
     */
    static isValidEmail(email) {
        // RFC 5322 compliant email regex (simplified)
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        return emailRegex.test(email);
    }
    /**
     * Check if email belongs to Vietnamese hospital
     */
    isVietnameseHospitalEmail() {
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
    /**
     * Check if email belongs to healthcare staff
     */
    isHealthcareStaffEmail() {
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
    /**
     * Get email type for role assignment
     */
    getEmailType() {
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
    /**
     * Mask email for logging (HIPAA compliance)
     */
    getMaskedEmail() {
        const localPart = this.localPart;
        const domain = this.domain;
        if (localPart.length <= 2) {
            return `${localPart}***@${domain}`;
        }
        const maskedLocal = localPart.substring(0, 2) + '*'.repeat(localPart.length - 2);
        return `${maskedLocal}@${domain}`;
    }
    /**
     * Equality check
     */
    equals(other) {
        if (!other || !(other instanceof Email)) {
            return false;
        }
        return this.props.value === other.props.value;
    }
    /**
     * String conversion
     */
    toString() {
        return this.props.value;
    }
}
exports.Email = Email;
//# sourceMappingURL=Email.js.map