"use strict";
/**
 * PermissionService
 *
 * Implementation of IPermissionService.
 * High-level permission checking with caching and business logic.
 *
 * Features:
 * - Permission checking with caching
 * - Ownership checks
 * - Permission expansion with hierarchy
 * - Cache management
 * - Admin bypass
 *
 * @author Hospital Management Team
 * @version 3.0.0 - Pure RBAC
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionService = void 0;
const Permission_1 = require("../../domain/value-objects/Permission");
class PermissionService {
    constructor(permissionRepository, cache) {
        this.permissionRepository = permissionRepository;
        this.cache = cache;
    }
    /**
     * Check if user has a specific permission
     *
     * Overloaded method - supports both formats:
     * - checkPermission(userId, 'patients:read')
     * - checkPermission(userId, 'patients', 'read')
     */
    async checkPermission(userId, permissionOrResource, action) {
        try {
            // Determine permission string
            const permission = action
                ? `${permissionOrResource}:${action}`
                : permissionOrResource;
            // Get effective permissions (cached)
            const permissions = await this.getEffectivePermissions(userId);
            // Check explicit admin permission (recommended approach)
            // Following Microsoft Azure RBAC best practices:
            // "It's recommended that you specify Actions explicitly instead of using the wildcard (*) character"
            if (permissions.includes('system:admin')) {
                return true;
            }
            // Check wildcard (legacy support, deprecated)
            // Kept for backward compatibility but should be avoided
            if (permissions.includes('*')) {
                return true;
            }
            // Check exact match
            if (permissions.includes(permission)) {
                return true;
            }
            // Check resource wildcard (e.g., 'patients:*' matches 'patients:read')
            const [resource] = permission.split(':');
            if (resource && permissions.includes(`${resource}:*`)) {
                return true;
            }
            return false;
        }
        catch (error) {
            console.error('[PermissionService] Error checking permission', error);
            return false;
        }
    }
    /**
     * Check if user has permission with ownership check
     *
     * This method checks if a user can access a resource owned by another user.
     * Returns true if:
     * - User is the resource owner, OR
     * - User has system:admin permission, OR
     * - User has wildcard permission (*) [deprecated], OR
     * - User has ownership-based permission (own_*)
     *
     * Returns false if:
     * - User is NOT the resource owner AND doesn't have admin/wildcard permission
     */
    async checkPermissionWithOwnership(userId, permission, resourceOwnerId) {
        try {
            // Check if user is the resource owner
            if (userId.value === resourceOwnerId) {
                return true;
            }
            // User is NOT the owner - check if they have permission to access others' resources
            const userPermissions = await this.getEffectivePermissions(userId);
            // Check explicit admin permission (recommended approach)
            if (userPermissions.includes('system:admin')) {
                return true;
            }
            // Check wildcard (legacy support, deprecated)
            if (userPermissions.includes('*')) {
                return true;
            }
            // Check if permission is ownership-based (starts with 'own_')
            if (permission.startsWith('own_')) {
                // Ownership permission requires being the owner
                return false;
            }
            // For non-ownership permissions, deny access to others' resources
            // (This enforces ownership check - user can only access their own resources)
            return false;
        }
        catch (error) {
            console.error('[PermissionService] Error checking permission with ownership', error);
            return false;
        }
    }
    /**
     * Check if user has ANY of the specified permissions
     */
    async hasAnyPermission(userId, permissions) {
        try {
            const userPermissions = await this.getEffectivePermissions(userId);
            // Check explicit admin permission (recommended approach)
            if (userPermissions.includes('system:admin')) {
                return true;
            }
            // Check wildcard (legacy support, deprecated)
            if (userPermissions.includes('*')) {
                return true;
            }
            // Check if any permission matches (with wildcard support)
            for (const permission of permissions) {
                // Check exact match
                if (userPermissions.includes(permission)) {
                    return true;
                }
                // Check resource wildcard (e.g., 'patients:*' matches 'patients:read')
                const [resource] = permission.split(':');
                if (resource && userPermissions.includes(`${resource}:*`)) {
                    return true;
                }
            }
            return false;
        }
        catch (error) {
            console.error('[PermissionService] Error checking any permission', error);
            return false;
        }
    }
    /**
     * Check if user has ALL of the specified permissions
     */
    async hasAllPermissions(userId, permissions) {
        try {
            const userPermissions = await this.getEffectivePermissions(userId);
            // Check explicit admin permission (recommended approach)
            if (userPermissions.includes('system:admin')) {
                return true;
            }
            // Check wildcard (legacy support, deprecated)
            if (userPermissions.includes('*')) {
                return true;
            }
            // Check if all permissions match
            return permissions.every((p) => userPermissions.includes(p));
        }
        catch (error) {
            console.error('[PermissionService] Error checking all permissions', error);
            return false;
        }
    }
    /**
     * Get effective permissions for a user (cached)
     */
    async getEffectivePermissions(userId) {
        try {
            // Delegate to repository (which uses cache)
            return await this.permissionRepository.getUserPermissions(userId);
        }
        catch (error) {
            console.error('[PermissionService] Error getting effective permissions', error);
            return [];
        }
    }
    /**
     * Get effective permissions as Permission objects
     */
    async getEffectivePermissionsAsObjects(userId) {
        try {
            const permissions = await this.getEffectivePermissions(userId);
            return permissions.map((p) => Permission_1.Permission.fromString(p));
        }
        catch (error) {
            console.error('[PermissionService] Error getting permissions as objects', error);
            return [];
        }
    }
    /**
     * Invalidate permission cache for a user
     */
    async invalidateCache(userId) {
        await this.cache.invalidate(userId);
    }
    /**
     * Invalidate cache for all users with a specific role
     */
    async invalidateCacheForRole(roleType) {
        await this.cache.invalidateForRole(roleType);
    }
    /**
     * Expand permissions with hierarchy
     */
    async expandPermissions(permissions) {
        return await this.permissionRepository.expandPermissions(permissions);
    }
    /**
     * Check if user is admin (has system:admin or wildcard permission)
     */
    async isAdmin(userId) {
        try {
            const permissions = await this.getEffectivePermissions(userId);
            // Check explicit admin permission first (recommended)
            if (permissions.includes('system:admin')) {
                return true;
            }
            // Check wildcard (legacy support, deprecated)
            return permissions.includes('*');
        }
        catch (error) {
            console.error('[PermissionService] Error checking admin status', error);
            return false;
        }
    }
    /**
     * Get permissions grouped by resource type
     */
    async getPermissionsGroupedByResource(userId) {
        try {
            const permissions = await this.getEffectivePermissionsAsObjects(userId);
            const grouped = new Map();
            for (const permission of permissions) {
                if (permission.isWildcard()) {
                    // Wildcard permission
                    grouped.set('*', ['*']);
                    continue;
                }
                const resource = permission.resourceType;
                const action = permission.action;
                if (!grouped.has(resource)) {
                    grouped.set(resource, []);
                }
                grouped.get(resource).push(action);
            }
            return grouped;
        }
        catch (error) {
            console.error('[PermissionService] Error grouping permissions', error);
            return new Map();
        }
    }
    /**
     * Warm up cache for a user
     */
    async warmUpCache(userId) {
        try {
            // Force load permissions into cache
            await this.getEffectivePermissions(userId);
        }
        catch (error) {
            console.error('[PermissionService] Error warming up cache', error);
        }
    }
    /**
     * Get cache statistics
     */
    async getCacheStats() {
        const stats = this.cache.getStats();
        return {
            hitRate: stats.hitRate,
            missRate: stats.missRate,
            size: stats.l1Size, // Total size is L1 size (L2 is in Redis)
            l1Size: stats.l1Size,
            l2Size: 0, // Redis size not tracked
        };
    }
    /**
     * Get user roles from database (Single Source of Truth)
     * Used by AuthenticationMiddleware to load roles from user_roles table
     *
     * @param userId - User ID
     * @returns Array of role names (e.g., ['admin', 'doctor'])
     */
    async getUserRoles(userId) {
        try {
            return await this.permissionRepository.getUserRoles(userId);
        }
        catch (error) {
            console.error('[PermissionService] Error getting user roles', error);
            return []; // Return empty array on error (fail-safe)
        }
    }
    /**
     * Check if user has a specific role
     */
    async hasRole(userId, role) {
        try {
            const userRoles = await this.getUserRoles(userId);
            return userRoles.includes(role);
        }
        catch (error) {
            console.error('[PermissionService] Error checking role', error);
            return false;
        }
    }
    /**
     * Check if user has ANY of the specified roles
     */
    async hasAnyRole(userId, roles) {
        try {
            const userRoles = await this.getUserRoles(userId);
            return roles.some(role => userRoles.includes(role));
        }
        catch (error) {
            console.error('[PermissionService] Error checking any role', error);
            return false;
        }
    }
    /**
     * Check if user has ALL of the specified roles
     */
    async hasAllRoles(userId, roles) {
        try {
            const userRoles = await this.getUserRoles(userId);
            return roles.every(role => userRoles.includes(role));
        }
        catch (error) {
            console.error('[PermissionService] Error checking all roles', error);
            return false;
        }
    }
}
exports.PermissionService = PermissionService;
//# sourceMappingURL=PermissionService.js.map