/**
 * CheckRolesUseCase
 *
 * Use case để check multiple roles của user
 * Hỗ trợ requireAll (AND) hoặc requireAny (OR)
 *
 * @author Hospital Management Team
 * @version 1.0.0
 */
import { IPermissionService } from '../../domain/services/IPermissionService';
import { ILogger } from '../services/ILogger';
export interface CheckRolesRequest {
    userId: string;
    roles: string[];
    requireAll: boolean;
}
export interface CheckRolesResponse {
    success: boolean;
    allowed: boolean;
    reason?: string;
}
export declare class CheckRolesUseCase {
    private permissionService;
    private logger;
    constructor(permissionService: IPermissionService, logger: ILogger);
    execute(request: CheckRolesRequest): Promise<CheckRolesResponse>;
}
//# sourceMappingURL=CheckRolesUseCase.d.ts.map