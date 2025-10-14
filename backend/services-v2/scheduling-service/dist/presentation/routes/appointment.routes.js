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
/**
 * Create appointment command routes
 * Uses DI container for dependency injection
 */
function createAppointmentRoutes() {
    const router = (0, express_1.Router)();
    const container = (0, container_1.getContainer)();
    const controller = container.getAppointmentController();
    // Command Routes (Write Operations)
    router.post('/appointments', (req, res) => controller.scheduleAppointment(req, res));
    router.post('/appointments/:id/confirm', (req, res) => controller.confirmAppointment(req, res));
    router.post('/appointments/:id/complete', (req, res) => controller.completeAppointment(req, res));
    router.post('/appointments/:id/cancel', (req, res) => controller.cancelAppointment(req, res));
    // Legacy Query Routes (for backward compatibility)
    // Note: These use write model, not read model
    router.get('/appointments/:id', (req, res) => controller.getAppointment(req, res));
    router.get('/appointments', (req, res) => controller.listAppointments(req, res));
    return router;
}
//# sourceMappingURL=appointment.routes.js.map