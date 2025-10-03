/**
 * Disable MFA Use Case
 * Handles disabling MFA for users with verification
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { IUseCase } from '@shared/application/use-cases/base/use-case.interface';
import { SupabaseUserRepository } from '../../infrastructure/repositories/SupabaseUserRepository';
import { VerifyMFAUseCase } from './VerifyMFAUseCase';
export interface DisableMFARequest {
    userId: string;
    verificationCode: string;
    ipAddress?: string;
    userAgent?: string;
}
export interface DisableMFAResponse {
    success: boolean;
    message: string;
    error?: string;
}
/**
 * Disable MFA Use Case
 * Requires verification before disabling MFA
 */
export declare class DisableMFAUseCase implements IUseCase<DisableMFARequest, DisableMFAResponse> {
    private userRepository;
    private verifyMFAUseCase;
    private logger;
    private circuitBreaker;
    constructor(userRepository: SupabaseUserRepository, verifyMFAUseCase: VerifyMFAUseCase, logger: any);
    execute(request: DisableMFARequest): Promise<DisableMFAResponse>;
    private executeImpl;
    /**
     * Validate request
     */
    private validateRequest;
}
//# sourceMappingURL=DisableMFAUseCase.d.ts.map