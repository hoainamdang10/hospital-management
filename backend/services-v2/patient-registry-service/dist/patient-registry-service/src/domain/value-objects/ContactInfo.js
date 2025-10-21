"use strict";
/**
 * ContactInfo Value Object
 * Patient contact information with Vietnamese standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactInfo = void 0;
const value_object_1 = require("../../../../shared/domain/base/value-object");
class ContactInfo extends value_object_1.ValueObject {
    constructor(props) {
        super(props);
    }
    validateFormat() {
        if (!ContactInfo.isValidVietnamesePhoneNumber(this.props.primaryPhone)) {
            throw new Error('Số điện thoại chính không đúng định dạng Việt Nam');
        }
        if (this.props.email && !ContactInfo.isValidEmail(this.props.email)) {
            throw new Error('Email không đúng định dạng');
        }
    }
    static create(props) {
        // Validate required fields
        if (!props.primaryPhone || props.primaryPhone.trim().length === 0) {
            throw new Error('Số điện thoại chính không được để trống');
        }
        if (!this.isValidVietnamesePhoneNumber(props.primaryPhone)) {
            throw new Error('Số điện thoại chính không đúng định dạng Việt Nam');
        }
        if (props.secondaryPhone && !this.isValidVietnamesePhoneNumber(props.secondaryPhone)) {
            throw new Error('Số điện thoại phụ không đúng định dạng Việt Nam');
        }
        // Trim and lowercase email before validation
        const trimmedEmail = props.email?.trim().toLowerCase();
        if (trimmedEmail && !this.isValidEmail(trimmedEmail)) {
            throw new Error('Email không đúng định dạng');
        }
        // Validate address
        if (!props.address.street || props.address.street.trim().length === 0) {
            throw new Error('Địa chỉ đường/phố không được để trống');
        }
        if (!props.address.ward || props.address.ward.trim().length === 0) {
            throw new Error('Phường/xã không được để trống');
        }
        if (!props.address.district || props.address.district.trim().length === 0) {
            throw new Error('Quận/huyện không được để trống');
        }
        if (!props.address.city || props.address.city.trim().length === 0) {
            throw new Error('Thành phố/quận/huyện không được để trống');
        }
        if (!props.address.province || props.address.province.trim().length === 0) {
            throw new Error('Tỉnh/thành phố không được để trống');
        }
        return new ContactInfo({
            primaryPhone: props.primaryPhone.trim(),
            secondaryPhone: props.secondaryPhone?.trim(),
            email: trimmedEmail,
            address: {
                street: props.address.street.trim(),
                ward: props.address.ward.trim(),
                district: props.address.district.trim(),
                city: props.address.city.trim(),
                province: props.address.province.trim(),
                postalCode: props.address.postalCode?.trim(),
                country: props.address.country || 'Việt Nam'
            },
            preferredContactMethod: props.preferredContactMethod
        });
    }
    // Getters
    get primaryPhone() {
        return this.props.primaryPhone;
    }
    get secondaryPhone() {
        return this.props.secondaryPhone;
    }
    get email() {
        return this.props.email;
    }
    get address() {
        return { ...this.props.address };
    }
    get preferredContactMethod() {
        return this.props.preferredContactMethod;
    }
    // Business methods
    getFormattedPrimaryPhone() {
        const phone = this.props.primaryPhone;
        return `${phone.slice(0, 4)} ${phone.slice(4, 7)} ${phone.slice(7)}`;
    }
    getFormattedSecondaryPhone() {
        if (!this.props.secondaryPhone) {
            return undefined;
        }
        const phone = this.props.secondaryPhone;
        return `${phone.slice(0, 4)} ${phone.slice(4, 7)} ${phone.slice(7)}`;
    }
    getFullAddress() {
        const { street, ward, district, city, province, country } = this.props.address;
        return `${street}, ${ward}, ${district}, ${city}, ${province}, ${country}`;
    }
    getShortAddress() {
        const { district, city } = this.props.address;
        return `${district}, ${city}`;
    }
    hasEmail() {
        return !!this.props.email;
    }
    hasSecondaryPhone() {
        return !!this.props.secondaryPhone;
    }
    canContactByEmail() {
        return this.hasEmail() &&
            (this.props.preferredContactMethod === 'email' ||
                this.props.preferredContactMethod === 'sms');
    }
    canContactByPhone() {
        return this.props.preferredContactMethod === 'phone';
    }
    canContactBySMS() {
        return this.props.preferredContactMethod === 'sms';
    }
    getContactPhones() {
        const phones = [this.props.primaryPhone];
        if (this.props.secondaryPhone) {
            phones.push(this.props.secondaryPhone);
        }
        return phones;
    }
    // Vietnamese address specific methods
    isInHoChiMinhCity() {
        return this.props.address.city.toLowerCase().includes('hồ chí minh') ||
            this.props.address.city.toLowerCase().includes('tp.hcm') ||
            this.props.address.city.toLowerCase().includes('sài gòn');
    }
    isInHanoi() {
        return this.props.address.city.toLowerCase().includes('hà nội') ||
            this.props.address.city.toLowerCase().includes('hanoi');
    }
    isInMajorCity() {
        return this.isInHoChiMinhCity() ||
            this.isInHanoi() ||
            this.props.address.city.toLowerCase().includes('đà nẵng') ||
            this.props.address.city.toLowerCase().includes('cần thơ') ||
            this.props.address.city.toLowerCase().includes('hải phòng');
    }
    // Validation methods
    static isValidVietnamesePhoneNumber(phone) {
        // Vietnamese phone number: 10 digits starting with 0
        const phoneRegex = /^0[0-9]{9}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    }
    static isValidEmail(email) {
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?/.source +
            /(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.source;
        return new RegExp(emailRegex).test(email);
    }
    // Update methods
    updatePrimaryPhone(primaryPhone) {
        return ContactInfo.create({
            ...this.props,
            primaryPhone
        });
    }
    updateSecondaryPhone(secondaryPhone) {
        return ContactInfo.create({
            ...this.props,
            secondaryPhone
        });
    }
    updateEmail(email) {
        return ContactInfo.create({
            ...this.props,
            email
        });
    }
    updateAddress(address) {
        return ContactInfo.create({
            ...this.props,
            address
        });
    }
    updatePreferredContactMethod(method) {
        return ContactInfo.create({
            ...this.props,
            preferredContactMethod: method
        });
    }
    equals(other) {
        return (this.props.primaryPhone === other.props.primaryPhone &&
            this.props.secondaryPhone === other.props.secondaryPhone &&
            this.props.email === other.props.email &&
            this.props.address.street === other.props.address.street &&
            this.props.address.ward === other.props.address.ward &&
            this.props.address.district === other.props.address.district &&
            this.props.address.city === other.props.address.city &&
            this.props.address.postalCode === other.props.address.postalCode &&
            this.props.address.country === other.props.address.country &&
            this.props.preferredContactMethod === other.props.preferredContactMethod);
    }
}
exports.ContactInfo = ContactInfo;
//# sourceMappingURL=ContactInfo.js.map