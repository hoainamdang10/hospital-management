/**
 * Verify MFA Use Case
 * Handles MFA code verification during login or setup
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { IUseCase } from '@shared/application/use-cases/base/use-case.interface';
export interface VerifyMFARequest {
    userId: string;
    code: string;
    attemptType: 'login' | 'setup' | 'disable';
    method?: '2fa_app' | 'sms' | 'email' | 'backup';
    ipAddress?: string;
    userAgent?: string;
}
export interface VerifyMFAResponse {
    success: boolean;
    valid: boolean;
    message: string;
    error?: string;
    requiresNewCode?: boolean;
}
/**
 * Verify MFA Use Case
 * Verifies TOTP codes or backup codes
 */
export declare class VerifyMFAUseCase implements IUseCase<VerifyMFARequest, VerifyMFAResponse> {
    private logger;
    private circuitBreaker;
    private supabaseClient;
    constructor(logger: any, supabaseUrl: string, supabaseKey: string);
    execute(request: VerifyMFARequest): Promise<VerifyMFAResponse>;
    private executeImpl;
    /**
     * Validate request
     */
    private validateRequest;
    /**
     * Check rate limiting
     */
    private checkRateLimit;
    /**
     * Verify TOTP code
     */
    private verifyTOTP;
    /**
     * Generate TOTP token
     */
    private generateTOTP;
    /**
     * Base32 decode
     */
    private base32Decode;
    /**
     * Verify backup code
     */
    private verifyBackupCode;
    /**
     * Log MFA attempt
     */
    private logAttempt;
    /**
     * Enable MFA after successful setup verification
     */
    private enableMFA;
}
//# sourceMappingURL=VerifyMFAUseCase.d.ts.map