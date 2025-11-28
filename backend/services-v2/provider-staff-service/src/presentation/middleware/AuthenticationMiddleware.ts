/**
 * Authentication Middleware
 * Verifies JWT tokens from Supabase and extracts user information
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, HIPAA, Security Best Practices
 */

import { Request, Response, NextFunction } from "express";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Extended Request interface with user information
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    role?: string;
    roles?: string[];
    metadata?: any;
  };
  requestId?: string;
}

/**
 * Authentication Middleware Configuration
 */
export interface AuthMiddlewareConfig {
  supabaseUrl: string;
  supabaseKey: string;
  requireAuth?: boolean;
  allowedRoles?: string[];
}

/**
 * Authentication Middleware Class
 */
export class AuthenticationMiddleware {
  private supabase: SupabaseClient;
  private config: AuthMiddlewareConfig;

  constructor(config: AuthMiddlewareConfig) {
    this.config = config;
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
  }

  /**
   * Bypass authentication for development/testing
   * Set BYPASS_AUTH=true in environment to enable
   */
  static bypassAuth = (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction,
  ): void => {
    // Attach a mock user for testing
    const mockRole = (process.env.BYPASS_AUTH_ROLE || "admin").toLowerCase();

    const additionalRoles = process.env.BYPASS_AUTH_ROLES?.split(",")
      .map((role) => role.trim().toLowerCase())
      .filter(Boolean) || ["doctor"];

    req.user = {
      id: process.env.BYPASS_AUTH_USER_ID || "test-user-id",
      email: process.env.BYPASS_AUTH_EMAIL || "test@example.com",
      role: mockRole,
      roles: [mockRole, ...additionalRoles],
      metadata: { isBypass: true },
    };
    next();
  };

  /**
   * Verify JWT token and attach user to request
   */
  authenticate = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      // Extract token from Authorization header
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        if (this.config.requireAuth !== false) {
          res.status(401).json({
            success: false,
            error: "UNAUTHORIZED",
            message: "Token xác thực không hợp lệ hoặc không được cung cấp.",
            timestamp: new Date().toISOString(),
            requestId: req.requestId || "unknown",
          });
          return;
        }
        // If auth is not required, continue without user
        next();
        return;
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      // Verify token with Supabase
      const {
        data: { user },
        error,
      } = await this.supabase.auth.getUser(token);

      if (error || !user) {
        res.status(401).json({
          success: false,
          error: "INVALID_TOKEN",
          message: "Token xác thực không hợp lệ hoặc đã hết hạn.",
          timestamp: new Date().toISOString(),
          requestId: req.requestId || "unknown",
          details: error?.message,
        });
        return;
      }

      // Extract user information
      req.user = {
        id: user.id,
        email: user.email,
        role:
          user.user_metadata?.role?.toString().toLowerCase() ||
          user.app_metadata?.role?.toString().toLowerCase(),
        roles:
          (user.user_metadata?.roles as string[] | undefined)?.map((r) =>
            r.toString().toLowerCase(),
          ) ||
          (user.app_metadata?.roles as string[] | undefined)?.map((r) =>
            r.toString().toLowerCase(),
          ) ||
          [],
        metadata: {
          ...user.user_metadata,
          ...user.app_metadata,
        },
      };

      // Check role-based access if required
      if (this.config.allowedRoles && this.config.allowedRoles.length > 0) {
        const allowedLower = this.config.allowedRoles.map((r) =>
          r.toLowerCase(),
        );
        const hasRequiredRole = this.config.allowedRoles.some(
          (role) =>
            req.user?.role === role.toLowerCase() ||
            req.user?.roles?.includes(role.toLowerCase()) ||
            allowedLower.includes(req.user?.role || "") ||
            req.user?.roles?.some((r) => allowedLower.includes(r)),
        );

        if (!hasRequiredRole) {
          res.status(403).json({
            success: false,
            error: "FORBIDDEN",
            message: "Bạn không có quyền truy cập tài nguyên này.",
            timestamp: new Date().toISOString(),
            requestId: req.requestId || "unknown",
            requiredRoles: this.config.allowedRoles,
            userRole: req.user?.role,
          });
          return;
        }
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "AUTHENTICATION_ERROR",
        message: "Lỗi xác thực người dùng.",
        timestamp: new Date().toISOString(),
        requestId: req.requestId || "unknown",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  /**
   * Create middleware with specific configuration
   */
  static create(config: AuthMiddlewareConfig) {
    const middleware = new AuthenticationMiddleware(config);
    return middleware.authenticate;
  }

  /**
   * Create middleware that requires authentication
   */
  static requireAuth(supabaseUrl: string, supabaseKey: string) {
    return AuthenticationMiddleware.create({
      supabaseUrl,
      supabaseKey,
      requireAuth: true,
    });
  }

  /**
   * Create middleware that requires specific roles
   */
  static requireRoles(
    supabaseUrl: string,
    supabaseKey: string,
    allowedRoles: string[],
  ) {
    return AuthenticationMiddleware.create({
      supabaseUrl,
      supabaseKey,
      requireAuth: true,
      allowedRoles,
    });
  }

  /**
   * Create middleware for optional authentication
   */
  static optional(supabaseUrl: string, supabaseKey: string) {
    return AuthenticationMiddleware.create({
      supabaseUrl,
      supabaseKey,
      requireAuth: false,
    });
  }

  /**
   * Middleware for ADMIN role only
   */
  static adminOnly(supabaseUrl: string, supabaseKey: string) {
    return AuthenticationMiddleware.requireRoles(supabaseUrl, supabaseKey, [
      "SUPER_ADMIN",
      "ADMIN",
    ]);
  }

  /**
   * Middleware for healthcare staff (DOCTOR, NURSE)
   */
  static healthcareStaffOnly(supabaseUrl: string, supabaseKey: string) {
    return AuthenticationMiddleware.requireRoles(supabaseUrl, supabaseKey, [
      "SUPER_ADMIN",
      "ADMIN",
      "DOCTOR",
      "NURSE",
    ]);
  }

  /**
   * Middleware for doctors only
   */
  static doctorOnly(supabaseUrl: string, supabaseKey: string) {
    return AuthenticationMiddleware.requireRoles(supabaseUrl, supabaseKey, [
      "SUPER_ADMIN",
      "ADMIN",
      "DOCTOR",
    ]);
  }
}

/**
 * Helper function to extract user ID from request
 */
export function getUserId(req: AuthenticatedRequest): string | null {
  return req.user?.id || null;
}

/**
 * Helper function to extract user role from request
 */
export function getUserRole(req: AuthenticatedRequest): string | null {
  return req.user?.role || null;
}

/**
 * Helper function to check if user has specific role
 */
export function hasRole(req: AuthenticatedRequest, role: string): boolean {
  return req.user?.role === role || req.user?.roles?.includes(role) || false;
}

/**
 * Helper function to check if user has any of the specified roles
 */
export function hasAnyRole(
  req: AuthenticatedRequest,
  roles: string[],
): boolean {
  return roles.some((role) => hasRole(req, role));
}
