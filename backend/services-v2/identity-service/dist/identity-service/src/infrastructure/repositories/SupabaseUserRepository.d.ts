/**
 * Supabase-Compatible User Repository Implementation
 * V2 Clean Architecture + DDD Implementation
 * Integrates with existing auth_schema on Supabase
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, HIPAA-Compliant, Production-Ready
 */
import { RedisCacheService } from '../cache/RedisCacheService';
import { IUserRepository, CreateAuthUserData } from '../../application/repositories/IUserRepository';
import { IPermissionRepository } from '../../domain/repositories/IPermissionRepository';
import { User } from '../../domain/aggregates/User';
import { UserId } from '../../domain/value-objects/UserId';
import { Email } from '../../domain/value-objects/Email';
import { UserSession } from '../../domain/entities/UserSession';
import { ILogger } from '../../application/services/ILogger';
export interface CreateUserRequest {
    email: string;
    fullName: string;
    roleType: string;
    citizenId?: string;
    dateOfBirth?: Date;
    gender?: string;
    phoneNumber?: string;
}
/**
 * Repository for User operations with Supabase auth_schema
 * Implements IUserRepository interface following Clean Architecture pattern
 * Returns Domain aggregates, not DTOs
 */
export declare class SupabaseUserRepository implements IUserRepository {
    private logger;
    private supabaseClient;
    private circuitBreaker;
    private cacheService?;
    private permissionRepository?;
    private readonly CACHE_TTL;
    constructor(supabaseUrl: string, supabaseKey: string, logger: ILogger, cacheService?: RedisCacheService, permissionRepository?: IPermissionRepository);
    /**
     * Find user by ID with circuit breaker protection and caching
     * Returns Domain aggregate, not DTO
     */
    findById(userId: UserId): Promise<User | null>;
    /**
     * Find user by email with caching
     * Returns Domain aggregate, not DTO
     */
    findByEmail(email: Email): Promise<User | null>;
    /**
     * Create new user with audit logging
     * Note: This only creates user_profile, not auth user
     * Use createAuthUser() to create both auth user + profile
     */
    create(userData: CreateUserRequest): Promise<User>;
    /**
     * Create auth user + user profile in one transaction
     * This replaces the trigger-based approach with explicit control
     *
     * @param userData - User data including password
     * @returns Created User aggregate
     * @throws Error if auth user or profile creation fails
     */
    createAuthUser(userData: CreateAuthUserData): Promise<User>;
    /**
     * Update user information
     * Accepts full User aggregate and maps to database format
     */
    update(user: User): Promise<void>;
    /**
     * Save user (create or update) - minimal implementation for schema-per-service
     */
    save(user: User): Promise<void>;
    /**
     * Soft delete user
     */
    delete(userId: UserId): Promise<void>;
    /**
     * Check if user exists
     */
    exists(userId: UserId): Promise<boolean>;
    /**
     * Create user session
     */
    createSession(session: UserSession): Promise<void>;
    /**
     * Find active session by token
     */
    findSessionByToken(token: string): Promise<UserSession | null>;
    /**
     * Invalidate user session
     */
    invalidateSession(sessionId: string, sessionToken?: string): Promise<void>;
    /**
     * Deactivate session - alias for invalidateSession
     */
    deactivateSession(sessionId: string, sessionToken?: string): Promise<void>;
    /**
     * Get user roles with caching
     *
     * Pure RBAC: Queries user_roles table for multiple roles
     */
    getUserRoles(userId: UserId): Promise<string[]>;
    /**
     * Log audit event for HIPAA compliance
     */
    private logAuditEvent;
    /**
     * Map database record to User Domain aggregate
     * Following Clean Architecture pattern - returns rich domain object
     *
     * Pure RBAC: Loads roles from user_roles table
     */
    private mapToUserAggregate;
    /**
     * Map database record to UserSession Domain entity
     * Following Clean Architecture pattern - returns rich domain object
     */
    private mapToSessionEntity;
    /**
     * Disable MFA for user
     */
    disableMFA(userId: UserId): Promise<void>;
    /**
     * Check if account is locked due to failed login attempts
     * Returns: { isLocked: boolean, unlockAt?: Date, failedAttempts: number }
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
    /**
     * Clear failed login attempts for user (after successful login)
     */
    private clearFailedLoginAttempts;
    /**
     * Manually unlock account (admin function)
     */
    unlockAccount(email: Email, adminUserId: string): Promise<void>;
    /**
     * Invalidate user cache (call after updates)
     */
    invalidateUserCache(userId: string, email?: string): Promise<void>;
    /**
     * Invalidate session cache
     */
    invalidateSessionCache(sessionToken: string): Promise<void>;
    /**
     * Clear all cache for this service
     */
    clearAllCache(): Promise<void>;
    /**
     * Get cache statistics
     */
    getCacheStats(): import("../cache/RedisCacheService").CacheStats | null;
    /**
     * Check if email exists
     */
    emailExists(email: Email): Promise<boolean>;
    /**
     * Get user permissions
     *
     * Pure RBAC: Delegates to PermissionRepository
     *
     * @deprecated This method is deprecated. Use IPermissionRepository.getUserPermissions() instead.
     * Kept for backward compatibility with existing code.
     */
    getUserPermissions(userId: UserId): Promise<string[]>;
    /**
     * Get active sessions for user
     */
    getActiveSessions(userId: UserId): Promise<UserSession[]>;
    /**
     * Get healthcare role by type
     */
    getHealthcareRoleByType(roleType: string): Promise<any | null>;
    /**
     * List all users with pagination
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
}
//# sourceMappingURL=SupabaseUserRepository.d.ts.map