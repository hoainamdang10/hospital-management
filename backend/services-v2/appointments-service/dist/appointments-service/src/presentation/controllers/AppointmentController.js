"use strict";
/**
 * Appointment Controller - Presentation Layer
 * V3 Clean Architecture Implementation
 * REST API endpoints for appointment management
 *
 * @author Hospital Management Team
 * @version 3.0.0
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentController = void 0;
class AppointmentController {
    constructor(scheduleAppointmentUseCase, cancelAppointmentUseCase, confirmAppointmentUseCase, completeAppointmentUseCase, getAppointmentUseCase, listAppointmentsUseCase, rescheduleAppointmentUseCase, checkInAppointmentUseCase, markAsNoShowUseCase, startAppointmentUseCase, bulkRescheduleAppointmentsUseCase, getAppointmentHistoryUseCase, getAppointmentStatisticsUseCase, createEmergencyAppointmentUseCase, transferAppointmentUseCase, createRecurringSeriesUseCase) {
        this.scheduleAppointmentUseCase = scheduleAppointmentUseCase;
        this.cancelAppointmentUseCase = cancelAppointmentUseCase;
        this.confirmAppointmentUseCase = confirmAppointmentUseCase;
        this.completeAppointmentUseCase = completeAppointmentUseCase;
        this.getAppointmentUseCase = getAppointmentUseCase;
        this.listAppointmentsUseCase = listAppointmentsUseCase;
        this.rescheduleAppointmentUseCase = rescheduleAppointmentUseCase;
        this.checkInAppointmentUseCase = checkInAppointmentUseCase;
        this.markAsNoShowUseCase = markAsNoShowUseCase;
        this.startAppointmentUseCase = startAppointmentUseCase;
        this.bulkRescheduleAppointmentsUseCase = bulkRescheduleAppointmentsUseCase;
        this.getAppointmentHistoryUseCase = getAppointmentHistoryUseCase;
        this.getAppointmentStatisticsUseCase = getAppointmentStatisticsUseCase;
        this.createEmergencyAppointmentUseCase = createEmergencyAppointmentUseCase;
        this.transferAppointmentUseCase = transferAppointmentUseCase;
        this.createRecurringSeriesUseCase = createRecurringSeriesUseCase;
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
            // Map nested validation structure to flat use case structure
            const { patient, provider, appointment, departmentCode } = req.body;
            console.log('[Controller] Mapping nested structure:', JSON.stringify({ patient, provider, appointment, departmentCode }, null, 2));
            const startTime = new Date(appointment.startTime);
            const endTime = new Date(appointment.endTime);
            const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);
            const useCaseRequest = {
                patientId: patient.patientId,
                doctorId: provider.providerId,
                appointmentDate: startTime.toISOString().split('T')[0], // YYYY-MM-DD
                appointmentTime: startTime.toTimeString().split(' ')[0], // HH:MM:SS
                durationMinutes,
                type: appointment.appointmentType,
                priority: appointment.priority,
                reason: appointment.reason,
                notes: appointment.notes,
                consultationFee: appointment.consultationFee || 0,
                departmentId: departmentCode,
                createdBy: userId
            };
            console.log('[Controller] Mapped to use case request:', JSON.stringify(useCaseRequest, null, 2));
            const result = await this.scheduleAppointmentUseCase.execute(useCaseRequest, { userId, timestamp: new Date() });
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
            }, { userId, timestamp: new Date() });
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
            }, { userId, timestamp: new Date() });
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
            }, { userId, timestamp: new Date() });
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
                appointmentId: req.params.id,
                completedBy: userId
            }, { userId, timestamp: new Date() });
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
            }, { userId, timestamp: new Date() });
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
     * GET /api/v1/appointments/:id/preview-reminders
     * Preview reminder schedules (applies quiet hours)
     */
    async previewReminders(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }
            const getResp = await this.getAppointmentUseCase.execute({ appointmentId: req.params.id }, { userId, timestamp: new Date() });
            if (!getResp.success || !getResp.appointment) {
                res.status(404).json({ success: false, message: 'Appointment not found' });
                return;
            }
            const appt = getResp.appointment;
            const appointmentTime = new Date(`${appt.appointmentDate}T${appt.appointmentTime}`);
            // Load reminder policy JSON
            let policy;
            try {
                const fs = await Promise.resolve().then(() => __importStar(require('fs')));
                const path = await Promise.resolve().then(() => __importStar(require('path')));
                const policyPath = path.join(__dirname, '../../infrastructure/config/reminder-policy.json');
                policy = JSON.parse(fs.readFileSync(policyPath, 'utf-8'));
            }
            catch {
                policy = { default: { ROUTINE: [{ window: '24h', channels: ['EMAIL', 'PUSH'] }, { window: '2h', channels: ['PUSH'] }], URGENT: [{ window: '2h', channels: ['SMS', 'PUSH'] }, { window: '30min', channels: ['SMS', 'PUSH'] }], EMERGENCY: [] }, quietHours: { enabled: false, start: '21:00', end: '06:00' } };
            }
            const urgencyKey = (appt.priority || 'routine').toUpperCase();
            const tenantId = process.env.TENANT_ID || 'hospital-1';
            const windows = (policy.tenants?.[tenantId]?.[urgencyKey] || policy.default?.[urgencyKey] || []);
            const parseWindow = (w) => {
                const m = w.match(/^(\d+)(min|h|d|w)$/);
                if (!m)
                    return 0;
                const n = parseInt(m[1], 10);
                const unit = m[2];
                const mul = { min: 60000, h: 3600000, d: 86400000, w: 604800000 };
                return n * (mul[unit] || 0);
            };
            const enforceQuiet = (dt) => {
                const qh = policy.quietHours;
                if (!qh || !qh.enabled)
                    return dt;
                const [sh, sm] = (qh.start || '21:00').split(':').map((s) => parseInt(s, 10));
                const [eh, em] = (qh.end || '06:00').split(':').map((s) => parseInt(s, 10));
                const local = new Date(dt);
                const s = new Date(local);
                s.setHours(sh, sm, 0, 0);
                const e = new Date(local);
                e.setHours(eh, em, 0, 0);
                const spanMid = e <= s;
                const inQuiet = spanMid ? (local >= s || local < e) : (local >= s && local < e);
                if (!inQuiet)
                    return dt;
                const shifted = new Date(local);
                if (spanMid && local >= s)
                    shifted.setDate(shifted.getDate() + 1);
                shifted.setHours(eh, em + 5, 0, 0);
                return shifted;
            };
            const now = new Date();
            const previews = windows.map((rw) => {
                const base = new Date(appointmentTime.getTime() - parseWindow(rw.window));
                const adjusted = enforceQuiet(base);
                return {
                    window: rw.window,
                    scheduledFor: adjusted.toISOString(),
                    channels: rw.channels,
                    skipped: adjusted <= now
                };
            });
            res.status(200).json({ success: true, appointmentId: appt.appointmentId, previews });
        }
        catch (error) {
            res.status(500).json({ success: false, message: 'Internal server error', errors: [error instanceof Error ? error.message : 'Unknown error'] });
        }
    }
    /**
     * POST /api/appointments/:id/reschedule
     * Reschedule an appointment
     */
    async rescheduleAppointment(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }
            const result = await this.rescheduleAppointmentUseCase.execute({
                appointmentId: req.params.id,
                ...req.body,
                rescheduledBy: userId
            }, { userId, timestamp: new Date() });
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
     * POST /api/appointments/:id/check-in
     * Check in patient for appointment
     */
    async checkInAppointment(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }
            const result = await this.checkInAppointmentUseCase.execute({
                appointmentId: req.params.id,
                checkedInBy: userId,
                ...req.body
            }, { userId, timestamp: new Date() });
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
     * POST /api/appointments/:id/no-show
     * Mark appointment as no-show
     */
    async markAsNoShow(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }
            const result = await this.markAsNoShowUseCase.execute({
                appointmentId: req.params.id,
                markedBy: userId,
                ...req.body
            }, { userId, timestamp: new Date() });
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
     * POST /api/appointments/:id/start
     * Start appointment (doctor begins consultation)
     */
    async startAppointment(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }
            const result = await this.startAppointmentUseCase.execute({
                appointmentId: req.params.id,
                startedBy: userId,
                ...req.body
            }, { userId, timestamp: new Date() });
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
     * POST /api/appointments/bulk-reschedule
     * Bulk reschedule appointments (doctor unavailable)
     */
    async bulkRescheduleAppointments(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }
            const result = await this.bulkRescheduleAppointmentsUseCase.execute({
                ...req.body,
                rescheduledBy: userId
            }, { userId, timestamp: new Date() });
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
     * GET /api/appointments/history
     * Get appointment history
     */
    async getAppointmentHistory(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }
            const result = await this.getAppointmentHistoryUseCase.execute({
                patientId: req.query.patientId,
                doctorId: req.query.doctorId,
                startDate: req.query.startDate,
                endDate: req.query.endDate,
                status: req.query.status ? req.query.status.split(',') : undefined,
                limit: req.query.limit ? parseInt(req.query.limit) : undefined,
                offset: req.query.offset ? parseInt(req.query.offset) : undefined,
                requestedBy: userId
            }, { userId, timestamp: new Date() });
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
     * GET /api/appointments/statistics
     * Get appointment statistics
     */
    async getAppointmentStatistics(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }
            const result = await this.getAppointmentStatisticsUseCase.execute({
                doctorId: req.query.doctorId,
                departmentId: req.query.departmentId,
                startDate: req.query.startDate,
                endDate: req.query.endDate,
                groupBy: req.query.groupBy,
                requestedBy: userId
            }, { userId, timestamp: new Date() });
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
     * POST /api/appointments/emergency
     * Create emergency appointment
     */
    async createEmergencyAppointment(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }
            const result = await this.createEmergencyAppointmentUseCase.execute({
                ...req.body,
                createdBy: userId
            }, { userId, timestamp: new Date() });
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
     * POST /api/appointments/:id/transfer
     * Transfer appointment to another doctor
     */
    async transferAppointment(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }
            const result = await this.transferAppointmentUseCase.execute({
                appointmentId: req.params.id,
                ...req.body,
                transferredBy: userId
            }, { userId, timestamp: new Date() });
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
     * POST /api/appointments/recurring
     * Create a recurring appointment series
     */
    async createRecurringAppointmentSeries(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'Unauthorized'
                });
                return;
            }
            const result = await this.createRecurringSeriesUseCase.execute(req.body, { userId, timestamp: new Date() });
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
}
exports.AppointmentController = AppointmentController;
//# sourceMappingURL=AppointmentController.js.map