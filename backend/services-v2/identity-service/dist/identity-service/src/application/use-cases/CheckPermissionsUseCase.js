"use strict";
/**
 * CheckPermissionsUseCase
 *
 * Use case để check multiple permissions của user
 * Hỗ trợ requireAll (AND) hoặc requireAny (OR)
 *
 * @author Hospital Management Team
 * @version 1.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckPermissionsUseCase = void 0;
const UserId_1 = require("../../domain/value-objects/UserId");
class CheckPermissionsUseCase {
    constructor(permissionService, logger) {
        this.permissionService = permissionService;
        this.logger = logger;
    }
    async execute(request) {
        try {
            this.logger.debug('Checking permissions', {
                userId: request.userId,
                permissions: request.permissions,
                requireAll: request.requireAll
            });
            const userId = UserId_1.UserId.fromString(request.userId);
            let allowed;
            if (request.requireAll) {
                allowed = await this.permissionService.hasAllPermissions(userId, request.permissions);
            }
            else {
                allowed = await this.permissionService.hasAnyPermission(userId, request.permissions);
            }
            this.logger.debug('Permissions check result', {
                userId: request.userId,
                permissions: request.permissions,
                requireAll: request.requireAll,
                allowed
            });
            return {
                success: true,
                allowed,
                reason: allowed
                    ? undefined
                    : request.requireAll
                        ? `Missing all required permissions: ${request.permissions.join(', ')}`
                        : `Missing any of required permissions: ${request.permissions.join(', ')}`
            };
        }
        catch (error) {
            this.logger.error('Permissions check error', {
                userId: request.userId,
                permissions: request.permissions,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return {
                success: false,
                allowed: false,
                reason: 'Permissions check failed'
            };
        }
    }
}
exports.CheckPermissionsUseCase = CheckPermissionsUseCase;
//# sourceMappingURL=CheckPermissionsUseCase.js.map