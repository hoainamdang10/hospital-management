"use strict";
/**
 * Recovery Attempt Value Object
 * Represents a single account recovery attempt
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD Value Object Pattern
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecoveryAttempt = void 0;
/**
 * Recovery Attempt Value Object
 * Immutable object representing a single recovery attempt for audit trail
 */
class RecoveryAttempt {
    constructor(props) {
        this._id = props.id;
        this._userId = props.userId;
        this._recoveryMethod = props.recoveryMethod;
        this._attemptType = props.attemptType;
        this._success = props.success;
        this._failureReason = props.failureReason || null;
        this._ipAddress = props.ipAddress || null;
        this._userAgent = props.userAgent || null;
        this._attemptedAt = props.attemptedAt;
    }
    /**
     * Factory method to create RecoveryAttempt
     * Validates all business rules
     */
    static create(props) {
        // Validate userId
        if (!props.userId || props.userId.trim().length === 0) {
            throw new Error('User ID is required');
        }
        // Validate recovery method
        const validRecoveryMethods = ['primary_email', 'recovery_email'];
        if (!validRecoveryMethods.includes(props.recoveryMethod)) {
            throw new Error(`Invalid recovery method: ${props.recoveryMethod}`);
        }
        // Validate attempt type
        const validAttemptTypes = ['request_reset', 'verify_token', 'reset_password'];
        if (!validAttemptTypes.includes(props.attemptType)) {
            throw new Error(`Invalid attempt type: ${props.attemptType}`);
        }
        // Validate failure reason consistency
        if (!props.success && !props.failureReason) {
            throw new Error('Failed attempts must have a failure reason');
        }
        if (props.success && props.failureReason) {
            throw new Error('Successful attempts cannot have a failure reason');
        }
        // Validate timestamp
        if (props.attemptedAt > new Date()) {
            throw new Error('Attempted timestamp cannot be in the future');
        }
        // Validate IP address format (basic validation)
        if (props.ipAddress && props.ipAddress.trim().length === 0) {
            throw new Error('IP address cannot be empty string');
        }
        // Validate user agent
        if (props.userAgent && props.userAgent.trim().length === 0) {
            throw new Error('User agent cannot be empty string');
        }
        return new RecoveryAttempt(props);
    }
    /**
     * Create successful recovery attempt
     */
    static createSuccess(userId, recoveryMethod, attemptType, ipAddress, userAgent) {
        return RecoveryAttempt.create({
            userId,
            recoveryMethod,
            attemptType,
            success: true,
            failureReason: null,
            ipAddress: ipAddress || null,
            userAgent: userAgent || null,
            attemptedAt: new Date()
        });
    }
    /**
     * Create failed recovery attempt
     */
    static createFailure(userId, recoveryMethod, attemptType, failureReason, ipAddress, userAgent) {
        return RecoveryAttempt.create({
            userId,
            recoveryMethod,
            attemptType,
            success: false,
            failureReason,
            ipAddress: ipAddress || null,
            userAgent: userAgent || null,
            attemptedAt: new Date()
        });
    }
    /**
     * Check if attempt was successful
     */
    isSuccessful() {
        return this._success;
    }
    /**
     * Check if attempt was a password reset request
     */
    isResetRequest() {
        return this._attemptType === 'request_reset';
    }
    /**
     * Check if attempt was a token verification
     */
    isTokenVerification() {
        return this._attemptType === 'verify_token';
    }
    /**
     * Check if attempt was a password reset
     */
    isPasswordReset() {
        return this._attemptType === 'reset_password';
    }
    /**
     * Check if attempt used primary email
     */
    usedPrimaryEmail() {
        return this._recoveryMethod === 'primary_email';
    }
    /**
     * Check if attempt used recovery email
     */
    usedRecoveryEmail() {
        return this._recoveryMethod === 'recovery_email';
    }
    // Getters
    get id() {
        return this._id;
    }
    get userId() {
        return this._userId;
    }
    get recoveryMethod() {
        return this._recoveryMethod;
    }
    get attemptType() {
        return this._attemptType;
    }
    get success() {
        return this._success;
    }
    get failureReason() {
        return this._failureReason;
    }
    get ipAddress() {
        return this._ipAddress;
    }
    get userAgent() {
        return this._userAgent;
    }
    get attemptedAt() {
        return this._attemptedAt;
    }
    /**
     * Convert to plain object for serialization
     */
    toObject() {
        return {
            id: this._id,
            userId: this._userId,
            recoveryMethod: this._recoveryMethod,
            attemptType: this._attemptType,
            success: this._success,
            failureReason: this._failureReason,
            ipAddress: this._ipAddress,
            userAgent: this._userAgent,
            attemptedAt: this._attemptedAt.toISOString()
        };
    }
    /**
     * Get a human-readable description of the attempt
     */
    getDescription() {
        const methodStr = this.usedPrimaryEmail() ? 'email chính' : 'email khôi phục';
        const typeStr = this.isResetRequest()
            ? 'yêu cầu đặt lại mật khẩu'
            : this.isTokenVerification()
                ? 'xác thực token'
                : 'đặt lại mật khẩu';
        const statusStr = this.isSuccessful() ? 'thành công' : 'thất bại';
        let description = `${typeStr} qua ${methodStr} - ${statusStr}`;
        if (!this.isSuccessful() && this._failureReason) {
            description += ` (${this._failureReason})`;
        }
        return description;
    }
    /**
     * Get attempt type in Vietnamese
     */
    getAttemptTypeVietnamese() {
        switch (this._attemptType) {
            case 'request_reset':
                return 'Yêu cầu đặt lại mật khẩu';
            case 'verify_token':
                return 'Xác thực token';
            case 'reset_password':
                return 'Đặt lại mật khẩu';
            default:
                return 'Không xác định';
        }
    }
    /**
     * Get recovery method in Vietnamese
     */
    getRecoveryMethodVietnamese() {
        switch (this._recoveryMethod) {
            case 'primary_email':
                return 'Email chính';
            case 'recovery_email':
                return 'Email khôi phục';
            default:
                return 'Không xác định';
        }
    }
}
exports.RecoveryAttempt = RecoveryAttempt;
//# sourceMappingURL=RecoveryAttempt.js.map