/**
 * Reminder Routes - Presentation Layer
 * Defines HTTP routes for MANUAL appointment reminders (Alternative API)
 *
 *  ALTERNATIVE API - Use only for special cases 
 *
 * These routes provide manual reminder management. For standard appointment reminders,
 * use the existing auto-scheduling system (AppointmentScheduledSchedulerHandler).
 *
 * ROUTES:
 * - POST   /:appointmentId/reminders - Create manual reminder
 * - GET    /:appointmentId/reminders - Get manual reminders
 * - PUT    /reminders/:reminderId - Update manual reminder
 * - DELETE /reminders/:reminderId - Delete manual reminder
 *
 * NOTE: These routes do NOT interact with Scheduler Service or auto-generated reminders.
 *
 * @see ReminderController for detailed documentation
 * @see AppointmentScheduledSchedulerHandler for auto-scheduling
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Clean Architecture, REST API
 */

import { Router, Request, Response } from "express";
import { ReminderController } from "../controllers/ReminderController";
import { body, param } from "express-validator";
import { validateRequest } from "../middleware/validateRequest";

/**
 * Create reminder routes
 *
 * Routes are mounted at /api/v1/appointments in main.ts
 * So these routes become:
 * - POST   /api/v1/appointments/:appointmentId/reminders
 * - GET    /api/v1/appointments/:appointmentId/reminders
 * - PUT    /api/v1/appointments/reminders/:reminderId
 * - DELETE /api/v1/appointments/reminders/:reminderId
 */
export function createReminderRoutes(controller: ReminderController): Router {
  const router = Router();

  /**
   * POST /:appointmentId/reminders
   * Create a new reminder for an appointment
   */
  router.post(
    "/:appointmentId/reminders",
    [
      param("appointmentId").isUUID().withMessage("Invalid appointment ID"),
      body("reminderType")
        .isIn(["email", "sms", "push", "in_app"])
        .withMessage("Invalid reminder type"),
      body("reminderChannel")
        .isIn(["email", "sms", "push_notification", "in_app_notification"])
        .withMessage("Invalid reminder channel"),
      body("sendBeforeMinutes")
        .isInt({ min: 1 })
        .withMessage("Send before minutes must be positive"),
      body("message").notEmpty().withMessage("Message is required"),
      body("recipientType")
        .isIn(["patient", "doctor", "both"])
        .withMessage("Invalid recipient type"),
      body("recipientEmail")
        .optional()
        .isEmail()
        .withMessage("Invalid email address"),
      body("recipientPhone")
        .optional()
        .matches(/^\+?[1-9]\d{1,14}$/)
        .withMessage("Invalid phone number"),
      body("priority")
        .optional()
        .isIn(["low", "normal", "high", "urgent"])
        .withMessage("Invalid priority"),
      body("maxRetries")
        .optional()
        .isInt({ min: 0, max: 10 })
        .withMessage("Max retries must be between 0 and 10"),
      validateRequest,
    ],
    (req: Request, res: Response) => controller.createReminder(req, res),
  );

  /**
   * GET /:appointmentId/reminders
   * Get all reminders for an appointment
   */
  router.get(
    "/:appointmentId/reminders",
    [
      param("appointmentId").isUUID().withMessage("Invalid appointment ID"),
      validateRequest,
    ],
    (req: Request, res: Response) => controller.getReminders(req, res),
  );

  /**
   * PUT /reminders/:reminderId
   * Update a reminder
   */
  router.put(
    "/reminders/:reminderId",
    [
      param("reminderId").isUUID().withMessage("Invalid reminder ID"),
      body("subject")
        .optional()
        .isString()
        .withMessage("Subject must be a string"),
      body("message")
        .optional()
        .isString()
        .withMessage("Message must be a string"),
      body("priority")
        .optional()
        .isIn(["low", "normal", "high", "urgent"])
        .withMessage("Invalid priority"),
      body("metadata")
        .optional()
        .isObject()
        .withMessage("Metadata must be an object"),
      validateRequest,
    ],
    (req: Request, res: Response) => controller.updateReminder(req, res),
  );

  /**
   * DELETE /reminders/:reminderId
   * Delete a reminder
   */
  router.delete(
    "/reminders/:reminderId",
    [
      param("reminderId").isUUID().withMessage("Invalid reminder ID"),
      validateRequest,
    ],
    (req: Request, res: Response) => controller.deleteReminder(req, res),
  );

  return router;
}
