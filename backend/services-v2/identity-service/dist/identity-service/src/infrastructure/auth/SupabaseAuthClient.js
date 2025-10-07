"use strict";
/**
* Supabase Authentication Client
* Handles real authentication using Supabase Auth
*
* @author Hospital Management Team
* @version 2.0.0
* @compliance Production-Ready, HIPAA-Compliant
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseAuthClient = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const error_helper_1 = require("../../utils/error-helper");
const IDegradationService_1 = require("../../application/services/IDegradationService");
/**
 * Supabase Authentication Client
 * Wraps Supabase Auth API with healthcare-specific logic
 */
class SupabaseAuthClient {
    constructor(config, logger) {
        this.logger = logger;
        this.supabaseClient = (0, supabase_js_1.createClient)(config.supabaseUrl, config.supabaseServiceRoleKey, {
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: false
            }
        });
    }
    /**
     * Authenticate user with email and password
     */
    async signInWithPassword(credentials) {
        try {
            // Validate credentials
            if (!credentials.email || !credentials.password) {
                return {
                    success: false,
                    mode: IDegradationService_1.ServiceMode.DEGRADED_SERVICE,
                    degradationReason: 'Missing email or password'
                };
            }
            this.logger.info('Attempting Supabase authentication', {
                email: credentials.email
            });
            // Call Supabase Auth API
            const { data, error } = await this.supabaseClient.auth.signInWithPassword({
                email: credentials.email,
                password: credentials.password
            });
            if (error) {
                this.logger.error('Supabase authentication failed', {
                    email: credentials.email,
                    error: error.message
                });
                return {
                    success: false,
                    mode: IDegradationService_1.ServiceMode.DEGRADED_SERVICE,
                    degradationReason: `Authentication failed: ${error.message}`
                };
            }
            if (!data.user || !data.session) {
                return {
                    success: false,
                    mode: IDegradationService_1.ServiceMode.DEGRADED_SERVICE,
                    degradationReason: 'No user or session returned'
                };
            }
            // Get user profile from database
            const userProfile = await this.getUserProfile(data.user.id);
            // Map to AuthResult
            const authResult = {
                success: true,
                userId: data.user.id,
                email: data.user.email,
                sessionToken: data.session.access_token,
                refreshToken: data.session.refresh_token,
                expiresAt: new Date(data.session.expires_at * 1000),
                mode: IDegradationService_1.ServiceMode.FULL_SERVICE,
                roles: [userProfile.role_type],
                permissions: await this.getUserPermissions(data.user.id, userProfile.role_type),
                metadata: {
                    fullName: userProfile.full_name,
                    isVerified: userProfile.is_verified,
                    isActive: userProfile.is_active,
                    lastLoginAt: new Date()
                }
            };
            // Update last login timestamp with email and IP
            await this.updateLastLogin(data.user.id, data.user.email || credentials.email, credentials.ipAddress);
            this.logger.info('Authentication successful', {
                userId: data.user.id,
                email: data.user.email,
                role: userProfile.role_type
            });
            return authResult;
        }
        catch (error) {
            this.logger.error('Authentication error', {
                email: credentials.email,
                error: (0, error_helper_1.getErrorMessage)(error)
            });
            return {
                success: false,
                mode: IDegradationService_1.ServiceMode.DEGRADED_SERVICE,
                degradationReason: `Unexpected error: ${(0, error_helper_1.getErrorMessage)(error)}`
            };
        }
    }
    /**
     * Get user profile from database
     */
    async getUserProfile(userId) {
        // Query view in public schema (maintains schema per service architecture)
        // View: public.auth_user_profiles_view -> auth_schema.user_profiles
        const { data, error } = await this.supabaseClient
            .from('auth_user_profiles_view')
            .select('*')
            .eq('id', userId)
            .single();
        if (error) {
            throw new Error(`Failed to get user profile: ${error.message}`);
        }
        if (!data) {
            throw new Error('User profile not found');
        }
        return data;
    }
    /**
     * Get user permissions based on role
     *
     * @deprecated This method is deprecated in Pure RBAC implementation.
     * Use IPermissionRepository.getUserPermissions() instead.
     *
     * This method is kept for backward compatibility but returns empty array.
     * All permission logic should go through PermissionRepository and PermissionService.
     */
    async getUserPermissions(userId, roleType) {
        this.logger.warn('getUserPermissions() called on SupabaseAuthClient. Use IPermissionRepository instead.', {
            userId,
            roleType
        });
        return [];
    }
    /**
     * Update last login timestamp with email and IP address
     */
    async updateLastLogin(userId, email, ipAddress) {
        try {
            // Use security definer function for controlled access to auth_schema
            await this.supabaseClient
                .rpc('auth_update_user_last_login', { user_id: userId });
            // Log login attempt with actual email and IP
            await this.supabaseClient
                .from('login_attempts')
                .insert({
                email: email, // Actual email from auth result
                ip_address: ipAddress || 'unknown', // Actual IP from request or 'unknown'
                success: true, // Matches migration schema (002_create_login_attempts_table.sql line 25)
                attempted_at: new Date().toISOString() // Matches migration schema (line 29)
            });
        }
        catch (error) {
            this.logger.warn('Failed to update last login', {
                userId,
                email,
                error: (0, error_helper_1.getErrorMessage)(error)
            });
            // Don't throw - this is not critical
        }
    }
    /**
     * Sign out user
     */
    async signOut() {
        try {
            const { error } = await this.supabaseClient.auth.signOut();
            if (error) {
                throw new Error(`Sign out failed: ${error.message}`);
            }
        }
        catch (error) {
            this.logger.error('Sign out error', {
                error: (0, error_helper_1.getErrorMessage)(error)
            });
            throw error;
        }
    }
    /**
     * Refresh session
     */
    async refreshSession(refreshToken) {
        try {
            const { data, error } = await this.supabaseClient.auth.refreshSession({
                refresh_token: refreshToken
            });
            if (error || !data.session) {
                return {
                    success: false,
                    mode: IDegradationService_1.ServiceMode.DEGRADED_SERVICE,
                    degradationReason: `Session refresh failed: ${error?.message || 'No session returned'}`
                };
            }
            const userProfile = await this.getUserProfile(data.user.id);
            return {
                success: true,
                userId: data.user.id,
                email: data.user.email,
                sessionToken: data.session.access_token,
                refreshToken: data.session.refresh_token,
                expiresAt: new Date(data.session.expires_at * 1000),
                mode: IDegradationService_1.ServiceMode.FULL_SERVICE,
                roles: [userProfile.role_type],
                permissions: await this.getUserPermissions(data.user.id, userProfile.role_type),
                metadata: {
                    fullName: userProfile.full_name,
                    isVerified: userProfile.is_verified,
                    isActive: userProfile.is_active
                }
            };
        }
        catch (error) {
            this.logger.error('Session refresh error', {
                error: (0, error_helper_1.getErrorMessage)(error)
            });
            return {
                success: false,
                mode: IDegradationService_1.ServiceMode.DEGRADED_SERVICE,
                degradationReason: `Unexpected error: ${(0, error_helper_1.getErrorMessage)(error)}`
            };
        }
    }
    /**
     * Verify session token
     */
    async verifyToken(token) {
        try {
            const { data, error } = await this.supabaseClient.auth.getUser(token);
            if (error || !data.user) {
                return null;
            }
            return data.user;
        }
        catch (error) {
            this.logger.error('Token verification error', {
                error: (0, error_helper_1.getErrorMessage)(error)
            });
            return null;
        }
    }
}
exports.SupabaseAuthClient = SupabaseAuthClient;
//# sourceMappingURL=SupabaseAuthClient.js.map