/**
 * Get Recovery Methods Use Case
 * Retrieves account recovery methods for a user
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS Query Pattern
 */
import { IUseCase } from '../../../../shared/application/use-cases/base/use-case.interface';
import { IRecoveryMethodRepository } from '../../domain/repositories/IRecoveryMethodRepository';
import { ICircuitBreaker } from '../services/ICircuitBreaker';
import { ILogger } from '../services/ILogger';
export interface GetRecoveryMethodsRequest {
    userId: string;
}
export interface GetRecoveryMethodsResponse {
    success: boolean;
    recoveryMethods?: {
        recoveryEmail: string | null;
        recoveryEmailVerified: boolean;
        recoveryEmailVerifiedAt: string | null;
        lastUpdatedAt: string;
    };
    message?: string;
    error?: string;
}
/**
 * Get Recovery Methods Use Case
 * Query use case to retrieve user's recovery methods
 */
export declare class GetRecoveryMethodsUseCase implements IUseCase<GetRecoveryMethodsRequest, GetRecoveryMethodsResponse> {
    private recoveryMethodRepository;
    private logger;
    private circuitBreaker;
    constructor(recoveryMethodRepository: IRecoveryMethodRepository, logger: ILogger, circuitBreaker: ICircuitBreaker);
    execute(request: GetRecoveryMethodsRequest): Promise<GetRecoveryMethodsResponse>;
    private executeImpl;
}
//# sourceMappingURL=GetRecoveryMethodsUseCase.d.ts.map