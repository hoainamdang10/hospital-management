import logger from "@hospital/shared/dist/utils/logger";
import { NextFunction, Request, Response } from "express";
import { supabaseAdmin } from "../config/supabase";

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        error: "No token provided",
        message: "Authorization header with Bearer token is required",
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      res.status(401).json({
        success: false,
        error: "No token provided",
        message: "Token is required",
      });
      return;
    }

    // Verify Supabase JWT token
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      logger.warn("Invalid token attempt", { error: error?.message });
      res.status(401).json({
        success: false,
        error: "Invalid or expired token",
        message: "Please sign in again",
      });
      return;
    }

    // Get user profile from profiles table
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      logger.error("Profile fetch error:", profileError);
      res.status(401).json({
        success: false,
        error: "User profile not found",
        message: "User profile is missing or invalid",
      });
      return;
    }

    if (!profile.is_active) {
      res.status(401).json({
        success: false,
        error: "Account is inactive",
        message: "Your account has been deactivated",
      });
      return;
    }

    // Add user info to request object
    req.user = {
      id: user.id,
      email: user.email,
      full_name: profile.full_name,
      role: profile.role,
      phone_number: profile.phone_number,
      is_active: profile.is_active,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    };

    // Add user info to request headers for downstream services
    req.headers["x-user-id"] = user.id;
    req.headers["x-user-email"] = user.email || "";
    req.headers["x-user-role"] = profile.role;
    req.headers["x-user-name"] = profile.full_name || "";

    logger.debug("Request authenticated", {
      userId: user.id,
      email: user.email,
      role: profile.role,
      path: req.path,
      method: req.method,
    });

    next();
  } catch (error) {
    logger.error("Auth middleware error:", error);
    res.status(500).json({
      success: false,
      error: "Authentication failed",
      message: "Internal server error during authentication",
    });
  }
};

/**
 * Role-based access control middleware
 */
export const requireRole = (roles: string | string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: "Authentication required",
        message: "Please sign in to access this resource",
      });
      return;
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn("Access denied - insufficient role", {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: allowedRoles,
        path: req.path,
      });

      res.status(403).json({
        success: false,
        error: "Insufficient permissions",
        message: `Access denied. Required role(s): ${allowedRoles.join(", ")}`,
      });
      return;
    }

    next();
  };
};

/**
 * Admin only middleware
 */
export const requireAdmin = requireRole("admin");

/**
 * Doctor only middleware
 */
export const requireDoctor = requireRole("doctor");

/**
 * Patient only middleware
 */
export const requirePatient = requireRole("patient");

/**
 * Doctor or Admin middleware
 */
export const requireDoctorOrAdmin = requireRole(["doctor", "admin"]);

/**
 * Receptionist only middleware
 */
export const requireReceptionist = requireRole("receptionist");

/**
 * Receptionist or Admin middleware
 */
export const requireReceptionistOrAdmin = requireRole([
  "receptionist",
  "admin",
]);
