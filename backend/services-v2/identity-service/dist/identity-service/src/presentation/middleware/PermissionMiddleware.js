"use strict";
/**
 * Permission Middleware
 * Express middleware for RBAC permission checking
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, RBAC, HIPAA
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionMiddleware = void 0;
exports.getUserIdFromParams = getUserIdFromParams;
exports.getPatientIdFromParams = getPatientIdFromParams;
exports.getOwnerIdFromBody = getOwnerIdFromBody;
const IPermissionService_1 = require("../../application/services/IPermissionService");
const error_helper_1 = require("../../utils/error-helper");
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
                const userId = req.user.userId;
                // Build permissions to check
                let permissionsToCheck = [];
                if (options.permissions) {
                    permissionsToCheck = options.permissions;
                }
                else if (options.resource && options.action) {
                    permissionsToCheck = [(0, IPermissionService_1.buildPermission)(options.resource, options.action)];
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
                // Check permissions
                let hasPermission;
                if (options.requireAll) {
                    hasPermission = await this.permissionService.hasAllPermissions(userId, permissionsToCheck);
                }
                else {
                    hasPermission = await this.permissionService.hasAnyPermission(userId, permissionsToCheck);
                }
                if (!hasPermission) {
                    this.logger.warn('Permission denied', {
                        userId,
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
                // Check resource ownership if required
                if (options.checkOwnership && options.getResourceOwnerId) {
                    const resourceOwnerId = options.getResourceOwnerId(req);
                    if (resourceOwnerId && resourceOwnerId !== userId) {
                        // Check if user has permission to access others' resources
                        const canAccessOthers = await this.permissionService.hasPermission(userId, permissionsToCheck[0], // Use first permission for ownership check
                        {
                            userId,
                            resourceOwnerId
                        });
                        if (!canAccessOthers) {
                            this.logger.warn('Resource ownership check failed', {
                                userId,
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
                    }
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