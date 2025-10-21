/**
 * Authentication Middleware
 * Verifies JWT tokens by calling Identity Service
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { ILogger } from '@shared/application/services/logger.interface';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  roles: string[];
  permissions: string[];
  sessionId?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
  correlationId?: string;
}

export interface AuthenticationMiddlewareConfig {
  identityServiceUrl: string;
  logger: ILogger;
  skipPaths?: string[];
}

export class AuthenticationMiddleware {
  private readonly identityServiceUrl: string;
  private readonly logger: ILogger;
  private readonly skipPaths: string[];

  constructor(config: AuthenticationMiddlewareConfig) {
    this.identityServiceUrl = config.identityServiceUrl;
    this.logger = config.logger;
    this.skipPaths = config.skipPaths || ['/health', '/api-docs'];
  }

  /**
   * Authenticate request by verifying JWT with Identity Service
   */
  authenticate() {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        // Skip authentication for certain paths
        if (this.shouldSkipAuthentication(req.path)) {
          return next();
        }

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

        // Verify token with Identity Service
        const user = await this.verifyTokenWithIdentityService(token);
        if (!user) {
          res.status(401).json({
            success: false,
            error: 'Unauthorized',
            message: 'Invalid or expired token'
          });
          return;
        }

        // Attach user to request
        req.user = user;

        next();
      } catch (error) {
        this.logger.error('Authentication middleware error', {
          error: error instanceof Error ? error.message : 'Unknown error',
          path: req.path
        });

        res.status(500).json({
          success: false,
          error: 'Internal Server Error',
          message: 'Authentication failed'
        });
      }
    };
  }

  /**
   * Verify JWT token with Identity Service
   */
  private async verifyTokenWithIdentityService(token: string): Promise<AuthenticatedUser | null> {
    try {
      const response = await axios.get(`${this.identityServiceUrl}/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        timeout: 5000
      });

      if (response.status === 200 && response.data.success) {
        return {
          userId: response.data.data.userId,
          email: response.data.data.email,
          roles: response.data.data.roles || [],
          permissions: response.data.data.permissions || [],
          sessionId: response.data.data.sessionId
        };
      }

      return null;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          // Invalid token
          return null;
        }

        this.logger.error('Identity Service verification failed', {
          error: error.message,
          status: error.response?.status
        });
      }

      return null;
    }
  }

  /**
   * Check if path should skip authentication
   */
  private shouldSkipAuthentication(path: string): boolean {
    return this.skipPaths.some(skipPath => path.startsWith(skipPath));
  }

  /**
   * Require specific role(s)
   */
  requireRole(allowedRoles: string | string[]) {
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required'
        });
        return;
      }

      const hasRole = req.user.roles.some(role => roles.includes(role));
      if (!hasRole) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Insufficient permissions'
        });
        return;
      }

      next();
    };
  }

  /**
   * Require specific permission(s)
   */
  requirePermission(requiredPermissions: string | string[]) {
    const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];

    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required'
        });
        return;
      }

      const hasPermission = permissions.every(permission =>
        req.user!.permissions.includes(permission)
      );

      if (!hasPermission) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Insufficient permissions'
        });
        return;
      }

      next();
    };
  }
}

