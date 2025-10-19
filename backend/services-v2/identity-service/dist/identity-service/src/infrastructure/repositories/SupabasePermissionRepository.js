"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabasePermissionRepository = void 0;
const Permission_1 = require("../../domain/value-objects/Permission");
class SupabasePermissionRepository {
    constructor(supabaseClient, cache) {
        this.supabaseClient = supabaseClient;
        this.cache = cache;
    }
    /**
     * Get all roles assigned to a user
     */
    async getUserRoles(userId) {
        try {
            const { data, error } = await this.supabaseClient
                .schema('auth_schema')
                .from('user_roles')
                .select('role_name')
                .eq('user_id', userId.value);
            if (error) {
                throw new Error(`Failed to get user roles: ${error.message}`);
            }
            return data?.map((row) => row.role_name) || [];
        }
        catch (error) {
            console.error('[SupabasePermissionRepository] Error getting user roles', error);
            throw error;
        }
    }
    /**
     * Get effective permissions for a user
     *
     * Combines:
     * 1. Role permissions
     * 2. User-specific overrides
     * 3. Expanded via hierarchy
     */
    async getUserPermissions(userId) {
        try {
            // Check cache first
            const cached = await this.cache.get(userId);
            if (cached) {
                return cached;
            }
            // Query from database
            const permissions = await this.queryUserPermissions(userId);
            // Expand with hierarchy
            const expanded = await this.expandPermissions(permissions);
            // Cache result
            await this.cache.set(userId, expanded);
            return expanded;
        }
        catch (error) {
            console.error('[SupabasePermissionRepository] Error getting user permissions', error);
            throw error;
        }
    }
    /**
     * Get permissions for a specific role
     */
    async getRolePermissions(roleType) {
        try {
            // Step 1: Get role ID with proper error handling
            const { data: roleData, error: roleError } = await this.supabaseClient
                .schema('auth_schema')
                .from('healthcare_roles')
                .select('id')
                .eq('role_name', roleType.toLowerCase())
                .single();
            if (roleError || !roleData) {
                console.warn(`[SupabasePermissionRepository] Role not found: ${roleType}`, roleError);
                return []; // Return empty array if role doesn't exist
            }
            // Step 2: Get permissions for the role
            const { data, error } = await this.supabaseClient
                .schema('auth_schema')
                .from('role_permissions')
                .select('permission_name')
                .eq('role_id', roleData.id)
                .eq('is_active', true);
            if (error) {
                throw new Error(`Failed to get role permissions: ${error.message}`);
            }
            return data?.map((row) => row.permission_name) || [];
        }
        catch (error) {
            console.error('[SupabasePermissionRepository] Error getting role permissions', error);
            throw error;
        }
    }
    /**
     * Check if user has a specific permission
     */
    async hasPermission(userId, resource, action) {
        const permission = `${resource}:${action}`;
        return this.hasPermissionString(userId, permission);
    }
    /**
     * Check if user has a specific permission (by string)
     */
    async hasPermissionString(userId, permission) {
        try {
            const permissions = await this.getUserPermissions(userId);
            // Check wildcard
            if (permissions.includes('*')) {
                return true;
            }
            // Check exact match
            return permissions.includes(permission);
        }
        catch (error) {
            console.error('[SupabasePermissionRepository] Error checking permission', error);
            return false;
        }
    }
    /**
     * Assign a role to a user
     */
    async assignRole(userId, roleType, assignedBy) {
        try {
            // Verify role exists in healthcare_roles table
            const { data: roleData, error: roleError } = await this.supabaseClient
                .schema('auth_schema')
                .from('healthcare_roles')
                .select('id, role_name')
                .eq('role_name', roleType.toLowerCase())
                .single();
            if (roleError || !roleData) {
                throw new Error(`Role not found: ${roleType}`);
            }
            // Insert user_role with role_name only
            // Note: user_roles table schema has: id, user_id, role_name, assigned_at, assigned_by
            // It does NOT have role_id column
            const { error } = await this.supabaseClient
                .schema('auth_schema')
                .from('user_roles')
                .insert({
                user_id: userId.value,
                role_name: roleType.toLowerCase(),
                assigned_by: assignedBy,
                assigned_at: new Date().toISOString(),
            });
            if (error) {
                if (error.code === '23505') {
                    // Unique constraint violation
                    throw new Error(`User already has role: ${roleType}`);
                }
                throw new Error(`Failed to assign role: ${error.message}`);
            }
            // Invalidate cache
            await this.invalidateCache(userId);
            // Audit log
            await this.logAudit('role_assigned', userId.value, {
                roleType,
                assignedBy,
            });
        }
        catch (error) {
            console.error('[SupabasePermissionRepository] Error assigning role', error);
            throw error;
        }
    }
    /**
     * Remove a role from a user
     */
    async removeRole(userId, roleType, removedBy) {
        try {
            // Check if user has only one role
            const roles = await this.getUserRoles(userId);
            if (roles.length === 1) {
                throw new Error('Cannot remove last role. User must have at least one role.');
            }
            // Delete user_role
            const { error } = await this.supabaseClient
                .schema('auth_schema')
                .from('user_roles')
                .delete()
                .eq('user_id', userId.value)
                .eq('role_name', roleType.toLowerCase());
            if (error) {
                throw new Error(`Failed to remove role: ${error.message}`);
            }
            // Invalidate cache
            await this.invalidateCache(userId);
            // Audit log
            await this.logAudit('role_removed', userId.value, {
                roleType,
                removedBy,
            });
        }
        catch (error) {
            console.error('[SupabasePermissionRepository] Error removing role', error);
            throw error;
        }
    }
    /**
     * Add user-specific permission override
     */
    async addUserPermission(userId, permission, grantedBy) {
        try {
            // Validate permission format
            Permission_1.Permission.fromString(permission);
            // Insert user_permission
            const { error } = await this.supabaseClient
                .schema('auth_schema')
                .from('user_permissions')
                .insert({
                user_id: userId.value,
                permission_name: permission,
                granted_by: grantedBy,
                granted_at: new Date().toISOString(),
            });
            if (error) {
                if (error.code === '23505') {
                    throw new Error(`User already has permission: ${permission}`);
                }
                throw new Error(`Failed to add user permission: ${error.message}`);
            }
            // Invalidate cache
            await this.invalidateCache(userId);
            // Audit log
            await this.logAudit('permission_granted', userId.value, {
                permission,
                grantedBy,
            });
        }
        catch (error) {
            console.error('[SupabasePermissionRepository] Error adding user permission', error);
            throw error;
        }
    }
    /**
     * Remove user-specific permission override
     */
    async removeUserPermission(userId, permission, revokedBy) {
        try {
            // Delete user_permission
            const { error } = await this.supabaseClient
                .schema('auth_schema')
                .from('user_permissions')
                .delete()
                .eq('user_id', userId.value)
                .eq('permission_name', permission);
            if (error) {
                throw new Error(`Failed to remove user permission: ${error.message}`);
            }
            // Invalidate cache
            await this.invalidateCache(userId);
            // Audit log
            await this.logAudit('permission_revoked', userId.value, {
                permission,
                revokedBy,
            });
        }
        catch (error) {
            console.error('[SupabasePermissionRepository] Error removing user permission', error);
            throw error;
        }
    }
    /**
     * Get all permissions in the system
     */
    async getAllPermissions() {
        try {
            const { data, error } = await this.supabaseClient
                .schema('auth_schema')
                .from('permissions')
                .select('permission_name')
                .eq('is_active', true)
                .order('permission_name');
            if (error) {
                throw new Error(`Failed to get all permissions: ${error.message}`);
            }
            return data?.map((row) => Permission_1.Permission.fromString(row.permission_name)) || [];
        }
        catch (error) {
            console.error('[SupabasePermissionRepository] Error getting all permissions', error);
            throw error;
        }
    }
    /**
     * Get all roles in the system
     */
    async getAllRoles() {
        try {
            const { data, error } = await this.supabaseClient
                .schema('auth_schema')
                .from('healthcare_roles')
                .select('role_name')
                .eq('is_active', true)
                .order('role_name');
            if (error) {
                throw new Error(`Failed to get all roles: ${error.message}`);
            }
            return data?.map((row) => row.role_name) || [];
        }
        catch (error) {
            console.error('[SupabasePermissionRepository] Error getting all roles', error);
            throw error;
        }
    }
    /**
     * Invalidate permission cache for a user
     */
    async invalidateCache(userId) {
        await this.cache.invalidate(userId);
    }
    /**
     * Expand permissions with hierarchy
     */
    async expandPermissions(permissions) {
        try {
            // Call database function
            const { data, error } = await this.supabaseClient.rpc('expand_permissions', {
                input_permissions: permissions,
            });
            if (error) {
                console.error('[SupabasePermissionRepository] Error expanding permissions', error);
                return permissions; // Fallback to original permissions
            }
            return data || permissions;
        }
        catch (error) {
            console.error('[SupabasePermissionRepository] Error expanding permissions', error);
            return permissions; // Fallback to original permissions
        }
    }
    // Private helper methods
    /**
     * Query user permissions from database
     *
     * Pure RBAC: Combines permissions from:
     * 1. User-specific permissions (user_permissions table)
     * 2. Role-based permissions (role_permissions via user_roles)
     *
     * IMPORTANT:
     * - user_roles table has: user_id, role_name (NOT role_id)
     * - role_permissions table has: role_id, permission_name
     * - Need to join via healthcare_roles to get role_id from role_name
     */
    async queryUserPermissions(userId) {
        const permissions = new Set();
        try {
            // Step 1: Get user-specific permissions
            const { data: userPerms, error: userPermsError } = await this.supabaseClient
                .schema('auth_schema')
                .from('user_permissions')
                .select('permission_name')
                .eq('user_id', userId.value);
            if (userPermsError) {
                console.warn('[SupabasePermissionRepository] Failed to query user_permissions', userPermsError);
            }
            else if (userPerms) {
                userPerms.forEach(p => permissions.add(p.permission_name));
            }
            // Step 2: Get role-based permissions
            // First get user's role names from user_roles table
            const { data: userRoles, error: rolesError } = await this.supabaseClient
                .schema('auth_schema')
                .from('user_roles')
                .select('role_name')
                .eq('user_id', userId.value);
            if (rolesError) {
                console.warn('[SupabasePermissionRepository] Failed to query user_roles', rolesError);
            }
            else if (userRoles && userRoles.length > 0) {
                // Get role IDs from healthcare_roles table
                const roleNames = userRoles.map(r => r.role_name);
                const { data: roles, error: rolesLookupError } = await this.supabaseClient
                    .schema('auth_schema')
                    .from('healthcare_roles')
                    .select('id')
                    .in('role_name', roleNames);
                if (rolesLookupError) {
                    console.warn('[SupabasePermissionRepository] Failed to lookup role IDs', rolesLookupError);
                }
                else if (roles && roles.length > 0) {
                    // Then get permissions for those role IDs
                    const roleIds = roles.map(r => r.id);
                    const { data: rolePerms, error: rolePermsError } = await this.supabaseClient
                        .schema('auth_schema')
                        .from('role_permissions')
                        .select('permission_name')
                        .in('role_id', roleIds);
                    if (rolePermsError) {
                        console.warn('[SupabasePermissionRepository] Failed to query role_permissions', rolePermsError);
                    }
                    else if (rolePerms) {
                        rolePerms.forEach(p => permissions.add(p.permission_name));
                    }
                }
            }
            return Array.from(permissions);
        }
        catch (error) {
            console.error('[SupabasePermissionRepository] Error querying user permissions', error);
            return []; // Return empty array on error
        }
    }
    /**
     * Log audit event
     */
    async logAudit(action, userId, details) {
        try {
            await this.supabaseClient
                .schema('auth_schema')
                .from('audit_logs')
                .insert({
                action,
                user_id: userId,
                details,
                severity: 'info',
                created_at: new Date().toISOString(),
            });
        }
        catch (error) {
            console.error('[SupabasePermissionRepository] Error logging audit', error);
            // Don't throw - audit logging failure shouldn't break the operation
        }
    }
}
exports.SupabasePermissionRepository = SupabasePermissionRepository;
//# sourceMappingURL=SupabasePermissionRepository.js.map