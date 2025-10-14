/**
 * Gateway Authentication Middleware
 * For downstream services - trusts headers from API Gateway
 * 
 * SECURITY: This middleware assumes requests come through API Gateway
 * Direct requests to services should be blocked at network level
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { Request, Response, NextFunction } from 'express';

export interface GatewayUser {
  userId: string;
  email: string;
  roles: string[];
  permissions: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: GatewayUser;
      correlationId?: string;
    }
  }
}

export interface GatewayAuthMiddlewareConfig {
  requireGateway?: boolean;
  trustedGatewayIPs?: string[];
  serviceName?: string;
}

export class GatewayAuthMiddleware {
  constructor(private config: GatewayAuthMiddlewareConfig = {}) {}

  authenticate() {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        const userId = req.headers['x-user-id'] as string;
        const email = req.headers['x-user-email'] as string;
        const rolesHeader = req.headers['x-user-roles'] as string;
        const permissionsHeader = req.headers['x-user-permissions'] as string;
        const correlationId = req.headers['x-correlation-id'] as string;

        if (!userId || !email) {
          if (this.config.requireGateway) {
            res.status(403).json({
              success: false,
              error: 'GATEWAY_REQUIRED',
              message: 'Requests must go through API Gateway',
              service: this.config.serviceName
            });
            return;
          }
          
          next();
          return;
        }

        let roles: string[] = [];
        let permissions: string[] = [];

        try {
          roles = rolesHeader ? JSON.parse(rolesHeader) : [];
        } catch {
          roles = rolesHeader ? rolesHeader.split(',') : [];
        }

        try {
          permissions = permissionsHeader ? JSON.parse(permissionsHeader) : [];
        } catch {
          permissions = permissionsHeader ? permissionsHeader.split(',') : [];
        }

        req.user = {
          userId,
          email,
          roles,
          permissions
        };

        req.correlationId = correlationId || `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        next();

      } catch (error) {
        res.status(500).json({
          success: false,
          error: 'AUTHENTICATION_ERROR',
          message: 'Failed to authenticate request',
          service: this.config.serviceName
        });
      }
    };
  }

  requireRole(allowedRoles: string | string[]) {
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'UNAUTHENTICATED',
          message: 'Authentication required',
          service: this.config.serviceName
        });
        return;
      }

      const hasRole = roles.some(role => req.user!.roles.includes(role));

      if (!hasRole) {
        res.status(403).json({
          success: false,
          error: 'INSUFFICIENT_PERMISSIONS',
          message: 'Insufficient permissions',
          requiredRoles: roles,
          userRoles: req.user.roles,
          service: this.config.serviceName
        });
        return;
      }

      next();
    };
  }

  requirePermission(requiredPermissions: string | string[]) {
    const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];

    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'UNAUTHENTICATED',
          message: 'Authentication required',
          service: this.config.serviceName
        });
        return;
      }

      const hasPermission = permissions.some(perm => req.user!.permissions.includes(perm));

      if (!hasPermission) {
        res.status(403).json({
          success: false,
          error: 'INSUFFICIENT_PERMISSIONS',
          message: 'Insufficient permissions',
          requiredPermissions: permissions,
          userPermissions: req.user.permissions,
          service: this.config.serviceName
        });
        return;
      }

      next();
    };
  }

  requireAnyRole(allowedRoles: string[]) {
    return this.requireRole(allowedRoles);
  }

  requireAllRoles(requiredRoles: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'UNAUTHENTICATED',
          message: 'Authentication required',
          service: this.config.serviceName
        });
        return;
      }

      const hasAllRoles = requiredRoles.every(role => req.user!.roles.includes(role));

      if (!hasAllRoles) {
        res.status(403).json({
          success: false,
          error: 'INSUFFICIENT_PERMISSIONS',
          message: 'All required roles must be present',
          requiredRoles,
          userRoles: req.user.roles,
          service: this.config.serviceName
        });
        return;
      }

      next();
    };
  }

  requireAnyPermission(requiredPermissions: string[]) {
    return this.requirePermission(requiredPermissions);
  }

  requireAllPermissions(requiredPermissions: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'UNAUTHENTICATED',
          message: 'Authentication required',
          service: this.config.serviceName
        });
        return;
      }

      const hasAllPermissions = requiredPermissions.every(perm => req.user!.permissions.includes(perm));

      if (!hasAllPermissions) {
        res.status(403).json({
          success: false,
          error: 'INSUFFICIENT_PERMISSIONS',
          message: 'All required permissions must be present',
          requiredPermissions,
          userPermissions: req.user.permissions,
          service: this.config.serviceName
        });
        return;
      }

      next();
    };
  }

  optionalAuth() {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        const userId = req.headers['x-user-id'] as string;
        const email = req.headers['x-user-email'] as string;
        const rolesHeader = req.headers['x-user-roles'] as string;
        const permissionsHeader = req.headers['x-user-permissions'] as string;
        const correlationId = req.headers['x-correlation-id'] as string;

        if (userId && email) {
          let roles: string[] = [];
          let permissions: string[] = [];

          try {
            roles = rolesHeader ? JSON.parse(rolesHeader) : [];
          } catch {
            roles = rolesHeader ? rolesHeader.split(',') : [];
          }

          try {
            permissions = permissionsHeader ? JSON.parse(permissionsHeader) : [];
          } catch {
            permissions = permissionsHeader ? permissionsHeader.split(',') : [];
          }

          req.user = {
            userId,
            email,
            roles,
            permissions
          };

          req.correlationId = correlationId || `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }

        next();

      } catch (error) {
        next();
      }
    };
  }
}

