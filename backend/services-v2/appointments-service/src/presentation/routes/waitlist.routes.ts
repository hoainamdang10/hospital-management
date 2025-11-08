/**
 * Waitlist Routes - Presentation Layer
 * Defines HTTP routes for appointment waitlist management
 *
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Clean Architecture, REST API
 */

import { Router, Request, Response } from "express";
import { body, param, query } from "express-validator";
import { WaitlistController } from "../controllers/WaitlistController";
import { validateRequest } from "../middleware/validateRequest";
import { authenticate, requireRole } from "../middleware/AuthMiddleware";
import { getContainer } from "../../infrastructure/di/container";

/**
 * Create waitlist routes
 */
export function createWaitlistRoutes(): Router {
  const router = Router();

  // Get controller from DI container
  const container = getContainer();
  const controller = container.getWaitlistController();

  /**
   * POST /waitlist
   * Add patient to waitlist
   */
  router.post(
    "/",
    authenticate,
    [
      body("patientId").isUUID().withMessage("Valid patient ID is required"),
      body("preferredDoctorId")
        .optional()
        .isUUID()
        .withMessage("Valid doctor ID required"),
      body("preferredDepartmentId")
        .optional()
        .isUUID()
        .withMessage("Valid department ID required"),
      body("preferredDate")
        .optional()
        .isISO8601()
        .withMessage("Valid date required (YYYY-MM-DD)"),
      body("preferredTimeSlot")
        .optional()
        .isString()
        .withMessage("Valid time slot required"),
      body("appointmentType")
        .notEmpty()
        .withMessage("Appointment type is required"),
      body("priority")
        .optional()
        .isIn(["EMERGENCY", "URGENT", "NORMAL", "LOW"])
        .withMessage("Invalid priority"),
      body("notes").optional().isString().withMessage("Notes must be a string"),
      body("reason")
        .optional()
        .isString()
        .withMessage("Reason must be a string"),
      body("isFlexibleDate")
        .optional()
        .isBoolean()
        .withMessage("isFlexibleDate must be boolean"),
      body("isFlexibleTime")
        .optional()
        .isBoolean()
        .withMessage("isFlexibleTime must be boolean"),
      body("isFlexibleDoctor")
        .optional()
        .isBoolean()
        .withMessage("isFlexibleDoctor must be boolean"),
      body("expiresAt")
        .optional()
        .isISO8601()
        .withMessage("Valid expiration date required"),
      body("contactPhone")
        .optional()
        .isMobilePhone("vi-VN")
        .withMessage("Valid Vietnamese phone number required"),
      body("contactEmail")
        .optional()
        .isEmail()
        .withMessage("Valid email required"),
      body("preferredContactMethod")
        .optional()
        .isIn(["SMS", "EMAIL", "PUSH", "CALL"])
        .withMessage("Invalid contact method"),
      validateRequest,
    ],
    (req: Request, res: Response) => controller.addToWaitlist(req, res),
  );

  /**
   * GET /waitlist
   * Get waitlist entries with filters
   */
  router.get(
    "/",
    authenticate,
    [
      query("patientId")
        .optional()
        .isUUID()
        .withMessage("Valid patient ID required"),
      query("doctorId")
        .optional()
        .isUUID()
        .withMessage("Valid doctor ID required"),
      query("departmentId")
        .optional()
        .isUUID()
        .withMessage("Valid department ID required"),
      query("date")
        .optional()
        .isISO8601()
        .withMessage("Valid date required (YYYY-MM-DD)"),
      query("appointmentType")
        .optional()
        .isString()
        .withMessage("Appointment type must be a string"),
      query("priority")
        .optional()
        .isIn(["EMERGENCY", "URGENT", "NORMAL", "LOW"])
        .withMessage("Invalid priority"),
      query("status")
        .optional()
        .isIn(["WAITING", "MATCHED", "CONVERTED", "CANCELLED", "EXPIRED"])
        .withMessage("Invalid status"),
      query("isExpired")
        .optional()
        .isBoolean()
        .withMessage("isExpired must be boolean"),
      query("limit")
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage("Limit must be between 1 and 100"),
      query("offset")
        .optional()
        .isInt({ min: 0 })
        .withMessage("Offset must be >= 0"),
      validateRequest,
    ],
    (req: Request, res: Response) => controller.getWaitlist(req, res),
  );

  /**
   * PUT /waitlist/:waitlistId
   * Update waitlist entry
   */
  router.put(
    "/:waitlistId",
    authenticate,
    [
      param("waitlistId").isUUID().withMessage("Valid waitlist ID is required"),
      body("preferredDate")
        .optional()
        .isISO8601()
        .withMessage("Valid date required (YYYY-MM-DD)"),
      body("preferredTimeSlot")
        .optional()
        .isString()
        .withMessage("Valid time slot required"),
      body("preferredDoctorId")
        .optional()
        .isUUID()
        .withMessage("Valid doctor ID required"),
      body("priority")
        .optional()
        .isIn(["EMERGENCY", "URGENT", "NORMAL", "LOW"])
        .withMessage("Invalid priority"),
      body("notes").optional().isString().withMessage("Notes must be a string"),
      body("status")
        .optional()
        .isIn(["WAITING", "MATCHED", "CONVERTED", "CANCELLED", "EXPIRED"])
        .withMessage("Invalid status"),
      body("isFlexibleDate")
        .optional()
        .isBoolean()
        .withMessage("isFlexibleDate must be boolean"),
      body("isFlexibleTime")
        .optional()
        .isBoolean()
        .withMessage("isFlexibleTime must be boolean"),
      body("isFlexibleDoctor")
        .optional()
        .isBoolean()
        .withMessage("isFlexibleDoctor must be boolean"),
      validateRequest,
    ],
    (req: Request, res: Response) => controller.updateWaitlistEntry(req, res),
  );

  /**
   * DELETE /waitlist/:waitlistId
   * Remove from waitlist (cancel)
   */
  router.delete(
    "/:waitlistId",
    authenticate,
    [
      param("waitlistId").isUUID().withMessage("Valid waitlist ID is required"),
      body("reason")
        .optional()
        .isString()
        .withMessage("Reason must be a string"),
      validateRequest,
    ],
    (req: Request, res: Response) => controller.removeFromWaitlist(req, res),
  );

  /**
   * POST /waitlist/:waitlistId/convert
   * Convert waitlist entry to appointment
   */
  router.post(
    "/:waitlistId/convert",
    authenticate,
    requireRole(["ADMIN", "DOCTOR", "NURSE"]),
    [
      param("waitlistId").isUUID().withMessage("Valid waitlist ID is required"),
      body("appointmentDate")
        .matches(/^\d{4}-\d{2}-\d{2}$/)
        .withMessage("Valid date required (YYYY-MM-DD)"),
      body("appointmentTime")
        .matches(/^\d{2}:\d{2}(:\d{2})?$/)
        .withMessage("Valid time required (HH:mm or HH:mm:ss)"),
      body("doctorId").isUUID().withMessage("Valid doctor ID is required"),
      body("departmentId")
        .optional()
        .isUUID()
        .withMessage("Valid department ID required"),
      body("durationMinutes")
        .optional()
        .isInt({ min: 5, max: 480 })
        .withMessage("Duration must be between 5 and 480 minutes"),
      validateRequest,
    ],
    (req: Request, res: Response) => controller.convertToAppointment(req, res),
  );

  return router;
}
