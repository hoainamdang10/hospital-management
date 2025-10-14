/**
 * CheckPermissionUseCase
 *
 * Use case để check permission của user
 * Được gọi bởi API Gateway để verify permissions
 *
 * @author Hospital Management Team
 * @version 1.0.0
 */
import { IPermissionService } from '../../domain/services/IPermissionService';
import { ILogger } from '../services/ILogger';
export interface CheckPermissionRequest {
    userId: string;
    permission: string;
}
export interface CheckPermissionResponse {
    success: boolean;
    allowed: boolean;
    reason?: string;
}
export declare class CheckPermissionUseCase {
    private permissionService;
    private logger;
    constructor(permissionService: IPermissionService, logger: ILogger);
    execute(request: CheckPermissionRequest): Promise<CheckPermissionResponse>;
}
//# sourceMappingURL=CheckPermissionUseCase.d.ts.map