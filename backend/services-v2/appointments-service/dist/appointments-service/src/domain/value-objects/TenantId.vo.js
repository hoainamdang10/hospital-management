"use strict";
/**
 * TenantId Value Object - Domain Layer
 * Multi-tenancy support for appointments service
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantId = void 0;
const value_object_1 = require("../../../../shared/domain/base/value-object");
/**
 * TenantId Value Object
 * Represents tenant identifier for multi-tenancy isolation
 */
class TenantId extends value_object_1.HealthcareValueObject {
    constructor(props) {
        super(props);
    }
    /**
     * Create TenantId from string
     */
    static create(value) {
        TenantId.validate(value);
        return new TenantId({ value });
    }
    /**
     * Create default tenant (hospital-1)
     */
    static createDefault() {
        return new TenantId({ value: 'hospital-1' });
    }
    /**
     * Validate value object format (required by ValueObject base class)
     */
    validateFormat() {
        TenantId.validate(this.props.value);
    }
    /**
     * Validate tenant ID format
     */
    static validate(value) {
        if (!value || value.trim().length === 0) {
            throw new Error('Tenant ID cannot be empty');
        }
        if (value.length > 100) {
            throw new Error('Tenant ID cannot exceed 100 characters');
        }
        // Allow alphanumeric, hyphens, underscores
        const validPattern = /^[a-zA-Z0-9_-]+$/;
        if (!validPattern.test(value)) {
            throw new Error('Tenant ID can only contain alphanumeric characters, hyphens, and underscores');
        }
    }
    /**
     * Get tenant ID value
     */
    get value() {
        return this.props.value;
    }
    /**
     * Healthcare-specific: Contains PHI
     */
    containsPHI() {
        return false; // Tenant ID is not PHI
    }
    /**
     * Anonymize for logging
     */
    anonymize() {
        return this; // Tenant ID is already anonymized
    }
    /**
     * String representation
     */
    toString() {
        return this.props.value;
    }
}
exports.TenantId = TenantId;
//# sourceMappingURL=TenantId.vo.js.map