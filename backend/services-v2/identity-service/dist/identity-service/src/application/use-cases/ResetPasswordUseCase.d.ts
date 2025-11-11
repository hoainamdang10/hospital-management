/**
 * Reset Password Use Case
 * Handles password reset with token
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { IUseCase } from '@shared/application/use-cases/base/use-case.interface';
import { IAuthenticationService } from '../services/IAuthenticationService';
import { ICircuitBreaker } from '../services/ICircuitBreaker';
import { ILogger } from '../services/ILogger';
export interface ResetPasswordRequest {
    accessToken: string;
    refreshToken: string;
    newPassword: string;
    confirmPassword: string;
}
export interface ResetPasswordResponse {
    success: boolean;
    message: string;
    error?: string;
}
export declare class ResetPasswordUseCase implements IUseCase<ResetPasswordRequest, ResetPasswordResponse> {
    private authService;
    private logger;
    private circuitBreaker;
    constructor(authService: IAuthenticationService, logger: ILogger, circuitBreaker: ICircuitBreaker);
    execute(request: ResetPasswordRequest): Promise<ResetPasswordResponse>;
    private executeImpl;
    private validateRequest;
}
//# sourceMappingURL=ResetPasswordUseCase.d.ts.map