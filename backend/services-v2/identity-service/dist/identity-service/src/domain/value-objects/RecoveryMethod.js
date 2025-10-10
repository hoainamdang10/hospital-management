"use strict";
/**
 * Recovery Method Value Object
 * Represents account recovery methods for a user
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD Value Object Pattern
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecoveryMethod = void 0;
const Email_1 = require("./Email");
/**
 * Recovery Method Value Object
 * Immutable object representing user's account recovery methods
 */
class RecoveryMethod {
    constructor(props) {
        this._userId = props.userId;
        this._recoveryEmail = props.recoveryEmail ? Email_1.Email.create(props.recoveryEmail) : null;
        this._recoveryEmailVerified = props.recoveryEmailVerified;
        this._recoveryEmailVerifiedAt = props.recoveryEmailVerifiedAt || null;
        this._lastUpdatedAt = props.lastUpdatedAt;
        this._updatedBy = props.updatedBy || null;
        this._createdAt = props.createdAt;
    }
    /**
     * Factory method to create RecoveryMethod
     * Validates all business rules
     */
    static create(props) {
        // Validate userId
        if (!props.userId || props.userId.trim().length === 0) {
            throw new Error('User ID is required');
        }
        // Validate recovery email if provided
        if (props.recoveryEmail) {
            // Email validation is done in Email.create()
            // Additional validation: recovery email should be different from primary email
            // (This check should be done at application layer with user's primary email)
        }
        // Validate verified status consistency
        if (props.recoveryEmailVerified && !props.recoveryEmailVerifiedAt) {
            throw new Error('Verified recovery email must have verification timestamp');
        }
        if (!props.recoveryEmailVerified && props.recoveryEmailVerifiedAt) {
            throw new Error('Unverified recovery email cannot have verification timestamp');
        }
        // Validate timestamps
        if (props.lastUpdatedAt > new Date()) {
            throw new Error('Last updated timestamp cannot be in the future');
        }
        if (props.createdAt > new Date()) {
            throw new Error('Created timestamp cannot be in the future');
        }
        if (props.lastUpdatedAt < props.createdAt) {
            throw new Error('Last updated timestamp cannot be before created timestamp');
        }
        return new RecoveryMethod(props);
    }
    /**
     * Create default recovery method (no recovery email configured)
     */
    static createDefault(userId) {
        return RecoveryMethod.create({
            userId,
            recoveryEmail: null,
            recoveryEmailVerified: false,
            recoveryEmailVerifiedAt: null,
            lastUpdatedAt: new Date(),
            updatedBy: null,
            createdAt: new Date()
        });
    }
    /**
     * Update recovery email
     * Returns new RecoveryMethod instance (immutable)
     */
    updateRecoveryEmail(newEmail, updatedBy) {
        return RecoveryMethod.create({
            userId: this._userId,
            recoveryEmail: newEmail,
            recoveryEmailVerified: false, // Reset verification status
            recoveryEmailVerifiedAt: null,
            lastUpdatedAt: new Date(),
            updatedBy,
            createdAt: this._createdAt
        });
    }
    /**
     * Mark recovery email as verified
     * Returns new RecoveryMethod instance (immutable)
     */
    markAsVerified() {
        if (!this._recoveryEmail) {
            throw new Error('Cannot verify: no recovery email configured');
        }
        if (this._recoveryEmailVerified) {
            throw new Error('Recovery email is already verified');
        }
        return RecoveryMethod.create({
            userId: this._userId,
            recoveryEmail: this._recoveryEmail.value,
            recoveryEmailVerified: true,
            recoveryEmailVerifiedAt: new Date(),
            lastUpdatedAt: new Date(),
            updatedBy: this._updatedBy,
            createdAt: this._createdAt
        });
    }
    /**
     * Remove recovery email
     * Returns new RecoveryMethod instance (immutable)
     */
    removeRecoveryEmail(updatedBy) {
        return RecoveryMethod.create({
            userId: this._userId,
            recoveryEmail: null,
            recoveryEmailVerified: false,
            recoveryEmailVerifiedAt: null,
            lastUpdatedAt: new Date(),
            updatedBy,
            createdAt: this._createdAt
        });
    }
    /**
     * Check if recovery email is configured
     */
    hasRecoveryEmail() {
        return this._recoveryEmail !== null;
    }
    /**
     * Check if recovery email is verified
     */
    isRecoveryEmailVerified() {
        return this._recoveryEmailVerified;
    }
    /**
     * Check if recovery email can be used for password reset
     */
    canUseForRecovery() {
        return this.hasRecoveryEmail() && this.isRecoveryEmailVerified();
    }
    // Getters
    get userId() {
        return this._userId;
    }
    get recoveryEmail() {
        return this._recoveryEmail;
    }
    get recoveryEmailVerified() {
        return this._recoveryEmailVerified;
    }
    get recoveryEmailVerifiedAt() {
        return this._recoveryEmailVerifiedAt;
    }
    get lastUpdatedAt() {
        return this._lastUpdatedAt;
    }
    get updatedBy() {
        return this._updatedBy;
    }
    get createdAt() {
        return this._createdAt;
    }
    /**
     * Convert to plain object for serialization
     */
    toObject() {
        return {
            userId: this._userId,
            recoveryEmail: this._recoveryEmail ? this._recoveryEmail.value : null,
            recoveryEmailVerified: this._recoveryEmailVerified,
            recoveryEmailVerifiedAt: this._recoveryEmailVerifiedAt
                ? this._recoveryEmailVerifiedAt.toISOString()
                : null,
            lastUpdatedAt: this._lastUpdatedAt.toISOString(),
            updatedBy: this._updatedBy,
            createdAt: this._createdAt.toISOString()
        };
    }
    /**
     * Check equality with another RecoveryMethod
     */
    equals(other) {
        if (!other)
            return false;
        return (this._userId === other._userId &&
            this._recoveryEmail?.value === other._recoveryEmail?.value &&
            this._recoveryEmailVerified === other._recoveryEmailVerified &&
            this._recoveryEmailVerifiedAt?.getTime() === other._recoveryEmailVerifiedAt?.getTime());
    }
    /**
     * Get a summary description of recovery methods
     */
    getDescription() {
        if (!this.hasRecoveryEmail()) {
            return 'Chưa cấu hình email khôi phục';
        }
        if (this.isRecoveryEmailVerified()) {
            return `Email khôi phục: ${this._recoveryEmail.value} (Đã xác thực)`;
        }
        return `Email khôi phục: ${this._recoveryEmail.value} (Chưa xác thực)`;
    }
}
exports.RecoveryMethod = RecoveryMethod;
//# sourceMappingURL=RecoveryMethod.js.map