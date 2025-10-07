/**
 * Authentication Middleware
 * Express middleware for JWT token verification
 *
 * @author Hospital Management Team
 * @version 3.0.0 - Pure RBAC
 * @compliance Clean Architecture, HIPAA
 */

import { Request, Response, NextFunction } from 'express';
import { SupabaseAuthClient } from '../../infrastructure/auth/SupabaseAuthClient';
import { IPermissionService } from '../../domain/services/IPermissionService';
import { UserId } from '../../domain/value-objects/UserId';
import { getErrorMessage } from '../../utils/error-helper';

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
 * Authentication Middleware
 */
export class AuthenticationMiddleware {
  constructor(
    private authClient: SupabaseAuthClient,
    private permissionService: IPermissionService,
    private logger: any
  ) {}

  /**
   * Verify JWT token and attach user to request
   */
  authenticate() {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        // Extract token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          res.status(401).json({
            success: false,
            error: 'Unauthorized',
            message: 'Missing or invalid authorization header'
          });
          return;
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token with Supabase
        const user = await this.authClient.verifyToken(token);
        if (!user) {
          res.status(401).json({
            success: false,
            error: 'Unauthorized',
            message: 'Invalid or expired token'
          });
          return;
        }

        // Load user permissions
        const userId = UserId.fromString(user.id);
        const permissionsArray = await this.permissionService.getEffectivePermissions(userId);

        // Extract roles from user metadata or default
        const roles = user.user_metadata?.roles || ['patient'];

        // Attach user info to request
        req.user = {
          userId: user.id,
          email: user.email!,
          roles,
          permissions: permissionsArray
        };

        // Log authentication for audit
        this.logger.debug('User authenticated', {
          userId: user.id,
          email: user.email,
          path: req.path,
          method: req.method
        });

        next();

      } catch (error) {
        this.logger.error('Authentication error', {
          error: getErrorMessage(error),
          path: req.path,
          method: req.method
        });

        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication failed'
        });
      }
    };
  }

  /**
   * Optional authentication - doesn't fail if no token
   */
  optionalAuthenticate() {
    return async (req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void> => {
      try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          // No token provided - continue without user
          return next();
        }

        const token = authHeader.substring(7);
        const user = await this.authClient.verifyToken(token);

        if (user) {
          const userId = UserId.fromString(user.id);
          const permissionsArray = await this.permissionService.getEffectivePermissions(userId);
          const roles = user.user_metadata?.roles || ['patient'];

          req.user = {
            userId: user.id,
            email: user.email!,
            roles,
            permissions: permissionsArray
          };
        }

        next();

      } catch (error) {
        // Log error but don't fail request
        this.logger.warn('Optional authentication failed', {
          error: getErrorMessage(error),
          path: req.path
        });
        next();
      }
    };
  }

  /**
   * Require specific role
   */
  requireRole(...roles: string[]) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required'
        });
        return;
      }

      const hasRole = roles.some(role => req.user!.roles.includes(role));
      if (!hasRole) {
        this.logger.warn('Role check failed', {
          userId: req.user.userId,
          requiredRoles: roles,
          userRoles: req.user.roles,
          path: req.path
        });

        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: `Required role: ${roles.join(' or ')}`,
          requiredRoles: roles
        });
        return;
      }

      next();
    };
  }

  /**
   * Require admin role
   */
  requireAdmin() {
    return this.requireRole('admin');
  }

  /**
   * Require doctor role
   */
  requireDoctor() {
    return this.requireRole('doctor');
  }

  /**
   * Require patient role
   */
  requirePatient() {
    return this.requireRole('patient');
  }
}

