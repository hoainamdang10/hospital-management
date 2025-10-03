"use strict";
/**
 * Supabase-Compatible User Repository Implementation
 * V2 Clean Architecture + DDD Implementation
 * Integrates with existing auth_schema on Supabase
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, HIPAA-Compliant, Production-Ready
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseUserRepository = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const CircuitBreaker_1 = require("../resilience/CircuitBreaker");
const error_helper_1 = require("../../utils/error-helper");
const UserMapper_1 = require("../mappers/UserMapper");
const UserSession_1 = require("../../domain/entities/UserSession");
/**
 * Repository for User operations with Supabase auth_schema
 * Implements IUserRepository interface following Clean Architecture pattern
 * Returns Domain aggregates, not DTOs
 */
class SupabaseUserRepository {
    constructor(supabaseUrl, supabaseKey, logger, cacheService) {
        this.logger = logger;
        this.circuitBreaker = CircuitBreaker_1.CircuitBreakerFactory.getBreaker('user-repository');
        // Cache TTL constants (in seconds)
        this.CACHE_TTL = {
            USER_PROFILE: 300, // 5 minutes
            USER_ROLES: 900, // 15 minutes
            USER_PERMISSIONS: 900, // 15 minutes
            SESSION: 60 // 1 minute
        };
        // Configure Supabase client with auth_schema
        // Note: TypeScript will infer the correct schema type from createClient options
        this.supabaseClient = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
            db: {
                schema: 'auth_schema', // Use auth_schema for user_profiles
            },
            global: {
                headers: {
                    'X-Client-Info': 'identity-service',
                },
            },
        }); // Type assertion to bypass schema type mismatch
        this.cacheService = cacheService;
    }
    /**
     * Find user by ID with circuit breaker protection and caching
     * Returns Domain aggregate, not DTO
     */
    async findById(userId) {
        const id = userId.value;
        // Try cache first
        if (this.cacheService) {
            const cacheKey = `user:${id}`;
            const cached = await this.cacheService.get(cacheKey);
            if (cached) {
                this.logger.debug('Cache hit for user', { userId: id });
                return this.mapToUserAggregate(cached);
            }
        }
        return await this.circuitBreaker.execute(async () => {
            const { data, error } = await this.supabaseClient
                .from('user_profiles')
                .select('*')
                .eq('id', id)
                .single();
            if (error) {
                if (error.code === 'PGRST116') {
                    return null; // Not found
                }
                throw new Error(`Failed to find user: ${(0, error_helper_1.getErrorMessage)(error)}`);
            }
            // Cache the database record
            if (this.cacheService && data) {
                await this.cacheService.set(`user:${id}`, data, { ttl: this.CACHE_TTL.USER_PROFILE });
            }
            // Map to Domain aggregate
            return this.mapToUserAggregate(data);
        }, async () => {
            this.logger.warn('Using fallback for findById', { userId: id });
            return null; // Fallback: return null if database unavailable
        });
    }
    /**
     * Find user by email with caching
     * Returns Domain aggregate, not DTO
     */
    async findByEmail(email) {
        const emailValue = email.value;
        // Try cache first
        if (this.cacheService) {
            const cacheKey = `user:email:${emailValue}`;
            const cached = await this.cacheService.get(cacheKey);
            if (cached) {
                this.logger.debug('Cache hit for user by email', { email: emailValue });
                return this.mapToUserAggregate(cached);
            }
        }
        return await this.circuitBreaker.execute(async () => {
            const { data, error } = await this.supabaseClient
                .from('user_profiles')
                .select('*')
                .eq('email', emailValue)
                .single();
            if (error) {
                if (error.code === 'PGRST116') {
                    return null; // Not found
                }
                throw new Error(`Failed to find user by email: ${(0, error_helper_1.getErrorMessage)(error)}`);
            }
            // Cache the database record
            if (this.cacheService && data) {
                await this.cacheService.set(`user:email:${emailValue}`, data, { ttl: this.CACHE_TTL.USER_PROFILE });
                await this.cacheService.set(`user:${data.id}`, data, { ttl: this.CACHE_TTL.USER_PROFILE });
            }
            // Map to Domain aggregate
            return this.mapToUserAggregate(data);
        }, async () => {
            this.logger.warn('Using fallback for findByEmail', { email: emailValue });
            return null;
        });
    }
    /**
     * Create new user with audit logging
     */
    async create(userData) {
        return await this.circuitBreaker.execute(async () => {
            const userRecord = {
                email: userData.email,
                full_name: userData.fullName,
                role_type: userData.roleType,
                citizen_id: userData.citizenId,
                date_of_birth: userData.dateOfBirth?.toISOString().split('T')[0],
                gender: userData.gender,
                phone_number: userData.phoneNumber,
                is_active: true,
                is_verified: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            const { data, error } = await this.supabaseClient
                .from('user_profiles')
                .insert(userRecord)
                .select()
                .single();
            if (error) {
                throw new Error(`Failed to create user: ${(0, error_helper_1.getErrorMessage)(error)}`);
            }
            // Log user creation for audit
            await this.logAuditEvent('USER_CREATED', data.id, {
                email: userData.email,
                roleType: userData.roleType
            });
            return this.mapToUserAggregate(data);
        });
    }
    /**
     * Update user information
     * Accepts full User aggregate and maps to database format
     */
    async update(user) {
        return await this.circuitBreaker.execute(async () => {
            const id = user.id;
            // Use UserMapper to convert domain to database format
            const updateRecord = UserMapper_1.UserMapper.toUpdate(user);
            // Remove undefined values with typed keys
            for (const key of Object.keys(updateRecord)) {
                if (updateRecord[key] === undefined) {
                    delete updateRecord[key];
                }
            }
            const { error } = await this.supabaseClient
                .from('user_profiles')
                .update(updateRecord)
                .eq('id', id)
                .select()
                .single();
            if (error) {
                throw new Error(`Failed to update user: ${(0, error_helper_1.getErrorMessage)(error)}`);
            }
            // Log user update for audit
            await this.logAuditEvent('USER_UPDATED', id, {
                updatedFields: Object.keys(updateRecord)
            });
            // Invalidate cache after update
            await this.invalidateUserCache(id, user.email.value);
        });
    }
    /**
     * Save user (create or update) - minimal implementation for schema-per-service
     */
    async save(user) {
        const record = UserMapper_1.UserMapper.toPersistence(user);
        // Upsert by id into auth_schema.user_profiles
        const { error } = await this.supabaseClient
            .from('user_profiles')
            .upsert(record, { onConflict: 'id' });
        if (error) {
            throw new Error(`Failed to save user: ${(0, error_helper_1.getErrorMessage)(error)}`);
        }
        // Invalidate caches
        await this.invalidateUserCache(record.id, record.email);
    }
    /**
     * Soft delete user
     */
    async delete(userId) {
        const id = userId.value;
        const { error } = await this.supabaseClient
            .from('user_profiles')
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq('id', id);
        if (error) {
            throw new Error(`Failed to delete user: ${(0, error_helper_1.getErrorMessage)(error)}`);
        }
        await this.invalidateUserCache(id);
    }
    /**
     * Check if user exists
     */
    async exists(userId) {
        const id = userId.value;
        const { data, error } = await this.supabaseClient
            .from('user_profiles')
            .select('id')
            .eq('id', id)
            .limit(1)
            .maybeSingle();
        if (error && error.code !== 'PGRST116') {
            throw new Error(`Failed to check user existence: ${(0, error_helper_1.getErrorMessage)(error)}`);
        }
        return !!data;
    }
    /**
     * Create user session
     */
    async createSession(session) {
        return await this.circuitBreaker.execute(async () => {
            const sessionRecord = {
                user_id: session.userId,
                session_token: session.sessionToken,
                device_info: session.deviceInfo,
                ip_address: session.ipAddress,
                user_agent: session.userAgent,
                expires_at: session.expiresAt.toISOString(),
                is_active: session.isActive,
                created_at: new Date().toISOString(),
                last_accessed_at: new Date().toISOString()
            };
            const { data, error } = await this.supabaseClient
                .from('user_sessions')
                .insert(sessionRecord)
                .select()
                .single();
            if (error) {
                throw new Error(`Failed to create session: ${(0, error_helper_1.getErrorMessage)(error)}`);
            }
            // Log session creation for security audit
            await this.logAuditEvent('SESSION_CREATED', session.userId, {
                sessionId: data.id,
                ipAddress: session.ipAddress,
                userAgent: session.userAgent
            });
        });
    }
    /**
     * Find active session by token
     */
    async findSessionByToken(token) {
        return await this.circuitBreaker.execute(async () => {
            const { data, error } = await this.supabaseClient
                .from('user_sessions')
                .select('*')
                .eq('session_token', token)
                .eq('is_active', true)
                .gt('expires_at', new Date().toISOString())
                .single();
            if (error) {
                if (error.code === 'PGRST116') {
                    return null; // Not found
                }
                throw new Error(`Failed to find session: ${(0, error_helper_1.getErrorMessage)(error)}`);
            }
            return this.mapToSessionEntity(data);
        }, async () => {
            this.logger.warn('Using fallback for findSessionByToken');
            return null;
        });
    }
    /**
     * Invalidate user session
     */
    async invalidateSession(sessionId, sessionToken) {
        return await this.circuitBreaker.execute(async () => {
            const { error } = await this.supabaseClient
                .from('user_sessions')
                .update({
                is_active: false,
                updated_at: new Date().toISOString()
            })
                .eq('id', sessionId);
            if (error) {
                throw new Error(`Failed to invalidate session: ${(0, error_helper_1.getErrorMessage)(error)}`);
            }
            // Invalidate session cache if token provided
            if (sessionToken) {
                await this.invalidateSessionCache(sessionToken);
            }
            // Log session invalidation for security audit
            await this.logAuditEvent('SESSION_INVALIDATED', null, {
                sessionId
            });
        });
    }
    /**
     * Deactivate session - alias for invalidateSession
     */
    async deactivateSession(sessionId, sessionToken) {
        return this.invalidateSession(sessionId, sessionToken);
    }
    /**
     * Get user roles with caching
     */
    async getUserRoles(userId) {
        const id = userId.value;
        // Try cache first
        if (this.cacheService) {
            const cacheKey = `roles:${id}`;
            const cached = await this.cacheService.get(cacheKey);
            if (cached) {
                this.logger.debug('Cache hit for user roles', { userId: id });
                return cached;
            }
        }
        return await this.circuitBreaker.execute(async () => {
            const { data, error } = await this.supabaseClient
                .from('user_profiles')
                .select('role_type')
                .eq('id', id)
                .single();
            if (error) {
                // If user not found, return empty array instead of throwing
                if (error.code === 'PGRST116') {
                    this.logger.debug('User not found', { userId: id });
                    return [];
                }
                throw new Error(`Failed to get user roles: ${(0, error_helper_1.getErrorMessage)(error)}`);
            }
            const roles = [data.role_type];
            // Cache the result
            if (this.cacheService) {
                await this.cacheService.set(`roles:${id}`, roles, { ttl: this.CACHE_TTL.USER_ROLES });
            }
            return roles;
        }, async () => {
            this.logger.warn('Using fallback for getUserRoles', { userId: id });
            return []; // Return empty array for non-existent user
        });
    }
    /**
     * Log audit event for HIPAA compliance
     */
    async logAuditEvent(action, userId, details) {
        try {
            const auditRecord = {
                actor_id: userId,
                action,
                resource_type: 'user',
                resource_id: userId,
                details,
                severity: 'info',
                success: true,
                created_at: new Date().toISOString()
            };
            await this.supabaseClient
                .from('audit_logs')
                .insert(auditRecord);
        }
        catch (error) {
            this.logger.error('Failed to log audit event', {
                action,
                userId,
                error: (0, error_helper_1.getErrorMessage)(error)
            });
        }
    }
    /**
     * Map database record to User Domain aggregate
     * Following Clean Architecture pattern - returns rich domain object
     */
    mapToUserAggregate(data) {
        return UserMapper_1.UserMapper.toDomain(data);
    }
    /**
     * Map database record to UserSession Domain entity
     * Following Clean Architecture pattern - returns rich domain object
     */
    mapToSessionEntity(data) {
        return UserSession_1.UserSession.fromPersistenceData({
            id: data.id,
            userId: data.user_id,
            sessionToken: data.session_token,
            deviceInfo: data.device_info,
            ipAddress: data.ip_address,
            userAgent: data.user_agent,
            expiresAt: new Date(data.expires_at),
            isActive: data.is_active,
            createdAt: new Date(data.created_at),
            lastAccessedAt: new Date(data.last_accessed_at)
        });
    }
    /**
     * Disable MFA for user
     */
    async disableMFA(userId) {
        const id = userId.value;
        try {
            // Disable MFA in two_factor_auth table
            const { error: mfaError } = await this.supabaseClient
                .from('two_factor_auth')
                .update({
                is_enabled: false,
                secret_key: null,
                backup_codes: null,
                updated_at: new Date().toISOString()
            })
                .eq('user_id', id);
            if (mfaError) {
                throw new Error(`Failed to disable MFA: ${(0, error_helper_1.getErrorMessage)(mfaError)}`);
            }
            // Update user profile
            const { error: profileError } = await this.supabaseClient
                .from('user_profiles')
                .update({
                two_factor_enabled: false,
                updated_at: new Date().toISOString()
            })
                .eq('id', id);
            if (profileError) {
                throw new Error(`Failed to update user profile: ${(0, error_helper_1.getErrorMessage)(profileError)}`);
            }
            this.logger.info('MFA disabled successfully', { userId: id });
        }
        catch (error) {
            this.logger.error('Failed to disable MFA', { userId: id, error: (0, error_helper_1.getErrorMessage)(error) });
            throw error;
        }
    }
    /**
     * Check if account is locked due to failed login attempts
     * Returns: { isLocked: boolean, unlockAt?: Date, failedAttempts: number }
     */
    async checkAccountLockout(email) {
        try {
            const emailValue = email.value;
            const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
            // Get recent failed login attempts (last 30 minutes)
            const { data: attempts, error } = await this.supabaseClient
                .from('login_attempts')
                .select('*')
                .eq('email', emailValue)
                .eq('is_successful', false)
                .gte('created_at', thirtyMinutesAgo.toISOString())
                .order('created_at', { ascending: false });
            if (error) {
                this.logger.error('Failed to check account lockout', { email: emailValue, error: (0, error_helper_1.getErrorMessage)(error) });
                return { isLocked: false, failedAttempts: 0 };
            }
            const failedAttempts = attempts?.length || 0;
            // Lock account if 5 or more failed attempts in last 30 minutes
            if (failedAttempts >= 5) {
                const firstFailedAttempt = attempts[attempts.length - 1];
                const unlockAt = new Date(new Date(firstFailedAttempt.created_at).getTime() + 30 * 60 * 1000);
                // Check if still locked
                if (new Date() < unlockAt) {
                    this.logger.warn('Account is locked', { email: emailValue, failedAttempts, unlockAt });
                    return { isLocked: true, unlockAt, failedAttempts };
                }
            }
            return { isLocked: false, failedAttempts };
        }
        catch (error) {
            this.logger.error('Error checking account lockout', { email: email.value, error: (0, error_helper_1.getErrorMessage)(error) });
            return { isLocked: false, failedAttempts: 0 };
        }
    }
    /**
     * Record login attempt (success or failure)
     */
    async recordLoginAttempt(email, isSuccessful, ipAddress, userAgent, errorMessage) {
        try {
            const emailValue = email.value;
            const attemptRecord = {
                email: emailValue,
                is_successful: isSuccessful,
                ip_address: ipAddress,
                user_agent: userAgent,
                error_message: errorMessage,
                created_at: new Date().toISOString()
            };
            const { error } = await this.supabaseClient
                .from('login_attempts')
                .insert(attemptRecord);
            if (error) {
                this.logger.error('Failed to record login attempt', { email: emailValue, error: (0, error_helper_1.getErrorMessage)(error) });
            }
            // If successful, clear old failed attempts
            if (isSuccessful) {
                await this.clearFailedLoginAttempts(emailValue);
            }
        }
        catch (error) {
            this.logger.error('Error recording login attempt', { email: email.value, error: (0, error_helper_1.getErrorMessage)(error) });
        }
    }
    /**
     * Clear failed login attempts for user (after successful login)
     */
    async clearFailedLoginAttempts(email) {
        try {
            const { error } = await this.supabaseClient
                .from('login_attempts')
                .delete()
                .eq('email', email)
                .eq('is_successful', false);
            if (error) {
                this.logger.error('Failed to clear failed login attempts', { email, error: (0, error_helper_1.getErrorMessage)(error) });
            }
        }
        catch (error) {
            this.logger.error('Error clearing failed login attempts', { email, error: (0, error_helper_1.getErrorMessage)(error) });
        }
    }
    /**
     * Manually unlock account (admin function)
     */
    async unlockAccount(email, adminUserId) {
        try {
            const emailValue = email.value;
            // Delete all failed login attempts
            const { error } = await this.supabaseClient
                .from('login_attempts')
                .delete()
                .eq('email', emailValue)
                .eq('is_successful', false);
            if (error) {
                throw new Error(`Failed to unlock account: ${(0, error_helper_1.getErrorMessage)(error)}`);
            }
            // Log audit event
            await this.logAuditEvent('account_unlocked', adminUserId, {
                target_email: emailValue,
                action: 'manual_unlock'
            });
            this.logger.info('Account unlocked successfully', { email: emailValue, adminUserId });
        }
        catch (error) {
            this.logger.error('Failed to unlock account', { email: email.value, error: (0, error_helper_1.getErrorMessage)(error) });
            throw error;
        }
    }
    /**
     * Invalidate user cache (call after updates)
     */
    async invalidateUserCache(userId, email) {
        if (!this.cacheService) {
            return;
        }
        try {
            // Delete user profile cache
            await this.cacheService.delete(`user:${userId}`);
            // Delete email-based cache if provided
            if (email) {
                await this.cacheService.delete(`user:email:${email}`);
            }
            // Delete roles cache
            await this.cacheService.delete(`roles:${userId}`);
            // Delete permissions cache
            await this.cacheService.delete(`permissions:${userId}`);
            this.logger.debug('User cache invalidated', { userId });
        }
        catch (error) {
            this.logger.error('Failed to invalidate user cache', { userId, error: (0, error_helper_1.getErrorMessage)(error) });
        }
    }
    /**
     * Invalidate session cache
     */
    async invalidateSessionCache(sessionToken) {
        if (!this.cacheService) {
            return;
        }
        try {
            await this.cacheService.delete(`session:${sessionToken}`);
            this.logger.debug('Session cache invalidated', { sessionToken: sessionToken.substring(0, 10) + '...' });
        }
        catch (error) {
            this.logger.error('Failed to invalidate session cache', { error: (0, error_helper_1.getErrorMessage)(error) });
        }
    }
    /**
     * Clear all cache for this service
     */
    async clearAllCache() {
        if (!this.cacheService) {
            return;
        }
        try {
            const deletedCount = await this.cacheService.clear();
            this.logger.info('All cache cleared', { deletedCount });
        }
        catch (error) {
            this.logger.error('Failed to clear all cache', { error: (0, error_helper_1.getErrorMessage)(error) });
        }
    }
    /**
     * Get cache statistics
     */
    getCacheStats() {
        return this.cacheService?.getStats() || null;
    }
    /**
     * Check if email exists
     */
    async emailExists(email) {
        const user = await this.findByEmail(email);
        return user !== null;
    }
    /**
     * Get user permissions
     */
    async getUserPermissions(userId) {
        const roles = await this.getUserRoles(userId);
        // For now, return basic permissions based on roles
        // TODO: Implement proper permission mapping
        const permissions = [];
        roles.forEach(role => {
            if (role === 'admin') {
                permissions.push('*'); // Admin has all permissions
            }
            else if (role === 'doctor') {
                permissions.push('read_patients', 'write_patients', 'read_appointments');
            }
            else if (role === 'patient') {
                permissions.push('read_own_data', 'book_appointments');
            }
        });
        return permissions;
    }
    /**
     * Get active sessions for user
     */
    async getActiveSessions(userId) {
        const { data, error } = await this.supabaseClient
            .from('user_sessions')
            .select('*')
            .eq('user_id', userId.value)
            .eq('is_active', true)
            .gt('expires_at', new Date().toISOString());
        if (error) {
            throw new Error(`Failed to get active sessions: ${(0, error_helper_1.getErrorMessage)(error)}`);
        }
        return data.map(record => this.mapToSessionEntity(record));
    }
    /**
     * Get healthcare role by type
     */
    async getHealthcareRoleByType(roleType) {
        const { data, error } = await this.supabaseClient
            .from('healthcare_roles')
            .select('*')
            .eq('role_name', roleType)
            .single();
        if (error) {
            return null;
        }
        return data;
    }
    /**
     * List all users with pagination
     */
    async list(options) {
        let query = this.supabaseClient
            .from('user_profiles')
            .select('*');
        if (options?.filters) {
            Object.entries(options.filters).forEach(([key, value]) => {
                query = query.eq(key, value);
            });
        }
        if (options?.limit) {
            query = query.limit(options.limit);
        }
        if (options?.offset) {
            query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
        }
        const { data, error } = await query;
        if (error) {
            throw new Error(`Failed to list users: ${(0, error_helper_1.getErrorMessage)(error)}`);
        }
        return data.map(record => this.mapToUserAggregate(record));
    }
    /**
     * Count total users
     */
    async count(filters) {
        let query = this.supabaseClient
            .from('user_profiles')
            .select('*', { count: 'exact', head: true });
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                query = query.eq(key, value);
            });
        }
        const { count, error } = await query;
        if (error) {
            throw new Error(`Failed to count users: ${(0, error_helper_1.getErrorMessage)(error)}`);
        }
        return count || 0;
    }
}
exports.SupabaseUserRepository = SupabaseUserRepository;
//# sourceMappingURL=SupabaseUserRepository.js.map