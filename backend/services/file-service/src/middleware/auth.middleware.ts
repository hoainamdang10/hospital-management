import express from "express";
import { logger } from "../utils/logger";
import { supabase } from "../utils/supabase";
import { SecurityError } from "./error.middleware";

export const authMiddleware = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new SecurityError("No authentication token provided");
    }

    const token = authHeader.substring(7);

    // Verify JWT token with Supabase
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      logger.warn("Invalid authentication token", {
        error: error?.message,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      });
      throw new SecurityError("Invalid authentication token");
    }

    // Get user profile with role information
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, role, email, full_name")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      logger.error("Failed to fetch user profile", {
        userId: user.id,
        error: profileError?.message,
      });
      throw new SecurityError("User profile not found");
    }

    // Check if user account is active
    if (!profile.role) {
      throw new SecurityError("User account is not active");
    }

    // Set user info on request
    req.user = {
      id: profile.id,
      role: profile.role,
      email: profile.email,
    };

    logger.debug("User authenticated", {
      userId: profile.id,
      role: profile.role,
      endpoint: req.path,
    });

    next();
  } catch (error) {
    if (error instanceof SecurityError) {
      res.status(401).json({
        success: false,
        error: {
          code: "AUTHENTICATION_FAILED",
          message: error.message,
        },
      });
      return;
    }

    logger.error("Authentication middleware error", {
      error: error instanceof Error ? error.message : "Unknown error",
      path: req.path,
    });

    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Authentication service error",
      },
    });
  }
};

// Role-based authorization middleware
export const requireRole = (allowedRoles: string[]) => {
  return (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: "AUTHENTICATION_REQUIRED",
          message: "Authentication required",
        },
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn("Insufficient permissions", {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: allowedRoles,
        endpoint: req.path,
      });

      res.status(403).json({
        success: false,
        error: {
          code: "INSUFFICIENT_PERMISSIONS",
          message: "Insufficient permissions for this operation",
        },
      });
      return;
    }

    next();
  };
};

// Healthcare staff authorization (doctors, nurses, admins)
export const requireHealthcareStaff = requireRole([
  "doctor",
  "nurse",
  "admin",
  "superadmin",
]);

// Admin authorization
export const requireAdmin = requireRole(["admin", "superadmin"]);

// Patient or healthcare staff (for accessing patient documents with permission)
export const requirePatientOrStaff = requireRole([
  "patient",
  "doctor",
  "nurse",
  "admin",
  "superadmin",
]);
