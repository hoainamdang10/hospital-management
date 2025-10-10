/**
 * Recovery Method Repository Interface
 * Defines contract for recovery method persistence
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Dependency Inversion Principle
 */
import { RecoveryMethod } from '../value-objects/RecoveryMethod';
/**
 * Recovery Method Repository Interface
 * Domain layer defines the contract, infrastructure layer implements it
 */
export interface IRecoveryMethodRepository {
    /**
     * Get recovery methods for a user
     * Returns null if user has no recovery methods configured
     *
     * @param userId - User ID
     * @returns RecoveryMethod or null
     */
    getByUserId(userId: string): Promise<RecoveryMethod | null>;
    /**
     * Create or update recovery methods for a user
     * If recovery methods exist, updates them
     * If not, creates new record
     *
     * @param recoveryMethod - Recovery method to save
     * @returns Saved recovery method
     */
    save(recoveryMethod: RecoveryMethod): Promise<RecoveryMethod>;
    /**
     * Check if recovery email is already used by another user
     * Used to prevent duplicate recovery emails
     *
     * @param email - Recovery email to check
     * @param excludeUserId - User ID to exclude from check (for updates)
     * @returns true if email is already used
     */
    isRecoveryEmailUsed(email: string, excludeUserId?: string): Promise<boolean>;
    /**
     * Find user by recovery email
     * Used for password reset via recovery email
     *
     * @param email - Recovery email
     * @returns User ID or null if not found
     */
    findUserIdByRecoveryEmail(email: string): Promise<string | null>;
    /**
     * Delete recovery methods for a user
     * Used when user account is deleted
     *
     * @param userId - User ID
     */
    delete(userId: string): Promise<void>;
}
//# sourceMappingURL=IRecoveryMethodRepository.d.ts.map