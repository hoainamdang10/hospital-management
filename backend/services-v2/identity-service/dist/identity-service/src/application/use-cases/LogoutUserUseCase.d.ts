/**
 * Logout User Use Case
 * Handles user logout and session cleanup
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { IUseCase } from '@shared/application/use-cases/base/use-case.interface';
import { IAuthenticationService } from '../services/IAuthenticationService';
import { IUserRepository } from '../repositories/IUserRepository';
import { IEventPublisher } from '../../infrastructure/events/RabbitMQEventPublisher';
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
    private eventPublisher?;
    private circuitBreaker;
    constructor(authService: IAuthenticationService, userRepository: IUserRepository, logger: any, eventPublisher?: IEventPublisher | undefined);
    execute(request: LogoutUserRequest): Promise<LogoutUserResponse>;
    private executeImpl;
}
//# sourceMappingURL=LogoutUserUseCase.d.ts.map