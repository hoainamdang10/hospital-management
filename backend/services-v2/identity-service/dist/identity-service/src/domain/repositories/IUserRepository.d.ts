/**
 * IUserRepository - Domain Repository Interface
 * V2 Clean Architecture + DDD Implementation
 * Defines contract for user persistence operations
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Repository Pattern, HIPAA
 */
import { User } from '../aggregates/User';
import { UserId } from '../value-objects/UserId';
import { Email } from '../value-objects/Email';
import { UserSession } from '../entities/UserSession';
/**
 * User Repository Interface
 * All methods return Domain objects, not DTOs
 */
export interface IUserRepository {
    /**
     * Find user by ID
     * @returns User aggregate or null if not found
     */
    findById(userId: UserId): Promise<User | null>;
    /**
     * Find user by email
     * @returns User aggregate or null if not found
     */
    findByEmail(email: Email): Promise<User | null>;
    /**
     * Save user (create or update)
     * @param user User aggregate to persist
     */
    save(user: User): Promise<void>;
    /**
     * Delete user (soft delete)
     * @param userId User ID to delete
     */
    delete(userId: UserId): Promise<void>;
    /**
     * Check if user exists
     * @param userId User ID to check
     */
    exists(userId: UserId): Promise<boolean>;
    /**
     * Create user session
     * @param session UserSession entity to create
     * @returns Created session entity
     */
    createSession(session: UserSession): Promise<UserSession>;
    /**
     * Find active session by token
     * @param token Session token
     * @returns UserSession entity or null if not found
     */
    findSessionByToken(token: string): Promise<UserSession | null>;
    /**
     * Invalidate user session
     * @param sessionId Session ID to invalidate
     */
    invalidateSession(sessionId: string): Promise<void>;
    /**
     * Get user roles
     * @param userId User ID
     * @returns Array of role names
     */
    getUserRoles(userId: UserId): Promise<string[]>;
    /**
     * Disable MFA for user
     * @param userId User ID
     */
    disableMFA(userId: UserId): Promise<void>;
    /**
     * Check account lockout status
     * @param email User email
     * @returns Lockout status information
     */
    checkAccountLockout(email: Email): Promise<{
        isLocked: boolean;
        unlockAt?: Date;
        failedAttempts: number;
    }>;
    /**
     * Record login attempt
     * @param email User email
     * @param isSuccessful Whether login was successful
     * @param ipAddress IP address of attempt
     * @param userAgent User agent string
     * @param errorMessage Error message if failed
     */
    recordLoginAttempt(email: Email, isSuccessful: boolean, ipAddress?: string, userAgent?: string, errorMessage?: string): Promise<void>;
    /**
     * Unlock account manually (admin function)
     * @param email User email
     * @param adminUserId Admin user ID performing unlock
     */
    unlockAccount(email: Email, adminUserId: string): Promise<void>;
}
//# sourceMappingURL=IUserRepository.d.ts.map