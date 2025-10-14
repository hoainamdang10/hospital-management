"use strict";
/**
 * CheckRoleUseCase
 *
 * Use case để check role của user
 * Được gọi bởi API Gateway để verify roles
 *
 * @author Hospital Management Team
 * @version 1.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckRoleUseCase = void 0;
const UserId_1 = require("../../domain/value-objects/UserId");
class CheckRoleUseCase {
    constructor(permissionService, logger) {
        this.permissionService = permissionService;
        this.logger = logger;
    }
    async execute(request) {
        try {
            this.logger.debug('Checking role', {
                userId: request.userId,
                role: request.role
            });
            const userId = UserId_1.UserId.fromString(request.userId);
            const allowed = await this.permissionService.hasRole(userId, request.role);
            this.logger.debug('Role check result', {
                userId: request.userId,
                role: request.role,
                allowed
            });
            return {
                success: true,
                allowed,
                reason: allowed ? undefined : `Missing role: ${request.role}`
            };
        }
        catch (error) {
            this.logger.error('Role check error', {
                userId: request.userId,
                role: request.role,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return {
                success: false,
                allowed: false,
                reason: 'Role check failed'
            };
        }
    }
}
exports.CheckRoleUseCase = CheckRoleUseCase;
//# sourceMappingURL=CheckRoleUseCase.js.map