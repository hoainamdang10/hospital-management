/**
 * Update Recovery Methods Use Case
 * Updates account recovery methods for a user
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS Command Pattern
 */
import { IUseCase } from '../../../../shared/application/use-cases/base/use-case.interface';
import { IRecoveryMethodRepository } from '../../domain/repositories/IRecoveryMethodRepository';
import { IUserRepository } from '../repositories/IUserRepository';
import { ICircuitBreaker } from '../services/ICircuitBreaker';
import { ILogger } from '../services/ILogger';
export interface UpdateRecoveryMethodsRequest {
    userId: string;
    recoveryEmail: string | null;
}
export interface UpdateRecoveryMethodsResponse {
    success: boolean;
    recoveryMethods?: {
        recoveryEmail: string | null;
        recoveryEmailVerified: boolean;
        recoveryEmailVerifiedAt: string | null;
        lastUpdatedAt: string;
    };
    message: string;
    error?: string;
}
/**
 * Update Recovery Methods Use Case
 * Command use case to update user's recovery methods
 */
export declare class UpdateRecoveryMethodsUseCase implements IUseCase<UpdateRecoveryMethodsRequest, UpdateRecoveryMethodsResponse> {
    private recoveryMethodRepository;
    private userRepository;
    private logger;
    private circuitBreaker;
    constructor(recoveryMethodRepository: IRecoveryMethodRepository, userRepository: IUserRepository, logger: ILogger, circuitBreaker: ICircuitBreaker);
    execute(request: UpdateRecoveryMethodsRequest): Promise<UpdateRecoveryMethodsResponse>;
    private executeImpl;
    private validateRequest;
}
//# sourceMappingURL=UpdateRecoveryMethodsUseCase.d.ts.map