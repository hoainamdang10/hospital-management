/**
 * Request Password Reset Use Case (Enhanced)
 * Handles password reset requests via primary or recovery email
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS Command Pattern
 */
import { IUseCase } from '../../../../shared/application/use-cases/base/use-case.interface';
import { IAuthenticationService } from '../services/IAuthenticationService';
import { IUserRepository } from '../repositories/IUserRepository';
import { IRecoveryMethodRepository } from '../../domain/repositories/IRecoveryMethodRepository';
import { IRecoveryHistoryRepository } from '../../domain/repositories/IRecoveryHistoryRepository';
import { ICircuitBreaker } from '../services/ICircuitBreaker';
import { ILogger } from '../services/ILogger';
export interface RequestPasswordResetRequest {
    email: string;
    method?: 'primary' | 'recovery';
    ipAddress?: string;
    userAgent?: string;
}
export interface RequestPasswordResetResponse {
    success: boolean;
    message: string;
    error?: string;
}
/**
 * Request Password Reset Use Case (Enhanced)
 * Supports password reset via primary email or recovery email
 * Includes rate limiting and audit logging
 */
export declare class RequestPasswordResetUseCase implements IUseCase<RequestPasswordResetRequest, RequestPasswordResetResponse> {
    private authService;
    private userRepository;
    private recoveryMethodRepository;
    private recoveryHistoryRepository;
    private logger;
    private circuitBreaker;
    private readonly RATE_LIMIT_WINDOW_HOURS;
    private readonly MAX_ATTEMPTS_PER_WINDOW;
    constructor(authService: IAuthenticationService, userRepository: IUserRepository, recoveryMethodRepository: IRecoveryMethodRepository, recoveryHistoryRepository: IRecoveryHistoryRepository, logger: ILogger, circuitBreaker: ICircuitBreaker);
    execute(request: RequestPasswordResetRequest): Promise<RequestPasswordResetResponse>;
    private executeImpl;
    /**
     * Find user by email (primary or recovery)
     * Returns userId and recovery method used
     */
    private findUserByEmail;
    /**
     * Check rate limiting
     * Returns error message if rate limit exceeded, null otherwise
     */
    private checkRateLimit;
    /**
     * Log recovery attempt
     */
    private logAttempt;
}
//# sourceMappingURL=RequestPasswordResetUseCase.d.ts.map