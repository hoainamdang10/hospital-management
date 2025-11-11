/**
 * Change Password Use Case (Authenticated)
 * Allows authenticated users to change their password
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS Command Pattern
 */
import { IUseCase } from '@shared/application/use-cases/base/use-case.interface';
import { IAuthenticationService } from '../services/IAuthenticationService';
import { IUserRepository } from '../repositories/IUserRepository';
import { IPasswordPolicyRepository } from '../../domain/repositories/IPasswordPolicyRepository';
import { ISessionRepository } from '../../domain/repositories/ISessionRepository';
import { ICircuitBreaker } from '../services/ICircuitBreaker';
import { ILogger } from '../services/ILogger';
import { IEventPublisher } from '../services/IEventPublisher';
export interface ChangePasswordRequest {
    userId: string;
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
    invalidateOtherSessions?: boolean;
}
export interface ChangePasswordResponse {
    success: boolean;
    message: string;
    error?: string;
}
/**
 * Change Password Use Case
 * Allows authenticated users to change their password
 * Validates current password, validates new password against policy
 * Optionally invalidates all other sessions
 */
export declare class ChangePasswordUseCase implements IUseCase<ChangePasswordRequest, ChangePasswordResponse> {
    private authService;
    private userRepository;
    private passwordPolicyRepository;
    private sessionRepository;
    private logger;
    private circuitBreaker;
    private eventPublisher?;
    constructor(authService: IAuthenticationService, userRepository: IUserRepository, passwordPolicyRepository: IPasswordPolicyRepository, sessionRepository: ISessionRepository, logger: ILogger, circuitBreaker: ICircuitBreaker, eventPublisher?: IEventPublisher | undefined);
    execute(request: ChangePasswordRequest): Promise<ChangePasswordResponse>;
    private executeImpl;
    private validateRequest;
}
//# sourceMappingURL=ChangePasswordUseCase.d.ts.map