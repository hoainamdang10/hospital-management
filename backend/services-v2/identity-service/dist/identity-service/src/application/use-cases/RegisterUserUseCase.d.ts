/**
 * Register User Use Case
 * Handles user registration with Supabase Auth integration
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { IUseCase } from '../../../../shared/application/use-cases/base/use-case.interface';
import { IUserRepository } from '../repositories/IUserRepository';
import { IPermissionRepository } from '../../domain/repositories/IPermissionRepository';
import { ICircuitBreaker } from '../services/ICircuitBreaker';
import { IEventPublisher } from '../services/IEventPublisher';
import { ILogger } from '../services/ILogger';
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
 * Flow: Explicit user creation via Repository (NO trigger dependency)
 *
 * This use case creates both auth user and profile explicitly through
 * the repository layer, ensuring full control, rollback capability,
 * and Clean Architecture compliance.
 */
export declare class RegisterUserUseCase implements IUseCase<RegisterUserRequest, RegisterUserResponse> {
    private userRepository;
    private permissionRepository;
    private logger;
    private circuitBreaker;
    private eventPublisher?;
    private validRolesCache;
    private validRolesCacheTime;
    private readonly CACHE_TTL;
    constructor(userRepository: IUserRepository, permissionRepository: IPermissionRepository, logger: ILogger, circuitBreaker: ICircuitBreaker, eventPublisher?: IEventPublisher | undefined);
    execute(request: RegisterUserRequest): Promise<RegisterUserResponse>;
    private executeImpl;
    /**
     * Get valid roles from database with caching
     * Cache for 5 minutes to avoid repeated database queries
     */
    private getValidRoles;
    private validateRequest;
}
//# sourceMappingURL=RegisterUserUseCase.d.ts.map