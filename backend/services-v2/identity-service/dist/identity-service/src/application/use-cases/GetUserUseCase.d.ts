/**
 * Get User Use Case
 * Retrieves user information by ID
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, HIPAA
 */
import { IUseCase } from '@shared/application/use-cases/base/use-case.interface';
import { IUserRepository } from '../repositories/IUserRepository';
import { ICircuitBreaker } from '../services/ICircuitBreaker';
import { ILogger } from '../services/ILogger';
export interface GetUserRequest {
    userId: string;
    requesterId: string;
}
export interface GetUserResponse {
    success: boolean;
    user?: {
        id: string;
        email: string;
        fullName: string;
        phoneNumber?: string;
        citizenId?: string;
        dateOfBirth?: string;
        gender?: string;
        address?: string;
        roleType: string;
        isActive: boolean;
        isEmailVerified: boolean;
        lastLoginAt?: string;
        createdAt: string;
        updatedAt: string;
    };
    message?: string;
    error?: string;
}
/**
 * Get User Use Case
 * Retrieves user information with proper authorization checks
 */
export declare class GetUserUseCase implements IUseCase<GetUserRequest, GetUserResponse> {
    private userRepository;
    private logger;
    private circuitBreaker;
    constructor(userRepository: IUserRepository, logger: ILogger, circuitBreaker: ICircuitBreaker);
    execute(request: GetUserRequest): Promise<GetUserResponse>;
    private getUserInternal;
}
//# sourceMappingURL=GetUserUseCase.d.ts.map