"use strict";
/**
 * CheckPermissionUseCase
 *
 * Use case để check permission của user
 * Được gọi bởi API Gateway để verify permissions
 *
 * @author Hospital Management Team
 * @version 1.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckPermissionUseCase = void 0;
const UserId_1 = require("../../domain/value-objects/UserId");
class CheckPermissionUseCase {
    constructor(permissionService, logger) {
        this.permissionService = permissionService;
        this.logger = logger;
    }
    async execute(request) {
        try {
            this.logger.debug('Checking permission', {
                userId: request.userId,
                permission: request.permission
            });
            const userId = UserId_1.UserId.fromString(request.userId);
            const allowed = await this.permissionService.checkPermission(userId, request.permission);
            this.logger.debug('Permission check result', {
                userId: request.userId,
                permission: request.permission,
                allowed
            });
            return {
                success: true,
                allowed,
                reason: allowed ? undefined : `Missing permission: ${request.permission}`
            };
        }
        catch (error) {
            this.logger.error('Permission check error', {
                userId: request.userId,
                permission: request.permission,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return {
                success: false,
                allowed: false,
                reason: 'Permission check failed'
            };
        }
    }
}
exports.CheckPermissionUseCase = CheckPermissionUseCase;
//# sourceMappingURL=CheckPermissionUseCase.js.map