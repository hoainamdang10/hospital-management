/**
 * CheckPermissionsUseCase
 *
 * Use case để check multiple permissions của user
 * Hỗ trợ requireAll (AND) hoặc requireAny (OR)
 *
 * @author Hospital Management Team
 * @version 1.0.0
 */
import { IPermissionService } from '../../domain/services/IPermissionService';
import { ILogger } from '../services/ILogger';
export interface CheckPermissionsRequest {
    userId: string;
    permissions: string[];
    requireAll: boolean;
}
export interface CheckPermissionsResponse {
    success: boolean;
    allowed: boolean;
    reason?: string;
}
export declare class CheckPermissionsUseCase {
    private permissionService;
    private logger;
    constructor(permissionService: IPermissionService, logger: ILogger);
    execute(request: CheckPermissionsRequest): Promise<CheckPermissionsResponse>;
}
//# sourceMappingURL=CheckPermissionsUseCase.d.ts.map