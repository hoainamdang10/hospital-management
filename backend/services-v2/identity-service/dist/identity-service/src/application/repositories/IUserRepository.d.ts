/**
 * User Repository Interface - Application Layer
 * Defines contract for user persistence operations
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Dependency Inversion Principle
 */
import { User } from '../../domain/aggregates/User';
import { UserId } from '../../domain/value-objects/UserId';
import { Email } from '../../domain/value-objects/Email';
import { UserSession } from '../../domain/entities/UserSession';
import { HealthcareRole } from '../../domain/entities/HealthcareRole';
export interface CreateAuthUserData {
    email: string;
    password: string;
    fullName: string;
    roleType: string;
    phoneNumber?: string;
    citizenId?: string;
    dateOfBirth?: Date;
    gender?: string;
    address?: string;
    emailConfirm?: boolean;
}
/**
 * User Repository Interface
 * Application layer defines the contract, infrastructure implements it
 */
export interface IUserRepository {
    /**
     * Find user by ID
     */
    findById(userId: UserId): Promise<User | null>;
    /**
     * Find user by email
     */
    findByEmail(email: Email): Promise<User | null>;
    /**
     * Save new user
     */
    save(user: User): Promise<void>;
    /**
     * Create user in auth system + profile (atomic operation)
     */
    createAuthUser(data: CreateAuthUserData): Promise<User>;
    /**
     * Update existing user
     * Accepts full User aggregate for consistency with domain model
     */
    update(user: User): Promise<void>;
    /**
     * Delete user
     */
    delete(userId: UserId): Promise<void>;
    /**
     * Check if email exists
     */
    emailExists(email: Email): Promise<boolean>;
    /**
     * Get user roles
     */
    getUserRoles(userId: UserId): Promise<string[]>;
    /**
     * Get user permissions
     */
    getUserPermissions(userId: UserId): Promise<string[]>;
    /**
     * Create user session
     */
    createSession(session: UserSession): Promise<void>;
    /**
     * Get active sessions for user
     */
    getActiveSessions(userId: UserId): Promise<UserSession[]>;
    /**
     * Invalidate session
     */
    invalidateSession(sessionId: string): Promise<void>;
    /**
     * Deactivate session
     */
    deactivateSession(sessionId: string): Promise<void>;
    /**
     * Get healthcare role by type
     */
    getHealthcareRoleByType(roleType: string): Promise<HealthcareRole | null>;
    /**
     * List all users (with pagination)
     */
    list(options?: {
        limit?: number;
        offset?: number;
        filters?: Record<string, any>;
    }): Promise<User[]>;
    /**
     * Count total users
     */
    count(filters?: Record<string, any>): Promise<number>;
    /**
     * Store staff invitation
     */
    storeStaffInvitation(data: {
        email: string;
        role: string;
        invitedBy: string;
        invitationToken: string;
        expiresAt: Date;
        invitationData?: any;
    }): Promise<void>;
    /**
     * Verify staff invitation token
     */
    verifyStaffInvitation(token: string): Promise<{
        isValid: boolean;
        email?: string;
        role?: string;
        invitationData?: any;
    }>;
    /**
     * Check if account is locked due to failed login attempts
     */
    checkAccountLockout(email: Email): Promise<{
        isLocked: boolean;
        unlockAt?: Date;
        failedAttempts: number;
    }>;
    /**
     * Record login attempt (success or failure)
     */
    recordLoginAttempt(email: Email, isSuccessful: boolean, ipAddress?: string, userAgent?: string, errorMessage?: string): Promise<void>;
}
//# sourceMappingURL=IUserRepository.d.ts.map