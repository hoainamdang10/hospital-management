/**
 * MFA Service Interface
 * Application layer defines the contract for MFA operations
 * Infrastructure layer provides concrete implementation
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Dependency Inversion Principle
 */
/**
 * MFA Method types
 */
export type MFAMethod = '2fa_app' | 'sms' | 'email' | 'backup';
/**
 * MFA Setup Result
 */
export interface MFASetupResult {
    secret: string;
    qrCodeUrl: string;
    backupCodes: string[];
}
/**
 * MFA Settings
 */
export interface MFASettings {
    userId: string;
    method: MFAMethod;
    isEnabled: boolean;
    secretKey?: string;
    phoneNumber?: string;
    email?: string;
    backupCodes?: string[];
    createdAt: Date;
    updatedAt: Date;
}
/**
 * MFA Service Interface
 * Defines contract for MFA operations
 *
 * This interface follows Clean Architecture principles:
 * - Defined in Application layer
 * - Implemented by Infrastructure layer
 * - Used by Use Cases
 *
 * Benefits:
 * - Testability: Easy to mock for unit tests
 * - Flexibility: Can switch MFA providers (Supabase, Auth0, Twilio)
 * - Dependency Inversion: Application doesn't depend on infrastructure
 */
export interface IMFAService {
    /**
     * Enable MFA for user
     * Generates TOTP secret, QR code, and backup codes
     *
     * @param userId User ID
     * @param method MFA method (2fa_app, sms, email)
     * @param phoneNumber Phone number (required for SMS)
     * @param email Email (required for email method)
     * @returns MFA setup result with secret, QR code, and backup codes
     */
    enableMFA(userId: string, method: MFAMethod, phoneNumber?: string, email?: string): Promise<MFASetupResult>;
    /**
     * Disable MFA for user
     * Removes MFA settings from database
     *
     * @param userId User ID
     */
    disableMFA(userId: string): Promise<void>;
    /**
     * Verify MFA code
     * Validates TOTP code against stored secret
     *
     * @param userId User ID
     * @param code TOTP code to verify
     * @param method MFA method
     * @returns True if code is valid
     */
    verifyCode(userId: string, code: string, method: MFAMethod): Promise<boolean>;
    /**
     * Generate backup codes
     * Creates new set of backup codes for user
     *
     * @param userId User ID
     * @returns Array of backup codes
     */
    generateBackupCodes(userId: string): Promise<string[]>;
    /**
     * Validate backup code
     * Checks if backup code is valid and marks it as used
     *
     * @param userId User ID
     * @param code Backup code to validate
     * @returns True if code is valid and not used
     */
    validateBackupCode(userId: string, code: string): Promise<boolean>;
    /**
     * Check if MFA is enabled for user
     *
     * @param userId User ID
     * @returns True if MFA is enabled
     */
    isMFAEnabled(userId: string): Promise<boolean>;
    /**
     * Get MFA settings for user
     *
     * @param userId User ID
     * @returns MFA settings or null if not found
     */
    getMFASettings(userId: string): Promise<MFASettings | null>;
    /**
     * Update MFA settings
     * Updates MFA configuration for user
     *
     * @param userId User ID
     * @param settings Partial MFA settings to update
     */
    updateMFASettings(userId: string, settings: Partial<MFASettings>): Promise<void>;
    /**
     * Check rate limit for MFA attempts
     * Prevents brute force attacks
     *
     * @param userId User ID
     * @param attemptType Type of attempt (login, setup, disable)
     * @returns True if rate limit is not exceeded
     */
    checkRateLimit(userId: string, attemptType: string): Promise<boolean>;
    /**
     * Record failed MFA attempt
     * Tracks failed attempts for rate limiting
     *
     * @param userId User ID
     * @param attemptType Type of attempt
     * @param ipAddress IP address of attempt
     * @param userAgent User agent of attempt
     */
    recordFailedAttempt(userId: string, attemptType: string, ipAddress?: string, userAgent?: string): Promise<void>;
    /**
     * Clear failed attempts
     * Resets failed attempt counter after successful verification
     *
     * @param userId User ID
     * @param attemptType Type of attempt
     */
    clearFailedAttempts(userId: string, attemptType: string): Promise<void>;
}
//# sourceMappingURL=IMFAService.d.ts.map