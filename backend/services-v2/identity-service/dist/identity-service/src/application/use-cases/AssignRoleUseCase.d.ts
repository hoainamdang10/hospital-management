/**
 * Assign Role Use Case (Admin Only)
 * Allows administrators to assign/change user roles
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS Command Pattern
 */
import { IUseCase } from '../../../../shared/application/use-cases/base/use-case.interface';
import { IUserRepository } from '../repositories/IUserRepository';
import { IPermissionRepository } from '../../domain/repositories/IPermissionRepository';
import { ICircuitBreaker } from '../services/ICircuitBreaker';
import { ILogger } from '../services/ILogger';
import { IEventPublisher } from '../services/IEventPublisher';
export interface AssignRoleRequest {
    userId: string;
    roleType: string;
    assignedBy: string;
    reason: string;
}
export interface AssignRoleResponse {
    success: boolean;
    message: string;
    previousRole?: string;
    newRole?: string;
    error?: string;
}
/**
 * Assign Role Use Case
 * Allows administrators to assign/change user roles
 * Validates role type, records audit trail
 */
export declare class AssignRoleUseCase implements IUseCase<AssignRoleRequest, AssignRoleResponse> {
    private userRepository;
    private permissionRepository;
    private logger;
    private circuitBreaker;
    private eventPublisher?;
    private readonly VALID_ROLES;
    constructor(userRepository: IUserRepository, permissionRepository: IPermissionRepository, logger: ILogger, circuitBreaker: ICircuitBreaker, eventPublisher?: IEventPublisher | undefined);
    execute(request: AssignRoleRequest): Promise<AssignRoleResponse>;
    private executeImpl;
    private validateRequest;
}
//# sourceMappingURL=AssignRoleUseCase.d.ts.map