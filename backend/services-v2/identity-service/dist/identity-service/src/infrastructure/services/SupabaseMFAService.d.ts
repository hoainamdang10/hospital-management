/**
 * Supabase MFA Service Implementation
 * Infrastructure layer implementation of IMFAService
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Dependency Inversion Principle
 */
import { IMFAService, MFAMethod, MFASetupResult, MFASettings } from '../../application/services/IMFAService';
import { SupabaseClient } from '@supabase/supabase-js';
import { ILogger } from '../../application/services/ILogger';
/**
 * Supabase MFA Service
 * Implements MFA operations using Supabase backend
 */
export declare class SupabaseMFAService implements IMFAService {
    private supabaseClient;
    private logger;
    constructor(supabaseClient: SupabaseClient, logger: ILogger);
    /**
     * Enable MFA for user
     */
    enableMFA(userId: string, method: MFAMethod, phoneNumber?: string, email?: string): Promise<MFASetupResult>;
    /**
     * Disable MFA for user
     */
    disableMFA(userId: string): Promise<void>;
    /**
     * Verify MFA code
     */
    verifyCode(userId: string, code: string, _method: MFAMethod): Promise<boolean>;
    /**
     * Generate backup codes
     */
    generateBackupCodes(_userId: string): Promise<string[]>;
    /**
     * Validate backup code
     */
    validateBackupCode(userId: string, code: string): Promise<boolean>;
    /**
     * Check if MFA is enabled
     */
    isMFAEnabled(userId: string): Promise<boolean>;
    /**
     * Get MFA settings
     */
    getMFASettings(userId: string): Promise<MFASettings | null>;
    /**
     * Update MFA settings
     */
    updateMFASettings(userId: string, settings: Partial<MFASettings>): Promise<void>;
    /**
     * Check rate limit
     */
    checkRateLimit(userId: string, attemptType: string): Promise<boolean>;
    /**
     * Record failed attempt
     */
    recordFailedAttempt(userId: string, attemptType: string, ipAddress?: string, userAgent?: string): Promise<void>;
    /**
     * Clear failed attempts
     */
    clearFailedAttempts(userId: string, attemptType: string): Promise<void>;
    /**
     * Generate TOTP secret (Base32 encoded)
     * Uses crypto.randomBytes for cryptographically secure random generation
     */
    private generateSecret;
    /**
     * Generate QR code URL for authenticator apps
     */
    private generateQRCodeURL;
    /**
     * Generate backup codes locally (fallback)
     * Uses crypto.randomBytes for cryptographically secure random generation
     */
    private generateBackupCodesLocally;
    /**
     * Verify TOTP code
     * Implements RFC 6238 TOTP algorithm
     */
    private verifyTOTP;
    /**
     * Generate TOTP code
     */
    private generateTOTP;
    /**
     * Decode Base32 string to Buffer
     */
    private base32Decode;
}
//# sourceMappingURL=SupabaseMFAService.d.ts.map