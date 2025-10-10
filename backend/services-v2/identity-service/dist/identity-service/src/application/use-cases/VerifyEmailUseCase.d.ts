/**
 * Verify Email Use Case
 * Handles email verification with OTP
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { IUseCase } from '../../../../shared/application/use-cases/base/use-case.interface';
import { IAuthenticationService } from '../services/IAuthenticationService';
import { IUserRepository } from '../repositories/IUserRepository';
import { ICircuitBreaker } from '../services/ICircuitBreaker';
import { IEventPublisher } from '../services/IEventPublisher';
import { ILogger } from '../services/ILogger';
export interface VerifyEmailRequest {
    email: string;
    token: string;
}
export interface VerifyEmailResponse {
    success: boolean;
    userId?: string;
    message: string;
    error?: string;
}
export declare class VerifyEmailUseCase implements IUseCase<VerifyEmailRequest, VerifyEmailResponse> {
    private authService;
    private userRepository;
    private logger;
    private circuitBreaker;
    private eventPublisher?;
    constructor(authService: IAuthenticationService, userRepository: IUserRepository, logger: ILogger, circuitBreaker: ICircuitBreaker, eventPublisher?: IEventPublisher | undefined);
    execute(request: VerifyEmailRequest): Promise<VerifyEmailResponse>;
    private executeImpl;
}
//# sourceMappingURL=VerifyEmailUseCase.d.ts.map