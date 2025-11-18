"use strict";
/**
 * Appointment Routes - Presentation Layer
 * V3 Clean Architecture Implementation
 * REST API routes for appointment management (Commands)
 *
 * @author Hospital Management Team
 * @version 3.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAppointmentRoutes = createAppointmentRoutes;
const express_1 = require("express");
const container_1 = require("../../infrastructure/di/container");
const IdempotencyMiddleware_1 = require("../middleware/IdempotencyMiddleware");
const AuthMiddleware_1 = require("../middleware/AuthMiddleware");
const ValidationMiddleware_1 = require("../middleware/ValidationMiddleware");
const ValidationSchemas_1 = require("../dto/ValidationSchemas");
/**
 * Create appointment command routes
 * Uses DI container for dependency injection
 */
function createAppointmentRoutes() {
    const router = (0, express_1.Router)();
    const container = (0, container_1.getContainer)();
    const controller = container.getAppointmentController();
    // Command Routes (Write Operations) - with auth, validation, and idempotency
    // Simplified booking endpoint for patient self-service (MVP)
    // Minimal validation - patient enters own info
    router.post('/appointments/book', AuthMiddleware_1.authenticate, IdempotencyMiddleware_1.idempotencyMiddleware, (req, res) => controller.scheduleAppointmentSimplified(req, res));
    router.post('/appointments', AuthMiddleware_1.authenticate, (0, ValidationMiddleware_1.validateRequest)(ValidationSchemas_1.scheduleAppointmentSchema, 'body'), IdempotencyMiddleware_1.idempotencyMiddleware, (req, res) => controller.scheduleAppointment(req, res));
    router.post('/appointments/:id/confirm', AuthMiddleware_1.authenticate, (0, AuthMiddleware_1.requireRole)(['DOCTOR', 'NURSE', 'ADMIN']), (0, ValidationMiddleware_1.validateRequest)(ValidationSchemas_1.confirmAppointmentSchema, 'body'), IdempotencyMiddleware_1.idempotencyMiddleware, (req, res) => controller.confirmAppointment(req, res));
    router.post('/appointments/:id/complete', AuthMiddleware_1.authenticate, (0, AuthMiddleware_1.requireRole)(['DOCTOR', 'NURSE']), IdempotencyMiddleware_1.idempotencyMiddleware, (req, res) => controller.completeAppointment(req, res));
    router.post('/appointments/:id/cancel', AuthMiddleware_1.authenticate, (0, ValidationMiddleware_1.validateRequest)(ValidationSchemas_1.cancelAppointmentSchema, 'body'), IdempotencyMiddleware_1.idempotencyMiddleware, (req, res) => controller.cancelAppointment(req, res));
    // Phase 1: Critical Use Cases
    router.post('/appointments/:id/reschedule', AuthMiddleware_1.authenticate, (0, ValidationMiddleware_1.validateRequest)(ValidationSchemas_1.rescheduleAppointmentSchema, 'body'), IdempotencyMiddleware_1.idempotencyMiddleware, (req, res) => controller.rescheduleAppointment(req, res));
    router.post('/appointments/:id/check-in', AuthMiddleware_1.authenticate, (0, AuthMiddleware_1.requireRole)(['RECEPTIONIST', 'NURSE', 'ADMIN']), IdempotencyMiddleware_1.idempotencyMiddleware, (req, res) => controller.checkInAppointment(req, res));
    router.post('/appointments/:id/no-show', AuthMiddleware_1.authenticate, (0, AuthMiddleware_1.requireRole)(['RECEPTIONIST', 'DOCTOR', 'NURSE', 'ADMIN']), IdempotencyMiddleware_1.idempotencyMiddleware, (req, res) => controller.markAsNoShow(req, res));
    router.post('/appointments/:id/start', AuthMiddleware_1.authenticate, (0, AuthMiddleware_1.requireRole)(['DOCTOR']), IdempotencyMiddleware_1.idempotencyMiddleware, (req, res) => controller.startAppointment(req, res));
    // Phase 3: Nice-to-Have Features
    // ===== ARCHIVED FOR POST-MVP: BulkReschedule Route =====
    // router.post(
    //   '/appointments/bulk-reschedule',
    //   authenticate,
    //   requireRole(['ADMIN', 'DOCTOR']),
    //   idempotencyMiddleware,
    //   (req, res) => controller.bulkRescheduleAppointments(req, res)
    // );
    router.get('/appointments/history', AuthMiddleware_1.authenticate, (req, res) => controller.getAppointmentHistory(req, res));
    router.get('/appointments/statistics', AuthMiddleware_1.authenticate, (0, AuthMiddleware_1.requireRole)(['ADMIN', 'DOCTOR']), (req, res) => controller.getAppointmentStatistics(req, res));
    router.post('/appointments/emergency', AuthMiddleware_1.authenticate, (0, AuthMiddleware_1.requireRole)(['DOCTOR', 'NURSE', 'ADMIN']), IdempotencyMiddleware_1.idempotencyMiddleware, (req, res) => controller.createEmergencyAppointment(req, res));
    router.post('/appointments/:id/transfer', AuthMiddleware_1.authenticate, (0, AuthMiddleware_1.requireRole)(['ADMIN', 'DOCTOR']), IdempotencyMiddleware_1.idempotencyMiddleware, (req, res) => controller.transferAppointment(req, res));
    // Recurring appointments
    router.post('/appointments/recurring', AuthMiddleware_1.authenticate, (0, AuthMiddleware_1.requireRole)(['ADMIN', 'DOCTOR']), IdempotencyMiddleware_1.idempotencyMiddleware, (req, res) => controller.createRecurringAppointmentSeries(req, res));
    // Utilities
    router.get('/appointments/:id/preview-reminders', AuthMiddleware_1.authenticate, (req, res) => controller.previewReminders(req, res));
    // Legacy Query Routes (for backward compatibility)
    // Note: These use write model, not read model
    router.get('/appointments/:id', AuthMiddleware_1.authenticate, (0, ValidationMiddleware_1.validateRequest)(ValidationSchemas_1.getAppointmentSchema, 'params'), (req, res) => controller.getAppointment(req, res));
    router.get('/appointments', AuthMiddleware_1.authenticate, (0, ValidationMiddleware_1.validateRequest)(ValidationSchemas_1.listAppointmentsSchema, 'query'), (req, res) => controller.listAppointments(req, res));
    return router;
}
//# sourceMappingURL=appointment.routes.js.map