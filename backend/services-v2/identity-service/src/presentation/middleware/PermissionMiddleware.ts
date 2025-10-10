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
import { UserId } from '../../domain/value-objects/UserId';
import { getErrorMessage } from '../../utils/error-helper';
import { ILogger } from '../../application/services/ILogger';

/**
 * Permission format: "resource:action"
 * Examples: "patients:read", "appointments:write", "*" (admin)
 */
export type Permission = string;

/**
 * Resource types in the system
 */
export enum ResourceType {
  PATIENTS = 'patients',
  APPOINTMENTS = 'appointments',
  MEDICAL_RECORDS = 'medical_records',
  PRESCRIPTIONS = 'prescriptions',
  USERS = 'users',
  ROLES = 'roles',
  SYSTEM = 'system'
}

/**
 * Action types
 */
export enum Action {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  WRITE = 'write',
  MANAGE = 'manage',
  ADMIN = 'admin'
}

/**
 * Helper to build permission string
 */
export function buildPermission(resource: ResourceType, action: Action): Permission {
  return `${resource}:${action}`;
}

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
export class PermissionMiddleware {
  constructor(
    private permissionService: IPermissionService,
    private logger: ILogger
  ) {}

  /**
   * Create middleware to check permissions
   */
  requirePermission(options: PermissionOptions) {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
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
        const userId = UserId.fromString(req.user.userId);

        // Build permissions to check
        let permissionsToCheck: Permission[] = [];

        if (options.permissions) {
          permissionsToCheck = options.permissions;
        } else if (options.resource && options.action) {
          permissionsToCheck = [buildPermission(options.resource, options.action)];
        } else {
          this.logger.error('Invalid permission options', { options });
          res.status(500).json({
            success: false,
            error: 'Internal Server Error',
            message: 'Invalid permission configuration'
          });
          return;
        }

        // Check permissions
        let hasPermission: boolean;
        if (options.requireAll) {
          hasPermission = await this.permissionService.hasAllPermissions(
            userId,
            permissionsToCheck
          );
        } else {
          hasPermission = await this.permissionService.hasAnyPermission(
            userId,
            permissionsToCheck
          );
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

        // Check resource ownership if required
        if (options.checkOwnership && options.getResourceOwnerId) {
          const resourceOwnerId = options.getResourceOwnerId(req);

          if (resourceOwnerId && resourceOwnerId !== req.user.userId) {
            // Check if user has permission to access others' resources
            const canAccessOthers = await this.permissionService.checkPermissionWithOwnership(
              userId,
              permissionsToCheck[0], // Use first permission for ownership check
              resourceOwnerId
            );

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
          }
        }

        // Permission granted
        next();

      } catch (error) {
        this.logger.error('Permission middleware error', {
          error: getErrorMessage(error),
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
  requireAny(...permissions: Permission[]) {
    return this.requirePermission({ permissions });
  }

  /**
   * Shorthand: Require all permissions
   */
  requireAll(...permissions: Permission[]) {
    return this.requirePermission({ 
      permissions, 
      requireAll: true 
    });
  }

  /**
   * Shorthand: Require resource access
   */
  requireResource(resource: ResourceType, action: Action) {
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
  requireOwnershipOrAdmin(getResourceOwnerId: (req: AuthenticatedRequest) => string | undefined) {
    return this.requirePermission({
      permissions: ['*'], // Admin can access
      checkOwnership: true,
      getResourceOwnerId,
      errorMessage: 'You can only access your own resources or need admin permission'
    });
  }
}

/**
 * Helper to extract user ID from route params
 */
export function getUserIdFromParams(req: AuthenticatedRequest): string | undefined {
  return req.params.userId || req.params.id;
}

/**
 * Helper to extract patient ID from route params
 */
export function getPatientIdFromParams(req: AuthenticatedRequest): string | undefined {
  return req.params.patientId;
}

/**
 * Helper to extract resource owner from request body
 */
export function getOwnerIdFromBody(req: AuthenticatedRequest): string | undefined {
  return req.body.userId || req.body.ownerId;
}

