/**
* Supabase Authentication Client
* Handles real authentication using Supabase Auth
*
* @author Hospital Management Team
* @version 2.0.0
* @compliance Production-Ready, HIPAA-Compliant
*/
import { AuthResult, UserCredentials } from '../../application/services/IDegradationService';
import { ILogger } from '../../application/services/ILogger';
import { ITokenVerifier, TokenUser } from '../../application/services/ITokenVerifier';
export interface SupabaseAuthConfig {
    supabaseUrl: string;
    supabaseServiceRoleKey: string;
    jwtSecret: string;
}
/**
 * Supabase Authentication Client
 * Wraps Supabase Auth API with healthcare-specific logic
 */
export declare class SupabaseAuthClient implements ITokenVerifier {
    private logger;
    private supabaseClient;
    constructor(config: SupabaseAuthConfig, logger: ILogger);
    /**
     * Authenticate user with email and password
     */
    signInWithPassword(credentials: UserCredentials): Promise<AuthResult>;
    /**
     * Get user profile from database
     */
    private getUserProfile;
    /**
     * Get user permissions based on role
     *
     * @deprecated This method is deprecated in Pure RBAC implementation.
     * Use IPermissionRepository.getUserPermissions() instead.
     *
     * This method is kept for backward compatibility but returns empty array.
     * All permission logic should go through PermissionRepository and PermissionService.
     */
    private getUserPermissions;
    /**
     * Update last login timestamp with email and IP address
     */
    private updateLastLogin;
    /**
     * Sign out user
     */
    signOut(): Promise<void>;
    /**
     * Refresh session
     */
    refreshSession(refreshToken: string): Promise<AuthResult>;
    /**
     * Verify session token
     */
    verifyToken(token: string): Promise<TokenUser | null>;
}
//# sourceMappingURL=SupabaseAuthClient.d.ts.map