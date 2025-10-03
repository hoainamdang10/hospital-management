"use strict";
/**
 * Supabase Auth Adapter
 * Adapts legacy SupabaseAuthService to new IAuthenticationService interface
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Adapter Pattern
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseAuthAdapter = void 0;
exports.createSupabaseAuthAdapter = createSupabaseAuthAdapter;
const SupabaseAuthService_1 = require("./SupabaseAuthService");
const error_helper_1 = require("../../utils/error-helper");
/**
 * Adapter that wraps legacy SupabaseAuthService
 * and implements new IAuthenticationService interface
 */
class SupabaseAuthAdapter {
    constructor(legacyService, 
    // @ts-expect-error - Logger will be used in future implementations
    _logger) {
        this.legacyService = legacyService;
        this._logger = _logger;
    }
    /**
     * Sign up new user
     */
    async signUp(data) {
        try {
            const metadata = {
                full_name: data.fullName,
                role_type: data.roleType,
                phone_number: data.phoneNumber,
                citizen_id: data.citizenId,
                date_of_birth: data.dateOfBirth,
                gender: data.gender,
                address: data.address
            };
            const legacyResult = await this.legacyService.signUp(data.email, data.password, metadata);
            return {
                success: true,
                user: {
                    id: legacyResult.user.id,
                    email: legacyResult.user.email,
                    role: data.roleType,
                    fullName: data.fullName
                },
                accessToken: legacyResult.session.accessToken,
                refreshToken: legacyResult.session.refreshToken,
                expiresIn: Math.floor((legacyResult.session.expiresAt - Date.now() / 1000))
            };
        }
        catch (error) {
            return {
                success: false,
                error: (0, error_helper_1.getErrorMessage)(error),
                message: 'Đăng ký thất bại'
            };
        }
    }
    /**
     * Sign in existing user
     */
    async signIn(credentials) {
        try {
            const legacyResult = await this.legacyService.signIn(credentials.email, credentials.password);
            return {
                success: true,
                user: {
                    id: legacyResult.user.id,
                    email: legacyResult.user.email,
                    role: 'PATIENT' // Will be loaded from database
                },
                accessToken: legacyResult.session.accessToken,
                refreshToken: legacyResult.session.refreshToken,
                expiresIn: Math.floor((legacyResult.session.expiresAt - Date.now() / 1000))
            };
        }
        catch (error) {
            return {
                success: false,
                error: (0, error_helper_1.getErrorMessage)(error),
                message: 'Đăng nhập thất bại'
            };
        }
    }
    /**
     * Sign out user
     */
    async signOut(accessToken) {
        await this.legacyService.signOut(accessToken);
    }
    /**
     * Refresh session
     */
    async refreshSession(_refreshToken) {
        try {
            // Legacy service doesn't have this method yet
            // Return error for now
            return {
                success: false,
                error: 'Not implemented',
                message: 'Refresh session chưa được implement'
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
    async verifyToken(_token) {
        // Legacy service doesn't have this method yet
        // Throw error for now
        throw new Error('verifyToken not implemented yet');
    }
    /**
     * Send password reset email
     */
    async sendPasswordResetEmail(email) {
        await this.legacyService.resetPasswordForEmail(email);
    }
    /**
     * Reset password with token
     */
    async resetPassword(_token, _newPassword) {
        // Legacy service doesn't have this exact method
        throw new Error('resetPassword not implemented yet');
    }
    /**
     * Update password
     */
    async updatePassword(_userId, _currentPassword, _newPassword) {
        // Legacy service has updatePassword(accessToken, newPassword)
        // Need to get accessToken from userId first
        throw new Error('updatePassword not implemented yet');
    }
    /**
     * Verify email with token
     */
    async verifyEmail(email, token) {
        try {
            await this.legacyService.verifyOtp(email, token, 'signup');
        }
        catch (error) {
            throw new Error(`Email verification failed: ${(0, error_helper_1.getErrorMessage)(error)}`);
        }
    }
    /**
     * Send email verification
     */
    async sendEmailVerification(_email) {
        // Legacy service doesn't have this method yet
        throw new Error('sendEmailVerification not implemented yet');
    }
    /**
     * Check if email exists
     */
    async emailExists(_email) {
        // Legacy service doesn't have this method yet
        // Return false for now
        return false;
    }
    /**
     * Get user by access token
     */
    async getUserFromToken(_accessToken) {
        // Legacy service doesn't have this method yet
        return null;
    }
}
exports.SupabaseAuthAdapter = SupabaseAuthAdapter;
/**
 * Factory function to create SupabaseAuthAdapter
 */
function createSupabaseAuthAdapter(supabaseUrl, supabaseKey, logger) {
    const legacyService = new SupabaseAuthService_1.SupabaseAuthService(supabaseUrl, supabaseKey, logger);
    return new SupabaseAuthAdapter(legacyService, logger);
}
//# sourceMappingURL=SupabaseAuthAdapter.js.map