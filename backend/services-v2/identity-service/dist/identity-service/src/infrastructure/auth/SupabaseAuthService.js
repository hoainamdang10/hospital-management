"use strict";
/**
 * Supabase Auth Service - Infrastructure Adapter
 * Wraps Supabase Auth API for domain use
 * Implements IAuthenticationService interface from application layer
 *
 * Pure RBAC Note:
 * - This service returns single role from user_metadata for backward compatibility
 * - Full roles array is loaded by UserRepository from user_roles table
 * - Permissions are loaded by PermissionRepository
 * - Use AuthenticateUserUseCase which orchestrates both auth and role loading
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Dependency Inversion Principle
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseAuthService = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const error_helper_1 = require("../../utils/error-helper");
/**
 * Supabase Auth Service Implementation
 * Delegates authentication to Supabase Auth API
 * Implements IAuthenticationService interface from application layer
 */
class SupabaseAuthService {
    constructor(supabaseUrl, supabaseKey, logger, defaultUserRole = 'patient' // Configurable default role
    ) {
        this.logger = logger;
        this.supabaseClient = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey, {
            auth: {
                autoRefreshToken: true,
                persistSession: false,
            },
        });
        this.defaultUserRole = defaultUserRole.toUpperCase(); // Store in uppercase for consistency
    }
    /**
     * @deprecated This method is DISABLED and will be removed in v3.0.0
     *
     * ❌ DO NOT USE THIS METHOD
     *
     * REASON: This method relied on database triggers to create user_profiles,
     * which violates Clean Architecture principles. The triggers have been
     * removed from the system.
     *
     * ✅ USE INSTEAD: RegisterUserUseCase
     *
     * MIGRATION PATH:
     * 1. Use RegisterUserUseCase which explicitly creates both auth.users
     *    and user_profiles records in a controlled manner
     * 2. See SupabaseUserRepository.createAuthUser() for implementation
     *
     * @see RegisterUserUseCase for the correct implementation
     * @see SupabaseUserRepository.createAuthUser() for explicit user creation
     * @throws Error Always throws error directing to use RegisterUserUseCase
     */
    async signUp(_data) {
        // Log error and throw immediately
        this.logger.error('DISABLED: SupabaseAuthService.signUp() is disabled. Use RegisterUserUseCase instead.', {
            email: _data.email,
            disabledSince: '2.1.0',
            removedIn: '3.0.0',
            reason: 'Trigger dependency removed from system'
        });
        throw new Error('SupabaseAuthService.signUp() is DISABLED. ' +
            'This method relied on database triggers which have been removed. ' +
            'Please use RegisterUserUseCase instead. ' +
            'See documentation: TRIGGER_ANALYSIS.md');
    }
    /**
     * Sign in user with Supabase Auth
     * Password verification is handled by Supabase
     */
    async signIn(credentials) {
        try {
            this.logger.info('Signing in user with Supabase Auth', { email: credentials.email });
            const { data, error } = await this.supabaseClient.auth.signInWithPassword({
                email: credentials.email,
                password: credentials.password
            });
            if (error) {
                this.logger.warn('Supabase Auth signIn failed', { email: credentials.email, error: (0, error_helper_1.getErrorMessage)(error) });
                return {
                    success: false,
                    error: (0, error_helper_1.getErrorMessage)(error),
                    message: `Đăng nhập thất bại: ${(0, error_helper_1.getErrorMessage)(error)}`
                };
            }
            if (!data.user || !data.session) {
                return {
                    success: false,
                    error: 'No user or session returned',
                    message: 'Đăng nhập thất bại: Không nhận được thông tin người dùng'
                };
            }
            this.logger.info('User signed in successfully', { userId: data.user.id, email: credentials.email });
            return {
                success: true,
                user: {
                    id: data.user.id,
                    email: data.user.email,
                    role: data.user.user_metadata?.role_type || this.defaultUserRole
                },
                accessToken: data.session.access_token,
                refreshToken: data.session.refresh_token,
                expiresIn: data.session.expires_in
            };
        }
        catch (error) {
            this.logger.error('Sign in error', { email: credentials.email, error: (0, error_helper_1.getErrorMessage)(error) });
            return {
                success: false,
                error: (0, error_helper_1.getErrorMessage)(error),
                message: `Đăng nhập thất bại: ${(0, error_helper_1.getErrorMessage)(error)}`
            };
        }
    }
    /**
     * Sign out user
     */
    async signOut(accessToken) {
        try {
            this.logger.info('Signing out user');
            // Set session using access token if provided
            if (accessToken) {
                const { error: sessionError } = await this.supabaseClient.auth.setSession({
                    access_token: accessToken,
                    refresh_token: ''
                });
                if (sessionError) {
                    this.logger.warn('Set session before signOut failed', { error: (0, error_helper_1.getErrorMessage)(sessionError) });
                }
            }
            const { error } = await this.supabaseClient.auth.signOut();
            if (error) {
                this.logger.error('Supabase Auth signOut failed', { error: (0, error_helper_1.getErrorMessage)(error) });
                throw new Error(`Đăng xuất thất bại: ${(0, error_helper_1.getErrorMessage)(error)}`);
            }
            this.logger.info('User signed out successfully');
        }
        catch (error) {
            this.logger.error('Sign out error', { error: (0, error_helper_1.getErrorMessage)(error) });
            throw error;
        }
    }
    /**
     * Send password reset email
     */
    async resetPasswordForEmail(email) {
        try {
            this.logger.info('Sending password reset email', { email });
            const { error } = await this.supabaseClient.auth.resetPasswordForEmail(email, {
                redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password`
            });
            if (error) {
                this.logger.error('Supabase Auth resetPasswordForEmail failed', { email, error: (0, error_helper_1.getErrorMessage)(error) });
                throw new Error(`Gửi email đặt lại mật khẩu thất bại: ${(0, error_helper_1.getErrorMessage)(error)}`);
            }
            this.logger.info('Password reset email sent successfully', { email });
        }
        catch (error) {
            this.logger.error('Reset password error', { email, error: (0, error_helper_1.getErrorMessage)(error) });
            throw error;
        }
    }
    /**
     * Verify OTP (for email verification or password reset)
     */
    async verifyOtp(email, token, type) {
        try {
            this.logger.info('Verifying OTP', { email, type });
            const { data, error } = await this.supabaseClient.auth.verifyOtp({
                email,
                token,
                type
            });
            if (error) {
                this.logger.error('Supabase Auth verifyOtp failed', { email, type, error: (0, error_helper_1.getErrorMessage)(error) });
                throw new Error(`Xác thực OTP thất bại: ${(0, error_helper_1.getErrorMessage)(error)}`);
            }
            if (!data.user || !data.session) {
                throw new Error('Xác thực OTP thất bại: Không nhận được thông tin người dùng');
            }
            this.logger.info('OTP verified successfully', { userId: data.user.id, email });
            return {
                success: true,
                user: {
                    id: data.user.id,
                    email: data.user.email,
                    role: data.user.user_metadata?.role_type || this.defaultUserRole
                },
                accessToken: data.session.access_token,
                refreshToken: data.session.refresh_token,
                expiresIn: data.session.expires_in
            };
        }
        catch (error) {
            this.logger.error('Verify OTP error', { email, type, error: (0, error_helper_1.getErrorMessage)(error) });
            return {
                success: false,
                error: (0, error_helper_1.getErrorMessage)(error),
                message: `Xác thực OTP thất bại: ${(0, error_helper_1.getErrorMessage)(error)}`
            };
        }
    }
    /**
     * Refresh session with refresh token
     */
    async refreshSession(refreshToken) {
        try {
            const { data, error } = await this.supabaseClient.auth.refreshSession({
                refresh_token: refreshToken
            });
            if (error || !data.session) {
                return {
                    success: false,
                    error: (0, error_helper_1.getErrorMessage)(error),
                    message: 'Refresh session thất bại'
                };
            }
            return {
                success: true,
                user: data.user ? {
                    id: data.user.id,
                    email: data.user.email,
                    role: data.user.user_metadata?.role_type || this.defaultUserRole
                } : undefined,
                accessToken: data.session.access_token,
                refreshToken: data.session.refresh_token,
                expiresIn: data.session.expires_in
            };
        }
        catch (error) {
            return {
                success: false,
                error: (0, error_helper_1.getErrorMessage)(error),
                message: 'Refresh session thất bại'
            };
        }
    }
    /**
     * Verify JWT token
     */
    async verifyToken(token) {
        const { data, error } = await this.supabaseClient.auth.getUser(token);
        if (error || !data.user) {
            throw new Error('Invalid token');
        }
        return {
            userId: data.user.id,
            email: data.user.email,
            role: data.user.user_metadata?.role_type || this.defaultUserRole,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 3600
        };
    }
    /**
     * Send password reset email
     */
    async sendPasswordResetEmail(email) {
        await this.resetPasswordForEmail(email);
    }
    /**
     * Reset password with token
     */
    async resetPassword(token, newPassword) {
        try {
            // Set session with recovery token
            const { error: sessionError } = await this.supabaseClient.auth.setSession({
                access_token: token,
                refresh_token: token
            });
            if (sessionError) {
                throw new Error(`Failed to set session: ${(0, error_helper_1.getErrorMessage)(sessionError)}`);
            }
            // Update password
            const { error } = await this.supabaseClient.auth.updateUser({
                password: newPassword
            });
            if (error) {
                throw new Error(`Failed to reset password: ${(0, error_helper_1.getErrorMessage)(error)}`);
            }
        }
        catch (error) {
            throw new Error(`Reset password failed: ${(0, error_helper_1.getErrorMessage)(error)}`);
        }
    }
    /**
     * Update user password (requires current password)
     */
    async updatePassword(userId, currentPassword, newPassword) {
        try {
            this.logger.info('Updating user password', { userId });
            // Fetch user email from user_profiles table
            const { data: profile, error: profileError } = await this.supabaseClient
                .from('user_profiles')
                .select('email')
                .eq('id', userId)
                .single();
            if (profileError || !profile) {
                throw new Error(`User not found: ${(0, error_helper_1.getErrorMessage)(profileError)}`);
            }
            // First verify current password by signing in with email
            const { data: signInData, error: signInError } = await this.supabaseClient.auth.signInWithPassword({
                email: profile.email, // Use actual email, not userId
                password: currentPassword
            });
            if (signInError || !signInData.session) {
                throw new Error('Current password is incorrect');
            }
            // Set session first
            const { error: sessionError } = await this.supabaseClient.auth.setSession({
                access_token: signInData.session.access_token,
                refresh_token: signInData.session.refresh_token
            });
            if (sessionError) {
                throw new Error(`Set session failed: ${sessionError.message}`);
            }
            const { error } = await this.supabaseClient.auth.updateUser({
                password: newPassword
            });
            if (error) {
                this.logger.error('Supabase Auth updatePassword failed', { error: (0, error_helper_1.getErrorMessage)(error) });
                throw new Error(`Cadp nhadt madt kha9u tha5t ba1i: ${(0, error_helper_1.getErrorMessage)(error)}`);
            }
            this.logger.info('Password updated successfully');
        }
        catch (error) {
            this.logger.error('Update password error', { error: (0, error_helper_1.getErrorMessage)(error) });
            throw error;
        }
    }
    /**
     * Verify email with token
     */
    async verifyEmail(email, token) {
        try {
            const { error } = await this.supabaseClient.auth.verifyOtp({
                email,
                token,
                type: 'signup'
            });
            if (error) {
                throw new Error(`Email verification failed: ${(0, error_helper_1.getErrorMessage)(error)}`);
            }
        }
        catch (error) {
            throw new Error(`Email verification failed: ${(0, error_helper_1.getErrorMessage)(error)}`);
        }
    }
    /**
     * Send email verification
     */
    async sendEmailVerification(email) {
        try {
            const { error } = await this.supabaseClient.auth.resend({
                type: 'signup',
                email
            });
            if (error) {
                throw new Error(`Failed to send verification email: ${(0, error_helper_1.getErrorMessage)(error)}`);
            }
        }
        catch (error) {
            throw new Error(`Failed to send verification email: ${(0, error_helper_1.getErrorMessage)(error)}`);
        }
    }
    /**
     * Check if email exists
     */
    async emailExists(_email) {
        // Supabase doesn't have a direct API for this
        // Return false for now
        return false;
    }
    /**
     * Get user from access token
     */
    async getUserFromToken(accessToken) {
        try {
            const { data, error } = await this.supabaseClient.auth.getUser(accessToken);
            if (error || !data.user) {
                return null;
            }
            return {
                id: data.user.id,
                email: data.user.email,
                role: data.user.user_metadata?.role_type || this.defaultUserRole
            };
        }
        catch {
            return null;
        }
    }
}
exports.SupabaseAuthService = SupabaseAuthService;
// Note: getErrorMessage is imported from '../../utils/error-helper'
//# sourceMappingURL=SupabaseAuthService.js.map