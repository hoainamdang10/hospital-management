/**
 * Authentication Middleware - Presentation Layer
 * JWT-based authentication for Billing Service
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, JWT, RBAC, Security Best Practices
 */

import { Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";

// Extend Express Request to include user information
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
        tenantId?: string;
        permissions?: string[];
        patientId?: string;
      };
      token?: string;
    }
  }
}

export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  DOCTOR = "DOCTOR",
  NURSE = "NURSE",
  PATIENT = "PATIENT",
  CASHIER = "CASHIER",
  FINANCE_MANAGER = "FINANCE_MANAGER",
  INSURANCE_OFFICER = "INSURANCE_OFFICER",
}

interface AuthOptions {
  required?: boolean;
  roles?: UserRole[];
  permissions?: string[];
}

/**
 * Main authentication middleware
 */
export const authMiddleware = (options: AuthOptions = { required: true }) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract token from Authorization header
      const authHeader = req.headers.authorization;

      //  TRUST GATEWAY HEADERS FIRST (Gateway already authenticated the user)
      const gatewayUser = extractGatewayUser(req);
      if (gatewayUser) {
        req.user = gatewayUser;
        return next();
      }

      if (!authHeader) {
        if (options.required) {
          return res.status(401).json({
            success: false,
            error: "Unauthorized",
            message: "No authorization token provided",
            code: "NO_TOKEN",
            timestamp: new Date().toISOString(),
          });
        }
        return next();
      }

      // Validate Bearer token format
      const parts = authHeader.split(" ");
      if (parts.length !== 2 || parts[0] !== "Bearer") {
        return res.status(401).json({
          success: false,
          error: "Unauthorized",
          message:
            "Invalid authorization header format. Expected: Bearer <token>",
          code: "INVALID_TOKEN_FORMAT",
          timestamp: new Date().toISOString(),
        });
      }

      const token = parts[1];
      req.token = token;

      // Initialize Supabase client
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.error("Supabase configuration missing");
        return res.status(500).json({
          success: false,
          error: "Internal Server Error",
          message: "Authentication service not configured",
          code: "AUTH_CONFIG_ERROR",
          timestamp: new Date().toISOString(),
        });
      }

      const supabase = createClient(supabaseUrl, supabaseKey);

      // Verify token with Supabase
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);

      if (error || !user) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "Invalid or expired token",
          code: "INVALID_TOKEN",
          timestamp: new Date().toISOString(),
        });
      }

      // Extract user metadata
      const userMetadata = user.user_metadata || {};
      const appMetadata = user.app_metadata || {};

      // Get user role from metadata or database
      let userRole = appMetadata.role as UserRole;

      if (!userRole) {
        // Fallback: query database for user role
        const { data: userData, error: dbError } = await supabase
          .from("auth_schema.users")
          .select("role, tenant_id")
          .eq("id", user.id)
          .single();

        if (dbError || !userData) {
          console.error("Failed to fetch user role:", dbError);
          userRole = UserRole.PATIENT; // Default role
        } else {
          userRole = userData.role as UserRole;
        }
      }

      // Attach user information to request
      req.user = {
        id: user.id,
        email: user.email || "",
        role: userRole,
        tenantId: appMetadata.tenant_id || userMetadata.tenant_id,
        permissions: appMetadata.permissions || [],
      };

      // Check role requirements
      if (options.roles && options.roles.length > 0) {
        if (!options.roles.includes(req.user.role)) {
          return res.status(403).json({
            success: false,
            error: "Forbidden",
            message: "Insufficient permissions to access this resource",
            code: "INSUFFICIENT_PERMISSIONS",
            requiredRoles: options.roles,
            userRole: req.user.role,
            timestamp: new Date().toISOString(),
          });
        }
      }

      // Check permission requirements
      if (options.permissions && options.permissions.length > 0) {
        const hasPermission = options.permissions.some((permission) =>
          req.user?.permissions?.includes(permission),
        );

        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            error: "Forbidden",
            message: "Missing required permissions",
            code: "MISSING_PERMISSIONS",
            requiredPermissions: options.permissions,
            timestamp: new Date().toISOString(),
          });
        }
      }

      next();
    } catch (error) {
      console.error("Authentication middleware error:", error);
      return res.status(500).json({
        success: false,
        error: "Internal Server Error",
        message: "Authentication failed",
        code: "AUTH_ERROR",
        timestamp: new Date().toISOString(),
      });
    }
  };
};

/**
 * Extract user context forwarded by API Gateway
 */
function extractGatewayUser(req: Request): Request["user"] | null {
  const gatewayUserId = (
    req.headers["x-user-id"] as string | undefined
  )?.trim();
  const gatewayEmail = (
    req.headers["x-user-email"] as string | undefined
  )?.trim();
  const gatewayRolesRaw = req.headers["x-user-roles"] as string | undefined;
  const gatewayPermissionsRaw = req.headers["x-user-permissions"] as
    | string
    | undefined;
  const patientIdHeader = (
    req.headers["x-patient-id"] as string | undefined
  )?.trim();

  if (!gatewayUserId) {
    return null;
  }

  const roles = parseHeaderArray(gatewayRolesRaw);
  const permissions = parseHeaderArray(gatewayPermissionsRaw);
  const normalizedRoles = roles
    .map((role) => role.toUpperCase())
    .filter((role) => role in UserRole) as UserRole[];

  const primaryRole = normalizedRoles[0] ?? UserRole.PATIENT;

  return {
    id: gatewayUserId,
    email: gatewayEmail || "unknown@patient.local",
    role: primaryRole,
    tenantId: undefined,
    permissions,
    patientId: patientIdHeader,
  };
}

function parseHeaderArray(headerValue?: string): string[] {
  if (!headerValue) return [];
  try {
    const parsed = JSON.parse(headerValue);
    if (Array.isArray(parsed)) {
      return parsed.map((value) => String(value));
    }
  } catch {
    // Fall back to comma-separated values
  }
  return headerValue
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

/**
 * Require specific roles
 */
export const requireRoles = (...roles: UserRole[]) => {
  return authMiddleware({ required: true, roles });
};

/**
 * Require specific permissions
 */
export const requirePermissions = (...permissions: string[]) => {
  return authMiddleware({ required: true, permissions });
};

/**
 * Optional authentication (allows unauthenticated requests)
 */
export const optionalAuth = () => {
  return authMiddleware({ required: false });
};

/**
 * Admin only access
 */
export const requireAdmin = () => {
  return requireRoles(UserRole.SUPER_ADMIN, UserRole.ADMIN);
};

/**
 * Finance staff access
 */
export const requireFinanceAccess = () => {
  return requireRoles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.FINANCE_MANAGER,
    UserRole.CASHIER,
  );
};

/**
 * Medical staff access
 */
export const requireMedicalStaffAccess = () => {
  return requireRoles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.DOCTOR,
    UserRole.NURSE,
  );
};

/**
 * Check if user can access patient data
 */
export const canAccessPatientData = (patientId: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
        message: "Authentication required",
        code: "NO_AUTH",
        timestamp: new Date().toISOString(),
      });
    }

    // Admin and medical staff can access all patient data
    if (
      req.user.role === UserRole.SUPER_ADMIN ||
      req.user.role === UserRole.ADMIN ||
      req.user.role === UserRole.DOCTOR ||
      req.user.role === UserRole.NURSE ||
      req.user.role === UserRole.FINANCE_MANAGER
    ) {
      return next();
    }

    // Patients can only access their own data
    if (
      req.user.role === UserRole.PATIENT &&
      (req.user.id === patientId || req.user.patientId === patientId)
    ) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: "Forbidden",
      message: "You do not have permission to access this patient data",
      code: "PATIENT_ACCESS_DENIED",
      timestamp: new Date().toISOString(),
    });
  };
};

/**
 * Check if user can modify invoice
 */
export const canModifyInvoice = () => {
  return requireRoles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.DOCTOR,
    UserRole.NURSE,
    UserRole.FINANCE_MANAGER,
    UserRole.CASHIER,
  );
};

/**
 * Check if user can process payments
 */
export const canProcessPayment = () => {
  return requireRoles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.FINANCE_MANAGER,
    UserRole.CASHIER,
  );
};

/**
 * Check if user can manage insurance claims
 */
export const canManageInsuranceClaims = () => {
  return requireRoles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.INSURANCE_OFFICER,
  );
};

/**
 * Validate tenant isolation
 */
export const validateTenantIsolation = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
        message: "Authentication required",
        code: "NO_AUTH",
        timestamp: new Date().toISOString(),
      });
    }

    // Super admin can access all tenants
    if (req.user.role === UserRole.SUPER_ADMIN) {
      return next();
    }

    // For other users, ensure tenant isolation
    const requestedTenantId =
      req.params.tenantId || req.query.tenantId || req.body.tenantId;

    if (requestedTenantId && req.user.tenantId !== requestedTenantId) {
      return res.status(403).json({
        success: false,
        error: "Forbidden",
        message: "Access denied to this tenant",
        code: "TENANT_ACCESS_DENIED",
        timestamp: new Date().toISOString(),
      });
    }

    next();
  };
};

/**
 * Extract user ID from request
 */
export const getUserId = (req: Request): string | null => {
  return req.user?.id || null;
};

/**
 * Extract user role from request
 */
export const getUserRole = (req: Request): UserRole | null => {
  return req.user?.role || null;
};

/**
 * Check if user has role
 */
export const hasRole = (req: Request, role: UserRole): boolean => {
  return req.user?.role === role;
};

/**
 * Check if user has any of the roles
 */
export const hasAnyRole = (req: Request, roles: UserRole[]): boolean => {
  return req.user ? roles.includes(req.user.role) : false;
};

/**
 * Check if user has permission
 */
export const hasPermission = (req: Request, permission: string): boolean => {
  return req.user?.permissions?.includes(permission) || false;
};

/**
 * Export default middleware
 */
export default authMiddleware;
