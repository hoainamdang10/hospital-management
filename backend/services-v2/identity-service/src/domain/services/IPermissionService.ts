/**
 * IPermissionService Interface
 * 
 * Domain service interface for permission checking and management.
 * Follows Clean Architecture - interface in domain layer, implementation in infrastructure.
 * 
 * Pure RBAC Design:
 * - High-level permission checking with caching
 * - Permission expansion with hierarchy
 * - Cache management
 * - Business logic for permission decisions
 * 
 * Difference from IPermissionRepository:
 * - Repository: Low-level data access (CRUD operations)
 * - Service: High-level business logic (permission decisions, caching strategy)
 * 
 * @author Hospital Management Team
 * @version 3.0.0 - Pure RBAC
 */

import { UserId } from '../value-objects/UserId';
import { Permission } from '../value-objects/Permission';

/**
 * Permission Service Interface
 * 
 * Responsibilities:
 * - High-level permission checking
 * - Permission caching strategy
 * - Permission expansion with hierarchy
 * - Business rules for permission decisions
 * - Ownership checks (e.g., patient can access own records)
 */
export interface IPermissionService {
  /**
   * Check if user has a specific permission
   * 
   * Features:
   * - Checks cache first (L1 memory + L2 Redis)
   * - Falls back to database if cache miss
   * - Handles wildcard permissions (*)
   * - Handles permission hierarchy (write implies read)
   * - Handles ownership checks (own_* permissions)
   * 
   * @param userId - User ID
   * @param permission - Permission string (e.g., 'patients:read')
   * @returns true if user has permission, false otherwise
   * 
   * @example
   * ```typescript
   * const canRead = await permissionService.checkPermission(userId, 'patients:read');
   * if (canRead) {
   *   // Allow access
   * }
   * ```
   */
  checkPermission(userId: UserId, permission: string): Promise<boolean>;

  /**
   * Check if user has permission with resource and action
   * 
   * @param userId - User ID
   * @param resource - Resource type (e.g., 'patients', 'medical-records')
   * @param action - Action (e.g., 'read', 'write', 'delete')
   * @returns true if user has permission, false otherwise
   * 
   * @example
   * ```typescript
   * const canWrite = await permissionService.checkPermission(userId, 'patients', 'write');
   * ```
   */
  checkPermission(userId: UserId, resource: string, action: string): Promise<boolean>;

  /**
   * Check if user has permission with ownership check
   * 
   * For permissions like 'own_profile:read', 'own_appointments:read'
   * Checks if the resource belongs to the user.
   * 
   * @param userId - User ID
   * @param permission - Permission string (e.g., 'own_profile:read')
   * @param resourceOwnerId - Owner ID of the resource
   * @returns true if user has permission and owns resource, false otherwise
   * 
   * @example
   * ```typescript
   * // Patient trying to access their own profile
   * const canAccess = await permissionService.checkPermissionWithOwnership(
   *   patientUserId,
   *   'own_profile:read',
   *   patientUserId
   * );
   * // Returns true if patientUserId === resourceOwnerId
   * ```
   */
  checkPermissionWithOwnership(
    userId: UserId,
    permission: string,
    resourceOwnerId: string
  ): Promise<boolean>;

  /**
   * Check if user has ANY of the specified permissions
   * 
   * @param userId - User ID
   * @param permissions - Array of permission strings
   * @returns true if user has at least one permission, false otherwise
   * 
   * @example
   * ```typescript
   * const canAccess = await permissionService.hasAnyPermission(userId, [
   *   'patients:read',
   *   'patients:write'
   * ]);
   * ```
   */
  hasAnyPermission(userId: UserId, permissions: string[]): Promise<boolean>;

  /**
   * Check if user has ALL of the specified permissions
   * 
   * @param userId - User ID
   * @param permissions - Array of permission strings
   * @returns true if user has all permissions, false otherwise
   * 
   * @example
   * ```typescript
   * const canManage = await permissionService.hasAllPermissions(userId, [
   *   'patients:read',
   *   'patients:write',
   *   'patients:delete'
   * ]);
   * ```
   */
  hasAllPermissions(userId: UserId, permissions: string[]): Promise<boolean>;

  /**
   * Get effective permissions for a user (cached)
   * 
   * Returns all permissions user has, including:
   * - Role permissions
   * - User-specific overrides
   * - Expanded permissions via hierarchy
   * 
   * Results are cached in L1 (memory) + L2 (Redis).
   * 
   * @param userId - User ID
   * @returns Array of permission strings
   * 
   * @example
   * ```typescript
   * const permissions = await permissionService.getEffectivePermissions(userId);
   * console.log(permissions);
   * // ['patients:read', 'patients:write', 'medical-records:read', ...]
   * ```
   */
  getEffectivePermissions(userId: UserId): Promise<string[]>;

  /**
   * Get effective permissions as Permission objects
   * 
   * @param userId - User ID
   * @returns Array of Permission objects
   * 
   * @example
   * ```typescript
   * const permissions = await permissionService.getEffectivePermissionsAsObjects(userId);
   * permissions.forEach(p => {
   *   console.log(p.resourceType, p.action);
   * });
   * ```
   */
  getEffectivePermissionsAsObjects(userId: UserId): Promise<Permission[]>;

  /**
   * Invalidate permission cache for a user
   * 
   * Clears:
   * - L1 cache (in-memory)
   * - L2 cache (Redis)
   * - Broadcasts invalidation to other instances via Pub/Sub
   * 
   * Call this after:
   * - Assigning/removing roles
   * - Adding/removing user permissions
   * - Changing role permissions
   * 
   * @param userId - User ID
   * @returns void
   * 
   * @example
   * ```typescript
   * await permissionService.invalidateCache(userId);
   * ```
   */
  invalidateCache(userId: UserId): Promise<void>;

  /**
   * Invalidate cache for all users with a specific role
   * 
   * Use this when role permissions are changed.
   * 
   * @param roleType - Role type (e.g., 'doctor', 'nurse')
   * @returns void
   * 
   * @example
   * ```typescript
   * // After changing doctor role permissions
   * await permissionService.invalidateCacheForRole('doctor');
   * ```
   */
  invalidateCacheForRole(roleType: string): Promise<void>;

  /**
   * Expand permissions with hierarchy
   * 
   * Example: 'patients:update' → ['patients:update', 'patients:read']
   * 
   * @param permissions - Array of permission strings
   * @returns Expanded array of permission strings
   * 
   * @example
   * ```typescript
   * const expanded = await permissionService.expandPermissions(['patients:update']);
   * console.log(expanded); // ['patients:update', 'patients:read']
   * ```
   */
  expandPermissions(permissions: string[]): Promise<string[]>;

  /**
   * Check if user is admin (has wildcard permission)
   * 
   * @param userId - User ID
   * @returns true if user is admin, false otherwise
   * 
   * @example
   * ```typescript
   * const isAdmin = await permissionService.isAdmin(userId);
   * if (isAdmin) {
   *   // Bypass permission checks
   * }
   * ```
   */
  isAdmin(userId: UserId): Promise<boolean>;

  /**
   * Get permissions grouped by resource type
   * 
   * @param userId - User ID
   * @returns Map of resource type to actions
   * 
   * @example
   * ```typescript
   * const grouped = await permissionService.getPermissionsGroupedByResource(userId);
   * console.log(grouped);
   * // {
   * //   'patients': ['read', 'write'],
   * //   'medical-records': ['read'],
   * //   'appointments': ['read', 'write', 'delete']
   * // }
   * ```
   */
  getPermissionsGroupedByResource(userId: UserId): Promise<Map<string, string[]>>;

  /**
   * Warm up cache for a user
   * 
   * Pre-loads permissions into cache.
   * Useful after login or role assignment.
   * 
   * @param userId - User ID
   * @returns void
   * 
   * @example
   * ```typescript
   * // After successful login
   * await permissionService.warmUpCache(userId);
   * ```
   */
  warmUpCache(userId: UserId): Promise<void>;

  /**
   * Get cache statistics
   *
   * @returns Cache statistics (hit rate, miss rate, size)
   *
   * @example
   * ```typescript
   * const stats = await permissionService.getCacheStats();
   * console.log(stats);
   * // { hitRate: 0.95, missRate: 0.05, size: 1234 }
   * ```
   */
  getCacheStats(): Promise<{
    hitRate: number;
    missRate: number;
    size: number;
    l1Size: number;
    l2Size: number;
  }>;

  /**
   * Check if user has a specific role
   *
   * @param userId - User ID
   * @param role - Role type (e.g., 'doctor', 'admin')
   * @returns true if user has the role, false otherwise
   */
  hasRole(userId: UserId, role: string): Promise<boolean>;

  /**
   * Check if user has ANY of the specified roles
   *
   * @param userId - User ID
   * @param roles - Array of role types
   * @returns true if user has at least one role, false otherwise
   */
  hasAnyRole(userId: UserId, roles: string[]): Promise<boolean>;

  /**
   * Check if user has ALL of the specified roles
   *
   * @param userId - User ID
   * @param roles - Array of role types
   * @returns true if user has all roles, false otherwise
   */
  hasAllRoles(userId: UserId, roles: string[]): Promise<boolean>;
}

