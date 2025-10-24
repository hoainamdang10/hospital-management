"use strict";
/**
 * Appointment Query Routes - Presentation Layer
 * REST API routes for appointment queries (CQRS Read Model)
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, REST API
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAppointmentQueryRoutes = createAppointmentQueryRoutes;
const express_1 = require("express");
const container_1 = require("../../infrastructure/di/container");
/**
 * Create appointment query routes
 * Uses DI container for dependency injection
 */
function createAppointmentQueryRoutes() {
    const router = (0, express_1.Router)();
    const container = (0, container_1.getContainer)();
    const controller = container.getAppointmentQueryController();
    /**
     * GET /api/v2/appointments/:id
     * Get appointment details with patient/doctor info (Read Model)
     */
    router.get('/appointments/:id', (req, res) => controller.getAppointmentDetails(req, res));
    /**
     * GET /api/v2/appointments
     * List appointments with filters and pagination (Read Model)
     */
    router.get('/appointments', (req, res) => controller.listAppointments(req, res));
    /**
     * GET /api/v2/patients/:patientId/appointments
     * Get appointments for a specific patient (Read Model)
     */
    router.get('/patients/:patientId/appointments', (req, res) => controller.getPatientAppointments(req, res));
    /**
     * GET /api/v2/doctors/:doctorId/appointments
     * Get appointments for a specific doctor (Read Model)
     */
    router.get('/doctors/:doctorId/appointments', (req, res) => controller.getDoctorAppointments(req, res));
    return router;
}
//# sourceMappingURL=appointmentQueryRoutes.js.map