/**
 * Verify MFA Use Case - Refactored
 * Handles MFA code verification during login or setup
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Dependency Inversion Principle
 */
import { IUseCase } from '@shared/application/use-cases/base/use-case.interface';
import { IMFAService, MFAMethod } from '../services/IMFAService';
export interface VerifyMFARequest {
    userId: string;
    code: string;
    attemptType: 'login' | 'setup' | 'disable';
    method?: MFAMethod;
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
 * Verify MFA Use Case - Refactored
 * Verifies TOTP codes or backup codes
 * Uses IMFAService interface for infrastructure independence
 */
export declare class VerifyMFAUseCase implements IUseCase<VerifyMFARequest, VerifyMFAResponse> {
    private mfaService;
    private logger;
    private circuitBreaker;
    constructor(mfaService: IMFAService, logger: any);
    execute(request: VerifyMFARequest): Promise<VerifyMFAResponse>;
    private executeImpl;
    /**
     * Validate request
     */
    private validateRequest;
}
//# sourceMappingURL=VerifyMFAUseCase.d.ts.map