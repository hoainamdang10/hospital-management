"use strict";
/**
 * Waitlist Routes - Presentation Layer
 * Defines HTTP routes for appointment waitlist management
 *
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Clean Architecture, REST API
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWaitlistRoutes = createWaitlistRoutes;
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const validateRequest_1 = require("../middleware/validateRequest");
const AuthMiddleware_1 = require("../middleware/AuthMiddleware");
const container_1 = require("../../infrastructure/di/container");
/**
 * Create waitlist routes
 */
function createWaitlistRoutes() {
    const router = (0, express_1.Router)();
    // Get controller from DI container
    const container = (0, container_1.getContainer)();
    const controller = container.getWaitlistController();
    /**
     * POST /waitlist
     * Add patient to waitlist
     */
    router.post("/", AuthMiddleware_1.authenticate, [
        (0, express_validator_1.body)("patientId").isUUID().withMessage("Valid patient ID is required"),
        (0, express_validator_1.body)("preferredDoctorId")
            .optional()
            .isUUID()
            .withMessage("Valid doctor ID required"),
        (0, express_validator_1.body)("preferredDepartmentId")
            .optional()
            .isUUID()
            .withMessage("Valid department ID required"),
        (0, express_validator_1.body)("preferredDate")
            .optional()
            .isISO8601()
            .withMessage("Valid date required (YYYY-MM-DD)"),
        (0, express_validator_1.body)("preferredTimeSlot")
            .optional()
            .isString()
            .withMessage("Valid time slot required"),
        (0, express_validator_1.body)("appointmentType")
            .notEmpty()
            .withMessage("Appointment type is required"),
        (0, express_validator_1.body)("priority")
            .optional()
            .isIn(["EMERGENCY", "URGENT", "NORMAL", "LOW"])
            .withMessage("Invalid priority"),
        (0, express_validator_1.body)("notes").optional().isString().withMessage("Notes must be a string"),
        (0, express_validator_1.body)("reason")
            .optional()
            .isString()
            .withMessage("Reason must be a string"),
        (0, express_validator_1.body)("isFlexibleDate")
            .optional()
            .isBoolean()
            .withMessage("isFlexibleDate must be boolean"),
        (0, express_validator_1.body)("isFlexibleTime")
            .optional()
            .isBoolean()
            .withMessage("isFlexibleTime must be boolean"),
        (0, express_validator_1.body)("isFlexibleDoctor")
            .optional()
            .isBoolean()
            .withMessage("isFlexibleDoctor must be boolean"),
        (0, express_validator_1.body)("expiresAt")
            .optional()
            .isISO8601()
            .withMessage("Valid expiration date required"),
        (0, express_validator_1.body)("contactPhone")
            .optional()
            .isMobilePhone("vi-VN")
            .withMessage("Valid Vietnamese phone number required"),
        (0, express_validator_1.body)("contactEmail")
            .optional()
            .isEmail()
            .withMessage("Valid email required"),
        (0, express_validator_1.body)("preferredContactMethod")
            .optional()
            .isIn(["SMS", "EMAIL", "PUSH", "CALL"])
            .withMessage("Invalid contact method"),
        validateRequest_1.validateRequest,
    ], (req, res) => controller.addToWaitlist(req, res));
    /**
     * GET /waitlist
     * Get waitlist entries with filters
     */
    router.get("/", AuthMiddleware_1.authenticate, [
        (0, express_validator_1.query)("patientId")
            .optional()
            .isUUID()
            .withMessage("Valid patient ID required"),
        (0, express_validator_1.query)("doctorId")
            .optional()
            .isUUID()
            .withMessage("Valid doctor ID required"),
        (0, express_validator_1.query)("departmentId")
            .optional()
            .isUUID()
            .withMessage("Valid department ID required"),
        (0, express_validator_1.query)("date")
            .optional()
            .isISO8601()
            .withMessage("Valid date required (YYYY-MM-DD)"),
        (0, express_validator_1.query)("appointmentType")
            .optional()
            .isString()
            .withMessage("Appointment type must be a string"),
        (0, express_validator_1.query)("priority")
            .optional()
            .isIn(["EMERGENCY", "URGENT", "NORMAL", "LOW"])
            .withMessage("Invalid priority"),
        (0, express_validator_1.query)("status")
            .optional()
            .isIn(["WAITING", "MATCHED", "CONVERTED", "CANCELLED", "EXPIRED"])
            .withMessage("Invalid status"),
        (0, express_validator_1.query)("isExpired")
            .optional()
            .isBoolean()
            .withMessage("isExpired must be boolean"),
        (0, express_validator_1.query)("limit")
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage("Limit must be between 1 and 100"),
        (0, express_validator_1.query)("offset")
            .optional()
            .isInt({ min: 0 })
            .withMessage("Offset must be >= 0"),
        validateRequest_1.validateRequest,
    ], (req, res) => controller.getWaitlist(req, res));
    /**
     * PUT /waitlist/:waitlistId
     * Update waitlist entry
     */
    router.put("/:waitlistId", AuthMiddleware_1.authenticate, [
        (0, express_validator_1.param)("waitlistId").isUUID().withMessage("Valid waitlist ID is required"),
        (0, express_validator_1.body)("preferredDate")
            .optional()
            .isISO8601()
            .withMessage("Valid date required (YYYY-MM-DD)"),
        (0, express_validator_1.body)("preferredTimeSlot")
            .optional()
            .isString()
            .withMessage("Valid time slot required"),
        (0, express_validator_1.body)("preferredDoctorId")
            .optional()
            .isUUID()
            .withMessage("Valid doctor ID required"),
        (0, express_validator_1.body)("priority")
            .optional()
            .isIn(["EMERGENCY", "URGENT", "NORMAL", "LOW"])
            .withMessage("Invalid priority"),
        (0, express_validator_1.body)("notes").optional().isString().withMessage("Notes must be a string"),
        (0, express_validator_1.body)("status")
            .optional()
            .isIn(["WAITING", "MATCHED", "CONVERTED", "CANCELLED", "EXPIRED"])
            .withMessage("Invalid status"),
        (0, express_validator_1.body)("isFlexibleDate")
            .optional()
            .isBoolean()
            .withMessage("isFlexibleDate must be boolean"),
        (0, express_validator_1.body)("isFlexibleTime")
            .optional()
            .isBoolean()
            .withMessage("isFlexibleTime must be boolean"),
        (0, express_validator_1.body)("isFlexibleDoctor")
            .optional()
            .isBoolean()
            .withMessage("isFlexibleDoctor must be boolean"),
        validateRequest_1.validateRequest,
    ], (req, res) => controller.updateWaitlistEntry(req, res));
    /**
     * DELETE /waitlist/:waitlistId
     * Remove from waitlist (cancel)
     */
    router.delete("/:waitlistId", AuthMiddleware_1.authenticate, [
        (0, express_validator_1.param)("waitlistId").isUUID().withMessage("Valid waitlist ID is required"),
        (0, express_validator_1.body)("reason")
            .optional()
            .isString()
            .withMessage("Reason must be a string"),
        validateRequest_1.validateRequest,
    ], (req, res) => controller.removeFromWaitlist(req, res));
    /**
     * POST /waitlist/:waitlistId/convert
     * Convert waitlist entry to appointment
     */
    router.post("/:waitlistId/convert", AuthMiddleware_1.authenticate, (0, AuthMiddleware_1.requireRole)(["ADMIN", "DOCTOR", "NURSE"]), [
        (0, express_validator_1.param)("waitlistId").isUUID().withMessage("Valid waitlist ID is required"),
        (0, express_validator_1.body)("appointmentDate")
            .matches(/^\d{4}-\d{2}-\d{2}$/)
            .withMessage("Valid date required (YYYY-MM-DD)"),
        (0, express_validator_1.body)("appointmentTime")
            .matches(/^\d{2}:\d{2}(:\d{2})?$/)
            .withMessage("Valid time required (HH:mm or HH:mm:ss)"),
        (0, express_validator_1.body)("doctorId").isUUID().withMessage("Valid doctor ID is required"),
        (0, express_validator_1.body)("departmentId")
            .optional()
            .isUUID()
            .withMessage("Valid department ID required"),
        (0, express_validator_1.body)("durationMinutes")
            .optional()
            .isInt({ min: 5, max: 480 })
            .withMessage("Duration must be between 5 and 480 minutes"),
        validateRequest_1.validateRequest,
    ], (req, res) => controller.convertToAppointment(req, res));
    return router;
}
//# sourceMappingURL=waitlist.routes.js.map