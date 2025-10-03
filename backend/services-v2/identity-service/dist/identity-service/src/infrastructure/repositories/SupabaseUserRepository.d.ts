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
import { IUserRepository } from '../../application/repositories/IUserRepository';
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
    private readonly CACHE_TTL;
    constructor(supabaseUrl: string, supabaseKey: string, logger: ILogger, cacheService?: RedisCacheService);
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
     */
    create(userData: CreateUserRequest): Promise<User>;
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
     */
    getUserRoles(userId: UserId): Promise<string[]>;
    /**
     * Log audit event for HIPAA compliance
     */
    private logAuditEvent;
    /**
     * Map database record to User Domain aggregate
     * Following Clean Architecture pattern - returns rich domain object
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
}
//# sourceMappingURL=SupabaseUserRepository.d.ts.map