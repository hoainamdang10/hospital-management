/**
 * Reset Password With Token Use Case (Enhanced)
 * Resets password using reset token with enhanced security
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS Command Pattern
 */
import { IUseCase } from '../../../../shared/application/use-cases/base/use-case.interface';
import { IAuthenticationService } from '../services/IAuthenticationService';
import { IPasswordPolicyRepository } from '../../domain/repositories/IPasswordPolicyRepository';
import { IRecoveryHistoryRepository } from '../../domain/repositories/IRecoveryHistoryRepository';
import { ISessionRepository } from '../../domain/repositories/ISessionRepository';
import { ICircuitBreaker } from '../services/ICircuitBreaker';
import { ILogger } from '../services/ILogger';
import { IEventPublisher } from '../services/IEventPublisher';
import { IUserRepository } from '../repositories/IUserRepository';
export interface ResetPasswordWithTokenRequest {
    token: string;
    newPassword: string;
    confirmPassword: string;
    ipAddress?: string;
    userAgent?: string;
}
export interface ResetPasswordWithTokenResponse {
    success: boolean;
    message: string;
    error?: string;
}
/**
 * Reset Password With Token Use Case (Enhanced)
 * Validates token, checks password policy, resets password, invalidates sessions
 */
export declare class ResetPasswordWithTokenUseCase implements IUseCase<ResetPasswordWithTokenRequest, ResetPasswordWithTokenResponse> {
    private authService;
    private passwordPolicyRepository;
    private recoveryHistoryRepository;
    private sessionRepository;
    private _userRepository;
    private logger;
    private circuitBreaker;
    private _eventPublisher?;
    constructor(authService: IAuthenticationService, passwordPolicyRepository: IPasswordPolicyRepository, recoveryHistoryRepository: IRecoveryHistoryRepository, sessionRepository: ISessionRepository, _userRepository: IUserRepository, // Prefixed with _ to indicate intentionally unused (removed in scope reduction)
    logger: ILogger, circuitBreaker: ICircuitBreaker, _eventPublisher?: IEventPublisher | undefined);
    execute(request: ResetPasswordWithTokenRequest): Promise<ResetPasswordWithTokenResponse>;
    private executeImpl;
    /**
     * Validate request
     */
    private validateRequest;
    /**
     * Log reset attempt
     */
    private logAttempt;
}
//# sourceMappingURL=ResetPasswordWithTokenUseCase.d.ts.map