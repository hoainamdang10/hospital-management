/**
 * Logout User Use Case
 * Handles user logout and session cleanup
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
export interface LogoutUserRequest {
    userId: string;
    accessToken: string;
    sessionId?: string;
}
export interface LogoutUserResponse {
    success: boolean;
    message: string;
    error?: string;
}
export declare class LogoutUserUseCase implements IUseCase<LogoutUserRequest, LogoutUserResponse> {
    private authService;
    private userRepository;
    private logger;
    private circuitBreaker;
    private _eventPublisher?;
    constructor(authService: IAuthenticationService, userRepository: IUserRepository, logger: ILogger, circuitBreaker: ICircuitBreaker, _eventPublisher?: IEventPublisher | undefined);
    execute(request: LogoutUserRequest): Promise<LogoutUserResponse>;
    private executeImpl;
}
//# sourceMappingURL=LogoutUserUseCase.d.ts.map