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
const uuid_1 = require("uuid");
class EmergencyContact extends entity_1.Entity {
    constructor(props, id) {
        super(props, id);
    }
    /**
     * Create new emergency contact
     */
    static create(name, relationship, primaryPhone, secondaryPhone, email, address, isPrimary = false) {
        const now = new Date();
        const id = (0, uuid_1.v4)();
        return new EmergencyContact({
            id,
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
        }, id);
    }
    /**
     * Reconstitute from persistence
     */
    static reconstitute(props) {
        return new EmergencyContact(props);
    }
    // Getters
    getId() {
        return this.id;
    }
    get name() {
        return this.props.name;
    }
    get relationship() {
        return this.props.relationship;
    }
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
    updateContactInfo(name, primaryPhone, secondaryPhone, email, address) {
        if (name) {
            this.props.name = name.trim();
        }
        if (primaryPhone) {
            this.props.primaryPhone = primaryPhone.trim();
        }
        if (secondaryPhone !== undefined) {
            this.props.secondaryPhone = secondaryPhone?.trim();
        }
        if (email !== undefined) {
            this.props.email = email?.trim();
        }
        if (address !== undefined) {
            this.props.address = address?.trim();
        }
        this.props.updatedAt = new Date();
    }
    // Validation methods
    validate() {
        if (!this.isValid()) {
            throw new Error('Invalid emergency contact');
        }
    }
    isValid() {
        return (this.props.name.length > 0 &&
            this.props.relationship.length > 0 &&
            this.props.primaryPhone.length > 0 &&
            EmergencyContact.isValidVietnamesePhone(this.props.primaryPhone));
    }
    static isValidVietnamesePhone(phone) {
        // Vietnamese phone: 10 digits, starts with 0
        const phoneRegex = /^0\d{9}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    }
    // Persistence methods
    toPersistence() {
        return {
            id: this.id,
            name: this.props.name,
            relationship: this.props.relationship,
            primary_phone: this.props.primaryPhone,
            secondary_phone: this.props.secondaryPhone,
            email: this.props.email,
            address: this.props.address,
            is_primary: this.props.isPrimary,
            is_active: this.props.isActive,
            created_at: this.props.createdAt.toISOString(),
            updated_at: this.props.updatedAt.toISOString()
        };
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
        const phone = this.props.primaryPhone;
        if (phone.length <= 4) {
            return '***';
        }
        return '***' + phone.slice(-4);
    }
}
exports.EmergencyContact = EmergencyContact;
//# sourceMappingURL=EmergencyContact.js.map