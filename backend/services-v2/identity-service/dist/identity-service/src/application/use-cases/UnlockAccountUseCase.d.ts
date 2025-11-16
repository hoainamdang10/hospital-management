/**
 * Unlock Account Use Case (Admin Only)
 * Allows administrators to manually unlock user accounts
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS Command Pattern
 */
import { IUseCase } from '../../../../shared/application/use-cases/base/use-case.interface';
import { IUserRepository } from '../repositories/IUserRepository';
import { ICircuitBreaker } from '../services/ICircuitBreaker';
import { ILogger } from '../services/ILogger';
import { IEventPublisher } from '../services/IEventPublisher';
export interface UnlockAccountRequest {
    userId: string;
    unlockedBy: string;
    reason: string;
}
export interface UnlockAccountResponse {
    success: boolean;
    message: string;
    error?: string;
}
/**
 * Unlock Account Use Case
 * Allows administrators to manually unlock user accounts
 * Records audit trail
 */
export declare class UnlockAccountUseCase implements IUseCase<UnlockAccountRequest, UnlockAccountResponse> {
    private userRepository;
    private logger;
    private circuitBreaker;
    private _eventPublisher?;
    constructor(userRepository: IUserRepository, logger: ILogger, circuitBreaker: ICircuitBreaker, _eventPublisher?: IEventPublisher | undefined);
    execute(request: UnlockAccountRequest): Promise<UnlockAccountResponse>;
    private executeImpl;
    private validateRequest;
}
//# sourceMappingURL=UnlockAccountUseCase.d.ts.map