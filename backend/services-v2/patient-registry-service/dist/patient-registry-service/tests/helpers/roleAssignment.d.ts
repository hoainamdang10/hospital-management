/**
 * Role Assignment Helper for Integration Tests
 *
 * Handles role and permission assignment for test users
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { SupabaseClient } from '@supabase/supabase-js';
/**
 * Test User Role Configuration
 */
export interface TestUserRole {
    email: string;
    role: 'ADMIN' | 'RECEPTIONIST' | 'DOCTOR' | 'NURSE' | 'PATIENT';
    permissions: string[];
}
/**
 * Predefined test user roles
 */
export declare const TEST_USER_ROLES: TestUserRole[];
/**
 * Assign role to user in database
 */
export declare function assignRoleToUser(supabaseClient: SupabaseClient, userId: string, role: string): Promise<void>;
/**
 * Assign permissions to user in database
 */
export declare function assignPermissionsToUser(supabaseClient: SupabaseClient, userId: string, permissions: string[]): Promise<void>;
/**
 * Setup roles and permissions for test user
 */
export declare function setupTestUserRoles(supabaseClient: SupabaseClient, userId: string, email: string): Promise<void>;
/**
 * Remove all roles and permissions for user
 */
export declare function cleanupUserRoles(supabaseClient: SupabaseClient, userId: string): Promise<void>;
/**
 * Get user's roles from database
 */
export declare function getUserRoles(supabaseClient: SupabaseClient, userId: string): Promise<string[]>;
/**
 * Get user's permissions from database
 */
export declare function getUserPermissions(supabaseClient: SupabaseClient, userId: string): Promise<string[]>;
//# sourceMappingURL=roleAssignment.d.ts.map