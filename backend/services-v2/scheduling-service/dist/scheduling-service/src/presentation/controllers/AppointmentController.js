"use strict";
/**
 * Appointment Controller - Presentation Layer
 * V3 Clean Architecture Implementation
 * REST API endpoints for appointment management
 *
 * @author Hospital Management Team
 * @version 3.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentController = void 0;
class AppointmentController {
    constructor(scheduleAppointmentUseCase, cancelAppointmentUseCase, confirmAppointmentUseCase, completeAppointmentUseCase, getAppointmentUseCase, listAppointmentsUseCase) {
        this.scheduleAppointmentUseCase = scheduleAppointmentUseCase;
        this.cancelAppointmentUseCase = cancelAppointmentUseCase;
        this.confirmAppointmentUseCase = confirmAppointmentUseCase;
        this.completeAppointmentUseCase = completeAppointmentUseCase;
        this.getAppointmentUseCase = getAppointmentUseCase;
        this.listAppointmentsUseCase = listAppointmentsUseCase;
    }
    /**
     * POST /api/appointments
     * Schedule a new appointment
     */
    async scheduleAppointment(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'Unauthorized'
                });
                return;
            }
            const result = await this.scheduleAppointmentUseCase.execute({
                ...req.body,
                createdBy: userId
            }, { userId });
            res.status(result.success ? 201 : 400).json(result);
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                errors: [error instanceof Error ? error.message : 'Unknown error']
            });
        }
    }
    /**
     * GET /api/appointments/:id
     * Get appointment by ID
     */
    async getAppointment(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'Unauthorized'
                });
                return;
            }
            const result = await this.getAppointmentUseCase.execute({
                appointmentId: req.params.id
            }, { userId });
            res.status(result.success ? 200 : 404).json(result);
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                errors: [error instanceof Error ? error.message : 'Unknown error']
            });
        }
    }
    /**
     * GET /api/appointments
     * List appointments with filters
     */
    async listAppointments(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'Unauthorized'
                });
                return;
            }
            const result = await this.listAppointmentsUseCase.execute({
                patientId: req.query.patientId,
                doctorId: req.query.doctorId,
                startDate: req.query.startDate,
                endDate: req.query.endDate
            }, { userId });
            res.status(result.success ? 200 : 400).json(result);
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                errors: [error instanceof Error ? error.message : 'Unknown error']
            });
        }
    }
    /**
     * POST /api/appointments/:id/confirm
     * Confirm appointment
     */
    async confirmAppointment(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'Unauthorized'
                });
                return;
            }
            const result = await this.confirmAppointmentUseCase.execute({
                appointmentId: req.params.id,
                confirmedBy: userId
            }, { userId });
            res.status(result.success ? 200 : 400).json(result);
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                errors: [error instanceof Error ? error.message : 'Unknown error']
            });
        }
    }
    /**
     * POST /api/appointments/:id/complete
     * Complete appointment
     */
    async completeAppointment(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'Unauthorized'
                });
                return;
            }
            const result = await this.completeAppointmentUseCase.execute({
                appointmentId: req.params.id
            }, { userId });
            res.status(result.success ? 200 : 400).json(result);
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                errors: [error instanceof Error ? error.message : 'Unknown error']
            });
        }
    }
    /**
     * POST /api/appointments/:id/cancel
     * Cancel appointment
     */
    async cancelAppointment(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'Unauthorized'
                });
                return;
            }
            const result = await this.cancelAppointmentUseCase.execute({
                appointmentId: req.params.id,
                cancellationReason: req.body.cancellationReason,
                cancelledBy: userId
            }, { userId });
            res.status(result.success ? 200 : 400).json(result);
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                errors: [error instanceof Error ? error.message : 'Unknown error']
            });
        }
    }
}
exports.AppointmentController = AppointmentController;
//# sourceMappingURL=AppointmentController.js.map