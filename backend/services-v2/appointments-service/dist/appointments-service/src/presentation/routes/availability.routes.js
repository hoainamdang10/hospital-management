"use strict";
/**
 * Availability Routes - Presentation Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * Routes for provider availability queries
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, RESTful API, Vietnamese Healthcare Standards
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAvailabilityRoutes = createAvailabilityRoutes;
const express_1 = require("express");
const container_1 = require("../../infrastructure/di/container");
const AuthMiddleware_1 = require("../middleware/AuthMiddleware");
const ValidationMiddleware_1 = require("../middleware/ValidationMiddleware");
const joi_1 = __importDefault(require("joi"));
/**
 * Validation schemas for availability routes
 */
const availableSlotsSchema = joi_1.default.object({
    date: joi_1.default.string()
        .pattern(/^\d{4}-\d{2}-\d{2}$/)
        .required()
        .messages({
        'string.pattern.base': 'Date is required in format YYYY-MM-DD',
        'any.required': 'Ngày là bắt buộc'
    }),
    duration: joi_1.default.number()
        .integer()
        .min(15)
        .max(120)
        .default(30)
        .messages({
        'number.base': 'Thời lượng phải là số',
        'number.min': 'Thời lượng tối thiểu 15 phút',
        'number.max': 'Thời lượng tối đa 120 phút'
    })
});
const providerIdSchema = joi_1.default.object({
    providerId: joi_1.default.string()
        .pattern(/^[A-Z]{2,4}-[A-Z]{2,4}-\d{6}-\d{3}$/) // Matches: DOC-INTE-202511-940, HAL-INTE-202511-948, CARD-DOC-202511-001, etc.
        .required()
        .messages({
        'string.pattern.base': 'Mã bác sĩ không đúng định dạng (XXXX-YYYY-YYYYMM-NNN)',
        'any.required': 'Mã bác sĩ là bắt buộc'
    })
});
/**
 * Create availability routes
 * Uses DI container for dependency injection
 *
 * Routes:
 * - GET /api/v1/appointments/providers/:providerId/available-slots
 * - GET /api/v1/appointments/providers/:providerId/schedule
 */
function createAvailabilityRoutes() {
    const router = (0, express_1.Router)();
    const container = (0, container_1.getContainer)();
    // Get AvailabilityController from DI container
    const availabilityController = container.getAvailabilityController();
    /**
     * GET /api/v1/appointments/providers/:providerId/available-slots
     *
     * Get available time slots for provider on specific date
     *
     * Query params:
     * - date: YYYY-MM-DD (required)
     * - duration: number in minutes (optional, default: 30)
     *
     * Example: GET /api/v1/appointments/providers/DEPT-DOC-202510-001/available-slots?date=2025-10-24&duration=30
     */
    router.get('/providers/:providerId/available-slots', AuthMiddleware_1.authenticate, (0, ValidationMiddleware_1.validateRequest)(providerIdSchema, 'params'), (0, ValidationMiddleware_1.validateRequest)(availableSlotsSchema, 'query'), (req, res) => availabilityController.getAvailableTimeSlots(req, res));
    /**
     * GET /api/appointments/providers/:providerId/schedule
     *
     * Get cached work schedule template for provider
     *
     * Example: GET /api/appointments/providers/DEPT-DOC-202510-001/schedule
     */
    router.get('/providers/:providerId/schedule', AuthMiddleware_1.authenticate, (0, ValidationMiddleware_1.validateRequest)(providerIdSchema, 'params'), (req, res) => availabilityController.getProviderSchedule(req, res));
    return router;
}
//# sourceMappingURL=availability.routes.js.map