/**
 * Enable MFA Use Case
 * Handles MFA setup for users with TOTP generation
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { IUseCase } from '@shared/application/use-cases/base/use-case.interface';
import { SupabaseUserRepository } from '../../infrastructure/repositories/SupabaseUserRepository';
export interface EnableMFARequest {
    userId: string;
    method: '2fa_app' | 'sms' | 'email';
    phoneNumber?: string;
    email?: string;
}
export interface EnableMFAResponse {
    success: boolean;
    secret?: string;
    qrCodeUrl?: string;
    backupCodes?: string[];
    message: string;
    error?: string;
}
/**
 * Enable MFA Use Case
 * Generates TOTP secret, QR code, and backup codes for user
 */
export declare class EnableMFAUseCase implements IUseCase<EnableMFARequest, EnableMFAResponse> {
    private userRepository;
    private logger;
    private circuitBreaker;
    private supabaseClient;
    constructor(userRepository: SupabaseUserRepository, logger: any, supabaseUrl: string, supabaseKey: string);
    execute(request: EnableMFARequest): Promise<EnableMFAResponse>;
    private executeImpl;
    /**
     * Validate request
     */
    private validateRequest;
    /**
     * Generate TOTP secret (Base32 encoded)
     */
    private generateSecret;
    /**
     * Generate QR code URL for authenticator apps
     */
    private generateQRCodeURL;
    /**
     * Generate backup codes
     */
    private generateBackupCodes;
    /**
     * Generate backup codes locally (fallback)
     */
    private generateBackupCodesLocally;
}
//# sourceMappingURL=EnableMFAUseCase.d.ts.map