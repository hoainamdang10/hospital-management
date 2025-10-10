/**
 * Recovery Attempt Value Object
 * Represents a single account recovery attempt
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD Value Object Pattern
 */
export type RecoveryMethodType = 'primary_email' | 'recovery_email';
export type AttemptType = 'request_reset' | 'verify_token' | 'reset_password';
export interface RecoveryAttemptProps {
    id?: string;
    userId: string;
    recoveryMethod: RecoveryMethodType;
    attemptType: AttemptType;
    success: boolean;
    failureReason?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    attemptedAt: Date;
}
/**
 * Recovery Attempt Value Object
 * Immutable object representing a single recovery attempt for audit trail
 */
export declare class RecoveryAttempt {
    private readonly _id;
    private readonly _userId;
    private readonly _recoveryMethod;
    private readonly _attemptType;
    private readonly _success;
    private readonly _failureReason;
    private readonly _ipAddress;
    private readonly _userAgent;
    private readonly _attemptedAt;
    private constructor();
    /**
     * Factory method to create RecoveryAttempt
     * Validates all business rules
     */
    static create(props: RecoveryAttemptProps): RecoveryAttempt;
    /**
     * Create successful recovery attempt
     */
    static createSuccess(userId: string, recoveryMethod: RecoveryMethodType, attemptType: AttemptType, ipAddress?: string, userAgent?: string): RecoveryAttempt;
    /**
     * Create failed recovery attempt
     */
    static createFailure(userId: string, recoveryMethod: RecoveryMethodType, attemptType: AttemptType, failureReason: string, ipAddress?: string, userAgent?: string): RecoveryAttempt;
    /**
     * Check if attempt was successful
     */
    isSuccessful(): boolean;
    /**
     * Check if attempt was a password reset request
     */
    isResetRequest(): boolean;
    /**
     * Check if attempt was a token verification
     */
    isTokenVerification(): boolean;
    /**
     * Check if attempt was a password reset
     */
    isPasswordReset(): boolean;
    /**
     * Check if attempt used primary email
     */
    usedPrimaryEmail(): boolean;
    /**
     * Check if attempt used recovery email
     */
    usedRecoveryEmail(): boolean;
    get id(): string | undefined;
    get userId(): string;
    get recoveryMethod(): RecoveryMethodType;
    get attemptType(): AttemptType;
    get success(): boolean;
    get failureReason(): string | null;
    get ipAddress(): string | null;
    get userAgent(): string | null;
    get attemptedAt(): Date;
    /**
     * Convert to plain object for serialization
     */
    toObject(): {
        id?: string;
        userId: string;
        recoveryMethod: RecoveryMethodType;
        attemptType: AttemptType;
        success: boolean;
        failureReason: string | null;
        ipAddress: string | null;
        userAgent: string | null;
        attemptedAt: string;
    };
    /**
     * Get a human-readable description of the attempt
     */
    getDescription(): string;
    /**
     * Get attempt type in Vietnamese
     */
    getAttemptTypeVietnamese(): string;
    /**
     * Get recovery method in Vietnamese
     */
    getRecoveryMethodVietnamese(): string;
}
//# sourceMappingURL=RecoveryAttempt.d.ts.map