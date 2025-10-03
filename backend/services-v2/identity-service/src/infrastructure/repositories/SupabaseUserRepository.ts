/**
 * Supabase-Compatible User Repository Implementation
 * V2 Clean Architecture + DDD Implementation
 * Integrates with existing auth_schema on Supabase
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, HIPAA-Compliant, Production-Ready
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CircuitBreakerFactory } from '../resilience/CircuitBreaker';
import { RedisCacheService } from '../cache/RedisCacheService';
import { getErrorMessage } from '../../utils/error-helper';
import { UserMapper } from '../mappers/UserMapper';

// Domain imports - Clean Architecture pattern
import { IUserRepository } from '../../application/repositories/IUserRepository';
import { User } from '../../domain/aggregates/User';
import { UserId } from '../../domain/value-objects/UserId';
import { Email } from '../../domain/value-objects/Email';
import { UserSession } from '../../domain/entities/UserSession';
import { ILogger } from '../../application/services/ILogger';

// Request/Response types
export interface CreateUserRequest {
  email: string;
  fullName: string;
  roleType: string;
  citizenId?: string;
  dateOfBirth?: Date;
  gender?: string;
  phoneNumber?: string;
}

// Database record interfaces (internal to infrastructure layer)
interface UserRecord {
  id: string;
  email: string;
  full_name: string;
  role_type: string;
  is_active: boolean;
  is_verified: boolean;
  citizen_id?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  phone_number?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

interface SessionRecord {
  id: string;
  user_id: string;
  session_token: string;
  device_info: any;
  ip_address: string;
  user_agent: string;
  expires_at: string;
  is_active: boolean;
  created_at: string;
  last_accessed_at: string;
}

/**
 * Repository for User operations with Supabase auth_schema
 * Implements IUserRepository interface following Clean Architecture pattern
 * Returns Domain aggregates, not DTOs
 */
export class SupabaseUserRepository implements IUserRepository {
  private supabaseClient: SupabaseClient;
  private circuitBreaker = CircuitBreakerFactory.getBreaker('user-repository');
  private cacheService?: RedisCacheService;

  // Cache TTL constants (in seconds)
  private readonly CACHE_TTL = {
    USER_PROFILE: 300,      // 5 minutes
    USER_ROLES: 900,        // 15 minutes
    USER_PERMISSIONS: 900,  // 15 minutes
    SESSION: 60             // 1 minute
  };

  constructor(
    supabaseUrl: string,
    supabaseKey: string,
    private logger: ILogger,
    cacheService?: RedisCacheService
  ) {
    // Configure Supabase client with auth_schema
    // Note: TypeScript will infer the correct schema type from createClient options
    this.supabaseClient = createClient(supabaseUrl, supabaseKey, {
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
    }) as any; // Type assertion to bypass schema type mismatch

    this.cacheService = cacheService;
  }

  /**
   * Find user by ID with circuit breaker protection and caching
   * Returns Domain aggregate, not DTO
   */
  async findById(userId: UserId): Promise<User | null> {
    const id = userId.value;

    // Try cache first
    if (this.cacheService) {
      const cacheKey = `user:${id}`;
      const cached = await this.cacheService.get<UserRecord>(cacheKey);
      if (cached) {
        this.logger.debug('Cache hit for user', { userId: id });
        return this.mapToUserAggregate(cached);
      }
    }

    return await this.circuitBreaker.execute(
      async () => {
        const { data, error } = await this.supabaseClient
          .from('user_profiles')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            return null; // Not found
          }
          throw new Error(`Failed to find user: ${getErrorMessage(error)}`);
        }

        // Cache the database record
        if (this.cacheService && data) {
          await this.cacheService.set(`user:${id}`, data, { ttl: this.CACHE_TTL.USER_PROFILE });
        }

        // Map to Domain aggregate
        return this.mapToUserAggregate(data);
      },
      async () => {
        this.logger.warn('Using fallback for findById', { userId: id });
        return null; // Fallback: return null if database unavailable
      }
    );
  }

  /**
   * Find user by email with caching
   * Returns Domain aggregate, not DTO
   */
  async findByEmail(email: Email): Promise<User | null> {
    const emailValue = email.value;

    // Try cache first
    if (this.cacheService) {
      const cacheKey = `user:email:${emailValue}`;
      const cached = await this.cacheService.get<UserRecord>(cacheKey);
      if (cached) {
        this.logger.debug('Cache hit for user by email', { email: emailValue });
        return this.mapToUserAggregate(cached);
      }
    }

    return await this.circuitBreaker.execute(
      async () => {
        const { data, error } = await this.supabaseClient
          .from('user_profiles')
          .select('*')
          .eq('email', emailValue)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            return null; // Not found
          }
          throw new Error(`Failed to find user by email: ${getErrorMessage(error)}`);
        }

        // Cache the database record
        if (this.cacheService && data) {
          await this.cacheService.set(`user:email:${emailValue}`, data, { ttl: this.CACHE_TTL.USER_PROFILE });
          await this.cacheService.set(`user:${data.id}`, data, { ttl: this.CACHE_TTL.USER_PROFILE });
        }

        // Map to Domain aggregate
        return this.mapToUserAggregate(data);
      },
      async () => {
        this.logger.warn('Using fallback for findByEmail', { email: emailValue });
        return null;
      }
    );
  }

  /**
   * Create new user with audit logging
   */
  async create(userData: CreateUserRequest): Promise<User> {
    return await this.circuitBreaker.execute(
      async () => {
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
          throw new Error(`Failed to create user: ${getErrorMessage(error)}`);
        }

        // Log user creation for audit
        await this.logAuditEvent('USER_CREATED', data.id, {
          email: userData.email,
          roleType: userData.roleType
        });

        return this.mapToUserAggregate(data);
      }
    );
  }

  /**
   * Update user information
   * Accepts full User aggregate and maps to database format
   */
  async update(user: User): Promise<void> {
    return await this.circuitBreaker.execute(
      async () => {
        const id = user.id;

        // Use UserMapper to convert domain to database format
        const updateRecord = UserMapper.toUpdate(user);

        // Remove undefined values with typed keys
        for (const key of Object.keys(updateRecord) as Array<keyof typeof updateRecord>) {
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
          throw new Error(`Failed to update user: ${getErrorMessage(error)}`);
        }

        // Log user update for audit
        await this.logAuditEvent('USER_UPDATED', id, {
          updatedFields: Object.keys(updateRecord)
        });

        // Invalidate cache after update
        await this.invalidateUserCache(id, user.email.value);
      }
    );
  }
  /**
   * Save user (create or update) - minimal implementation for schema-per-service
   */
  async save(user: User): Promise<void> {
    const record = UserMapper.toPersistence(user);
    // Upsert by id into auth_schema.user_profiles
    const { error } = await this.supabaseClient
      .from('user_profiles')
      .upsert(record, { onConflict: 'id' });
    if (error) {
      throw new Error(`Failed to save user: ${getErrorMessage(error)}`);
    }
    // Invalidate caches
    await this.invalidateUserCache(record.id!, record.email!);
  }

  /**
   * Soft delete user
   */
  async delete(userId: UserId): Promise<void> {
    const id = userId.value;
    const { error } = await this.supabaseClient
      .from('user_profiles')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) {
      throw new Error(`Failed to delete user: ${getErrorMessage(error)}`);
    }
    await this.invalidateUserCache(id);
  }

  /**
   * Check if user exists
   */
  async exists(userId: UserId): Promise<boolean> {
    const id = userId.value;
    const { data, error } = await this.supabaseClient
      .from('user_profiles')
      .select('id')
      .eq('id', id)
      .limit(1)
      .maybeSingle();
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to check user existence: ${getErrorMessage(error)}`);
    }
    return !!data;
  }


  /**
   * Create user session
   */
  async createSession(session: UserSession): Promise<void> {
    return await this.circuitBreaker.execute(
      async () => {
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
          throw new Error(`Failed to create session: ${getErrorMessage(error)}`);
        }

        // Log session creation for security audit
        await this.logAuditEvent('SESSION_CREATED', session.userId, {
          sessionId: data.id,
          ipAddress: session.ipAddress,
          userAgent: session.userAgent
        });
      }
    );
  }

  /**
   * Find active session by token
   */
  async findSessionByToken(token: string): Promise<UserSession | null> {
    return await this.circuitBreaker.execute(
      async () => {
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
          throw new Error(`Failed to find session: ${getErrorMessage(error)}`);
        }

        return this.mapToSessionEntity(data);
      },
      async () => {
        this.logger.warn('Using fallback for findSessionByToken');
        return null;
      }
    );
  }

  /**
   * Invalidate user session
   */
  async invalidateSession(sessionId: string, sessionToken?: string): Promise<void> {
    return await this.circuitBreaker.execute(
      async () => {
        const { error } = await this.supabaseClient
          .from('user_sessions')
          .update({
            is_active: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionId);

        if (error) {
          throw new Error(`Failed to invalidate session: ${getErrorMessage(error)}`);
        }

        // Invalidate session cache if token provided
        if (sessionToken) {
          await this.invalidateSessionCache(sessionToken);
        }

        // Log session invalidation for security audit
        await this.logAuditEvent('SESSION_INVALIDATED', null, {
          sessionId
        });
      }
    );
  }

  /**
   * Deactivate session - alias for invalidateSession
   */
  async deactivateSession(sessionId: string, sessionToken?: string): Promise<void> {
    return this.invalidateSession(sessionId, sessionToken);
  }

  /**
   * Get user roles with caching
   */
  async getUserRoles(userId: UserId): Promise<string[]> {
    const id = userId.value;
    // Try cache first
    if (this.cacheService) {
      const cacheKey = `roles:${id}`;
      const cached = await this.cacheService.get<string[]>(cacheKey);
      if (cached) {
        this.logger.debug('Cache hit for user roles', { userId: id });
        return cached;
      }
    }

    return await this.circuitBreaker.execute(
      async () => {
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
          throw new Error(`Failed to get user roles: ${getErrorMessage(error)}`);
        }

        const roles = [data.role_type];

        // Cache the result
        if (this.cacheService) {
          await this.cacheService.set(`roles:${id}`, roles, { ttl: this.CACHE_TTL.USER_ROLES });
        }

        return roles;
      },
      async () => {
        this.logger.warn('Using fallback for getUserRoles', { userId: id });
        return []; // Return empty array for non-existent user
      }
    );
  }

  /**
   * Log audit event for HIPAA compliance
   */
  private async logAuditEvent(action: string, userId: string | null, details: any): Promise<void> {
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
    } catch (error) {
      this.logger.error('Failed to log audit event', {
        action,
        userId,
        error: getErrorMessage(error)
      });
    }
  }

  /**
   * Map database record to User Domain aggregate
   * Following Clean Architecture pattern - returns rich domain object
   */
  private mapToUserAggregate(data: UserRecord): User {
    return UserMapper.toDomain(data);
  }

  /**
   * Map database record to UserSession Domain entity
   * Following Clean Architecture pattern - returns rich domain object
   */
  private mapToSessionEntity(data: SessionRecord): UserSession {
    return UserSession.fromPersistenceData({
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
  async disableMFA(userId: UserId): Promise<void> {
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
        throw new Error(`Failed to disable MFA: ${getErrorMessage(mfaError)}`);
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
        throw new Error(`Failed to update user profile: ${getErrorMessage(profileError)}`);
      }

      this.logger.info('MFA disabled successfully', { userId: id });
    } catch (error) {
      this.logger.error('Failed to disable MFA', { userId: id, error: getErrorMessage(error) });
      throw error;
    }
  }

  /**
   * Check if account is locked due to failed login attempts
   * Returns: { isLocked: boolean, unlockAt?: Date, failedAttempts: number }
   */
  async checkAccountLockout(email: Email): Promise<{ isLocked: boolean; unlockAt?: Date; failedAttempts: number }> {
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
        this.logger.error('Failed to check account lockout', { email: emailValue, error: getErrorMessage(error) });
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
    } catch (error) {
      this.logger.error('Error checking account lockout', { email: email.value, error: getErrorMessage(error) });
      return { isLocked: false, failedAttempts: 0 };
    }
  }

  /**
   * Record login attempt (success or failure)
   */
  async recordLoginAttempt(
    email: Email,
    isSuccessful: boolean,
    ipAddress?: string,
    userAgent?: string,
    errorMessage?: string
  ): Promise<void> {
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
        this.logger.error('Failed to record login attempt', { email: emailValue, error: getErrorMessage(error) });
      }

      // If successful, clear old failed attempts
      if (isSuccessful) {
        await this.clearFailedLoginAttempts(emailValue);
      }
    } catch (error) {
      this.logger.error('Error recording login attempt', { email: email.value, error: getErrorMessage(error) });
    }
  }

  /**
   * Clear failed login attempts for user (after successful login)
   */
  private async clearFailedLoginAttempts(email: string): Promise<void> {
    try {
      const { error } = await this.supabaseClient
        .from('login_attempts')
        .delete()
        .eq('email', email)
        .eq('is_successful', false);

      if (error) {
        this.logger.error('Failed to clear failed login attempts', { email, error: getErrorMessage(error) });
      }
    } catch (error) {
      this.logger.error('Error clearing failed login attempts', { email, error: getErrorMessage(error) });
    }
  }

  /**
   * Manually unlock account (admin function)
   */
  async unlockAccount(email: Email, adminUserId: string): Promise<void> {
    try {
      const emailValue = email.value;
      // Delete all failed login attempts
      const { error } = await this.supabaseClient
        .from('login_attempts')
        .delete()
        .eq('email', emailValue)
        .eq('is_successful', false);

      if (error) {
        throw new Error(`Failed to unlock account: ${getErrorMessage(error)}`);
      }

      // Log audit event
      await this.logAuditEvent('account_unlocked', adminUserId, {
        target_email: emailValue,
        action: 'manual_unlock'
      });

      this.logger.info('Account unlocked successfully', { email: emailValue, adminUserId });
    } catch (error) {
      this.logger.error('Failed to unlock account', { email: email.value, error: getErrorMessage(error) });
      throw error;
    }
  }

  /**
   * Invalidate user cache (call after updates)
   */
  async invalidateUserCache(userId: string, email?: string): Promise<void> {
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
    } catch (error) {
      this.logger.error('Failed to invalidate user cache', { userId, error: getErrorMessage(error) });
    }
  }

  /**
   * Invalidate session cache
   */
  async invalidateSessionCache(sessionToken: string): Promise<void> {
    if (!this.cacheService) {
      return;
    }

    try {
      await this.cacheService.delete(`session:${sessionToken}`);
      this.logger.debug('Session cache invalidated', { sessionToken: sessionToken.substring(0, 10) + '...' });
    } catch (error) {
      this.logger.error('Failed to invalidate session cache', { error: getErrorMessage(error) });
    }
  }

  /**
   * Clear all cache for this service
   */
  async clearAllCache(): Promise<void> {
    if (!this.cacheService) {
      return;
    }

    try {
      const deletedCount = await this.cacheService.clear();
      this.logger.info('All cache cleared', { deletedCount });
    } catch (error) {
      this.logger.error('Failed to clear all cache', { error: getErrorMessage(error) });
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
  async emailExists(email: Email): Promise<boolean> {
    const user = await this.findByEmail(email);
    return user !== null;
  }

  /**
   * Get user permissions
   */
  async getUserPermissions(userId: UserId): Promise<string[]> {
    const roles = await this.getUserRoles(userId);
    // For now, return basic permissions based on roles
    // TODO: Implement proper permission mapping
    const permissions: string[] = [];
    roles.forEach(role => {
      if (role === 'admin') {
        permissions.push('*'); // Admin has all permissions
      } else if (role === 'doctor') {
        permissions.push('read_patients', 'write_patients', 'read_appointments');
      } else if (role === 'patient') {
        permissions.push('read_own_data', 'book_appointments');
      }
    });
    return permissions;
  }

  /**
   * Get active sessions for user
   */
  async getActiveSessions(userId: UserId): Promise<UserSession[]> {
    const { data, error } = await this.supabaseClient
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId.value)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString());

    if (error) {
      throw new Error(`Failed to get active sessions: ${getErrorMessage(error)}`);
    }

    return data.map(record => this.mapToSessionEntity(record));
  }

  /**
   * Get healthcare role by type
   */
  async getHealthcareRoleByType(roleType: string): Promise<any | null> {
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
  async list(options?: {
    limit?: number;
    offset?: number;
    filters?: Record<string, any>;
  }): Promise<User[]> {
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
      throw new Error(`Failed to list users: ${getErrorMessage(error)}`);
    }

    return data.map(record => this.mapToUserAggregate(record));
  }

  /**
   * Count total users
   */
  async count(filters?: Record<string, any>): Promise<number> {
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
      throw new Error(`Failed to count users: ${getErrorMessage(error)}`);
    }

    return count || 0;
  }
}
