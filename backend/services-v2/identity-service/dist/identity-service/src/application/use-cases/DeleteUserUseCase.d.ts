/**
 * Delete User Use Case
 * Soft deletes user (deactivates) or hard deletes based on policy
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, HIPAA
 */
import { IUseCase } from '../../../../shared/application/use-cases/base/use-case.interface';
import { IUserRepository } from '../repositories/IUserRepository';
import { ICircuitBreaker } from '../services/ICircuitBreaker';
import { ILogger } from '../services/ILogger';
export interface DeleteUserRequest {
    userId: string;
    requesterId: string;
    hardDelete?: boolean;
    reason?: string;
}
export interface DeleteUserResponse {
    success: boolean;
    message?: string;
    error?: string;
    deletionType?: 'soft' | 'hard';
}
/**
 * Delete User Use Case
 * Handles user deletion with proper authorization and audit logging
 *
 * Default behavior: Soft delete (deactivate user)
 * Hard delete: Only for admin with explicit flag
 */
export declare class DeleteUserUseCase implements IUseCase<DeleteUserRequest, DeleteUserResponse> {
    private userRepository;
    private logger;
    private circuitBreaker;
    constructor(userRepository: IUserRepository, logger: ILogger, circuitBreaker: ICircuitBreaker);
    execute(request: DeleteUserRequest): Promise<DeleteUserResponse>;
    private deleteUserInternal;
}
//# sourceMappingURL=DeleteUserUseCase.d.ts.map