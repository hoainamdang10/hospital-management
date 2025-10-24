"use strict";
/**
 * Availability Routes - Presentation Layer
 * V2 Clean Architecture + DDD Implementation
 *
 * Routes for provider availability queries
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, RESTful API, Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAvailabilityRoutes = createAvailabilityRoutes;
const express_1 = require("express");
const AvailabilityController_1 = require("../controllers/AvailabilityController");
const FindAvailableTimeSlotsUseCase_1 = require("../../application/use-cases/FindAvailableTimeSlotsUseCase");
const SupabaseProviderScheduleRepository_1 = require("../../infrastructure/persistence/SupabaseProviderScheduleRepository");
const SupabaseAppointmentRepository_1 = require("../../infrastructure/persistence/SupabaseAppointmentRepository");
/**
 * Create availability routes
 *
 * Routes:
 * - GET /api/appointments/providers/:providerId/available-slots
 * - GET /api/appointments/providers/:providerId/schedule
 */
function createAvailabilityRoutes() {
    const router = (0, express_1.Router)();
    // Get environment variables
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) {
        throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
    }
    // Initialize repositories
    const providerScheduleRepository = new SupabaseProviderScheduleRepository_1.SupabaseProviderScheduleRepository(supabaseUrl, supabaseKey);
    const appointmentRepository = new SupabaseAppointmentRepository_1.SupabaseAppointmentRepository(supabaseUrl, supabaseKey);
    // Initialize use case
    const findAvailableTimeSlotsUseCase = new FindAvailableTimeSlotsUseCase_1.FindAvailableTimeSlotsUseCase(providerScheduleRepository, appointmentRepository);
    // Initialize controller
    const availabilityController = new AvailabilityController_1.AvailabilityController(findAvailableTimeSlotsUseCase, providerScheduleRepository);
    /**
     * GET /api/appointments/providers/:providerId/available-slots
     *
     * Get available time slots for provider on specific date
     *
     * Query params:
     * - date: YYYY-MM-DD (required)
     * - duration: number in minutes (optional, default: 30)
     *
     * Example: GET /api/appointments/providers/123/available-slots?date=2025-10-24&duration=30
     */
    router.get('/providers/:providerId/available-slots', (req, res) => availabilityController.getAvailableTimeSlots(req, res));
    /**
     * GET /api/appointments/providers/:providerId/schedule
     *
     * Get cached work schedule template for provider
     *
     * Example: GET /api/appointments/providers/123/schedule
     */
    router.get('/providers/:providerId/schedule', (req, res) => availabilityController.getProviderSchedule(req, res));
    return router;
}
//# sourceMappingURL=availability.routes.js.map