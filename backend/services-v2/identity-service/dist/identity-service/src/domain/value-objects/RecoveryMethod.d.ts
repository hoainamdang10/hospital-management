/**
 * Recovery Method Value Object
 * Represents account recovery methods for a user
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD Value Object Pattern
 */
import { Email } from './Email';
export interface RecoveryMethodProps {
    userId: string;
    recoveryEmail?: string | null;
    recoveryEmailVerified: boolean;
    recoveryEmailVerifiedAt?: Date | null;
    lastUpdatedAt: Date;
    updatedBy?: string | null;
    createdAt: Date;
}
/**
 * Recovery Method Value Object
 * Immutable object representing user's account recovery methods
 */
export declare class RecoveryMethod {
    private readonly _userId;
    private readonly _recoveryEmail;
    private readonly _recoveryEmailVerified;
    private readonly _recoveryEmailVerifiedAt;
    private readonly _lastUpdatedAt;
    private readonly _updatedBy;
    private readonly _createdAt;
    private constructor();
    /**
     * Factory method to create RecoveryMethod
     * Validates all business rules
     */
    static create(props: RecoveryMethodProps): RecoveryMethod;
    /**
     * Create default recovery method (no recovery email configured)
     */
    static createDefault(userId: string): RecoveryMethod;
    /**
     * Update recovery email
     * Returns new RecoveryMethod instance (immutable)
     */
    updateRecoveryEmail(newEmail: string, updatedBy: string): RecoveryMethod;
    /**
     * Mark recovery email as verified
     * Returns new RecoveryMethod instance (immutable)
     */
    markAsVerified(): RecoveryMethod;
    /**
     * Remove recovery email
     * Returns new RecoveryMethod instance (immutable)
     */
    removeRecoveryEmail(updatedBy: string): RecoveryMethod;
    /**
     * Check if recovery email is configured
     */
    hasRecoveryEmail(): boolean;
    /**
     * Check if recovery email is verified
     */
    isRecoveryEmailVerified(): boolean;
    /**
     * Check if recovery email can be used for password reset
     */
    canUseForRecovery(): boolean;
    get userId(): string;
    get recoveryEmail(): Email | null;
    get recoveryEmailVerified(): boolean;
    get recoveryEmailVerifiedAt(): Date | null;
    get lastUpdatedAt(): Date;
    get updatedBy(): string | null;
    get createdAt(): Date;
    /**
     * Convert to plain object for serialization
     */
    toObject(): {
        userId: string;
        recoveryEmail: string | null;
        recoveryEmailVerified: boolean;
        recoveryEmailVerifiedAt: string | null;
        lastUpdatedAt: string;
        updatedBy: string | null;
        createdAt: string;
    };
    /**
     * Check equality with another RecoveryMethod
     */
    equals(other: RecoveryMethod): boolean;
    /**
     * Get a summary description of recovery methods
     */
    getDescription(): string;
}
//# sourceMappingURL=RecoveryMethod.d.ts.map