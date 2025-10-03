/**
 * Supabase Authentication Client
 * Handles real authentication using Supabase Auth
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Production-Ready, HIPAA-Compliant
 */
import { User as SupabaseUser } from '@supabase/supabase-js';
import { AuthResult, UserCredentials } from '../../application/services/IDegradationService';
export interface SupabaseAuthConfig {
    supabaseUrl: string;
    supabaseServiceRoleKey: string;
    jwtSecret: string;
}
/**
 * Supabase Authentication Client
 * Wraps Supabase Auth API with healthcare-specific logic
 */
export declare class SupabaseAuthClient {
    private logger;
    private supabaseClient;
    constructor(config: SupabaseAuthConfig, logger: any);
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
     */
    private getUserPermissions;
    /**
     * Get default permissions for role type
     */
    private getDefaultPermissions;
    /**
     * Update last login timestamp
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
    verifyToken(token: string): Promise<SupabaseUser | null>;
}
//# sourceMappingURL=SupabaseAuthClient.d.ts.map