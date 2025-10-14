"use strict";
/**
 * PersonalInfo Value Object
 * Encapsulates personal information for staff members
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
        if (!this.props.fullName || this.props.fullName.trim().length === 0) {
            throw new Error('Tên đầy đủ không được để trống');
        }
        if (this.props.fullName.trim().length < 2) {
            throw new Error('Tên đầy đủ phải có ít nhất 2 ký tự');
        }
        // Validate citizen ID format if provided (12 digits)
        if (this.props.citizenId && !/^\d{12}$/.test(this.props.citizenId)) {
            throw new Error('CCCD phải có 12 chữ số');
        }
        // Validate phone number format if provided
        if (this.props.phoneNumber && !/^[0-9]{10,11}$/.test(this.props.phoneNumber)) {
            throw new Error('Số điện thoại không hợp lệ');
        }
        // Validate email format if provided
        if (this.props.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.props.email)) {
            throw new Error('Email không hợp lệ');
        }
    }
    static create(props) {
        return new PersonalInfo({
            fullName: props.fullName.trim(),
            citizenId: props.citizenId?.trim(),
            dateOfBirth: props.dateOfBirth,
            gender: props.gender,
            phoneNumber: props.phoneNumber?.trim(),
            email: props.email?.trim(),
            address: props.address?.trim()
        });
    }
    get fullName() {
        return this.props.fullName;
    }
    get citizenId() {
        return this.props.citizenId;
    }
    get dateOfBirth() {
        return this.props.dateOfBirth;
    }
    get gender() {
        return this.props.gender;
    }
    get phoneNumber() {
        return this.props.phoneNumber;
    }
    get email() {
        return this.props.email;
    }
    get address() {
        return this.props.address;
    }
}
exports.PersonalInfo = PersonalInfo;
//# sourceMappingURL=PersonalInfo.js.map