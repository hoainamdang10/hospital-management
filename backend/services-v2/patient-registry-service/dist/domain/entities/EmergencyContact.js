"use strict";
/**
 * EmergencyContact Entity - Patient Registry
 * Patient emergency contact information
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmergencyContact = void 0;
const entity_1 = require("@shared/domain/base/entity");
class EmergencyContact extends entity_1.Entity {
    constructor(props) {
        super(props);
    }
    /**
     * Create new emergency contact
     */
    static create(name, relationship, primaryPhone, secondaryPhone, email, address, isPrimary = false) {
        const now = new Date();
        return new EmergencyContact({
            id: entity_1.Entity.generateId(),
            name: name.trim(),
            relationship: relationship.trim(),
            primaryPhone: primaryPhone.trim(),
            secondaryPhone: secondaryPhone?.trim(),
            email: email?.trim(),
            address: address?.trim(),
            isPrimary,
            isActive: true,
            createdAt: now,
            updatedAt: now
        });
    }
    /**
     * Reconstitute from persistence
     */
    static reconstitute(props) {
        return new EmergencyContact(props);
    }
    // Getters
    get id() {
        return this.props.id;
    }
    get name() {
        return this.props.name;
    }
    get relationship() {
        return this.props.relationship;
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
    get isPrimary() {
        return this.props.isPrimary;
    }
    get isActive() {
        return this.props.isActive;
    }
    // Business methods
    setPrimary() {
        this.props.isPrimary = true;
        this.props.updatedAt = new Date();
    }
    removePrimary() {
        this.props.isPrimary = false;
        this.props.updatedAt = new Date();
    }
    activate() {
        this.props.isActive = true;
        this.props.updatedAt = new Date();
    }
    deactivate() {
        this.props.isActive = false;
        this.props.updatedAt = new Date();
    }
    updateContactInfo(name, phoneNumber, email, address) {
        if (name)
            this.props.name = name.trim();
        if (phoneNumber)
            this.props.phoneNumber = phoneNumber.trim();
        if (email !== undefined)
            this.props.email = email?.trim();
        if (address !== undefined)
            this.props.address = address?.trim();
        this.props.updatedAt = new Date();
    }
    // Validation methods
    isValid() {
        return (this.props.name.length > 0 &&
            this.props.relationship.length > 0 &&
            this.props.phoneNumber.length > 0 &&
            EmergencyContact.isValidVietnamesePhone(this.props.phoneNumber));
    }
    static isValidVietnamesePhone(phone) {
        // Vietnamese phone: 10 digits, starts with 0
        const phoneRegex = /^0\d{9}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    }
    // Persistence methods
    toPersistence() {
        return {
            id: this.props.id,
            name: this.props.name,
            relationship: this.props.relationship,
            phoneNumber: this.props.phoneNumber,
            email: this.props.email,
            address: this.props.address,
            isPrimary: this.props.isPrimary,
            isActive: this.props.isActive,
            createdAt: this.props.createdAt.toISOString(),
            updatedAt: this.props.updatedAt.toISOString()
        };
    }
    static fromPersistence(data) {
        return EmergencyContact.reconstitute({
            id: data.id,
            name: data.name,
            relationship: data.relationship,
            phoneNumber: data.phoneNumber,
            email: data.email,
            address: data.address,
            isPrimary: data.isPrimary,
            isActive: data.isActive,
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt)
        });
    }
    // Logging methods
    getSummaryForLogging() {
        return {
            id: this.props.id,
            name: this.props.name,
            relationship: this.props.relationship,
            isPrimary: this.props.isPrimary,
            isActive: this.props.isActive
        };
    }
    getMaskedPhoneNumber() {
        const phone = this.props.phoneNumber;
        if (phone.length <= 4)
            return '***';
        return '***' + phone.slice(-4);
    }
}
exports.EmergencyContact = EmergencyContact;
//# sourceMappingURL=EmergencyContact.js.map