"use strict";
/**
 * PersonalInfo Value Object
 * User personal information with Vietnamese standards
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersonalInfo = void 0;
const value_object_1 = require("../../../../shared/domain/base/value-object");
class PersonalInfo extends value_object_1.ValueObject {
    constructor(props) {
        super(props);
    }
    /**
     * Validate format - required by ValueObject base class
     */
    validateFormat() {
        // Validate full name
        if (!this.props.fullName || this.props.fullName.trim().length === 0) {
            throw new Error('Họ tên không được để trống');
        }
        if (this.props.fullName.trim().length < 2) {
            throw new Error('Họ tên phải có ít nhất 2 ký tự');
        }
        // Validate phone number if provided
        if (this.props.phoneNumber && !PersonalInfo.isValidVietnamesePhone(this.props.phoneNumber)) {
            throw new Error('Số điện thoại không hợp lệ');
        }
        // Validate citizen ID if provided
        if (this.props.citizenId && !PersonalInfo.isValidCitizenId(this.props.citizenId)) {
            throw new Error('Số CMND/CCCD không hợp lệ');
        }
    }
    static create(props) {
        return new PersonalInfo({
            fullName: props.fullName.trim(),
            phoneNumber: props.phoneNumber?.trim(),
            address: props.address?.trim(),
            dateOfBirth: props.dateOfBirth,
            gender: props.gender,
            citizenId: props.citizenId?.trim(),
            emergencyContactName: props.emergencyContactName?.trim(),
            emergencyContactPhone: props.emergencyContactPhone?.trim()
        });
    }
    // REMOVED: fromSupabaseData() method
    // This method violated Clean Architecture by coupling domain to external concerns
    // Use PersonalInfo.create() directly in mappers
    static isValidVietnamesePhone(phone) {
        // Vietnamese phone: 10 digits, starts with 0
        const phoneRegex = /^0\d{9}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    }
    static isValidCitizenId(citizenId) {
        // CMND: 9 or 12 digits, CCCD: 12 digits
        const citizenIdRegex = /^\d{9}$|^\d{12}$/;
        return citizenIdRegex.test(citizenId.replace(/\s/g, ''));
    }
    // Getters
    get fullName() {
        return this.props.fullName;
    }
    get phoneNumber() {
        return this.props.phoneNumber;
    }
    get address() {
        return this.props.address;
    }
    get dateOfBirth() {
        return this.props.dateOfBirth;
    }
    get gender() {
        return this.props.gender;
    }
    get citizenId() {
        return this.props.citizenId;
    }
    get emergencyContactName() {
        return this.props.emergencyContactName;
    }
    get emergencyContactPhone() {
        return this.props.emergencyContactPhone;
    }
    /**
     * Check if personal info is complete
     */
    isComplete() {
        return !!(this.props.fullName &&
            this.props.phoneNumber &&
            this.props.address &&
            this.props.dateOfBirth &&
            this.props.gender &&
            this.props.citizenId);
    }
    /**
     * Check if has Vietnamese citizen ID
     */
    hasVietnameseId() {
        return !!this.props.citizenId && PersonalInfo.isValidCitizenId(this.props.citizenId);
    }
    /**
     * Check if has valid phone number
     */
    hasValidPhoneNumber() {
        return !!this.props.phoneNumber && PersonalInfo.isValidVietnamesePhone(this.props.phoneNumber);
    }
    /**
     * Calculate age from date of birth
     */
    getAge() {
        if (!this.props.dateOfBirth) {
            return null;
        }
        const today = new Date();
        const birthDate = new Date(this.props.dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }
}
exports.PersonalInfo = PersonalInfo;
//# sourceMappingURL=PersonalInfo.js.map