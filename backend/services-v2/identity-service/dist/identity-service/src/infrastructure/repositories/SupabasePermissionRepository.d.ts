/**
 * SupabasePermissionRepository
 *
 * Implementation of IPermissionRepository using Supabase.
 * Queries Pure RBAC tables for permission management.
 *
 * Tables used:
 * - auth_schema.permissions (master permissions)
 * - auth_schema.healthcare_roles (role metadata)
 * - auth_schema.role_permissions (role → permission mappings)
 * - auth_schema.user_roles (user → role assignments)
 * - auth_schema.user_permissions (user-specific overrides)
 * - auth_schema.permission_inheritance (permission hierarchy)
 *
 * @author Hospital Management Team
 * @version 3.0.0 - Pure RBAC
 */
import { SupabaseClient } from '@supabase/supabase-js';
import { IPermissionRepository } from '../../domain/repositories/IPermissionRepository';
import { UserId } from '../../domain/value-objects/UserId';
import { Permission } from '../../domain/value-objects/Permission';
import { PermissionCache } from '../cache/PermissionCache';
export declare class SupabasePermissionRepository implements IPermissionRepository {
    private readonly supabaseClient;
    private readonly cache;
    constructor(supabaseClient: SupabaseClient, cache: PermissionCache);
    /**
     * Get all roles assigned to a user
     */
    getUserRoles(userId: UserId): Promise<string[]>;
    /**
     * Get effective permissions for a user
     *
     * Combines:
     * 1. Role permissions
     * 2. User-specific overrides
     * 3. Expanded via hierarchy
     */
    getUserPermissions(userId: UserId): Promise<string[]>;
    /**
     * Get permissions for a specific role
     */
    getRolePermissions(roleType: string): Promise<string[]>;
    /**
     * Check if user has a specific permission
     */
    hasPermission(userId: UserId, resource: string, action: string): Promise<boolean>;
    /**
     * Check if user has a specific permission (by string)
     */
    hasPermissionString(userId: UserId, permission: string): Promise<boolean>;
    /**
     * Assign a role to a user
     */
    assignRole(userId: UserId, roleType: string, assignedBy: string): Promise<void>;
    /**
     * Remove a role from a user
     */
    removeRole(userId: UserId, roleType: string, removedBy: string): Promise<void>;
    /**
     * Add user-specific permission override
     */
    addUserPermission(userId: UserId, permission: string, grantedBy: string): Promise<void>;
    /**
     * Remove user-specific permission override
     */
    removeUserPermission(userId: UserId, permission: string, revokedBy: string): Promise<void>;
    /**
     * Get all permissions in the system
     */
    getAllPermissions(): Promise<Permission[]>;
    /**
     * Get all roles in the system
     */
    getAllRoles(): Promise<string[]>;
    /**
     * Invalidate permission cache for a user
     */
    invalidateCache(userId: UserId): Promise<void>;
    /**
     * Expand permissions with hierarchy
     */
    expandPermissions(permissions: string[]): Promise<string[]>;
    /**
     * Query user permissions from database
     *
     * Pure RBAC: Combines permissions from:
     * 1. User-specific permissions (user_permissions table)
     * 2. Role-based permissions (role_permissions via user_roles)
     *
     * IMPORTANT: role_permissions table uses role_id, not role_name
     */
    private queryUserPermissions;
    /**
     * Log audit event
     */
    private logAudit;
}
//# sourceMappingURL=SupabasePermissionRepository.d.ts.map