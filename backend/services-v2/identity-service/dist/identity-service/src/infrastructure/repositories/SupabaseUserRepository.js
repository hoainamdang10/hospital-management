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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseUserRepository = void 0;
const CircuitBreaker_1 = require("../resilience/CircuitBreaker");
const error_helper_1 = require("../../utils/error-helper");
const UserMapper_1 = require("../mappers/UserMapper");
const crypto_1 = __importDefault(require("crypto"));
const UserId_1 = require("../../domain/value-objects/UserId");
const UserSession_1 = require("../../domain/entities/UserSession");
/**
 * Repository for User operations with Supabase auth_schema
 * Implements IUserRepository interface following Clean Architecture pattern
 * Returns Domain aggregates, not DTOs
 */
class SupabaseUserRepository {
    constructor(supabaseClient, logger, cacheService, permissionRepository, eventPublisher, outboxService) {
        this.logger = logger;
        this.circuitBreaker = CircuitBreaker_1.CircuitBreakerFactory.getBreaker("user-repository");
        // Cache TTL constants (in seconds)
        this.CACHE_TTL = {
            USER_PROFILE: 300, // 5 minutes
            USER_ROLES: 900, // 15 minutes
            USER_PERMISSIONS: 900, // 15 minutes
            SESSION: 60, // 1 minute
        };
        this.supabaseClient = supabaseClient;
        this.cacheService = cacheService;
        this.permissionRepository = permissionRepository;
        this.eventPublisher = eventPublisher;
        this.outboxService = outboxService;
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
                this.logger.debug("Cache hit for user", { userId: id });
                return await this.mapToUserAggregate(cached);
            }
        }
        return await this.circuitBreaker.execute(async () => {
            const { data, error } = await this.supabaseClient
                .from("user_profiles")
                .select("*")
                .eq("id", id)
                .single();
            if (error) {
                if (error.code === "PGRST116") {
                    return null; // Not found
                }
                throw new Error(`Failed to find user: ${(0, error_helper_1.getErrorMessage)(error)}`);
            }
            // Cache the database record
            if (this.cacheService && data) {
                await this.cacheService.set(`user:${id}`, data, {
                    ttl: this.CACHE_TTL.USER_PROFILE,
                });
            }
            // Map to Domain aggregate
            return await this.mapToUserAggregate(data);
        }, async () => {
            this.logger.warn("Using fallback for findById", { userId: id });
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
                this.logger.debug("Cache hit for user by email", { email: emailValue });
                return await this.mapToUserAggregate(cached);
            }
        }
        return await this.circuitBreaker.execute(async () => {
            const { data, error } = await this.supabaseClient
                .from("user_profiles")
                .select("*")
                .eq("email", emailValue)
                .single();
            if (error) {
                if (error.code === "PGRST116") {
                    return null; // Not found
                }
                throw new Error(`Failed to find user by email: ${(0, error_helper_1.getErrorMessage)(error)}`);
            }
            // Cache the database record
            if (this.cacheService && data) {
                await this.cacheService.set(`user:email:${emailValue}`, data, {
                    ttl: this.CACHE_TTL.USER_PROFILE,
                });
                await this.cacheService.set(`user:${data.id}`, data, {
                    ttl: this.CACHE_TTL.USER_PROFILE,
                });
            }
            // Map to Domain aggregate
            return await this.mapToUserAggregate(data);
        }, async () => {
            this.logger.warn("Using fallback for findByEmail", {
                email: emailValue,
            });
            return null;
        });
    }
    /**
     * Create new user with audit logging
     * Note: This only creates user_profile, not auth user
     * Use createAuthUser() to create both auth user + profile
     */
    async create(userData) {
        return await this.circuitBreaker.execute(async () => {
            const userRecord = {
                email: userData.email,
                full_name: userData.fullName,
                role_type: userData.roleType,
                citizen_id: userData.citizenId,
                date_of_birth: userData.dateOfBirth?.toISOString().split("T")[0],
                gender: userData.gender,
                phone_number: userData.phoneNumber,
                is_active: true,
                is_verified: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
            const { data, error } = await this.supabaseClient
                .from("user_profiles")
                .insert(userRecord)
                .select()
                .single();
            if (error) {
                throw new Error(`Failed to create user: ${(0, error_helper_1.getErrorMessage)(error)}`);
            }
            // Log user creation for audit
            await this.logAuditEvent("USER_CREATED", data.id, {
                email: userData.email,
                roleType: userData.roleType,
            });
            return await this.mapToUserAggregate(data);
        });
    }
    /**
     * Create auth user + user profile in one transaction
     * This replaces the trigger-based approach with explicit control
     *
     * @param userData - User data including password
     * @returns Created User aggregate
     * @throws Error if auth user or profile creation fails
     */
    async createAuthUser(userData) {
        return await this.circuitBreaker.execute(async () => {
            this.logger.info("Creating auth user with profile", {
                email: userData.email,
            });
            // Step 1: Create auth user via Admin API
            const { data: authUser, error: authError } = await this.supabaseClient.auth.admin.createUser({
                email: userData.email,
                password: userData.password,
                email_confirm: userData.emailConfirm ?? true, // Auto-confirm by default
                user_metadata: {
                    full_name: userData.fullName,
                    // ❌ REMOVED: role: userData.roleType
                    // Roles are now managed ONLY in user_roles table (Single Source of Truth)
                    // This prevents metadata/database sync issues
                    phone_number: userData.phoneNumber,
                    citizen_id: userData.citizenId,
                    date_of_birth: userData.dateOfBirth?.toISOString().split("T")[0],
                    gender: userData.gender,
                    address: userData.address,
                },
            });
            if (authError || !authUser.user) {
                this.logger.error("Failed to create auth user", {
                    email: userData.email,
                    error: (0, error_helper_1.getErrorMessage)(authError),
                });
                throw new Error(`Failed to create auth user: ${(0, error_helper_1.getErrorMessage)(authError)}`);
            }
            this.logger.debug("Auth user created", {
                userId: authUser.user.id,
                email: userData.email,
            });
            // Step 2: Create user profile explicitly (no trigger dependency)
            const profileRecord = {
                id: authUser.user.id, // Use auth user ID
                email: userData.email,
                full_name: userData.fullName,
                role_type: userData.roleType,
                citizen_id: userData.citizenId,
                date_of_birth: userData.dateOfBirth?.toISOString().split("T")[0],
                gender: userData.gender,
                phone_number: userData.phoneNumber,
                address: userData.address,
                is_active: true,
                is_verified: userData.emailConfirm ?? true,
                subscription_tier: "free",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
            let profile = null;
            let profileError = null;
            // Try to insert profile
            const insertResult = await this.supabaseClient
                .from("user_profiles")
                .insert(profileRecord)
                .select()
                .single();
            profile = insertResult.data;
            profileError = insertResult.error;
            // Handle duplicate key error (orphaned profile from previous failed operation)
            if (profileError && profileError.code === "23505") {
                this.logger.warn("Found orphaned profile, cleaning up and retrying", {
                    userId: authUser.user.id,
                    email: userData.email,
                });
                // Delete orphaned profile
                await this.supabaseClient
                    .from("user_profiles")
                    .delete()
                    .eq("id", authUser.user.id);
                // Retry insert
                const retryResult = await this.supabaseClient
                    .from("user_profiles")
                    .insert(profileRecord)
                    .select()
                    .single();
                profile = retryResult.data;
                profileError = retryResult.error;
            }
            // Check final result
            if (profileError || !profile) {
                // Rollback: Delete auth user if profile creation fails
                this.logger.error("Failed to create user profile, rolling back auth user", {
                    userId: authUser.user.id,
                    error: (0, error_helper_1.getErrorMessage)(profileError),
                });
                await this.supabaseClient.auth.admin.deleteUser(authUser.user.id);
                throw new Error(`Failed to create user profile: ${(0, error_helper_1.getErrorMessage)(profileError)}`);
            }
            this.logger.info("User profile created successfully", {
                userId: profile.id,
                email: profile.email,
                role: profile.role_type,
            });
            // Step 3: Assign role in Pure RBAC (user_roles table)
            // CRITICAL: This must succeed for Pure RBAC to work correctly
            if (this.permissionRepository) {
                // Validate role type by querying database
                let validRoles;
                try {
                    validRoles = await this.permissionRepository.getAllRoles();
                }
                catch (error) {
                    this.logger.error("Failed to get valid roles from database, using fallback", error instanceof Error ? error : new Error(String(error)));
                    // Fallback to hardcoded roles if database query fails
                    validRoles = [
                        "admin",
                        "doctor",
                        "nurse",
                        "patient",
                        "receptionist",
                        "pharmacist",
                        "lab_technician",
                        "billing_staff",
                    ];
                }
                if (!validRoles.includes(userData.roleType.toLowerCase())) {
                    // Rollback: Delete auth user and profile
                    this.logger.error("Invalid role type, rolling back user creation", {
                        userId: profile.id,
                        roleType: userData.roleType,
                        validRoles,
                    });
                    await this.supabaseClient.auth.admin.deleteUser(profile.id);
                    await this.supabaseClient
                        .from("user_profiles")
                        .delete()
                        .eq("id", profile.id);
                    throw new Error(`Invalid role type: ${userData.roleType}. Valid roles: ${validRoles.join(", ")}`);
                }
                try {
                    const userId = UserId_1.UserId.fromString(profile.id);
                    await this.permissionRepository.assignRole(userId, userData.roleType, "system");
                    this.logger.info("Role assigned in Pure RBAC", {
                        userId: profile.id,
                        role: userData.roleType,
                    });
                }
                catch (error) {
                    // CRITICAL ERROR: Rollback user creation
                    this.logger.error("Failed to assign role in Pure RBAC, rolling back user creation", {
                        userId: profile.id,
                        role: userData.roleType,
                        error: (0, error_helper_1.getErrorMessage)(error),
                    });
                    // Rollback: Delete auth user and profile
                    await this.supabaseClient.auth.admin.deleteUser(profile.id);
                    await this.supabaseClient
                        .from("user_profiles")
                        .delete()
                        .eq("id", profile.id);
                    throw new Error(`Failed to assign role: ${(0, error_helper_1.getErrorMessage)(error)}`);
                }
            }
            // Step 4: Log audit event
            await this.logAuditEvent("USER_CREATED", profile.id, {
                email: userData.email,
                roleType: userData.roleType,
                method: "createAuthUser",
            });
            // Step 5: Invalidate cache (user + roles)
            if (this.cacheService) {
                await this.cacheService.delete(`user:${profile.id}`);
                await this.cacheService.delete(`user:email:${profile.email}`);
                await this.cacheService.delete(`roles:${profile.id}`); // Invalidate roles cache
            }
            // Step 6: Map to Domain aggregate
            return await this.mapToUserAggregate(profile);
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
                .from("user_profiles")
                .update(updateRecord)
                .eq("id", id)
                .select()
                .single();
            if (error) {
                throw new Error(`Failed to update user: ${(0, error_helper_1.getErrorMessage)(error)}`);
            }
            // Log user update for audit
            await this.logAuditEvent("USER_UPDATED", id, {
                updatedFields: Object.keys(updateRecord),
            });
            // Invalidate cache after update
            await this.invalidateUserCache(id, user.email.value);
        });
    }
    /**
     * Update Supabase Auth email_confirmed_at timestamp
     * Used after email verification to allow login
     */
    async updateAuthEmailConfirmed(userId) {
        const id = userId.value;
        try {
            // Update auth.users table directly using admin API
            const { error } = await this.supabaseClient.auth.admin.updateUserById(id, {
                email_confirm: true,
            });
            if (error) {
                throw new Error(`Failed to update auth email confirmed: ${(0, error_helper_1.getErrorMessage)(error)}`);
            }
            this.logger.info("Supabase Auth email_confirmed_at updated", {
                userId: id,
            });
        }
        catch (error) {
            this.logger.error("Error updating auth email confirmed", {
                userId: id,
                error: (0, error_helper_1.getErrorMessage)(error),
            });
            throw error;
        }
    }
    /**
     * Update user profile data (for patient sync)
     * Updates auth_schema.user_profiles table
     */
    async updateProfile(userId, profileData) {
        return await this.circuitBreaker.execute(async () => {
            try {
                // Remove undefined values
                const cleanData = {};
                for (const [key, value] of Object.entries(profileData)) {
                    if (value !== undefined && value !== null) {
                        cleanData[key] = value;
                    }
                }
                if (Object.keys(cleanData).length === 0) {
                    this.logger.debug("No profile data to update", { userId });
                    return;
                }
                const { error } = await this.supabaseClient
                    .from("user_profiles")
                    .update(cleanData)
                    .eq("user_id", userId);
                if (error) {
                    throw new Error(`Failed to update user profile: ${(0, error_helper_1.getErrorMessage)(error)}`);
                }
                this.logger.info("User profile updated successfully", {
                    userId,
                    updatedFields: Object.keys(cleanData),
                });
                // Invalidate cache after profile update
                await this.invalidateUserCache(userId);
            }
            catch (error) {
                this.logger.error("Error updating user profile", {
                    userId,
                    error: (0, error_helper_1.getErrorMessage)(error),
                });
                throw error;
            }
        });
    }
    /**
     * Save user (create or update) - minimal implementation for schema-per-service
     */
    async save(user) {
        const record = UserMapper_1.UserMapper.toPersistence(user);
        // Upsert by id into auth_schema.user_profiles
        const { error } = await this.supabaseClient
            .from("user_profiles")
            .upsert(record, { onConflict: "id" });
        if (error) {
            throw new Error(`Failed to save user: ${(0, error_helper_1.getErrorMessage)(error)}`);
        }
        // Invalidate caches
        await this.invalidateUserCache(record.id, record.email);
        // Publish domain events
        await this.publishDomainEvents(user);
    }
    /**
     * Publish domain events from aggregate
     * Uses Outbox Pattern for guaranteed event publishing
     */
    async publishDomainEvents(user) {
        if (!this.eventPublisher && !this.outboxService) {
            this.logger.debug("Event publisher and outbox service not configured, skipping event publishing");
            return;
        }
        const events = user.getUncommittedEvents();
        if (events.length === 0) {
            return;
        }
        try {
            // Store events in outbox (guaranteed persistence)
            if (this.outboxService) {
                for (const event of events) {
                    await this.outboxService.storeEvent(event);
                }
                this.logger.info("Domain events stored in outbox", {
                    userId: user.id,
                    eventCount: events.length,
                    eventTypes: events.map((event) => event.eventType),
                });
            }
            // Also publish immediately if eventPublisher available (best effort)
            if (this.eventPublisher) {
                try {
                    await this.eventPublisher.publishDomainEvents(events);
                    this.logger.info("Domain events published immediately", {
                        userId: user.id,
                        eventCount: events.length,
                    });
                }
                catch (publishError) {
                    this.logger.warn("Failed to publish events immediately, outbox will retry", {
                        userId: user.id,
                        error: publishError instanceof Error
                            ? publishError.message
                            : String(publishError),
                    });
                    // Don't throw - outbox will handle retry
                }
            }
            // Mark events as committed (they're safely stored in outbox)
            user.markEventsAsCommitted();
        }
        catch (error) {
            this.logger.error("Failed to handle domain events", {
                userId: user.id,
                error: error instanceof Error ? error.message : String(error),
                eventCount: events.length,
            });
            // Don't throw - outbox will retry, but we should not fail the transaction
        }
    }
    /**
     * Soft delete user
     */
    async delete(userId) {
        const id = userId.value;
        const { error } = await this.supabaseClient
            .from("user_profiles")
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq("id", id);
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
            .from("user_profiles")
            .select("id")
            .eq("id", id)
            .limit(1)
            .maybeSingle();
        if (error && error.code !== "PGRST116") {
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
                id: session.id, // Use session ID from domain entity (Supabase session_id)
                user_id: session.userId,
                session_token: session.sessionToken,
                device_info: session.deviceInfo,
                ip_address: session.ipAddress,
                user_agent: session.userAgent,
                expires_at: session.expiresAt.toISOString(),
                is_active: session.isActive,
                created_at: new Date().toISOString(),
                last_accessed_at: new Date().toISOString(),
            };
            const { data, error } = await this.supabaseClient
                .from("user_sessions")
                .insert(sessionRecord)
                .select()
                .single();
            if (error) {
                throw new Error(`Failed to create session: ${(0, error_helper_1.getErrorMessage)(error)}`);
            }
            // Log session creation for security audit
            await this.logAuditEvent("SESSION_CREATED", session.userId, {
                sessionId: data.id,
                ipAddress: session.ipAddress,
                userAgent: session.userAgent,
            });
        });
    }
    /**
     * Find active session by token
     */
    async findSessionByToken(token) {
        return await this.circuitBreaker.execute(async () => {
            const { data, error } = await this.supabaseClient
                .from("user_sessions")
                .select("*")
                .eq("session_token", token)
                .eq("is_active", true)
                .gt("expires_at", new Date().toISOString())
                .single();
            if (error) {
                if (error.code === "PGRST116") {
                    return null; // Not found
                }
                throw new Error(`Failed to find session: ${(0, error_helper_1.getErrorMessage)(error)}`);
            }
            return this.mapToSessionEntity(data);
        }, async () => {
            this.logger.warn("Using fallback for findSessionByToken");
            return null;
        });
    }
    /**
     * Invalidate user session
     */
    async invalidateSession(sessionId, sessionToken, userId) {
        return await this.circuitBreaker.execute(async () => {
            let query = this.supabaseClient
                .from("user_sessions")
                .update({
                is_active: false,
                updated_at: new Date().toISOString(),
            })
                .eq("id", sessionId);
            if (userId) {
                query = query.eq("user_id", userId);
            }
            const { error } = await query;
            if (error) {
                throw new Error(`Failed to invalidate session: ${(0, error_helper_1.getErrorMessage)(error)}`);
            }
            // Invalidate session cache if token provided
            if (sessionToken) {
                await this.invalidateSessionCache(sessionToken);
            }
            // Log session invalidation for security audit
            await this.logAuditEvent("SESSION_INVALIDATED", null, {
                sessionId,
            });
        });
    }
    /**
     * Deactivate session - alias for invalidateSession
     */
    async deactivateSession(sessionId, userId, sessionToken) {
        return this.invalidateSession(sessionId, sessionToken, userId.value);
    }
    /**
     * Get user roles with caching
     *
     * Pure RBAC: Queries user_roles table for multiple roles
     */
    async getUserRoles(userId) {
        const id = userId.value;
        // Try cache first
        if (this.cacheService) {
            const cacheKey = `roles:${id}`;
            const cached = await this.cacheService.get(cacheKey);
            if (cached) {
                this.logger.debug("Cache hit for user roles", { userId: id });
                return cached;
            }
        }
        return await this.circuitBreaker.execute(async () => {
            // Query user_roles table (Pure RBAC)
            const { data, error } = await this.supabaseClient
                .from("user_roles")
                .select("role_name")
                .eq("user_id", id);
            if (error) {
                throw new Error(`Failed to get user roles: ${(0, error_helper_1.getErrorMessage)(error)}`);
            }
            // Extract role names from user_roles table
            const roles = data?.map((row) => row.role_name) || [];
            // Cache the result
            if (this.cacheService) {
                await this.cacheService.set(`roles:${id}`, roles, {
                    ttl: this.CACHE_TTL.USER_ROLES,
                });
            }
            return roles;
        }, async () => {
            this.logger.warn("Using fallback for getUserRoles", { userId: id });
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
                resource_type: "user",
                resource_id: userId,
                details,
                severity: "info",
                success: true,
                created_at: new Date().toISOString(),
            };
            await this.supabaseClient.from("audit_logs").insert(auditRecord);
        }
        catch (error) {
            this.logger.error("Failed to log audit event", {
                action,
                userId,
                error: (0, error_helper_1.getErrorMessage)(error),
            });
        }
    }
    /**
     * Map database record to User Domain aggregate
     * Following Clean Architecture pattern - returns rich domain object
     *
     * Pure RBAC: Loads roles from user_roles table
     */
    async mapToUserAggregate(data) {
        // Load roles from Pure RBAC (user_roles table)
        let roleTypes = [];
        if (this.permissionRepository) {
            try {
                const userId = UserId_1.UserId.fromString(data.id);
                roleTypes = await this.permissionRepository.getUserRoles(userId);
            }
            catch (error) {
                this.logger.warn("Failed to load user roles from Pure RBAC, falling back to role_type", {
                    userId: data.id,
                    error: (0, error_helper_1.getErrorMessage)(error),
                });
                // Fallback to legacy role_type if Pure RBAC fails
                if (data.role_type) {
                    roleTypes = [data.role_type];
                }
            }
        }
        else {
            // Fallback to legacy role_type if permissionRepository not available
            if (data.role_type) {
                roleTypes = [data.role_type];
            }
        }
        return UserMapper_1.UserMapper.toDomain(data, roleTypes);
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
            lastAccessedAt: new Date(data.last_accessed_at),
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
                .from("two_factor_auth")
                .update({
                is_enabled: false,
                secret_key: null,
                backup_codes: null,
                updated_at: new Date().toISOString(),
            })
                .eq("user_id", id);
            if (mfaError) {
                throw new Error(`Failed to disable MFA: ${(0, error_helper_1.getErrorMessage)(mfaError)}`);
            }
            // Update user profile
            const { error: profileError } = await this.supabaseClient
                .from("user_profiles")
                .update({
                two_factor_enabled: false,
                updated_at: new Date().toISOString(),
            })
                .eq("id", id);
            if (profileError) {
                throw new Error(`Failed to update user profile: ${(0, error_helper_1.getErrorMessage)(profileError)}`);
            }
            this.logger.info("MFA disabled successfully", { userId: id });
        }
        catch (error) {
            this.logger.error("Failed to disable MFA", {
                userId: id,
                error: (0, error_helper_1.getErrorMessage)(error),
            });
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
                .from("login_attempts")
                .select("*")
                .eq("email", emailValue)
                .eq("success", false) // Fixed: Use 'success' to match migration schema
                .gte("attempted_at", thirtyMinutesAgo.toISOString()) // Fixed: Use 'attempted_at' to match migration schema
                .order("attempted_at", { ascending: false });
            if (error) {
                this.logger.error("Failed to check account lockout", {
                    email: emailValue,
                    error: (0, error_helper_1.getErrorMessage)(error),
                });
                return { isLocked: false, failedAttempts: 0 };
            }
            const failedAttempts = attempts?.length || 0;
            // Lock account if 5 or more failed attempts in last 30 minutes
            if (failedAttempts >= 5) {
                const firstFailedAttempt = attempts[attempts.length - 1];
                const unlockAt = new Date(new Date(firstFailedAttempt.attempted_at).getTime() + 30 * 60 * 1000); // Fixed: Use 'attempted_at'
                // Check if still locked
                if (new Date() < unlockAt) {
                    this.logger.warn("Account is locked", {
                        email: emailValue,
                        failedAttempts,
                        unlockAt,
                    });
                    return { isLocked: true, unlockAt, failedAttempts };
                }
            }
            return { isLocked: false, failedAttempts };
        }
        catch (error) {
            this.logger.error("Error checking account lockout", {
                email: email.value,
                error: (0, error_helper_1.getErrorMessage)(error),
            });
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
                success: isSuccessful, // Fixed: Use 'success' to match migration schema
                ip_address: ipAddress,
                user_agent: userAgent,
                failure_reason: errorMessage, // Fixed: Use 'failure_reason' to match migration schema
                attempted_at: new Date().toISOString(), // Fixed: Use 'attempted_at' to match migration schema
            };
            const { error } = await this.supabaseClient
                .from("login_attempts")
                .insert(attemptRecord);
            if (error) {
                this.logger.error("Failed to record login attempt", {
                    email: emailValue,
                    error: (0, error_helper_1.getErrorMessage)(error),
                });
            }
            // If successful, clear old failed attempts
            if (isSuccessful) {
                await this.clearFailedLoginAttempts(emailValue);
            }
        }
        catch (error) {
            this.logger.error("Error recording login attempt", {
                email: email.value,
                error: (0, error_helper_1.getErrorMessage)(error),
            });
        }
    }
    /**
     * Clear failed login attempts for user (after successful login)
     */
    async clearFailedLoginAttempts(email) {
        try {
            const { error } = await this.supabaseClient
                .from("login_attempts")
                .delete()
                .eq("email", email)
                .eq("success", false); // Fixed: Use 'success' to match migration schema
            if (error) {
                this.logger.error("Failed to clear failed login attempts", {
                    email,
                    error: (0, error_helper_1.getErrorMessage)(error),
                });
            }
        }
        catch (error) {
            this.logger.error("Error clearing failed login attempts", {
                email,
                error: (0, error_helper_1.getErrorMessage)(error),
            });
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
                .from("login_attempts")
                .delete()
                .eq("email", emailValue)
                .eq("success", false); // Fixed: Use 'success' to match migration schema
            if (error) {
                throw new Error(`Failed to unlock account: ${(0, error_helper_1.getErrorMessage)(error)}`);
            }
            // Log audit event
            await this.logAuditEvent("account_unlocked", adminUserId, {
                target_email: emailValue,
                action: "manual_unlock",
            });
            this.logger.info("Account unlocked successfully", {
                email: emailValue,
                adminUserId,
            });
        }
        catch (error) {
            this.logger.error("Failed to unlock account", {
                email: email.value,
                error: (0, error_helper_1.getErrorMessage)(error),
            });
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
            this.logger.debug("User cache invalidated", { userId });
        }
        catch (error) {
            this.logger.error("Failed to invalidate user cache", {
                userId,
                error: (0, error_helper_1.getErrorMessage)(error),
            });
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
            this.logger.debug("Session cache invalidated", {
                sessionToken: sessionToken.substring(0, 10) + "...",
            });
        }
        catch (error) {
            this.logger.error("Failed to invalidate session cache", {
                error: (0, error_helper_1.getErrorMessage)(error),
            });
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
            this.logger.info("All cache cleared", { deletedCount });
        }
        catch (error) {
            this.logger.error("Failed to clear all cache", {
                error: (0, error_helper_1.getErrorMessage)(error),
            });
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
     *
     * Pure RBAC: Delegates to PermissionRepository
     *
     * @deprecated This method is deprecated. Use IPermissionRepository.getUserPermissions() instead.
     * Kept for backward compatibility with existing code.
     */
    async getUserPermissions(userId) {
        // NOTE: This method should be removed once all code is migrated to use IPermissionRepository
        // For now, we return empty array and log a warning
        this.logger.warn("getUserPermissions() called on UserRepository. Use IPermissionRepository instead.", {
            userId: userId.value,
        });
        return [];
    }
    /**
     * Get active sessions for user
     */
    async getActiveSessions(userId) {
        const { data, error } = await this.supabaseClient
            .from("user_sessions")
            .select("*")
            .eq("user_id", userId.value)
            .eq("is_active", true)
            .gt("expires_at", new Date().toISOString());
        if (error) {
            throw new Error(`Failed to get active sessions: ${(0, error_helper_1.getErrorMessage)(error)}`);
        }
        return data.map((record) => this.mapToSessionEntity(record));
    }
    /**
     * Get healthcare role by type
     */
    async getHealthcareRoleByType(roleType) {
        const { data, error } = await this.supabaseClient
            .from("healthcare_roles")
            .select("*")
            .eq("role_name", roleType)
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
        let query = this.supabaseClient.from("user_profiles").select("*");
        if (options?.filters) {
            // Handle search_term separately with ilike
            const { search_term, ...otherFilters } = options.filters;
            // SECURITY: Whitelist allowed filter keys to prevent unauthorized column access
            const allowedFilterKeys = [
                "role_type",
                "is_active",
                "is_verified",
                "gender",
                "id",
            ];
            // Apply exact match filters with validation
            Object.entries(otherFilters).forEach(([key, value]) => {
                if (!allowedFilterKeys.includes(key)) {
                    throw new Error(`Invalid filter key: ${key}. Allowed keys: ${allowedFilterKeys.join(", ")}`);
                }
                query = query.eq(key, value);
            });
            // Apply search term with ilike on full_name and email
            // SECURITY: Escape LIKE special characters to prevent SQL injection
            if (search_term) {
                // Escape special characters: \, %, _
                const escapedTerm = String(search_term)
                    .replace(/\\/g, "\\\\") // Escape backslash first
                    .replace(/%/g, "\\%") // Escape % wildcard
                    .replace(/_/g, "\\_"); // Escape _ wildcard
                query = query.or(`full_name.ilike.%${escapedTerm}%,email.ilike.%${escapedTerm}%`);
            }
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
        return await Promise.all(data.map((record) => this.mapToUserAggregate(record)));
    }
    /**
     * Count total users
     */
    async count(filters) {
        let query = this.supabaseClient
            .from("user_profiles")
            .select("*", { count: "exact", head: true });
        if (filters) {
            // Handle search_term separately with ilike
            const { search_term, ...otherFilters } = filters;
            // SECURITY: Whitelist allowed filter keys to prevent unauthorized column access
            const allowedFilterKeys = [
                "role_type",
                "is_active",
                "is_verified",
                "gender",
                "id",
            ];
            // Apply exact match filters with validation
            Object.entries(otherFilters).forEach(([key, value]) => {
                if (!allowedFilterKeys.includes(key)) {
                    throw new Error(`Invalid filter key: ${key}. Allowed keys: ${allowedFilterKeys.join(", ")}`);
                }
                query = query.eq(key, value);
            });
            // Apply search term with ilike on full_name and email
            // SECURITY: Escape LIKE special characters to prevent SQL injection
            if (search_term) {
                // Escape special characters: \, %, _
                const escapedTerm = String(search_term)
                    .replace(/\\/g, "\\\\") // Escape backslash first
                    .replace(/%/g, "\\%") // Escape % wildcard
                    .replace(/_/g, "\\_"); // Escape _ wildcard
                query = query.or(`full_name.ilike.%${escapedTerm}%,email.ilike.%${escapedTerm}%`);
            }
        }
        const { count, error } = await query;
        if (error) {
            throw new Error(`Failed to count users: ${(0, error_helper_1.getErrorMessage)(error)}`);
        }
        return count || 0;
    }
    /**
     * Store staff invitation
     */
    async storeStaffInvitation(data) {
        try {
            const { error } = await this.supabaseClient
                .from("staff_invitations")
                .insert({
                email: data.email,
                role: data.role,
                invited_by: data.invitedBy,
                invitation_token: data.invitationToken,
                expires_at: data.expiresAt.toISOString(),
                status: "PENDING",
                invitation_data: data.invitationData || {},
            });
            if (error) {
                throw new Error(`Failed to store staff invitation: ${(0, error_helper_1.getErrorMessage)(error)}`);
            }
            this.logger.info("Staff invitation stored", {
                email: data.email,
                role: data.role,
            });
        }
        catch (error) {
            this.logger.error("Error storing staff invitation", {
                error: (0, error_helper_1.getErrorMessage)(error),
            });
            throw error;
        }
    }
    /**
     * Verify staff invitation token
     */
    async verifyStaffInvitation(token) {
        try {
            const { data, error } = await this.supabaseClient
                .from("staff_invitations")
                .select("*")
                .eq("invitation_token", token)
                .eq("status", "PENDING")
                .single();
            if (error || !data) {
                return { isValid: false };
            }
            // Check if token is expired
            const expiresAt = new Date(data.expires_at);
            if (expiresAt < new Date()) {
                this.logger.warn("Staff invitation token expired", {
                    email: data.email,
                    expiresAt,
                });
                return { isValid: false };
            }
            return {
                isValid: true,
                email: data.email,
                role: data.role,
                invitationData: data.invitation_data,
            };
        }
        catch (error) {
            this.logger.error("Error verifying staff invitation", {
                error: (0, error_helper_1.getErrorMessage)(error),
            });
            return { isValid: false };
        }
    }
    /**
     * Mark staff invitation as used
     */
    async markInvitationAsUsed(token, userId) {
        try {
            const { error } = await this.supabaseClient
                .from("staff_invitations")
                .update({
                status: "ACCEPTED",
                accepted_at: new Date().toISOString(),
                // Schema column is `accepted_by` (uuid). The previous
                // `accepted_by_user_id` column does not exist in Supabase,
                // so use the actual column to avoid schema cache errors.
                accepted_by: userId,
            })
                .eq("invitation_token", token)
                .eq("status", "PENDING");
            if (error) {
                throw new Error(`Failed to mark invitation as used: ${(0, error_helper_1.getErrorMessage)(error)}`);
            }
            this.logger.info("Staff invitation marked as used", {
                token: token.substring(0, 10) + "...",
                userId,
            });
        }
        catch (error) {
            this.logger.error("Error marking invitation as used", {
                error: (0, error_helper_1.getErrorMessage)(error),
            });
            throw error;
        }
    }
    /**
     * List staff invitations with pagination and filters
     */
    async listStaffInvitations(options) {
        try {
            const limit = options?.limit || 20;
            const offset = options?.offset || 0;
            // Build query
            let query = this.supabaseClient
                .from("staff_invitations")
                .select("*", { count: "exact" });
            // Apply filters
            if (options?.status) {
                query = query.eq("status", options.status);
            }
            if (options?.role) {
                query = query.eq("role", options.role);
            }
            if (options?.email) {
                query = query.ilike("email", `%${options.email}%`);
            }
            // Apply pagination and ordering
            query = query
                .order("created_at", { ascending: false })
                .range(offset, offset + limit - 1);
            const { data, error, count } = await query;
            if (error) {
                throw new Error(`Failed to list staff invitations: ${(0, error_helper_1.getErrorMessage)(error)}`);
            }
            const invitations = (data || []).map((row) => ({
                id: row.id,
                email: row.email,
                role: row.role,
                invitedBy: row.invited_by,
                invitationToken: row.invitation_token,
                expiresAt: new Date(row.expires_at),
                acceptedAt: row.accepted_at ? new Date(row.accepted_at) : undefined,
                // DB column is `accepted_by`
                acceptedBy: row.accepted_by || undefined,
                status: row.status,
                invitationData: row.invitation_data || {},
                createdAt: new Date(row.created_at),
                updatedAt: new Date(row.updated_at),
            }));
            return {
                invitations,
                total: count || 0,
            };
        }
        catch (error) {
            this.logger.error("Error listing staff invitations", {
                error: (0, error_helper_1.getErrorMessage)(error),
            });
            throw error;
        }
    }
    /**
     * Get staff invitation by ID
     */
    async getStaffInvitationById(id) {
        try {
            const { data, error } = await this.supabaseClient
                .from("staff_invitations")
                .select("*")
                .eq("id", id)
                .single();
            if (error || !data) {
                return null;
            }
            return {
                id: data.id,
                email: data.email,
                role: data.role,
                invitedBy: data.invited_by,
                invitationToken: data.invitation_token,
                expiresAt: new Date(data.expires_at),
                acceptedAt: data.accepted_at ? new Date(data.accepted_at) : undefined,
                acceptedBy: data.accepted_by || undefined,
                status: data.status,
                invitationData: data.invitation_data || {},
                createdAt: new Date(data.created_at),
                updatedAt: new Date(data.updated_at),
            };
        }
        catch (error) {
            this.logger.error("Error getting staff invitation by ID", {
                id,
                error: (0, error_helper_1.getErrorMessage)(error),
            });
            throw error;
        }
    }
    /**
     * Cancel staff invitation
     */
    async cancelStaffInvitation(id, cancelledBy) {
        try {
            const { error } = await this.supabaseClient
                .from("staff_invitations")
                .update({
                status: "CANCELLED",
                updated_at: new Date().toISOString(),
            })
                .eq("id", id)
                .eq("status", "PENDING"); // Only cancel pending invitations
            if (error) {
                throw new Error(`Failed to cancel staff invitation: ${(0, error_helper_1.getErrorMessage)(error)}`);
            }
            this.logger.info("Staff invitation cancelled", {
                id,
                cancelledBy,
            });
        }
        catch (error) {
            this.logger.error("Error cancelling staff invitation", {
                id,
                error: (0, error_helper_1.getErrorMessage)(error),
            });
            throw error;
        }
    }
    /**
     * Resend staff invitation (update expiry and generate new token)
     */
    async resendStaffInvitation(id) {
        try {
            // Generate new token and expiry
            const invitationToken = crypto_1.default.randomBytes(32).toString("hex");
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
            const { error } = await this.supabaseClient
                .from("staff_invitations")
                .update({
                invitation_token: invitationToken,
                expires_at: expiresAt.toISOString(),
                updated_at: new Date().toISOString(),
            })
                .eq("id", id)
                .eq("status", "PENDING"); // Only resend pending invitations
            if (error) {
                throw new Error(`Failed to resend staff invitation: ${(0, error_helper_1.getErrorMessage)(error)}`);
            }
            this.logger.info("Staff invitation resent", {
                id,
            });
            return {
                invitationToken,
                expiresAt,
            };
        }
        catch (error) {
            this.logger.error("Error resending staff invitation", {
                id,
                error: (0, error_helper_1.getErrorMessage)(error),
            });
            throw error;
        }
    }
}
exports.SupabaseUserRepository = SupabaseUserRepository;
//# sourceMappingURL=SupabaseUserRepository.js.map