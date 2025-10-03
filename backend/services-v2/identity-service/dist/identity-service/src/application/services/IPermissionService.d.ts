/**
 * Permission Service Interface - Application Layer
 * Defines contract for RBAC permission checking
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, RBAC, HIPAA
 */
/**
 * Permission format: "resource:action"
 * Examples:
 * - "patients:read"
 * - "appointments:write"
 * - "medical_records:read"
 * - "*" (admin - all permissions)
 */
export type Permission = string;
/**
 * Resource types in the system
 */
export declare enum ResourceType {
    PATIENTS = "patients",
    APPOINTMENTS = "appointments",
    MEDICAL_RECORDS = "medical_records",
    PRESCRIPTIONS = "prescriptions",
    USERS = "users",
    ROLES = "roles",
    SYSTEM = "system"
}
/**
 * Action types
 */
export declare enum Action {
    CREATE = "create",
    READ = "read",
    UPDATE = "update",
    DELETE = "delete",
    WRITE = "write",// Alias for create + update
    MANAGE = "manage",// All actions on resource
    ADMIN = "admin"
}
/**
 * Permission check result
 */
export interface PermissionCheckResult {
    allowed: boolean;
    reason?: string;
    requiredPermissions: Permission[];
    userPermissions: Permission[];
}
/**
 * Permission context for conditional checks
 */
export interface PermissionContext {
    userId: string;
    resourceId?: string;
    resourceOwnerId?: string;
    metadata?: Record<string, any>;
}
/**
 * Permission Service Interface
 */
export interface IPermissionService {
    /**
     * Check if user has specific permission
     */
    hasPermission(userId: string, permission: Permission, context?: PermissionContext): Promise<boolean>;
    /**
     * Check if user has any of the permissions
     */
    hasAnyPermission(userId: string, permissions: Permission[], context?: PermissionContext): Promise<boolean>;
    /**
     * Check if user has all permissions
     */
    hasAllPermissions(userId: string, permissions: Permission[], context?: PermissionContext): Promise<boolean>;
    /**
     * Get all permissions for user
     */
    getUserPermissions(userId: string): Promise<Permission[]>;
    /**
     * Check permission with detailed result
     */
    checkPermission(userId: string, permission: Permission, context?: PermissionContext): Promise<PermissionCheckResult>;
    /**
     * Check if user can access resource
     */
    canAccessResource(userId: string, resourceType: ResourceType, action: Action, resourceId?: string): Promise<boolean>;
    /**
     * Invalidate permission cache for user
     */
    invalidateCache(userId: string): Promise<void>;
}
/**
 * Helper to build permission string
 */
export declare function buildPermission(resource: ResourceType, action: Action): Permission;
/**
 * Helper to parse permission string
 */
export declare function parsePermission(permission: Permission): {
    resource: string;
    action: string;
} | null;
/**
 * Check if permission matches pattern
 * Supports wildcards: "*", "resource:*", "*:action"
 */
export declare function matchesPermission(userPermission: Permission, requiredPermission: Permission): boolean;
//# sourceMappingURL=IPermissionService.d.ts.map