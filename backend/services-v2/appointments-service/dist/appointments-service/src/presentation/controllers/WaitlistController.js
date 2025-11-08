"use strict";
/**
 * WaitlistController - Presentation Layer
 * Handles HTTP requests for appointment waitlist management
 *
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Clean Architecture, REST API
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WaitlistController = void 0;
/**
 * Waitlist Controller
 */
class WaitlistController {
    constructor(addToWaitlistUseCase, getWaitlistUseCase, updateWaitlistEntryUseCase, removeFromWaitlistUseCase, convertWaitlistToAppointmentUseCase) {
        this.addToWaitlistUseCase = addToWaitlistUseCase;
        this.getWaitlistUseCase = getWaitlistUseCase;
        this.updateWaitlistEntryUseCase = updateWaitlistEntryUseCase;
        this.removeFromWaitlistUseCase = removeFromWaitlistUseCase;
        this.convertWaitlistToAppointmentUseCase = convertWaitlistToAppointmentUseCase;
    }
    /**
     * POST /api/v1/appointments/waitlist
     * Add patient to waitlist
     */
    async addToWaitlist(req, res) {
        try {
            const userId = req.user?.userId;
            const userRole = req.user?.role;
            const result = await this.addToWaitlistUseCase.execute({
                patientId: req.body.patientId,
                preferredDoctorId: req.body.preferredDoctorId,
                preferredDepartmentId: req.body.preferredDepartmentId,
                preferredDate: req.body.preferredDate ? new Date(req.body.preferredDate) : undefined,
                preferredTimeSlot: req.body.preferredTimeSlot,
                appointmentType: req.body.appointmentType,
                priority: req.body.priority,
                notes: req.body.notes,
                reason: req.body.reason,
                isFlexibleDate: req.body.isFlexibleDate,
                isFlexibleTime: req.body.isFlexibleTime,
                isFlexibleDoctor: req.body.isFlexibleDoctor,
                expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : undefined,
                contactPhone: req.body.contactPhone,
                contactEmail: req.body.contactEmail,
                preferredContactMethod: req.body.preferredContactMethod,
                createdBy: userId
            });
            if (result.success) {
                res.status(201).json({
                    success: true,
                    data: {
                        waitlistId: result.waitlistId,
                        position: result.position
                    },
                    message: 'Successfully added to waitlist'
                });
            }
            else {
                res.status(400).json({
                    success: false,
                    error: result.error
                });
            }
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message || 'Internal server error'
            });
        }
    }
    /**
     * GET /api/v1/appointments/waitlist
     * Get waitlist entries with filters
     */
    async getWaitlist(req, res) {
        try {
            const result = await this.getWaitlistUseCase.execute({
                patientId: req.query.patientId,
                doctorId: req.query.doctorId,
                departmentId: req.query.departmentId,
                date: req.query.date ? new Date(req.query.date) : undefined,
                appointmentType: req.query.appointmentType,
                priority: req.query.priority,
                status: req.query.status,
                isExpired: req.query.isExpired === 'true' ? true : req.query.isExpired === 'false' ? false : undefined,
                limit: req.query.limit ? parseInt(req.query.limit) : 50,
                offset: req.query.offset ? parseInt(req.query.offset) : 0
            });
            if (result.success) {
                res.status(200).json({
                    success: true,
                    data: {
                        entries: result.entries,
                        total: result.total,
                        limit: req.query.limit ? parseInt(req.query.limit) : 50,
                        offset: req.query.offset ? parseInt(req.query.offset) : 0
                    }
                });
            }
            else {
                res.status(400).json({
                    success: false,
                    error: result.error
                });
            }
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message || 'Internal server error'
            });
        }
    }
    /**
     * PUT /api/v1/appointments/waitlist/:waitlistId
     * Update waitlist entry
     */
    async updateWaitlistEntry(req, res) {
        try {
            const { waitlistId } = req.params;
            const result = await this.updateWaitlistEntryUseCase.execute({
                waitlistId,
                preferredDate: req.body.preferredDate ? new Date(req.body.preferredDate) : undefined,
                preferredTimeSlot: req.body.preferredTimeSlot,
                preferredDoctorId: req.body.preferredDoctorId,
                priority: req.body.priority,
                notes: req.body.notes,
                status: req.body.status,
                isFlexibleDate: req.body.isFlexibleDate,
                isFlexibleTime: req.body.isFlexibleTime,
                isFlexibleDoctor: req.body.isFlexibleDoctor
            });
            if (result.success) {
                res.status(200).json({
                    success: true,
                    message: 'Waitlist entry updated successfully'
                });
            }
            else {
                res.status(400).json({
                    success: false,
                    error: result.error
                });
            }
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message || 'Internal server error'
            });
        }
    }
    /**
     * DELETE /api/v1/appointments/waitlist/:waitlistId
     * Remove from waitlist (cancel)
     */
    async removeFromWaitlist(req, res) {
        try {
            const { waitlistId } = req.params;
            const userId = req.user?.userId;
            const result = await this.removeFromWaitlistUseCase.execute({
                waitlistId,
                cancelledBy: userId,
                reason: req.body.reason
            });
            if (result.success) {
                res.status(200).json({
                    success: true,
                    message: 'Successfully removed from waitlist'
                });
            }
            else {
                res.status(400).json({
                    success: false,
                    error: result.error
                });
            }
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message || 'Internal server error'
            });
        }
    }
    /**
     * POST /api/v1/appointments/waitlist/:waitlistId/convert
     * Convert waitlist entry to appointment
     */
    async convertToAppointment(req, res) {
        try {
            const { waitlistId } = req.params;
            const userId = req.user?.userId;
            const result = await this.convertWaitlistToAppointmentUseCase.execute({
                waitlistId,
                appointmentDate: req.body.appointmentDate,
                appointmentTime: req.body.appointmentTime,
                doctorId: req.body.doctorId,
                departmentId: req.body.departmentId,
                durationMinutes: req.body.durationMinutes,
                convertedBy: userId
            });
            if (result.success) {
                res.status(200).json({
                    success: true,
                    data: {
                        appointmentId: result.appointmentId
                    },
                    message: 'Waitlist entry marked as matched. Please create appointment using the appointmentId.'
                });
            }
            else {
                res.status(400).json({
                    success: false,
                    error: result.error
                });
            }
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message || 'Internal server error'
            });
        }
    }
}
exports.WaitlistController = WaitlistController;
//# sourceMappingURL=WaitlistController.js.map