/**
 * Verify Reset Token Use Case
 * Verifies password reset token validity
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS Query Pattern
 */
import { IUseCase } from '@shared/application/use-cases/base/use-case.interface';
import { IAuthenticationService } from '../services/IAuthenticationService';
import { IRecoveryHistoryRepository } from '../../domain/repositories/IRecoveryHistoryRepository';
import { ICircuitBreaker } from '../services/ICircuitBreaker';
import { ILogger } from '../services/ILogger';
export interface VerifyResetTokenRequest {
    token: string;
    ipAddress?: string;
    userAgent?: string;
}
export interface VerifyResetTokenResponse {
    success: boolean;
    valid: boolean;
    userId?: string;
    email?: string;
    message: string;
    error?: string;
}
/**
 * Verify Reset Token Use Case
 * Validates password reset token without consuming it
 */
export declare class VerifyResetTokenUseCase implements IUseCase<VerifyResetTokenRequest, VerifyResetTokenResponse> {
    private authService;
    private recoveryHistoryRepository;
    private logger;
    private circuitBreaker;
    constructor(authService: IAuthenticationService, recoveryHistoryRepository: IRecoveryHistoryRepository, logger: ILogger, circuitBreaker: ICircuitBreaker);
    execute(request: VerifyResetTokenRequest): Promise<VerifyResetTokenResponse>;
    private executeImpl;
    /**
     * Log verification attempt
     */
    private logAttempt;
}
//# sourceMappingURL=VerifyResetTokenUseCase.d.ts.map