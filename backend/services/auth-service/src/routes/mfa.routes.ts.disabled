/**
 * MFA Routes for Hospital Management System
 * Handles Multi-Factor Authentication for staff, doctors, and admins
 */

import { Router } from "express";
import {
  authenticateWithMFA,
  challengeTOTP,
  checkMFACompliance,
  checkMFAVerificationNeeded,
  completeTOTPEnrollment,
  enrollTOTP,
  getMFAAuditHistory,
  getMFAStatus,
  unenrollTOTP,
  verifyTOTP,
} from "../controllers/mfa.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

// Apply auth middleware to all MFA routes
router.use(authMiddleware);

// MFA Status and Management
router.get("/status", getMFAStatus);
router.get("/compliance", checkMFACompliance);
router.get("/audit", getMFAAuditHistory);
router.get("/needs-verification", checkMFAVerificationNeeded);

// TOTP Enrollment
router.post("/enroll", enrollTOTP);
router.post("/enroll/complete", completeTOTPEnrollment);

// TOTP Verification
router.post("/challenge", challengeTOTP);
router.post("/verify", verifyTOTP);
router.post("/authenticate", authenticateWithMFA);

// TOTP Management
router.delete("/unenroll/:factorId", unenrollTOTP);

export default router;
