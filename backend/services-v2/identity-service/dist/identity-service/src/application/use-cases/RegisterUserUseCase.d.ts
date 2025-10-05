/**
 * Register User Use Case
 * Handles user registration with Supabase Auth integration
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { IUseCase } from '../../../../shared/application/use-cases/base/use-case.interface';
import { IAuthenticationService } from '../services/IAuthenticationService';
import { IUserRepository } from '../repositories/IUserRepository';
export interface RegisterUserRequest {
    email: string;
    password: string;
    fullName: string;
    roleType: string;
    phoneNumber?: string;
    citizenId?: string;
    dateOfBirth?: string;
    gender?: string;
    address?: string;
}
export interface RegisterUserResponse {
    success: boolean;
    userId?: string;
    email?: string;
    message: string;
    requiresEmailVerification?: boolean;
    error?: string;
}
/**
 * Register User Use Case
 * Flow: Supabase Auth signUp  Trigger creates user_profiles  Return success
 */
export declare class RegisterUserUseCase implements IUseCase<RegisterUserRequest, RegisterUserResponse> {
    private authService;
    private userRepository;
    private logger;
    private circuitBreaker;
    constructor(authService: IAuthenticationService, userRepository: IUserRepository, logger: any);
    execute(request: RegisterUserRequest): Promise<RegisterUserResponse>;
    private executeImpl;
    private validateRequest;
}
//# sourceMappingURL=RegisterUserUseCase.d.ts.map