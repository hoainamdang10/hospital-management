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
import type { IAuthenticationService, AuthResult, UserCredentials, UserRegistrationData, TokenPayload } from '../../application/services/IAuthenticationService';
export { IAuthenticationService, AuthResult, UserCredentials, TokenPayload, UserRegistrationData } from '../../application/services/IAuthenticationService';
/**
 * Supabase Auth Service Implementation
 * Delegates authentication to Supabase Auth API
 * Implements IAuthenticationService interface from application layer
 */
export declare class SupabaseAuthService implements IAuthenticationService {
    private logger;
    private supabaseClient;
    private defaultUserRole;
    constructor(supabaseUrl: string, supabaseKey: string, logger: any, defaultUserRole?: string);
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
    signUp(_data: UserRegistrationData): Promise<AuthResult>;
    /**
     * Sign in user with Supabase Auth
     * Password verification is handled by Supabase
     */
    signIn(credentials: UserCredentials): Promise<AuthResult>;
    /**
     * Sign out user
     */
    signOut(accessToken: string): Promise<void>;
    /**
     * Send password reset email
     */
    resetPasswordForEmail(email: string): Promise<void>;
    /**
     * Verify OTP (for email verification or password reset)
     */
    verifyOtp(email: string, token: string, type: 'signup' | 'recovery'): Promise<AuthResult>;
    /**
     * Refresh session with refresh token
     */
    refreshSession(refreshToken: string): Promise<AuthResult>;
    /**
     * Verify JWT token
     */
    verifyToken(token: string): Promise<TokenPayload>;
    /**
     * Send password reset email
     */
    sendPasswordResetEmail(email: string): Promise<void>;
    /**
     * Reset password with token
     */
    resetPassword(token: string, newPassword: string): Promise<void>;
    /**
     * Update user password (requires current password)
     */
    updatePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>;
    /**
     * Verify email with token
     */
    verifyEmail(email: string, token: string): Promise<void>;
    /**
     * Send email verification
     */
    sendEmailVerification(email: string): Promise<void>;
    /**
     * Check if email exists
     */
    emailExists(_email: string): Promise<boolean>;
    /**
     * Get user from access token
     */
    getUserFromToken(accessToken: string): Promise<{
        id: string;
        email: string;
        role: string;
    } | null>;
}
//# sourceMappingURL=SupabaseAuthService.d.ts.map