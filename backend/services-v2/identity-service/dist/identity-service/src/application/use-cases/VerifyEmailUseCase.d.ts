/**
 * Verify Email Use Case
 * Handles email verification with OTP
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { IUseCase } from '@shared/application/use-cases/base/use-case.interface';
import { IAuthenticationService } from '../services/IAuthenticationService';
import { IUserRepository } from '../repositories/IUserRepository';
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
    constructor(authService: IAuthenticationService, userRepository: IUserRepository, logger: any);
    execute(request: VerifyEmailRequest): Promise<VerifyEmailResponse>;
    private executeImpl;
}
//# sourceMappingURL=VerifyEmailUseCase.d.ts.map