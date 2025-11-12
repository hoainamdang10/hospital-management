/**
 * Authorization Middleware
 * Smart ownership-based authorization for patient data
 * 
 * AUTHORIZATION RULES:
 * 1. Patients can access their OWN data without special permissions
 * 2. Admin/Doctor need "patient:read" permission to access OTHER patients' data
 * 3. System/Service accounts with appropriate permissions can access all
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { Response, NextFunction } from "express";
import { ILogger } from "@shared/application/services/logger.interface";
import { AuthenticatedRequest } from "./AuthenticationMiddleware";
import { IPatientRepository } from "../../domain/repositories/IPatientRepository";
import { PatientId } from "../../domain/value-objects/PatientId";

export interface AuthorizationMiddlewareConfig {
  logger: ILogger;
  patientRepository: IPatientRepository;
}

export class AuthorizationMiddleware {
  private readonly logger: ILogger;
  private readonly patientRepository: IPatientRepository;

  constructor(config: AuthorizationMiddlewareConfig) {
    this.logger = config.logger;
    this.patientRepository = config.patientRepository;
  }

  /**
   * Check if user can access patient data
   * 
   * SMART AUTHORIZATION LOGIC:
   * - If requesting own data (patient.userId === req.user.userId) → ALLOW
   * - If has "patient:read" permission → ALLOW (admin/doctor)
   * - Otherwise → DENY (403)
   */
  canAccessPatientData(paramName: 'patientId' | 'userId' = 'patientId') {
    return async (
      req: AuthenticatedRequest,
      res: Response,
      next: NextFunction,
    ): Promise<void> => {
      try {
        // Authentication check
        if (!req.user) {
          res.status(401).json({
            success: false,
            error: "Unauthorized",
            message: "Authentication required",
          });
          return;
        }

        const requestedId = req.params[paramName];
        const currentUserId = req.user.userId;
        const userRoles = req.user.roles || [];
        const userPermissions = req.user.permissions || [];

        this.logger.debug("Authorization check", {
          paramName,
          requestedId,
          currentUserId,
          userRoles,
          hasPatientReadPermission: userPermissions.includes("patient:read"),
        });

        // RULE 1: Check if user has admin permission (can access all)
        if (userPermissions.includes("patient:read")) {
          this.logger.info("Access granted: User has patient:read permission", {
            userId: currentUserId,
            requestedId,
            reason: "permission",
          });
          return next();
        }

        // RULE 2: Check ownership (patient accessing own data)
        let isOwner = false;
        
        if (paramName === 'userId') {
          // Direct userId comparison
          isOwner = requestedId === currentUserId;
        } else if (paramName === 'patientId') {
          // Need to fetch patient to check userId
          const patientId = PatientId.create(requestedId);
          const patient = await this.patientRepository.findById(patientId);
          if (patient) {
            isOwner = patient.getUserId() === currentUserId;
          }
        }

        if (isOwner) {
          this.logger.info("Access granted: User accessing own data", {
            userId: currentUserId,
            requestedId,
            reason: "ownership",
          });
          return next();
        }

        // RULE 3: DENY - No permission and not owner
        this.logger.warn("Access denied: Insufficient permissions", {
          userId: currentUserId,
          requestedId,
          userRoles,
          userPermissions,
        });

        res.status(403).json({
          success: false,
          error: "Forbidden",
          message: "You do not have permission to access this patient's data",
          code: "INSUFFICIENT_PERMISSIONS",
        });
      } catch (error) {
        this.logger.error("Authorization middleware error", {
          error: error instanceof Error ? error.message : "Unknown error",
          path: req.path,
        });

        res.status(500).json({
          success: false,
          error: "Internal Server Error",
          message: "Authorization check failed",
        });
      }
    };
  }

  /**
   * Require specific permission(s)
   * Fallback to permission-only check (no ownership logic)
   */
  requirePermission(requiredPermissions: string | string[]) {
    const permissions = Array.isArray(requiredPermissions)
      ? requiredPermissions
      : [requiredPermissions];

    return (
      req: AuthenticatedRequest,
      res: Response,
      next: NextFunction,
    ): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "Authentication required",
        });
        return;
      }

      const userPermissions = req.user.permissions || [];
      const hasPermission = permissions.every((permission) =>
        userPermissions.includes(permission),
      );

      if (!hasPermission) {
        this.logger.warn("Permission denied", {
          userId: req.user.userId,
          required: permissions,
          actual: userPermissions,
        });

        res.status(403).json({
          success: false,
          error: "Forbidden",
          message: "Insufficient permissions",
          requiredPermissions: permissions,
        });
        return;
      }

      next();
    };
  }

  /**
   * Require specific role(s)
   */
  requireRole(allowedRoles: string | string[]) {
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    return (
      req: AuthenticatedRequest,
      res: Response,
      next: NextFunction,
    ): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "Authentication required",
        });
        return;
      }

      const userRoles = req.user.roles || [];
      const hasRole = userRoles.some((role) => roles.includes(role));

      if (!hasRole) {
        this.logger.warn("Role requirement not met", {
          userId: req.user.userId,
          required: roles,
          actual: userRoles,
        });

        res.status(403).json({
          success: false,
          error: "Forbidden",
          message: "Insufficient role privileges",
          requiredRoles: roles,
        });
        return;
      }

      next();
    };
  }
}
