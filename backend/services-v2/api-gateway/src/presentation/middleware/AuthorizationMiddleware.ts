import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './AuthenticationMiddleware';
import { AuthorizeRequestUseCase } from '@application/use-cases/AuthorizeRequestUseCase';

export class AuthorizationMiddleware {
  constructor(private authorizeRequestUseCase: AuthorizeRequestUseCase) {}

  requirePermission(permission: string) {
    return this.requirePermissions([permission], true);
  }

  requireAnyPermission(permissions: string[]) {
    return this.requirePermissions(permissions, false);
  }

  requireAllPermissions(permissions: string[]) {
    return this.requirePermissions(permissions, true);
  }

  requireRole(role: string) {
    return this.requireRoles([role], true);
  }

  requireAnyRole(roles: string[]) {
    return this.requireRoles(roles, false);
  }

  requireAllRoles(roles: string[]) {
    return this.requireRoles(roles, true);
  }

  private requirePermissions(permissions: string[], requireAll: boolean) {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        if (!req.user || !req.user.userId) {
          res.status(401).json({
            success: false,
            error: 'Authentication required',
            requestId: req.requestId
          });
          return;
        }

        const result = await this.authorizeRequestUseCase.execute({
          userId: req.user.userId,
          requiredPermissions: permissions,
          requireAll,
          requestId: req.requestId || 'unknown',
          path: req.path
        });

        if (!result.allowed) {
          res.status(403).json({
            success: false,
            error: result.reason || 'Insufficient permissions',
            requestId: req.requestId
          });
          return;
        }

        next();

      } catch (error) {
        res.status(500).json({
          success: false,
          error: 'Internal authorization error',
          requestId: req.requestId
        });
      }
    };
  }

  private requireRoles(roles: string[], requireAll: boolean) {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        if (!req.user || !req.user.userId) {
          res.status(401).json({
            success: false,
            error: 'Authentication required',
            requestId: req.requestId
          });
          return;
        }

        const result = await this.authorizeRequestUseCase.execute({
          userId: req.user.userId,
          requiredRoles: roles,
          requireAll,
          requestId: req.requestId || 'unknown',
          path: req.path
        });

        if (!result.allowed) {
          res.status(403).json({
            success: false,
            error: result.reason || 'Insufficient roles',
            requestId: req.requestId
          });
          return;
        }

        next();

      } catch (error) {
        res.status(500).json({
          success: false,
          error: 'Internal authorization error',
          requestId: req.requestId
        });
      }
    };
  }
}

