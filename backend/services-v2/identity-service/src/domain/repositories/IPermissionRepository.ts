/**
 * IPermissionRepository Interface
 *
 * Repository interface for RBAC permission management.
 * Follows Clean Architecture - interface in domain layer, implementation in infrastructure.
 *
 * Pure RBAC Design:
 * - Query user roles from user_roles table
 * - Query role permissions from role_permissions table
 * - Query user-specific overrides from user_permissions table
 * - Expand permissions with hierarchy from permission_inheritance table
 * - Cache results in Redis for performance
 *
 * @author Hospital Management Team
 * @version 3.0.0 - Pure RBAC
 */

import { UserId } from "../value-objects/UserId";
import { Permission } from "../value-objects/Permission";

/**
 * Permission Repository Interface
 *
 * Responsibilities:
 * - Manage user-role assignments
 * - Manage role-permission mappings
 * - Manage user-specific permission overrides
 * - Query effective permissions with hierarchy expansion
 * - Cache permission data for performance
 */
export interface IPermissionRepository {
  /**
   * Get all roles assigned to a user
   *
   * @param userId - User ID
   * @returns Array of role names (e.g., ['admin', 'doctor'])
   *
   * @example
   * ```typescript
   * const roles = await permissionRepository.getUserRoles(userId);
   * console.log(roles); // ['doctor', 'patient']
   * ```
   */
  getUserRoles(userId: UserId): Promise<string[]>;

  /**
   * Get effective permissions for a user
   *
   * Combines:
   * 1. Permissions from all assigned roles (via role_permissions)
   * 2. User-specific permission overrides (via user_permissions)
   * 3. Expanded permissions via hierarchy (via permission_inheritance)
   *
   * @param userId - User ID
   * @returns Array of permission strings (e.g., ['patients:read', 'patients:write'])
   *
   * @example
   * ```typescript
   * const permissions = await permissionRepository.getUserPermissions(userId);
   * console.log(permissions); // ['patients:read', 'patients:write', 'medical-records:read']
   * ```
   */
  getUserPermissions(userId: UserId): Promise<string[]>;

  /**
   * Get permissions for a specific role
   *
   * @param roleType - Role type (e.g., 'doctor', 'patient')
   * @returns Array of permission strings
   *
   * @example
   * ```typescript
   * const permissions = await permissionRepository.getRolePermissions('doctor');
   * console.log(permissions); // ['patients:read', 'patients:write', 'medical-records:read']
   * ```
   */
  getRolePermissions(roleType: string): Promise<string[]>;

  /**
   * Check if user has a specific permission
   *
   * Checks:
   * 1. Wildcard permission (*)
   * 2. Exact permission match
   * 3. Permission hierarchy (e.g., write implies read)
   *
   * @param userId - User ID
   * @param resource - Resource type (e.g., 'patients', 'medical-records')
   * @param action - Action (e.g., 'read', 'write', 'delete')
   * @returns true if user has permission, false otherwise
   *
   * @example
   * ```typescript
   * const canRead = await permissionRepository.hasPermission(userId, 'patients', 'read');
   * if (canRead) {
   *   // Allow access
   * }
   * ```
   */
  hasPermission(
    userId: UserId,
    resource: string,
    action: string,
  ): Promise<boolean>;

  /**
   * Check if user has a specific permission (by permission string)
   *
   * @param userId - User ID
   * @param permission - Permission string (e.g., 'patients:read')
   * @returns true if user has permission, false otherwise
   *
   * @example
   * ```typescript
   * const canRead = await permissionRepository.hasPermissionString(userId, 'patients:read');
   * ```
   */
  hasPermissionString(userId: UserId, permission: string): Promise<boolean>;

  /**
   * Assign a role to a user
   *
   * Creates entry in user_roles table.
   * Invalidates permission cache for user.
   *
   * @param userId - User ID
   * @param roleType - Role type to assign (e.g., 'doctor', 'patient')
   * @param assignedBy - User ID of person assigning the role
   * @returns void
   * @throws Error if role already assigned or role doesn't exist
   *
   * @example
   * ```typescript
   * await permissionRepository.assignRole(userId, 'doctor', adminUserId);
   * ```
   */
  assignRole(
    userId: UserId,
    roleType: string,
    assignedBy: string,
  ): Promise<void>;

  /**
   * Remove a role from a user
   *
   * Deletes entry from user_roles table.
   * Invalidates permission cache for user.
   *
   * @param userId - User ID
   * @param roleType - Role type to remove
   * @param removedBy - User ID of person removing the role
   * @returns void
   * @throws Error if role not assigned or user has only one role
   *
   * @example
   * ```typescript
   * await permissionRepository.removeRole(userId, 'patient', adminUserId);
   * ```
   */
  removeRole(
    userId: UserId,
    roleType: string,
    removedBy: string,
  ): Promise<void>;

  /**
   * Add user-specific permission override
   *
   * Creates entry in user_permissions table.
   * Use this to grant additional permissions beyond role permissions.
   * Invalidates permission cache for user.
   *
   * @param userId - User ID
   * @param permission - Permission string (e.g., 'patients:read')
   * @param grantedBy - User ID of person granting the permission
   * @returns void
   * @throws Error if permission already granted or invalid format
   *
   * @example
   * ```typescript
   * // Grant specific patient access to a doctor
   * await permissionRepository.addUserPermission(userId, 'patient-123:read', adminUserId);
   * ```
   */
  addUserPermission(
    userId: UserId,
    permission: string,
    grantedBy: string,
  ): Promise<void>;

  /**
   * Remove user-specific permission override
   *
   * Deletes entry from user_permissions table.
   * Invalidates permission cache for user.
   *
   * @param userId - User ID
   * @param permission - Permission string to revoke
   * @param revokedBy - User ID of person revoking the permission
   * @returns void
   * @throws Error if permission not granted
   *
   * @example
   * ```typescript
   * await permissionRepository.removeUserPermission(userId, 'patient-123:read', adminUserId);
   * ```
   */
  removeUserPermission(
    userId: UserId,
    permission: string,
    revokedBy: string,
  ): Promise<void>;

  /**
   * Get all permissions in the system
   *
   * @returns Array of Permission objects
   *
   * @example
   * ```typescript
   * const allPermissions = await permissionRepository.getAllPermissions();
   * console.log(allPermissions.map(p => p.value));
   * // ['patients:read', 'patients:write', 'medical-records:read', ...]
   * ```
   */
  getAllPermissions(): Promise<Permission[]>;

  /**
   * Get all roles in the system
   *
   * @returns Array of role names
   *
   * @example
   * ```typescript
   * const allRoles = await permissionRepository.getAllRoles();
   * console.log(allRoles); // ['admin', 'doctor', 'patient']
   * ```
   */
  getAllRoles(): Promise<string[]>;

  /**
   * Invalidate permission cache for a user
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
   * await permissionRepository.invalidateCache(userId);
   * ```
   */
  invalidateCache(userId: UserId): Promise<void>;

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
   * const expanded = await permissionRepository.expandPermissions(['patients:update']);
   * console.log(expanded); // ['patients:update', 'patients:read']
   * ```
   */
  expandPermissions(permissions: string[]): Promise<string[]>;
}
