"use strict";
/**
 * Role Assignment Helper for Integration Tests
 *
 * Handles role and permission assignment for test users
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TEST_USER_ROLES = void 0;
exports.assignRoleToUser = assignRoleToUser;
exports.assignPermissionsToUser = assignPermissionsToUser;
exports.setupTestUserRoles = setupTestUserRoles;
exports.cleanupUserRoles = cleanupUserRoles;
exports.getUserRoles = getUserRoles;
exports.getUserPermissions = getUserPermissions;
/**
 * Predefined test user roles
 */
exports.TEST_USER_ROLES = [
    {
        email: 'admin@test.com',
        role: 'ADMIN',
        permissions: [
            'patient:create',
            'patient:read',
            'patient:update',
            'patient:delete',
            'patient:deactivate',
            'patient:merge',
            'user:create',
            'user:read',
            'user:update',
            'user:delete',
            'system:admin'
        ]
    },
    {
        email: 'receptionist@test.com',
        role: 'RECEPTIONIST',
        permissions: [
            'patient:create',
            'patient:read',
            'patient:update',
            'appointment:create',
            'appointment:read',
            'appointment:update'
        ]
    },
    {
        email: 'doctor@test.com',
        role: 'DOCTOR',
        permissions: [
            'patient:read',
            'medical-record:create',
            'medical-record:read',
            'medical-record:update',
            'prescription:create',
            'prescription:read'
        ]
    },
    {
        email: 'nurse@test.com',
        role: 'NURSE',
        permissions: [
            'patient:read',
            'medical-record:read',
            'vital-signs:create',
            'vital-signs:read'
        ]
    },
    {
        email: 'patient@test.com',
        role: 'PATIENT',
        permissions: [
            'patient:read:own',
            'medical-record:read:own',
            'appointment:create:own',
            'appointment:read:own'
        ]
    }
];
/**
 * Assign role to user in database
 */
async function assignRoleToUser(supabaseClient, userId, role) {
    try {
        // Check if user_roles table exists
        const { data: existingRole, error: checkError } = await supabaseClient
            .from('user_roles')
            .select('*')
            .eq('user_id', userId)
            .eq('role_name', role)
            .single();
        if (checkError && checkError.code !== 'PGRST116') {
            // PGRST116 = no rows returned, which is fine
            console.warn(`  Error checking existing role: ${checkError.message}`);
        }
        if (existingRole) {
            console.log(`ℹ  User ${userId} already has role ${role}`);
            return;
        }
        // Insert role
        const { error: insertError } = await supabaseClient
            .from('user_roles')
            .insert({
            user_id: userId,
            role_name: role,
            assigned_at: new Date().toISOString(),
            assigned_by: 'system-test'
        });
        if (insertError) {
            console.warn(`  Could not assign role ${role} to user ${userId}: ${insertError.message}`);
        }
        else {
            console.log(` Assigned role ${role} to user ${userId}`);
        }
    }
    catch (error) {
        console.warn(`  Error assigning role: ${error}`);
    }
}
/**
 * Assign permissions to user in database
 */
async function assignPermissionsToUser(supabaseClient, userId, permissions) {
    try {
        for (const permission of permissions) {
            // Check if permission already exists
            const { data: existingPermission, error: checkError } = await supabaseClient
                .from('user_permissions')
                .select('*')
                .eq('user_id', userId)
                .eq('permission_name', permission)
                .single();
            if (checkError && checkError.code !== 'PGRST116') {
                console.warn(`  Error checking existing permission: ${checkError.message}`);
            }
            if (existingPermission) {
                continue;
            }
            // Insert permission
            const { error: insertError } = await supabaseClient
                .from('user_permissions')
                .insert({
                user_id: userId,
                permission_name: permission,
                granted_at: new Date().toISOString(),
                granted_by: 'system-test'
            });
            if (insertError) {
                console.warn(`  Could not assign permission ${permission}: ${insertError.message}`);
            }
        }
        console.log(` Assigned ${permissions.length} permissions to user ${userId}`);
    }
    catch (error) {
        console.warn(`  Error assigning permissions: ${error}`);
    }
}
/**
 * Setup roles and permissions for test user
 */
async function setupTestUserRoles(supabaseClient, userId, email) {
    const userRole = exports.TEST_USER_ROLES.find(r => r.email === email);
    if (!userRole) {
        console.warn(`  No role configuration found for ${email}`);
        return;
    }
    // Assign role
    await assignRoleToUser(supabaseClient, userId, userRole.role);
    // Assign permissions
    await assignPermissionsToUser(supabaseClient, userId, userRole.permissions);
}
/**
 * Remove all roles and permissions for user
 */
async function cleanupUserRoles(supabaseClient, userId) {
    try {
        // Delete roles
        const { error: rolesError } = await supabaseClient
            .from('user_roles')
            .delete()
            .eq('user_id', userId);
        if (rolesError) {
            console.warn(`  Could not delete roles: ${rolesError.message}`);
        }
        // Delete permissions
        const { error: permissionsError } = await supabaseClient
            .from('user_permissions')
            .delete()
            .eq('user_id', userId);
        if (permissionsError) {
            console.warn(`  Could not delete permissions: ${permissionsError.message}`);
        }
        console.log(` Cleaned up roles and permissions for user ${userId}`);
    }
    catch (error) {
        console.warn(`  Error cleaning up user roles: ${error}`);
    }
}
/**
 * Get user's roles from database
 */
async function getUserRoles(supabaseClient, userId) {
    try {
        const { data, error } = await supabaseClient
            .from('user_roles')
            .select('role_name')
            .eq('user_id', userId);
        if (error) {
            console.warn(`  Could not get user roles: ${error.message}`);
            return [];
        }
        return data?.map(r => r.role_name) || [];
    }
    catch (error) {
        console.warn(`  Error getting user roles: ${error}`);
        return [];
    }
}
/**
 * Get user's permissions from database
 */
async function getUserPermissions(supabaseClient, userId) {
    try {
        const { data, error } = await supabaseClient
            .from('user_permissions')
            .select('permission_name')
            .eq('user_id', userId);
        if (error) {
            console.warn(`  Could not get user permissions: ${error.message}`);
            return [];
        }
        return data?.map(p => p.permission_name) || [];
    }
    catch (error) {
        console.warn(`  Error getting user permissions: ${error}`);
        return [];
    }
}
//# sourceMappingURL=roleAssignment.js.map