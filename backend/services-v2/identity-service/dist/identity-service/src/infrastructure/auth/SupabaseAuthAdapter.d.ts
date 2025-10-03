/**
 * Supabase Auth Adapter
 * Adapts legacy SupabaseAuthService to new IAuthenticationService interface
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Adapter Pattern
 */
import { IAuthenticationService, AuthResult, UserCredentials, TokenPayload, UserRegistrationData } from '../../application/services/IAuthenticationService';
import { SupabaseAuthService } from './SupabaseAuthService';
/**
 * Adapter that wraps legacy SupabaseAuthService
 * and implements new IAuthenticationService interface
 */
export declare class SupabaseAuthAdapter implements IAuthenticationService {
    private legacyService;
    private _logger;
    constructor(legacyService: SupabaseAuthService, _logger: any);
    /**
     * Sign up new user
     */
    signUp(data: UserRegistrationData): Promise<AuthResult>;
    /**
     * Sign in existing user
     */
    signIn(credentials: UserCredentials): Promise<AuthResult>;
    /**
     * Sign out user
     */
    signOut(accessToken: string): Promise<void>;
    /**
     * Refresh session
     */
    refreshSession(_refreshToken: string): Promise<AuthResult>;
    /**
     * Verify JWT token
     */
    verifyToken(_token: string): Promise<TokenPayload>;
    /**
     * Send password reset email
     */
    sendPasswordResetEmail(email: string): Promise<void>;
    /**
     * Reset password with token
     */
    resetPassword(_token: string, _newPassword: string): Promise<void>;
    /**
     * Update password
     */
    updatePassword(_userId: string, _currentPassword: string, _newPassword: string): Promise<void>;
    /**
     * Verify email with token
     */
    verifyEmail(email: string, token: string): Promise<void>;
    /**
     * Send email verification
     */
    sendEmailVerification(_email: string): Promise<void>;
    /**
     * Check if email exists
     */
    emailExists(_email: string): Promise<boolean>;
    /**
     * Get user by access token
     */
    getUserFromToken(_accessToken: string): Promise<{
        id: string;
        email: string;
        role: string;
    } | null>;
}
/**
 * Factory function to create SupabaseAuthAdapter
 */
export declare function createSupabaseAuthAdapter(supabaseUrl: string, supabaseKey: string, logger: any): IAuthenticationService;
//# sourceMappingURL=SupabaseAuthAdapter.d.ts.map