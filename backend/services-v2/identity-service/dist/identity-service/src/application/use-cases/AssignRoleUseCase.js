"use strict";
/**
 * Assign Role Use Case (Admin Only)
 * Allows administrators to assign/change user roles
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS Command Pattern
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssignRoleUseCase = void 0;
const UserId_1 = require("../../domain/value-objects/UserId");
/**
 * Assign Role Use Case
 * Allows administrators to assign/change user roles
 * Validates role type, records audit trail
 */
class AssignRoleUseCase {
    constructor(userRepository, permissionRepository, logger, circuitBreaker) {
        this.userRepository = userRepository;
        this.permissionRepository = permissionRepository;
        this.logger = logger;
        this.circuitBreaker = circuitBreaker;
        // Valid role types (5 core roles)
        this.VALID_ROLES = ['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'PATIENT'];
    }
    async execute(request) {
        return await this.circuitBreaker.execute(async () => this.executeImpl(request), async () => {
            this.logger.error('Circuit breaker open for AssignRoleUseCase');
            return {
                success: false,
                message: 'Dịch vụ gán vai trò tạm thời không khả dụng. Vui lòng thử lại sau.',
                error: 'SERVICE_UNAVAILABLE'
            };
        });
    }
    async executeImpl(request) {
        try {
            this.logger.info('Processing role assignment request', {
                userId: request.userId,
                roleType: request.roleType,
                assignedBy: request.assignedBy,
                reason: request.reason
            });
            // 1. Validate input
            const validationError = this.validateRequest(request);
            if (validationError) {
                return {
                    success: false,
                    message: validationError,
                    error: 'VALIDATION_ERROR'
                };
            }
            // 2. Convert string ID to Value Object
            const userIdVO = UserId_1.UserId.fromString(request.userId);
            // 3. Get user to validate existence and check current roles
            const user = await this.userRepository.findById(userIdVO);
            if (!user) {
                return {
                    success: false,
                    message: 'Người dùng không tồn tại',
                    error: 'USER_NOT_FOUND'
                };
            }
            // 4. Get current roles (read-only)
            const currentRoleTypes = user.roleTypes;
            const previousRoleType = currentRoleTypes.length > 0 ? currentRoleTypes[0] : 'NONE';
            // 5. Check if role is already assigned
            if (user.hasRole(request.roleType)) {
                return {
                    success: false,
                    message: `Người dùng đã có vai trò ${request.roleType}`,
                    error: 'ROLE_ALREADY_ASSIGNED'
                };
            }
            // 6. Prevent changing own role
            if (request.userId === request.assignedBy) {
                return {
                    success: false,
                    message: 'Không thể thay đổi vai trò của chính mình',
                    error: 'CANNOT_CHANGE_OWN_ROLE'
                };
            }
            // 7. Validate role type exists in system
            const validRoles = await this.permissionRepository.getAllRoles();
            const normalizedRoles = validRoles.map(role => role.toUpperCase());
            if (!normalizedRoles.includes(request.roleType)) {
                return {
                    success: false,
                    message: `Vai trò ${request.roleType} không tồn tại trong hệ thống`,
                    error: 'ROLE_NOT_FOUND'
                };
            }
            // 8. Assign role via PermissionRepository (source of truth for roles)
            // This updates user_roles table and invalidates cache
            await this.permissionRepository.assignRole(userIdVO, request.roleType, request.assignedBy);
            // 9. Log audit trail
            this.logger.info('Role assigned successfully', {
                userId: request.userId,
                previousRole: previousRoleType,
                newRole: request.roleType,
                assignedBy: request.assignedBy,
                reason: request.reason
            });
            return {
                success: true,
                message: `Vai trò đã được thay đổi từ ${previousRoleType} sang ${request.roleType}. Lý do: ${request.reason}`,
                previousRole: previousRoleType,
                newRole: request.roleType
            };
        }
        catch (error) {
            this.logger.error('Failed to assign role', {
                userId: request.userId,
                roleType: request.roleType,
                assignedBy: request.assignedBy,
                error: error.message
            });
            return {
                success: false,
                message: 'Không thể gán vai trò. Vui lòng thử lại sau.',
                error: 'ASSIGN_ROLE_FAILED'
            };
        }
    }
    validateRequest(request) {
        if (!request.userId || request.userId.trim().length === 0) {
            return 'User ID là bắt buộc';
        }
        if (!request.roleType || request.roleType.trim().length === 0) {
            return 'Role Type là bắt buộc';
        }
        // Validate role type
        const roleTypeUpper = request.roleType.toUpperCase();
        if (!this.VALID_ROLES.includes(roleTypeUpper)) {
            return `Role Type không hợp lệ. Các vai trò hợp lệ: ${this.VALID_ROLES.join(', ')}`;
        }
        // Normalize role type to uppercase
        request.roleType = roleTypeUpper;
        if (!request.assignedBy || request.assignedBy.trim().length === 0) {
            return 'Assigned By (Admin ID) là bắt buộc';
        }
        if (!request.reason || request.reason.trim().length === 0) {
            return 'Lý do gán vai trò là bắt buộc';
        }
        if (request.reason.length < 10) {
            return 'Lý do gán vai trò phải có ít nhất 10 ký tự';
        }
        return null;
    }
}
exports.AssignRoleUseCase = AssignRoleUseCase;
//# sourceMappingURL=AssignRoleUseCase.js.map