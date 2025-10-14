"use strict";
/**
 * Permission Middleware
 * Express middleware for RBAC permission checking
 *
 * @author Hospital Management Team
 * @version 3.0.0 - Pure RBAC
 * @compliance Clean Architecture, RBAC, HIPAA
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionMiddleware = exports.Action = exports.ResourceType = void 0;
exports.buildPermission = buildPermission;
exports.getUserIdFromParams = getUserIdFromParams;
exports.getPatientIdFromParams = getPatientIdFromParams;
exports.getOwnerIdFromBody = getOwnerIdFromBody;
const UserId_1 = require("../../domain/value-objects/UserId");
const error_helper_1 = require("../../utils/error-helper");
/**
 * Resource types in the system
 */
var ResourceType;
(function (ResourceType) {
    ResourceType["PATIENTS"] = "patients";
    ResourceType["APPOINTMENTS"] = "appointments";
    ResourceType["MEDICAL_RECORDS"] = "medical_records";
    ResourceType["PRESCRIPTIONS"] = "prescriptions";
    ResourceType["USERS"] = "users";
    ResourceType["ROLES"] = "roles";
    ResourceType["SYSTEM"] = "system";
})(ResourceType || (exports.ResourceType = ResourceType = {}));
/**
 * Action types
 */
var Action;
(function (Action) {
    Action["CREATE"] = "create";
    Action["READ"] = "read";
    Action["UPDATE"] = "update";
    Action["DELETE"] = "delete";
    Action["WRITE"] = "write";
    Action["MANAGE"] = "manage";
    Action["ADMIN"] = "admin";
})(Action || (exports.Action = Action = {}));
/**
 * Helper to build permission string
 */
function buildPermission(resource, action) {
    return `${resource}:${action}`;
}
/**
 * Permission Middleware Factory
 */
class PermissionMiddleware {
    constructor(permissionService, logger) {
        this.permissionService = permissionService;
        this.logger = logger;
    }
    /**
     * Create middleware to check permissions
     */
    requirePermission(options) {
        return async (req, res, next) => {
            try {
                // Check if user is authenticated
                if (!req.user || !req.user.userId) {
                    res.status(401).json({
                        success: false,
                        error: 'Unauthorized',
                        message: 'Authentication required'
                    });
                    return;
                }
                // Convert string userId to UserId value object
                const userId = UserId_1.UserId.fromString(req.user.userId);
                // Build permissions to check
                let permissionsToCheck = [];
                if (options.permissions) {
                    permissionsToCheck = options.permissions;
                }
                else if (options.resource && options.action) {
                    permissionsToCheck = [buildPermission(options.resource, options.action)];
                }
                else {
                    this.logger.error('Invalid permission options', { options });
                    res.status(500).json({
                        success: false,
                        error: 'Internal Server Error',
                        message: 'Invalid permission configuration'
                    });
                    return;
                }
                // Check resource ownership FIRST (if required)
                // This allows users to access their own resources even without explicit permissions
                if (options.checkOwnership && options.getResourceOwnerId) {
                    const resourceOwnerId = options.getResourceOwnerId(req);
                    // If user is accessing their own resource, allow it
                    if (resourceOwnerId && resourceOwnerId === req.user.userId) {
                        // User is accessing their own resource - allow it
                        next();
                        return;
                    }
                    // User is trying to access someone else's resource
                    // Check if they have permission to do so (admin, etc.)
                    const canAccessOthers = await this.permissionService.checkPermissionWithOwnership(userId, permissionsToCheck[0], // Use first permission for ownership check
                    resourceOwnerId || '');
                    if (!canAccessOthers) {
                        this.logger.warn('Resource ownership check failed', {
                            userId: userId.value,
                            resourceOwnerId,
                            path: req.path
                        });
                        res.status(403).json({
                            success: false,
                            error: 'Forbidden',
                            message: 'You can only access your own resources'
                        });
                        return;
                    }
                    // User has permission to access others' resources (admin)
                    // Continue to next middleware
                    next();
                    return;
                }
                // No ownership check required - check permissions normally
                let hasPermission;
                if (options.requireAll) {
                    hasPermission = await this.permissionService.hasAllPermissions(userId, permissionsToCheck);
                }
                else {
                    hasPermission = await this.permissionService.hasAnyPermission(userId, permissionsToCheck);
                }
                if (!hasPermission) {
                    this.logger.warn('Permission denied', {
                        userId: userId.value,
                        requiredPermissions: permissionsToCheck,
                        userPermissions: req.user.permissions,
                        path: req.path,
                        method: req.method
                    });
                    res.status(403).json({
                        success: false,
                        error: 'Forbidden',
                        message: options.errorMessage || 'You do not have permission to perform this action',
                        requiredPermissions: permissionsToCheck
                    });
                    return;
                }
                // Permission granted
                next();
            }
            catch (error) {
                this.logger.error('Permission middleware error', {
                    error: (0, error_helper_1.getErrorMessage)(error),
                    path: req.path,
                    method: req.method
                });
                res.status(500).json({
                    success: false,
                    error: 'Internal Server Error',
                    message: 'Failed to check permissions'
                });
            }
        };
    }
    /**
     * Shorthand: Require any of the permissions
     */
    requireAny(...permissions) {
        return this.requirePermission({ permissions });
    }
    /**
     * Shorthand: Require all permissions
     */
    requireAll(...permissions) {
        return this.requirePermission({
            permissions,
            requireAll: true
        });
    }
    /**
     * Shorthand: Require resource access
     */
    requireResource(resource, action) {
        return this.requirePermission({ resource, action });
    }
    /**
     * Shorthand: Require admin permission
     */
    requireAdmin() {
        return this.requirePermission({
            permissions: ['*'],
            errorMessage: 'Admin access required'
        });
    }
    /**
     * Shorthand: Require ownership or admin
     */
    requireOwnershipOrAdmin(getResourceOwnerId) {
        return this.requirePermission({
            permissions: ['*'], // Admin can access
            checkOwnership: true,
            getResourceOwnerId,
            errorMessage: 'You can only access your own resources or need admin permission'
        });
    }
}
exports.PermissionMiddleware = PermissionMiddleware;
/**
 * Helper to extract user ID from route params
 */
function getUserIdFromParams(req) {
    return req.params.userId || req.params.id;
}
/**
 * Helper to extract patient ID from route params
 */
function getPatientIdFromParams(req) {
    return req.params.patientId;
}
/**
 * Helper to extract resource owner from request body
 */
function getOwnerIdFromBody(req) {
    return req.body.userId || req.body.ownerId;
}
//# sourceMappingURL=PermissionMiddleware.js.map