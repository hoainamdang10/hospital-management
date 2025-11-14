/**
 * Verify Email Use Case - Verify-First Approach
 * Handles email verification and creates user AFTER verification
 *
 * Design Pattern: Verify-First
 * - Finds pending registration by token
 * - Creates actual user in auth.users and user_profiles
 * - Deletes pending registration after successful user creation
 * - Sends welcome email
 *
 * @author Hospital Management Team
 * @version 3.0.0 - Verify-First Approach
 */
import { IUseCase } from "../../../../shared/application/use-cases/base/use-case.interface";
import { IUserRepository } from "../repositories/IUserRepository";
import { IPendingRegistrationRepository } from "../../domain/repositories/IPendingRegistrationRepository";
import { IEmailService } from "../services/IEmailService";
import { ICircuitBreaker } from "../services/ICircuitBreaker";
import { IEventPublisher } from "../services/IEventPublisher";
import { ILogger } from "../services/ILogger";
import { OutboxService } from "../../infrastructure/outbox/OutboxService";
export interface VerifyEmailRequest {
    token: string;
}
export interface VerifyEmailResponse {
    success: boolean;
    userId?: string;
    email?: string;
    message: string;
    error?: string;
}
export declare class VerifyEmailUseCase implements IUseCase<VerifyEmailRequest, VerifyEmailResponse> {
    private userRepository;
    private pendingRegistrationRepository;
    private emailService;
    private logger;
    private circuitBreaker;
    private jwtSecret;
    private eventPublisher?;
    private outboxService?;
    constructor(userRepository: IUserRepository, pendingRegistrationRepository: IPendingRegistrationRepository, emailService: IEmailService, logger: ILogger, circuitBreaker: ICircuitBreaker, jwtSecret: string, eventPublisher?: IEventPublisher | undefined, // Optional for backward compatibility
    outboxService?: OutboxService | undefined);
    execute(request: VerifyEmailRequest): Promise<VerifyEmailResponse>;
    private executeImpl;
    private decryptPendingPassword;
}
//# sourceMappingURL=VerifyEmailUseCase.d.ts.map