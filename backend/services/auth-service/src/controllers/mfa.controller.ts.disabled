/**
 * MFA Controller for Hospital Management System
 * Handles Multi-Factor Authentication operations
 */

import logger from "@hospital/shared/dist/utils/logger";
import { ResponseHelper } from "@hospital/shared/dist/utils/response-helpers";
import { Request, Response } from "express";
import { mfaService } from "../../../../lib/services/mfa.service";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    email: string;
  };
}

/**
 * Get MFA status for current user
 */
export const getMFAStatus = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      ResponseHelper.unauthorized(res, "User not authenticated");
      return;
    }

    const status = await mfaService.getUserMFAStatus();

    ResponseHelper.success(res, "MFA status retrieved successfully", {
      mfaStatus: status,
    });
  } catch (error: any) {
    logger.error("Error getting MFA status:", error);
    ResponseHelper.internalError(res, "Failed to get MFA status");
  }
};

/**
 * Start TOTP enrollment process
 */
export const enrollTOTP = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      ResponseHelper.unauthorized(res, "User not authenticated");
      return;
    }

    const { friendlyName } = req.body;
    const result = await mfaService.enrollTOTP(friendlyName);

    if (result.success) {
      ResponseHelper.success(res, "TOTP enrollment started successfully", {
        enrollment: {
          factorId: result.factorId,
          qrCode: result.qrCode,
          secret: result.secret,
          friendlyName: result.friendlyName,
        },
      });
    } else {
      ResponseHelper.badRequest(
        res,
        result.error || "Failed to start TOTP enrollment"
      );
    }
  } catch (error: any) {
    logger.error("Error starting TOTP enrollment:", error);
    ResponseHelper.internalError(res, "Failed to start TOTP enrollment");
  }
};

/**
 * Complete TOTP enrollment with verification code
 */
export const completeTOTPEnrollment = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      ResponseHelper.unauthorized(res, "User not authenticated");
      return;
    }

    const { factorId, code } = req.body;

    if (!factorId || !code) {
      ResponseHelper.badRequest(
        res,
        "Factor ID and verification code are required"
      );
      return;
    }

    const success = await mfaService.completeEnrollment(factorId, code);

    if (success) {
      ResponseHelper.success(res, "TOTP enrollment completed successfully");
    } else {
      ResponseHelper.badRequest(res, "Invalid verification code");
    }
  } catch (error: any) {
    logger.error("Error completing TOTP enrollment:", error);
    ResponseHelper.internalError(res, "Failed to complete TOTP enrollment");
  }
};

/**
 * Challenge TOTP for verification
 */
export const challengeTOTP = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      ResponseHelper.unauthorized(res, "User not authenticated");
      return;
    }

    const { factorId } = req.body;

    if (!factorId) {
      ResponseHelper.badRequest(res, "Factor ID is required");
      return;
    }

    const challengeId = await mfaService.challengeTOTP(factorId);

    ResponseHelper.success(res, "TOTP challenge created successfully", {
      challengeId,
    });
  } catch (error: any) {
    logger.error("Error creating TOTP challenge:", error);
    ResponseHelper.internalError(res, "Failed to create TOTP challenge");
  }
};

/**
 * Verify TOTP code
 */
export const verifyTOTP = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      ResponseHelper.unauthorized(res, "User not authenticated");
      return;
    }

    const { factorId, challengeId, code } = req.body;

    if (!factorId || !challengeId || !code) {
      ResponseHelper.badRequest(
        res,
        "Factor ID, challenge ID, and verification code are required"
      );
      return;
    }

    const result = await mfaService.verifyTOTP(factorId, challengeId, code);

    if (result.success) {
      ResponseHelper.success(res, "TOTP verification successful", {
        verified: true,
        session: result.session,
      });
    } else {
      ResponseHelper.badRequest(
        res,
        result.error || "TOTP verification failed"
      );
    }
  } catch (error: any) {
    logger.error("Error verifying TOTP:", error);
    ResponseHelper.internalError(res, "Failed to verify TOTP");
  }
};

/**
 * Authenticate with MFA
 */
export const authenticateWithMFA = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      ResponseHelper.unauthorized(res, "User not authenticated");
      return;
    }

    const { factorId, code } = req.body;

    if (!factorId || !code) {
      ResponseHelper.badRequest(
        res,
        "Factor ID and verification code are required"
      );
      return;
    }

    const result = await mfaService.authenticateWithMFA(factorId, code);

    if (result.success) {
      ResponseHelper.success(res, "MFA authentication successful", {
        authenticated: true,
        session: result.session,
      });
    } else {
      ResponseHelper.badRequest(
        res,
        result.error || "MFA authentication failed"
      );
    }
  } catch (error: any) {
    logger.error("Error authenticating with MFA:", error);
    ResponseHelper.internalError(res, "Failed to authenticate with MFA");
  }
};

/**
 * Unenroll TOTP factor
 */
export const unenrollTOTP = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      ResponseHelper.unauthorized(res, "User not authenticated");
      return;
    }

    const { factorId } = req.params;

    if (!factorId) {
      ResponseHelper.badRequest(res, "Factor ID is required");
      return;
    }

    const success = await mfaService.unenrollTOTP(factorId);

    if (success) {
      ResponseHelper.success(res, "TOTP factor unenrolled successfully");
    } else {
      ResponseHelper.badRequest(res, "Failed to unenroll TOTP factor");
    }
  } catch (error: any) {
    logger.error("Error unenrolling TOTP factor:", error);
    ResponseHelper.internalError(res, "Failed to unenroll TOTP factor");
  }
};

/**
 * Check MFA compliance for current user
 */
export const checkMFACompliance = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      ResponseHelper.unauthorized(res, "User not authenticated");
      return;
    }

    const compliance = await mfaService.validateMFACompliance();

    ResponseHelper.success(res, "MFA compliance check completed", {
      compliance,
    });
  } catch (error: any) {
    logger.error("Error checking MFA compliance:", error);
    ResponseHelper.internalError(res, "Failed to check MFA compliance");
  }
};

/**
 * Get MFA audit history for current user
 */
export const getMFAAuditHistory = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      ResponseHelper.unauthorized(res, "User not authenticated");
      return;
    }

    const { limit = 50 } = req.query;
    const auditHistory = await mfaService.getMFAAuditHistory(Number(limit));

    ResponseHelper.success(res, "MFA audit history retrieved successfully", {
      auditHistory,
      limit: Number(limit),
    });
  } catch (error: any) {
    logger.error("Error getting MFA audit history:", error);
    ResponseHelper.internalError(res, "Failed to get MFA audit history");
  }
};

/**
 * Check if MFA verification is needed for current session
 */
export const checkMFAVerificationNeeded = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      ResponseHelper.unauthorized(res, "User not authenticated");
      return;
    }

    const verificationNeeded = await mfaService.needsMFAVerification();

    ResponseHelper.success(res, "MFA verification check completed", {
      verificationNeeded,
    });
  } catch (error: any) {
    logger.error("Error checking MFA verification:", error);
    ResponseHelper.internalError(res, "Failed to check MFA verification");
  }
};
