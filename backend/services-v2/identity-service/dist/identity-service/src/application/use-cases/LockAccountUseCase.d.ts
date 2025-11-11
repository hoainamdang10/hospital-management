/**
 * Lock Account Use Case (Admin Only)
 * Allows administrators to manually lock user accounts
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS Command Pattern
 */
import { IUseCase } from "@shared/application/use-cases/base/use-case.interface";
import { IUserRepository } from "../repositories/IUserRepository";
import { ISessionRepository } from "../../domain/repositories/ISessionRepository";
import { ICircuitBreaker } from "../services/ICircuitBreaker";
import { ILogger } from "../services/ILogger";
export interface LockAccountRequest {
    userId: string;
    lockedBy: string;
    reason: string;
    terminateSessions?: boolean;
}
export interface LockAccountResponse {
    success: boolean;
    message: string;
    error?: string;
}
/**
 * Lock Account Use Case
 * Allows administrators to manually lock user accounts
 * Optionally terminates all active sessions
 * Records audit trail
 */
export declare class LockAccountUseCase implements IUseCase<LockAccountRequest, LockAccountResponse> {
    private userRepository;
    private sessionRepository;
    private logger;
    private circuitBreaker;
    constructor(userRepository: IUserRepository, sessionRepository: ISessionRepository, logger: ILogger, circuitBreaker: ICircuitBreaker);
    execute(request: LockAccountRequest): Promise<LockAccountResponse>;
    private executeImpl;
    private validateRequest;
}
//# sourceMappingURL=LockAccountUseCase.d.ts.map