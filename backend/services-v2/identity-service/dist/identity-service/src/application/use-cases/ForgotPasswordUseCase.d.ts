/**
 * Forgot Password Use Case
 * Handles password reset request
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { IUseCase } from '@shared/application/use-cases/base/use-case.interface';
import { IAuthenticationService } from '../services/IAuthenticationService';
import { IUserRepository } from '../repositories/IUserRepository';
export interface ForgotPasswordRequest {
    email: string;
}
export interface ForgotPasswordResponse {
    success: boolean;
    message: string;
    error?: string;
}
export declare class ForgotPasswordUseCase implements IUseCase<ForgotPasswordRequest, ForgotPasswordResponse> {
    private authService;
    private userRepository;
    private logger;
    private circuitBreaker;
    constructor(authService: IAuthenticationService, userRepository: IUserRepository, logger: any);
    execute(request: ForgotPasswordRequest): Promise<ForgotPasswordResponse>;
    private executeImpl;
}
//# sourceMappingURL=ForgotPasswordUseCase.d.ts.map