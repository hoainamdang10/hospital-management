import { VerifyEmailResponse } from "./VerifyEmailUseCase";
/**
 * Register User Use Case - Verify-First Approach
 * Handles user registration with email verification BEFORE creating user
 *
 * Design Pattern: Verify-First
 * - User data stored in pending_registrations table
 * - User created ONLY after email verification
 * - Prevents database pollution from unverified users
 * - Allows re-registration after token expiration
 *
 * @author Hospital Management Team
 * @version 3.0.0 - Verify-First Approach
 */
import { IUseCase } from "@shared/application/use-cases/base/use-case.interface";
import { IUserRepository } from "../repositories/IUserRepository";
import { ICircuitBreaker } from "../services/ICircuitBreaker";
import { IEventPublisher } from "../services/IEventPublisher";
import { ILogger } from "../services/ILogger";
import { IEmailService } from "../services/IEmailService";
import { IPendingRegistrationRepository } from "../../domain/repositories/IPendingRegistrationRepository";
interface AutoVerificationConfig {
    enabled: boolean;
    verifyToken: (token: string) => Promise<VerifyEmailResponse>;
}
export interface RegisterUserRequest {
    email: string;
    password: string;
    fullName: string;
    roleType?: string;
    phoneNumber?: string;
    citizenId?: string;
    dateOfBirth?: string;
    gender?: string;
    address?: string;
}
export interface RegisterUserResponse {
    success: boolean;
    pendingRegistrationId?: string;
    email?: string;
    message: string;
    requiresEmailVerification: boolean;
    error?: string;
}
/**
 * Register User Use Case - Verify-First Approach
 * Flow: Store pending registration → Send verification email → User created after verification
 *
 * This use case stores user data temporarily in pending_registrations table
 * and creates the actual user ONLY after email verification is completed.
 * This prevents database pollution from unverified users.
 */
export declare class RegisterUserUseCase implements IUseCase<RegisterUserRequest, RegisterUserResponse> {
    private userRepository;
    private pendingRegistrationRepository;
    private logger;
    private circuitBreaker;
    private emailService;
    private jwtSecret;
    private frontendUrl;
    private eventPublisher?;
    private autoVerification?;
    private readonly BCRYPT_ROUNDS;
    constructor(userRepository: IUserRepository, pendingRegistrationRepository: IPendingRegistrationRepository, logger: ILogger, circuitBreaker: ICircuitBreaker, emailService: IEmailService, jwtSecret: string, frontendUrl: string, eventPublisher?: IEventPublisher | undefined, // Optional for backward compatibility
    autoVerification?: AutoVerificationConfig | undefined);
    execute(request: RegisterUserRequest): Promise<RegisterUserResponse>;
    private executeImpl;
    private validateRequest;
    private autoVerifyPendingRegistration;
}
export {};
//# sourceMappingURL=RegisterUserUseCase.d.ts.map