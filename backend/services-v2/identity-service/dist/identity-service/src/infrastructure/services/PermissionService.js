"use strict";
/**
 * Permission Service Implementation
 * Implements RBAC permission checking with caching
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, RBAC, HIPAA
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionService = void 0;
const IPermissionService_1 = require("../../application/services/IPermissionService");
const UserId_1 = require("../../domain/value-objects/UserId");
const error_helper_1 = require("../../utils/error-helper");
/**
 * Permission Service
 * Handles permission checking with caching and conditional logic
 */
class PermissionService {
    constructor(userRepository, cacheService, logger) {
        this.userRepository = userRepository;
        this.cacheService = cacheService;
        this.logger = logger;
        this.CACHE_TTL = 300; // 5 minutes
        this.CACHE_PREFIX = 'permissions:';
    }
    /**
     * Check if user has specific permission
     */
    async hasPermission(userId, permission, context) {
        try {
            const userPermissions = await this.getUserPermissions(userId);
            // Check if any user permission matches required permission
            const hasPermission = userPermissions.some(userPerm => (0, IPermissionService_1.matchesPermission)(userPerm, permission));
            // Apply conditional logic if context provided
            if (hasPermission && context) {
                return await this.checkConditionalPermission(userId, permission, context);
            }
            return hasPermission;
        }
        catch (error) {
            this.logger.error('Permission check failed', {
                userId,
                permission,
                error: (0, error_helper_1.getErrorMessage)(error)
            });
            return false;
        }
    }
    /**
     * Check if user has any of the permissions
     */
    async hasAnyPermission(userId, permissions, context) {
        for (const permission of permissions) {
            if (await this.hasPermission(userId, permission, context)) {
                return true;
            }
        }
        return false;
    }
    /**
     * Check if user has all permissions
     */
    async hasAllPermissions(userId, permissions, context) {
        for (const permission of permissions) {
            if (!(await this.hasPermission(userId, permission, context))) {
                return false;
            }
        }
        return true;
    }
    /**
     * Get all permissions for user (with caching)
     */
    async getUserPermissions(userId) {
        try {
            // Try cache first
            const cacheKey = `${this.CACHE_PREFIX}${userId}`;
            if (this.cacheService) {
                const cached = await this.cacheService.get(cacheKey);
                if (cached) {
                    return cached;
                }
            }
            // Load from repository
            const userIdVO = UserId_1.UserId.fromString(userId);
            const permissions = await this.userRepository.getUserPermissions(userIdVO);
            // Cache for future use
            if (this.cacheService) {
                await this.cacheService.set(cacheKey, permissions, { ttl: this.CACHE_TTL });
            }
            return permissions;
        }
        catch (error) {
            this.logger.error('Failed to get user permissions', {
                userId,
                error: (0, error_helper_1.getErrorMessage)(error)
            });
            return [];
        }
    }
    /**
     * Check permission with detailed result
     */
    async checkPermission(userId, permission, context) {
        const userPermissions = await this.getUserPermissions(userId);
        const allowed = await this.hasPermission(userId, permission, context);
        let reason;
        if (!allowed) {
            if (userPermissions.length === 0) {
                reason = 'User has no permissions';
            }
            else if (context?.resourceOwnerId && context.resourceOwnerId !== userId) {
                reason = 'User does not own this resource';
            }
            else {
                reason = `Missing required permission: ${permission}`;
            }
        }
        return {
            allowed,
            reason,
            requiredPermissions: [permission],
            userPermissions
        };
    }
    /**
     * Check if user can access resource
     */
    async canAccessResource(userId, resourceType, action, resourceId) {
        const permission = `${resourceType}:${action}`;
        const context = {
            userId,
            resourceId
        };
        return await this.hasPermission(userId, permission, context);
    }
    /**
     * Invalidate permission cache for user
     */
    async invalidateCache(userId) {
        try {
            if (this.cacheService) {
                const cacheKey = `${this.CACHE_PREFIX}${userId}`;
                await this.cacheService.delete(cacheKey);
                this.logger.info('Permission cache invalidated', { userId });
            }
        }
        catch (error) {
            this.logger.error('Failed to invalidate permission cache', {
                userId,
                error: (0, error_helper_1.getErrorMessage)(error)
            });
        }
    }
    /**
     * Check conditional permissions based on context
     * Examples:
     * - Patient can only read their own medical records
     * - Doctor can only access patients in their department
     */
    async checkConditionalPermission(userId, permission, context) {
        // Check if user is accessing their own resource
        if (context.resourceOwnerId) {
            // Allow if user owns the resource
            if (context.resourceOwnerId === userId) {
                return true;
            }
            // Check if permission allows accessing others' resources
            const userPermissions = await this.getUserPermissions(userId);
            // Admin can access everything
            if (userPermissions.includes('*')) {
                return true;
            }
            // Check for specific "others" permission
            // e.g., "patients:read_others" allows reading other patients' data
            const othersPermission = permission.replace(':', '_others:');
            return userPermissions.some(p => (0, IPermissionService_1.matchesPermission)(p, othersPermission));
        }
        // Additional conditional checks can be added here
        // e.g., department-based access, time-based access, etc.
        return true;
    }
}
exports.PermissionService = PermissionService;
//# sourceMappingURL=PermissionService.js.map