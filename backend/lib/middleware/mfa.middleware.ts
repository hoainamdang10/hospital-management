/**
 * MFA Middleware for Hospital Management System
 * Enforces Multi-Factor Authentication for sensitive operations
 */

import { NextFunction, Request, Response } from "express";
import { mfaService } from "../services/mfa.service";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    email: string;
  };
}

/**
 * Middleware to check if user has completed MFA
 * Blocks access to sensitive operations if MFA is required but not completed
 */
export const requireMFA = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: "Unauthorized",
        message: "User not authenticated",
      });
      return;
    }

    // Check if MFA is required for this user's role
    const mfaRequired = mfaService.isMFARequired(req.user.role);

    if (!mfaRequired) {
      // MFA not required for this role, proceed
      next();
      return;
    }

    // MFA is required, check if user has completed it
    const status = await mfaService.getUserMFAStatus();

    if (!status.mfaEnrolled) {
      res.status(403).json({
        success: false,
        error: "MFA Required",
        message:
          "Multi-Factor Authentication is required for your role. Please enroll in MFA to continue.",
        code: "MFA_ENROLLMENT_REQUIRED",
        data: {
          mfaRequired: true,
          mfaEnrolled: false,
          role: req.user.role,
        },
      });
      return;
    }

    // Check if current session has MFA verification
    if (status.currentAAL !== "aal2") {
      res.status(403).json({
        success: false,
        error: "MFA Verification Required",
        message: "Please complete MFA verification to access this resource.",
        code: "MFA_VERIFICATION_REQUIRED",
        data: {
          mfaRequired: true,
          mfaEnrolled: true,
          currentAAL: status.currentAAL,
          requiredAAL: "aal2",
        },
      });
      return;
    }

    // MFA requirements satisfied, proceed
    next();
  } catch (error) {
    console.error("Error in MFA middleware:", error);
    res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: "Failed to verify MFA requirements",
    });
  }
};

/**
 * Middleware to check MFA compliance without blocking
 * Adds MFA status to request for informational purposes
 */
export const checkMFAStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      next();
      return;
    }

    // Get MFA status and add to request
    const status = await mfaService.getUserMFAStatus();
    req.mfaStatus = status;

    // Add MFA headers for client information
    res.setHeader("X-MFA-Required", status.mfaRequired.toString());
    res.setHeader("X-MFA-Enrolled", status.mfaEnrolled.toString());
    res.setHeader("X-MFA-Current-AAL", status.currentAAL);

    next();
  } catch (error) {
    console.error("Error checking MFA status:", error);
    // Don't block request, just continue without MFA info
    next();
  }
};

/**
 * Middleware to enforce MFA for specific roles only
 * @param roles Array of roles that require MFA
 */
export const requireMFAForRoles = (roles: string[]) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        });
        return;
      }

      // Check if user's role requires MFA
      if (!roles.includes(req.user.role)) {
        // Role doesn't require MFA, proceed
        next();
        return;
      }

      // Role requires MFA, check compliance
      const status = await mfaService.getUserMFAStatus();

      if (!status.mfaEnrolled) {
        res.status(403).json({
          success: false,
          error: "MFA Required",
          message: `Multi-Factor Authentication is required for ${req.user.role} role. Please enroll in MFA to continue.`,
          code: "MFA_ENROLLMENT_REQUIRED",
          data: {
            mfaRequired: true,
            mfaEnrolled: false,
            role: req.user.role,
            requiredRoles: roles,
          },
        });
        return;
      }

      if (status.currentAAL !== "aal2") {
        res.status(403).json({
          success: false,
          error: "MFA Verification Required",
          message: "Please complete MFA verification to access this resource.",
          code: "MFA_VERIFICATION_REQUIRED",
          data: {
            mfaRequired: true,
            mfaEnrolled: true,
            currentAAL: status.currentAAL,
            requiredAAL: "aal2",
            role: req.user.role,
          },
        });
        return;
      }

      // MFA requirements satisfied, proceed
      next();
    } catch (error) {
      console.error("Error in role-based MFA middleware:", error);
      res.status(500).json({
        success: false,
        error: "Internal Server Error",
        message: "Failed to verify MFA requirements",
      });
    }
  };
};

/**
 * Middleware to enforce MFA for financial operations
 * Always requires MFA for payment-related endpoints
 */
export const requireMFAForFinancial = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: "Unauthorized",
        message: "User not authenticated",
      });
      return;
    }

    // Financial operations always require MFA regardless of role
    const status = await mfaService.getUserMFAStatus();

    if (!status.mfaEnrolled) {
      res.status(403).json({
        success: false,
        error: "MFA Required for Financial Operations",
        message:
          "Multi-Factor Authentication is required for all financial operations. Please enroll in MFA to continue.",
        code: "MFA_FINANCIAL_REQUIRED",
        data: {
          mfaRequired: true,
          mfaEnrolled: false,
          operation: "financial",
          role: req.user.role,
        },
      });
      return;
    }

    if (status.currentAAL !== "aal2") {
      res.status(403).json({
        success: false,
        error: "MFA Verification Required",
        message:
          "Please complete MFA verification to access financial operations.",
        code: "MFA_VERIFICATION_REQUIRED",
        data: {
          mfaRequired: true,
          mfaEnrolled: true,
          currentAAL: status.currentAAL,
          requiredAAL: "aal2",
          operation: "financial",
        },
      });
      return;
    }

    // MFA requirements satisfied for financial operations
    next();
  } catch (error) {
    console.error("Error in financial MFA middleware:", error);
    res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: "Failed to verify MFA requirements for financial operations",
    });
  }
};

/**
 * Middleware to enforce MFA for admin operations
 * Requires MFA for admin and super-admin roles
 */
export const requireMFAForAdmin = requireMFAForRoles(["admin", "super-admin"]);

/**
 * Middleware to enforce MFA for medical staff
 * Requires MFA for doctors and medical staff
 */
export const requireMFAForMedical = requireMFAForRoles([
  "doctor",
  "nurse",
  "medical-staff",
]);

// Extend Request interface to include MFA status
declare global {
  namespace Express {
    interface Request {
      mfaStatus?: {
        mfaRequired: boolean;
        mfaEnrolled: boolean;
        currentAAL: string;
        factors: any[];
        lastVerification?: Date;
      };
    }
  }
}
