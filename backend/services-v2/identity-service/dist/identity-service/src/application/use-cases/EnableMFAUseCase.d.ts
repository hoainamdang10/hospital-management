/**
 * Enable MFA Use Case - Refactored
 * Handles MFA setup for users with TOTP generation
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Dependency Inversion Principle
 */
import { IUseCase } from '../../../../shared/application/use-cases/base/use-case.interface';
import { IUserRepository } from '../repositories/IUserRepository';
import { IMFAService } from '../services/IMFAService';
import { ICircuitBreaker } from '../services/ICircuitBreaker';
import { ILogger } from '../services/ILogger';
import { IEventPublisher } from '../services/IEventPublisher';
export interface EnableMFARequest {
    userId: string;
    method: '2fa_app' | 'sms' | 'email';
    phoneNumber?: string;
    email?: string;
}
export interface EnableMFAResponse {
    success: boolean;
    secret?: string;
    qrCodeUrl?: string;
    backupCodes?: string[];
    message: string;
    error?: string;
}
/**
 * Enable MFA Use Case - Refactored
 * Generates TOTP secret, QR code, and backup codes for user
 * Uses IMFAService interface for infrastructure independence
 */
export declare class EnableMFAUseCase implements IUseCase<EnableMFARequest, EnableMFAResponse> {
    private userRepository;
    private mfaService;
    private logger;
    private circuitBreaker;
    private eventPublisher?;
    constructor(userRepository: IUserRepository, mfaService: IMFAService, logger: ILogger, circuitBreaker: ICircuitBreaker, eventPublisher?: IEventPublisher | undefined);
    execute(request: EnableMFARequest): Promise<EnableMFAResponse>;
    private executeImpl;
    /**
     * Validate request
     */
    private validateRequest;
}
//# sourceMappingURL=EnableMFAUseCase.d.ts.map