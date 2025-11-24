"use strict";
/**
 * Reminder Routes - Presentation Layer
 * Defines HTTP routes for MANUAL appointment reminders (Alternative API)
 *
 * ⚠️ ALTERNATIVE API - Use only for special cases ⚠️
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReminderRoutes = createReminderRoutes;
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const validateRequest_1 = require("../middleware/validateRequest");
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
function createReminderRoutes(controller) {
    const router = (0, express_1.Router)();
    /**
     * POST /:appointmentId/reminders
     * Create a new reminder for an appointment
     */
    router.post("/:appointmentId/reminders", [
        (0, express_validator_1.param)("appointmentId").isUUID().withMessage("Invalid appointment ID"),
        (0, express_validator_1.body)("reminderType")
            .isIn(["email", "sms", "push", "in_app"])
            .withMessage("Invalid reminder type"),
        (0, express_validator_1.body)("reminderChannel")
            .isIn(["email", "sms", "push_notification", "in_app_notification"])
            .withMessage("Invalid reminder channel"),
        (0, express_validator_1.body)("sendBeforeMinutes")
            .isInt({ min: 1 })
            .withMessage("Send before minutes must be positive"),
        (0, express_validator_1.body)("message").notEmpty().withMessage("Message is required"),
        (0, express_validator_1.body)("recipientType")
            .isIn(["patient", "doctor", "both"])
            .withMessage("Invalid recipient type"),
        (0, express_validator_1.body)("recipientEmail")
            .optional()
            .isEmail()
            .withMessage("Invalid email address"),
        (0, express_validator_1.body)("recipientPhone")
            .optional()
            .matches(/^\+?[1-9]\d{1,14}$/)
            .withMessage("Invalid phone number"),
        (0, express_validator_1.body)("priority")
            .optional()
            .isIn(["low", "normal", "high", "urgent"])
            .withMessage("Invalid priority"),
        (0, express_validator_1.body)("maxRetries")
            .optional()
            .isInt({ min: 0, max: 10 })
            .withMessage("Max retries must be between 0 and 10"),
        validateRequest_1.validateRequest,
    ], (req, res) => controller.createReminder(req, res));
    /**
     * GET /:appointmentId/reminders
     * Get all reminders for an appointment
     */
    router.get("/:appointmentId/reminders", [
        (0, express_validator_1.param)("appointmentId").isUUID().withMessage("Invalid appointment ID"),
        validateRequest_1.validateRequest,
    ], (req, res) => controller.getReminders(req, res));
    /**
     * PUT /reminders/:reminderId
     * Update a reminder
     */
    router.put("/reminders/:reminderId", [
        (0, express_validator_1.param)("reminderId").isUUID().withMessage("Invalid reminder ID"),
        (0, express_validator_1.body)("subject")
            .optional()
            .isString()
            .withMessage("Subject must be a string"),
        (0, express_validator_1.body)("message")
            .optional()
            .isString()
            .withMessage("Message must be a string"),
        (0, express_validator_1.body)("priority")
            .optional()
            .isIn(["low", "normal", "high", "urgent"])
            .withMessage("Invalid priority"),
        (0, express_validator_1.body)("metadata")
            .optional()
            .isObject()
            .withMessage("Metadata must be an object"),
        validateRequest_1.validateRequest,
    ], (req, res) => controller.updateReminder(req, res));
    /**
     * DELETE /reminders/:reminderId
     * Delete a reminder
     */
    router.delete("/reminders/:reminderId", [
        (0, express_validator_1.param)("reminderId").isUUID().withMessage("Invalid reminder ID"),
        validateRequest_1.validateRequest,
    ], (req, res) => controller.deleteReminder(req, res));
    return router;
}
//# sourceMappingURL=reminder.routes.js.map