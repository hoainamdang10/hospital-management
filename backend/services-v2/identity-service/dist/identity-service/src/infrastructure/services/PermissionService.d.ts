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
import { IPermissionService } from '../../domain/services/IPermissionService';
import { IPermissionRepository } from '../../domain/repositories/IPermissionRepository';
import { UserId } from '../../domain/value-objects/UserId';
import { Permission } from '../../domain/value-objects/Permission';
import { PermissionCache } from '../cache/PermissionCache';
export declare class PermissionService implements IPermissionService {
    private readonly permissionRepository;
    private readonly cache;
    constructor(permissionRepository: IPermissionRepository, cache: PermissionCache);
    /**
     * Check if user has a specific permission
     *
     * Overloaded method - supports both formats:
     * - checkPermission(userId, 'patients:read')
     * - checkPermission(userId, 'patients', 'read')
     */
    checkPermission(userId: UserId, permissionOrResource: string, action?: string): Promise<boolean>;
    /**
     * Check if user has permission with ownership check
     *
     * This method checks if a user can access a resource owned by another user.
     * Returns true if:
     * - User is the resource owner, OR
     * - User has wildcard permission (*), OR
     * - User has ownership-based permission (own_*)
     *
     * Returns false if:
     * - User is NOT the resource owner AND doesn't have wildcard permission
     */
    checkPermissionWithOwnership(userId: UserId, permission: string, resourceOwnerId: string): Promise<boolean>;
    /**
     * Check if user has ANY of the specified permissions
     */
    hasAnyPermission(userId: UserId, permissions: string[]): Promise<boolean>;
    /**
     * Check if user has ALL of the specified permissions
     */
    hasAllPermissions(userId: UserId, permissions: string[]): Promise<boolean>;
    /**
     * Get effective permissions for a user (cached)
     */
    getEffectivePermissions(userId: UserId): Promise<string[]>;
    /**
     * Get effective permissions as Permission objects
     */
    getEffectivePermissionsAsObjects(userId: UserId): Promise<Permission[]>;
    /**
     * Invalidate permission cache for a user
     */
    invalidateCache(userId: UserId): Promise<void>;
    /**
     * Invalidate cache for all users with a specific role
     */
    invalidateCacheForRole(roleType: string): Promise<void>;
    /**
     * Expand permissions with hierarchy
     */
    expandPermissions(permissions: string[]): Promise<string[]>;
    /**
     * Check if user is admin (has wildcard permission)
     */
    isAdmin(userId: UserId): Promise<boolean>;
    /**
     * Get permissions grouped by resource type
     */
    getPermissionsGroupedByResource(userId: UserId): Promise<Map<string, string[]>>;
    /**
     * Warm up cache for a user
     */
    warmUpCache(userId: UserId): Promise<void>;
    /**
     * Get cache statistics
     */
    getCacheStats(): Promise<{
        hitRate: number;
        missRate: number;
        size: number;
        l1Size: number;
        l2Size: number;
    }>;
}
//# sourceMappingURL=PermissionService.d.ts.map