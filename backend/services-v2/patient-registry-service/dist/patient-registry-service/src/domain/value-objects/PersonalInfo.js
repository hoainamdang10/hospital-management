"use strict";
/**
 * PersonalInfo Value Object - Patient Registry
 * Patient personal information with Vietnamese healthcare standards
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
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
        // Validate date of birth
        if (!this.props.dateOfBirth) {
            throw new Error('Ngày sinh không được để trống');
        }
        if (Number.isNaN(this.props.dateOfBirth.getTime())) {
            throw new Error('Ngày sinh không hợp lệ');
        }
        const today = new Date();
        if (this.props.dateOfBirth >= today) {
            throw new Error('Ngày sinh phải trước ngày hiện tại');
        }
        const age = today.getFullYear() - this.props.dateOfBirth.getFullYear();
        if (age > 150) {
            throw new Error('Tuổi không hợp lệ');
        }
        // Validate gender
        if (!this.props.gender) {
            throw new Error('Giới tính không được để trống');
        }
        if (!['male', 'female', 'other'].includes(this.props.gender)) {
            throw new Error('Giới tính không hợp lệ');
        }
        // Validate national ID
        if (!this.props.nationalId || this.props.nationalId.trim().length === 0) {
            throw new Error('CMND/CCCD không được để trống');
        }
        if (!PersonalInfo.isValidCitizenId(this.props.nationalId)) {
            throw new Error('Số CMND/CCCD không hợp lệ');
        }
        // Validate nationality
        if (!this.props.nationality || this.props.nationality.trim().length === 0) {
            throw new Error('Quốc tịch không được để trống');
        }
    }
    /**
     * Create PersonalInfo
     */
    static create(props) {
        return new PersonalInfo({
            fullName: props.fullName.trim(),
            dateOfBirth: props.dateOfBirth,
            gender: props.gender,
            nationalId: props.nationalId.trim(),
            nationality: props.nationality.trim(),
            ethnicity: props.ethnicity?.trim(),
            occupation: props.occupation?.trim(),
            maritalStatus: props.maritalStatus?.trim()
        });
    }
    /**
     * Validate Vietnamese citizen ID (CMND/CCCD)
     */
    static isValidCitizenId(citizenId) {
        // CMND: 9 or 12 digits, CCCD: 12 digits
        const citizenIdRegex = /^\d{9}$|^\d{12}$/;
        return citizenIdRegex.test(citizenId.replace(/\s/g, ''));
    }
    // Getters
    get fullName() {
        return this.props.fullName;
    }
    get dateOfBirth() {
        return this.props.dateOfBirth;
    }
    get gender() {
        return this.props.gender;
    }
    get nationalId() {
        return this.props.nationalId;
    }
    get nationality() {
        return this.props.nationality;
    }
    get ethnicity() {
        return this.props.ethnicity;
    }
    get occupation() {
        return this.props.occupation;
    }
    get maritalStatus() {
        return this.props.maritalStatus;
    }
    /**
     * Get age from date of birth
     */
    getAge() {
        const today = new Date();
        const birthDate = this.props.dateOfBirth;
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }
    /**
     * Check if patient is minor (< 18 years old)
     */
    isMinor() {
        return this.getAge() < 18;
    }
    /**
     * Check if patient is elderly (>= 65 years old)
     */
    isElderly() {
        return this.getAge() >= 65;
    }
    /**
     * Vietnamese healthcare compliance check
     */
    isVietnameseCompliant() {
        return (this.props.fullName.length >= 2 &&
            PersonalInfo.isValidCitizenId(this.props.nationalId) &&
            this.props.nationality.length > 0);
    }
    /**
     * HIPAA compliance check
     */
    isHIPAACompliant() {
        // HIPAA requires full name, date of birth, and gender
        return (this.props.fullName.length >= 2 &&
            !!this.props.dateOfBirth &&
            !!this.props.gender);
    }
    /**
     * Check if personal info is valid
     */
    isValid() {
        try {
            this.validateFormat();
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Convert to persistence format
     */
    toPersistence() {
        return {
            fullName: this.props.fullName,
            dateOfBirth: this.props.dateOfBirth.toISOString(),
            gender: this.props.gender,
            nationalId: this.props.nationalId,
            nationality: this.props.nationality,
            ethnicity: this.props.ethnicity,
            occupation: this.props.occupation,
            maritalStatus: this.props.maritalStatus
        };
    }
    /**
     * Create from persistence data
     */
    static fromPersistence(data) {
        return PersonalInfo.create({
            fullName: data.fullName,
            dateOfBirth: new Date(data.dateOfBirth),
            gender: data.gender,
            nationalId: data.nationalId,
            nationality: data.nationality,
            ethnicity: data.ethnicity,
            occupation: data.occupation,
            maritalStatus: data.maritalStatus
        });
    }
    /**
     * Get display name (for logging, no sensitive data)
     */
    getDisplayName() {
        return this.props.fullName;
    }
    /**
     * Get masked national ID (for logging)
     */
    getMaskedNationalId() {
        const id = this.props.nationalId;
        if (id.length <= 4) {
            return '***';
        }
        return '***' + id.slice(-4);
    }
    /**
     * Get summary for logging (no sensitive data)
     */
    getSummaryForLogging() {
        return {
            fullName: this.props.fullName,
            age: this.getAge(),
            gender: this.props.gender,
            nationality: this.props.nationality,
            isMinor: this.isMinor(),
            isElderly: this.isElderly()
        };
    }
}
exports.PersonalInfo = PersonalInfo;
//# sourceMappingURL=PersonalInfo.js.map