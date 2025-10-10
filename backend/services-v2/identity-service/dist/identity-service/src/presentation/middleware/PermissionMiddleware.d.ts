/**
 * Permission Middleware
 * Express middleware for RBAC permission checking
 *
 * @author Hospital Management Team
 * @version 3.0.0 - Pure RBAC
 * @compliance Clean Architecture, RBAC, HIPAA
 */
import { Request, Response, NextFunction } from 'express';
import { IPermissionService } from '../../domain/services/IPermissionService';
import { ILogger } from '../../application/services/ILogger';
/**
 * Permission format: "resource:action"
 * Examples: "patients:read", "appointments:write", "*" (admin)
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
    WRITE = "write",
    MANAGE = "manage",
    ADMIN = "admin"
}
/**
 * Helper to build permission string
 */
export declare function buildPermission(resource: ResourceType, action: Action): Permission;
/**
 * Extended Request with user info
 */
export interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        email: string;
        roles: string[];
        permissions: string[];
    };
}
/**
 * Permission check options
 */
export interface PermissionOptions {
    /**
     * Required permissions (user must have at least one)
     */
    permissions?: Permission[];
    /**
     * Resource type and action (alternative to permissions array)
     */
    resource?: ResourceType;
    action?: Action;
    /**
     * Require all permissions (default: false - any permission is enough)
     */
    requireAll?: boolean;
    /**
     * Custom error message
     */
    errorMessage?: string;
    /**
     * Check resource ownership
     */
    checkOwnership?: boolean;
    /**
     * Function to extract resource owner ID from request
     */
    getResourceOwnerId?: (req: AuthenticatedRequest) => string | undefined;
}
/**
 * Permission Middleware Factory
 */
export declare class PermissionMiddleware {
    private permissionService;
    private logger;
    constructor(permissionService: IPermissionService, logger: ILogger);
    /**
     * Create middleware to check permissions
     */
    requirePermission(options: PermissionOptions): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Shorthand: Require any of the permissions
     */
    requireAny(...permissions: Permission[]): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Shorthand: Require all permissions
     */
    requireAll(...permissions: Permission[]): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Shorthand: Require resource access
     */
    requireResource(resource: ResourceType, action: Action): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Shorthand: Require admin permission
     */
    requireAdmin(): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Shorthand: Require ownership or admin
     */
    requireOwnershipOrAdmin(getResourceOwnerId: (req: AuthenticatedRequest) => string | undefined): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
}
/**
 * Helper to extract user ID from route params
 */
export declare function getUserIdFromParams(req: AuthenticatedRequest): string | undefined;
/**
 * Helper to extract patient ID from route params
 */
export declare function getPatientIdFromParams(req: AuthenticatedRequest): string | undefined;
/**
 * Helper to extract resource owner from request body
 */
export declare function getOwnerIdFromBody(req: AuthenticatedRequest): string | undefined;
//# sourceMappingURL=PermissionMiddleware.d.ts.map