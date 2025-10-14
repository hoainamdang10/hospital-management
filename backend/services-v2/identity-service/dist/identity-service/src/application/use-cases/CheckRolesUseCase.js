"use strict";
/**
 * CheckRolesUseCase
 *
 * Use case để check multiple roles của user
 * Hỗ trợ requireAll (AND) hoặc requireAny (OR)
 *
 * @author Hospital Management Team
 * @version 1.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckRolesUseCase = void 0;
const UserId_1 = require("../../domain/value-objects/UserId");
class CheckRolesUseCase {
    constructor(permissionService, logger) {
        this.permissionService = permissionService;
        this.logger = logger;
    }
    async execute(request) {
        try {
            this.logger.debug('Checking roles', {
                userId: request.userId,
                roles: request.roles,
                requireAll: request.requireAll
            });
            const userId = UserId_1.UserId.fromString(request.userId);
            let allowed;
            if (request.requireAll) {
                allowed = await this.permissionService.hasAllRoles(userId, request.roles);
            }
            else {
                allowed = await this.permissionService.hasAnyRole(userId, request.roles);
            }
            this.logger.debug('Roles check result', {
                userId: request.userId,
                roles: request.roles,
                requireAll: request.requireAll,
                allowed
            });
            return {
                success: true,
                allowed,
                reason: allowed
                    ? undefined
                    : request.requireAll
                        ? `Missing all required roles: ${request.roles.join(', ')}`
                        : `Missing any of required roles: ${request.roles.join(', ')}`
            };
        }
        catch (error) {
            this.logger.error('Roles check error', {
                userId: request.userId,
                roles: request.roles,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return {
                success: false,
                allowed: false,
                reason: 'Roles check failed'
            };
        }
    }
}
exports.CheckRolesUseCase = CheckRolesUseCase;
//# sourceMappingURL=CheckRolesUseCase.js.map