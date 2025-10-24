"use strict";
/**
 * Value Object Base Class - Clean Architecture + DDD
 * Enhanced version with healthcare-specific features
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, HIPAA, Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.VietnameseHealthcareValueObject = exports.HealthcareValueObject = exports.ValueObject = void 0;
/**
 * Abstract Value Object Base Class
 */
class ValueObject {
    constructor(props) {
        this.props = Object.freeze(props);
        this.validateFormat();
    }
    /**
     * Check if this value object equals another
     */
    equals(other) {
        if (!other || other.constructor !== this.constructor) {
            return false;
        }
        return this.deepEquals(this.props, other.props);
    }
    /**
     * Deep equality check for complex objects
     */
    deepEquals(a, b) {
        if (a === b)
            return true;
        if (a == null || b == null)
            return false;
        if (typeof a !== typeof b)
            return false;
        if (typeof a === 'object') {
            if (Array.isArray(a) !== Array.isArray(b))
                return false;
            if (Array.isArray(a)) {
                if (a.length !== b.length)
                    return false;
                for (let i = 0; i < a.length; i++) {
                    if (!this.deepEquals(a[i], b[i]))
                        return false;
                }
                return true;
            }
            const keysA = Object.keys(a);
            const keysB = Object.keys(b);
            if (keysA.length !== keysB.length)
                return false;
            for (const key of keysA) {
                if (!keysB.includes(key))
                    return false;
                if (!this.deepEquals(a[key], b[key]))
                    return false;
            }
            return true;
        }
        return false;
    }
    /**
     * Get hash code for this value object
     */
    hashCode() {
        return JSON.stringify(this.props);
    }
    /**
     * Convert to string representation
     */
    toString() {
        return JSON.stringify(this.props);
    }
    /**
     * Get a copy of the props (defensive copy)
     */
    getProps() {
        return { ...this.props };
    }
}
exports.ValueObject = ValueObject;
/**
 * Healthcare Value Object Base Class
 * Specialized for healthcare domain with HIPAA compliance
 */
class HealthcareValueObject extends ValueObject {
    constructor(props) {
        super(props);
    }
    /**
     * Validate healthcare-specific business rules
     */
    validateHealthcareRules() {
        // Common healthcare validations can be added here
    }
    /**
     * Get HIPAA audit information
     */
    getHIPAAAuditInfo() {
        return {
            valueObjectType: this.constructor.name,
            containsPHI: this.containsPHI(),
            accessedAt: new Date(),
            auditType: 'VALUE_OBJECT_ACCESS'
        };
    }
}
exports.HealthcareValueObject = HealthcareValueObject;
/**
 * Vietnamese Healthcare Value Object
 * Specialized for Vietnamese healthcare standards
 */
class VietnameseHealthcareValueObject extends HealthcareValueObject {
    constructor(props) {
        super(props);
        this.validateVietnameseStandards();
    }
}
exports.VietnameseHealthcareValueObject = VietnameseHealthcareValueObject;
//# sourceMappingURL=value-object.js.map