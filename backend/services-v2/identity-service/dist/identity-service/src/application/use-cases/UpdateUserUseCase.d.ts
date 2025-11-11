/**
 * Update User Use Case
 * Updates user information
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, HIPAA
 */
import { IUseCase } from '@shared/application/use-cases/base/use-case.interface';
import { IUserRepository } from '../repositories/IUserRepository';
import { ICircuitBreaker } from '../services/ICircuitBreaker';
import { ILogger } from '../services/ILogger';
import { IEventPublisher } from '../services/IEventPublisher';
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
    private eventPublisher?;
    constructor(userRepository: IUserRepository, logger: ILogger, circuitBreaker: ICircuitBreaker, eventPublisher?: IEventPublisher | undefined);
    execute(request: UpdateUserRequest): Promise<UpdateUserResponse>;
    private updateUserInternal;
    /**
     * Build list of field changes for event
     * @param oldValues - Captured old values BEFORE changes
     * @param updates - New values from request
     */
    private buildChangesList;
    /**
     * Publish UserUpdatedEvent
     */
    private publishUserUpdatedEvent;
}
//# sourceMappingURL=UpdateUserUseCase.d.ts.map