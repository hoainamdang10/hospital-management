/**
 * Update User Use Case
 * Updates user information
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, HIPAA
 */
import { IUseCase } from '../../../../shared/application/use-cases/base/use-case.interface';
import { IUserRepository } from '../repositories/IUserRepository';
export interface UpdateUserRequest {
    userId: string;
    requesterId: string;
    updates: {
        email?: string;
        fullName?: string;
        phoneNumber?: string;
        citizenId?: string;
        dateOfBirth?: string;
        gender?: string;
        address?: string;
        isActive?: boolean;
    };
}
export interface UpdateUserResponse {
    success: boolean;
    user?: {
        id: string;
        email: string;
        fullName: string;
        phoneNumber?: string;
        updatedAt: string;
    };
    message?: string;
    error?: string;
}
/**
 * Update User Use Case
 * Updates user information with validation and audit logging
 */
export declare class UpdateUserUseCase implements IUseCase<UpdateUserRequest, UpdateUserResponse> {
    private userRepository;
    private logger;
    private circuitBreaker;
    constructor(userRepository: IUserRepository, logger: any);
    execute(request: UpdateUserRequest): Promise<UpdateUserResponse>;
    private updateUserInternal;
}
//# sourceMappingURL=UpdateUserUseCase.d.ts.map