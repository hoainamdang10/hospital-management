/**
 * CheckRoleUseCase
 *
 * Use case để check role của user
 * Được gọi bởi API Gateway để verify roles
 *
 * @author Hospital Management Team
 * @version 1.0.0
 */
import { IPermissionService } from '../../domain/services/IPermissionService';
import { ILogger } from '../services/ILogger';
export interface CheckRoleRequest {
    userId: string;
    role: string;
}
export interface CheckRoleResponse {
    success: boolean;
    allowed: boolean;
    reason?: string;
}
export declare class CheckRoleUseCase {
    private permissionService;
    private logger;
    constructor(permissionService: IPermissionService, logger: ILogger);
    execute(request: CheckRoleRequest): Promise<CheckRoleResponse>;
}
//# sourceMappingURL=CheckRoleUseCase.d.ts.map