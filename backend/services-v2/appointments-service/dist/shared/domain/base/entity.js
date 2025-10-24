"use strict";
/**
 * Entity Base Class - Clean Architecture + DDD
 * Enhanced version with healthcare-specific features
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, HIPAA
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthcareValueObject = exports.ValueObject = exports.HealthcareEntity = exports.Entity = void 0;
const uuid_1 = require("uuid");
/**
 * Abstract base class for all domain entities
 */
class Entity {
    constructor(props, id) {
        this._id = id || (0, uuid_1.v4)();
        this.props = props;
        this._createdAt = new Date();
        this._updatedAt = new Date();
    }
    /**
     * Get entity ID
     */
    get id() {
        return this._id;
    }
    /**
     * Get creation timestamp
     */
    get createdAt() {
        return this._createdAt;
    }
    /**
     * Get last update timestamp
     */
    get updatedAt() {
        return this._updatedAt;
    }
    /**
     * Update the entity's updated timestamp
     */
    touch() {
        this._updatedAt = new Date();
    }
    /**
     * Check equality with another entity
     */
    equals(entity) {
        if (entity === null || entity === undefined) {
            return false;
        }
        if (this === entity) {
            return true;
        }
        if (!(entity instanceof Entity)) {
            return false;
        }
        return this._id === entity._id;
    }
    /**
     * Get entity properties (immutable copy)
     */
    getProps() {
        return Object.freeze({ ...this.props });
    }
    /**
     * Update entity properties
     */
    updateProps(updates) {
        this.props = { ...this.props, ...updates };
        this.touch();
    }
    /**
     * Create entity from persistence data
     */
    static fromPersistence(_data) {
        throw new Error('fromPersistence method must be implemented by subclasses');
    }
}
exports.Entity = Entity;
/**
 * Healthcare Entity Base Class
 * Specialized entity for healthcare domain
 */
class HealthcareEntity extends Entity {
    constructor(props, id) {
        super(props, id);
    }
    /**
     * Get HIPAA compliance level
     */
    getHIPAAComplianceLevel() {
        return this.containsPHI() ? 'HIGH' : 'LOW';
    }
    /**
     * Healthcare-specific validation
     */
    validate() {
        this.validateHealthcareCompliance();
        this.validateBusinessRules();
    }
    /**
     * Validate healthcare compliance requirements
     */
    validateHealthcareCompliance() {
        if (this.containsPHI()) {
            this.validatePHIHandling();
        }
    }
    /**
     * Validate PHI handling requirements
     */
    validatePHIHandling() {
        // Ensure PHI is properly handled
        const patientId = this.getPatientId();
        if (!patientId) {
            throw new Error('PHI-containing entity must have associated patient ID');
        }
    }
    /**
     * Get audit information for HIPAA compliance
     */
    getAuditInfo() {
        return {
            entityId: this.id,
            entityType: this.constructor.name,
            containsPHI: this.containsPHI(),
            patientId: this.getPatientId(),
            complianceLevel: this.getHIPAAComplianceLevel(),
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}
exports.HealthcareEntity = HealthcareEntity;
/**
 * Value Object Base Class
 * For immutable value objects in the domain
 */
class ValueObject {
    constructor(props) {
        this.props = Object.freeze(props);
    }
    /**
     * Check equality with another value object
     */
    equals(vo) {
        if (vo === null || vo === undefined) {
            return false;
        }
        if (vo.props === undefined) {
            return false;
        }
        return JSON.stringify(this.props) === JSON.stringify(vo.props);
    }
    /**
     * Get value object properties
     */
    getValue() {
        return this.props;
    }
}
exports.ValueObject = ValueObject;
/**
 * Healthcare Value Object
 * Specialized value object for healthcare domain
 */
class HealthcareValueObject extends ValueObject {
    constructor(props) {
        super(props);
        this.validate();
    }
    /**
     * Healthcare-specific validation
     */
    validate() {
        this.validateFormat();
        this.validateHealthcareCompliance();
    }
    /**
     * Validate healthcare compliance
     */
    validateHealthcareCompliance() {
        if (this.containsPHI()) {
            this.validatePHIFormat();
        }
    }
}
exports.HealthcareValueObject = HealthcareValueObject;
//# sourceMappingURL=entity.js.map