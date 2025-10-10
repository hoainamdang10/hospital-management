/**
 * Authentication Service Interface
 * Application layer defines the contract for authentication operations
 * Infrastructure layer provides concrete implementation
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Dependency Inversion Principle
 */
/**
 * Authentication result returned by authentication operations
 */
export interface AuthResult {
    success: boolean;
    user?: {
        id: string;
        email: string;
        role: string;
        fullName?: string;
    };
    accessToken?: string;
    refreshToken?: string;
    expiresIn?: number;
    permissions?: string[];
    error?: string;
    message?: string;
}
/**
 * User credentials for authentication
 */
export interface UserCredentials {
    email: string;
    password: string;
}
/**
 * Token payload structure
 */
export interface TokenPayload {
    userId: string;
    email: string;
    role: string;
    iat: number;
    exp: number;
}
/**
 * User registration data
 */
export interface UserRegistrationData {
    email: string;
    password: string;
    fullName: string;
    roleType: string;
    phoneNumber?: string;
    citizenId?: string;
    dateOfBirth?: string;
    gender?: string;
    address?: string;
}
/**
 * Authentication Service Interface
 * Defines contract for authentication operations
 *
 * This interface follows Clean Architecture principles:
 * - Defined in Application layer
 * - Implemented by Infrastructure layer
 * - Used by Use Cases
 *
 * Benefits:
 * - Testability: Easy to mock for unit tests
 * - Flexibility: Can switch authentication providers (Supabase, Auth0, Cognito)
 * - Dependency Inversion: Application doesn't depend on infrastructure
 */
export interface IAuthenticationService {
    /**
     * Sign up new user
     * Creates user account in authentication system
     *
     * @param data User registration data
     * @returns Authentication result with tokens
     */
    signUp(data: UserRegistrationData): Promise<AuthResult>;
    /**
     * Sign in existing user
     * Authenticates user with email and password
     *
     * @param credentials User credentials
     * @returns Authentication result with tokens and permissions
     */
    signIn(credentials: UserCredentials): Promise<AuthResult>;
    /**
     * Sign out user
     * Invalidates user session and tokens
     *
     * @param accessToken User's access token
     */
    signOut(accessToken: string): Promise<void>;
    /**
     * Refresh session
     * Generates new access token using refresh token
     *
     * @param refreshToken User's refresh token
     * @returns New authentication result with fresh tokens
     */
    refreshSession(refreshToken: string): Promise<AuthResult>;
    /**
     * Verify JWT token
     * Validates token and extracts payload
     *
     * @param token JWT token to verify
     * @returns Token payload if valid
     * @throws Error if token is invalid or expired
     */
    verifyToken(token: string): Promise<TokenPayload>;
    /**
     * Send password reset email
     * Initiates password reset flow
     *
     * @param email User's email address
     */
    sendPasswordResetEmail(email: string): Promise<void>;
    /**
     * Reset password with token
     * Completes password reset flow
     *
     * @param accessToken Access token from password reset email
     * @param refreshToken Refresh token from password reset email
     * @param newPassword New password
     */
    resetPassword(accessToken: string, refreshToken: string, newPassword: string): Promise<void>;
    /**
     * Update password
     * Changes user's password (for authenticated users)
     * Note: Current password verification should be done in use case
     *
     * @param userId User ID
     * @param newPassword New password
     */
    updatePassword(userId: string, newPassword: string): Promise<void>;
    /**
     * Verify email with token
     * Confirms user's email address
     *
     * @param email User's email
     * @param token Verification token
     */
    verifyEmail(email: string, token: string): Promise<void>;
    /**
     * Send email verification
     * Sends verification email to user
     *
     * @param email User's email address
     */
    sendEmailVerification(email: string): Promise<void>;
    /**
     * Check if email exists
     * Validates email uniqueness
     *
     * @param email Email to check
     * @returns True if email exists
     */
    emailExists(email: string): Promise<boolean>;
    /**
     * Get user by access token
     * Retrieves user information from token
     *
     * @param accessToken User's access token
     * @returns User information
     */
    getUserFromToken(accessToken: string): Promise<{
        id: string;
        email: string;
        role: string;
    } | null>;
}
/**
 * Service mode for graceful degradation
 */
export declare enum ServiceMode {
    FULL = "FULL",// All features available
    DEGRADED = "DEGRADED",// Limited features, using cache
    EMERGENCY = "EMERGENCY"
}
/**
 * Authentication service configuration
 */
export interface AuthServiceConfig {
    supabaseUrl: string;
    supabaseServiceRoleKey: string;
    jwtSecret: string;
    enableEmergencyMode?: boolean;
}
//# sourceMappingURL=IAuthenticationService.d.ts.map