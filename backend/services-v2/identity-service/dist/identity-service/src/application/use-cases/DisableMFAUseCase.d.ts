/**
 * Disable MFA Use Case - Refactored
 * Handles disabling MFA for users with verification
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Dependency Inversion Principle
 */
import { IUseCase } from '../../../../shared/application/use-cases/base/use-case.interface';
import { IUserRepository } from '../repositories/IUserRepository';
import { IMFAService } from '../services/IMFAService';
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
 * Disable MFA Use Case - Refactored
 * Requires verification before disabling MFA
 * Uses IMFAService interface for infrastructure independence
 */
export declare class DisableMFAUseCase implements IUseCase<DisableMFARequest, DisableMFAResponse> {
    private userRepository;
    private mfaService;
    private verifyMFAUseCase;
    private logger;
    private circuitBreaker;
    constructor(userRepository: IUserRepository, mfaService: IMFAService, verifyMFAUseCase: VerifyMFAUseCase, logger: any);
    execute(request: DisableMFARequest): Promise<DisableMFAResponse>;
    private executeImpl;
    /**
     * Validate request
     */
    private validateRequest;
}
//# sourceMappingURL=DisableMFAUseCase.d.ts.map