"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentController = void 0;
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
const express_validator_1 = require("express-validator");
const appointment_repository_1 = require("../repositories/appointment.repository");
const doctor_service_1 = require("../services/doctor.service");
const patient_service_1 = require("../services/patient.service");
class AppointmentController {
    constructor() {
        this.appointmentRepository = new appointment_repository_1.AppointmentRepository();
        this.doctorService = new doctor_service_1.DoctorService();
        this.patientService = new patient_service_1.PatientService();
    }
    async getAllAppointments(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    error: "Validation failed",
                    details: errors.array(),
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const typeParam = req.query.type ?? req.query.appointment_type;
            const filters = {
                doctor_id: req.query.doctor_id,
                patient_id: req.query.patient_id,
                appointment_date: req.query.appointment_date,
                date_from: req.query.date_from,
                date_to: req.query.date_to,
                status: req.query.status,
                type: typeParam,
                search: req.query.search,
            };
            const { appointments, total } = await this.appointmentRepository.getAllAppointments(filters, page, limit);
            const response = {
                success: true,
                data: appointments,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
                timestamp: new Date().toISOString(),
            };
            res.json(response);
        }
        catch (error) {
            logger_1.default.error("Error in getAllAppointments:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch appointments",
                message: error instanceof Error ? error.message : "Unknown error",
                timestamp: new Date().toISOString(),
            });
        }
    }
    async getAppointmentById(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    error: "Validation failed",
                    details: errors.array(),
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            const { appointment_id } = req.params;
            const appointment = await this.appointmentRepository.getAppointmentById(appointment_id);
            if (!appointment) {
                res.status(404).json({
                    success: false,
                    error: "Appointment not found",
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            const response = {
                success: true,
                data: appointment,
                timestamp: new Date().toISOString(),
            };
            res.json(response);
        }
        catch (error) {
            logger_1.default.error("Error in getAppointmentById:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch appointment",
                message: error instanceof Error ? error.message : "Unknown error",
                timestamp: new Date().toISOString(),
            });
        }
    }
    async getAppointmentsByDoctorId(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    error: "Validation failed",
                    details: errors.array(),
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            const { doctor_id } = req.params;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const typeParam = req.query.type ?? req.query.appointment_type;
            const filters = {
                appointment_date: req.query.date,
                status: req.query.status,
                type: typeParam,
            };
            const { appointments, total } = await this.appointmentRepository.getAppointmentsByDoctorId(doctor_id, filters, page, limit);
            const response = {
                success: true,
                data: appointments,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
                timestamp: new Date().toISOString(),
            };
            res.json(response);
        }
        catch (error) {
            logger_1.default.error("Error in getAppointmentsByDoctorId:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch doctor appointments",
                message: error instanceof Error ? error.message : "Unknown error",
                timestamp: new Date().toISOString(),
            });
        }
    }
    async getAppointmentsByPatientId(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    error: "Validation failed",
                    details: errors.array(),
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            const { patient_id } = req.params;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const typeParam = req.query.type ?? req.query.appointment_type;
            const filters = {
                appointment_date: req.query.date,
                status: req.query.status,
                type: typeParam,
            };
            const { appointments, total } = await this.appointmentRepository.getAppointmentsByPatientId(patient_id, filters, page, limit);
            const response = {
                success: true,
                data: appointments,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
                timestamp: new Date().toISOString(),
            };
            res.json(response);
        }
        catch (error) {
            logger_1.default.error("Error in getAppointmentsByPatientId:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch patient appointments",
                message: error instanceof Error ? error.message : "Unknown error",
                timestamp: new Date().toISOString(),
            });
        }
    }
    async createAppointment(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    error: "Validation failed",
                    details: errors.array(),
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            const appointmentData = req.body;
            const doctorExists = await this.doctorService.verifyDoctorExists(appointmentData.doctor_id);
            if (!doctorExists) {
                res.status(400).json({
                    success: false,
                    error: "Doctor not found",
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            const patientExists = await this.patientService.verifyPatientExists(appointmentData.patient_id);
            if (!patientExists) {
                res.status(400).json({
                    success: false,
                    error: "Patient not found",
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            const startTime = appointmentData.start_time ?? appointmentData.appointment_time;
            const duration = appointmentData.duration_minutes ??
                appointmentData.duration_minutes ??
                30;
            const [sH, sM] = startTime.split(":").map(Number);
            const endTotal = sH * 60 + sM + duration;
            const endTime = `${Math.floor(endTotal / 60)
                .toString()
                .padStart(2, "0")}:${(endTotal % 60).toString().padStart(2, "0")}`;
            const isAvailable = await this.doctorService.checkDoctorAvailability(appointmentData.doctor_id, appointmentData.appointment_date, startTime, endTime);
            if (!isAvailable) {
                res.status(400).json({
                    success: false,
                    error: "Doctor is not available at the requested time",
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            const conflictCheck = await this.appointmentRepository.checkConflicts(appointmentData.doctor_id, appointmentData.appointment_date, startTime, endTime);
            if (conflictCheck.has_conflict) {
                res.status(400).json({
                    success: false,
                    error: "Time slot conflicts with existing appointment",
                    details: conflictCheck,
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            const appointment = await this.appointmentRepository.createAppointment(appointmentData);
            const response = {
                success: true,
                data: appointment,
                message: "Appointment created successfully",
                timestamp: new Date().toISOString(),
            };
            res.status(201).json(response);
        }
        catch (error) {
            logger_1.default.error("Error in createAppointment:", error);
            res.status(500).json({
                success: false,
                error: "Failed to create appointment",
                message: error instanceof Error ? error.message : "Unknown error",
                timestamp: new Date().toISOString(),
            });
        }
    }
    async updateAppointment(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    error: "Validation failed",
                    details: errors.array(),
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            const { appointment_id } = req.params;
            const updateData = req.body;
            const exists = await this.appointmentRepository.appointmentExists(appointment_id);
            if (!exists) {
                res.status(404).json({
                    success: false,
                    error: "Appointment not found",
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            const timeChanged = Boolean(updateData.appointment_date ||
                updateData.appointment_time ||
                updateData.duration_minutes !== undefined);
            if (timeChanged) {
                const currentAppointment = await this.appointmentRepository.getAppointmentById(appointment_id);
                if (currentAppointment) {
                    const checkDate = updateData.appointment_date || currentAppointment.appointment_date;
                    const checkStartTime = updateData.appointment_time || currentAppointment.appointment_time;
                    const duration = updateData.duration_minutes ??
                        currentAppointment.duration_minutes ??
                        30;
                    const [h, m] = checkStartTime.split(":").map(Number);
                    const endTotal = h * 60 + m + duration;
                    const checkEndTime = `${Math.floor(endTotal / 60)
                        .toString()
                        .padStart(2, "0")}:${(endTotal % 60).toString().padStart(2, "0")}`;
                    const conflictCheck = await this.appointmentRepository.checkConflicts(currentAppointment.doctor_id, checkDate, checkStartTime, checkEndTime, appointment_id);
                    if (conflictCheck.has_conflict) {
                        res.status(400).json({
                            success: false,
                            error: "Time slot conflicts with existing appointment",
                            details: conflictCheck,
                            timestamp: new Date().toISOString(),
                        });
                        return;
                    }
                }
            }
            const appointment = await this.appointmentRepository.updateAppointment(appointment_id, updateData);
            const response = {
                success: true,
                data: appointment,
                message: "Appointment updated successfully",
                timestamp: new Date().toISOString(),
            };
            res.json(response);
        }
        catch (error) {
            logger_1.default.error("Error in updateAppointment:", error);
            res.status(500).json({
                success: false,
                error: "Failed to update appointment",
                message: error instanceof Error ? error.message : "Unknown error",
                timestamp: new Date().toISOString(),
            });
        }
    }
    async cancelAppointment(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    error: "Validation failed",
                    details: errors.array(),
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            const { appointment_id } = req.params;
            const { reason } = req.body;
            const exists = await this.appointmentRepository.appointmentExists(appointment_id);
            if (!exists) {
                res.status(404).json({
                    success: false,
                    error: "Appointment not found",
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            await this.appointmentRepository.cancelAppointment(appointment_id, reason);
            res.json({
                success: true,
                message: "Appointment cancelled successfully",
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            logger_1.default.error("Error in cancelAppointment:", error);
            res.status(500).json({
                success: false,
                error: "Failed to cancel appointment",
                message: error instanceof Error ? error.message : "Unknown error",
                timestamp: new Date().toISOString(),
            });
        }
    }
    async confirmAppointment(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    error: "Validation failed",
                    details: errors.array(),
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            const { appointment_id } = req.params;
            const { notes } = req.body;
            const exists = await this.appointmentRepository.appointmentExists(appointment_id);
            if (!exists) {
                res.status(404).json({
                    success: false,
                    error: "Appointment not found",
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            const updateData = {
                status: "confirmed",
            };
            if (notes) {
                updateData.notes = notes;
            }
            const appointment = await this.appointmentRepository.updateAppointment(appointment_id, updateData);
            const response = {
                success: true,
                data: appointment,
                message: "Appointment confirmed successfully",
                timestamp: new Date().toISOString(),
            };
            res.json(response);
        }
        catch (error) {
            logger_1.default.error("Error in confirmAppointment:", error);
            res.status(500).json({
                success: false,
                error: "Failed to confirm appointment",
                message: error instanceof Error ? error.message : "Unknown error",
                timestamp: new Date().toISOString(),
            });
        }
    }
    async getAvailableTimeSlots(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    error: "Validation failed",
                    details: errors.array(),
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            const { doctor_id, date, duration } = req.query;
            const slotDuration = parseInt(duration) || 30;
            const availableSlots = await this.doctorService.getAvailableTimeSlots(doctor_id, date, slotDuration);
            const response = {
                success: true,
                data: availableSlots.map((slot) => ({
                    date: date,
                    start_time: slot.start_time,
                    end_time: slot.end_time,
                    is_available: true,
                    doctor_id: doctor_id,
                    slot_duration: slotDuration,
                })),
                doctor_id: doctor_id,
                date: date,
                timestamp: new Date().toISOString(),
            };
            res.json(response);
        }
        catch (error) {
            logger_1.default.error("Error in getAvailableTimeSlots:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch available time slots",
                message: error instanceof Error ? error.message : "Unknown error",
                timestamp: new Date().toISOString(),
            });
        }
    }
    async getAppointmentStats(req, res) {
        try {
            const stats = await this.appointmentRepository.getAppointmentStats();
            res.json({
                success: true,
                data: stats,
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            logger_1.default.error("Error in getAppointmentStats:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch appointment statistics",
                message: error instanceof Error ? error.message : "Unknown error",
                timestamp: new Date().toISOString(),
            });
        }
    }
    async getUpcomingAppointments(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    error: "Validation failed",
                    details: errors.array(),
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            const { doctor_id } = req.params;
            const days = parseInt(req.query.days) || 7;
            const appointments = await this.appointmentRepository.getUpcomingAppointments(doctor_id, days);
            const response = {
                success: true,
                data: appointments,
                timestamp: new Date().toISOString(),
            };
            res.json(response);
        }
        catch (error) {
            logger_1.default.error("Error in getUpcomingAppointments:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch upcoming appointments",
                message: error instanceof Error ? error.message : "Unknown error",
                timestamp: new Date().toISOString(),
            });
        }
    }
    async getRealtimeStatus(req, res) {
        try {
            res.json({
                success: true,
                data: {
                    realtime_enabled: true,
                    websocket_enabled: true,
                    supabase_subscription: true,
                    connected_clients: 0,
                    last_event: null,
                    uptime: process.uptime(),
                },
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            logger_1.default.error("Error in getRealtimeStatus:", error);
            res.status(500).json({
                success: false,
                error: "Failed to get real-time status",
                message: error instanceof Error ? error.message : "Unknown error",
                timestamp: new Date().toISOString(),
            });
        }
    }
    async getLiveAppointments(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const { appointments, total } = await this.appointmentRepository.getAllAppointments({}, page, limit);
            res.json({
                success: true,
                data: {
                    appointments,
                    realtime_enabled: true,
                    live_updates: true,
                    websocket_channel: "appointments_realtime",
                    subscription_info: {
                        events: ["INSERT", "UPDATE", "DELETE"],
                        filters: ["status_changes", "time_changes", "new_appointments"],
                    },
                },
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            logger_1.default.error("Error in getLiveAppointments:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch live appointments",
                message: error instanceof Error ? error.message : "Unknown error",
                timestamp: new Date().toISOString(),
            });
        }
    }
    async getCalendarView(req, res) {
        try {
            const { date, doctor_id, view = "month" } = req.query;
            if (!date) {
                res.status(400).json({
                    success: false,
                    error: "Date is required",
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            const calendarData = await this.appointmentRepository.getCalendarView(date, doctor_id, view);
            const response = {
                success: true,
                data: calendarData,
                message: "Calendar view retrieved successfully",
                timestamp: new Date().toISOString(),
            };
            res.json(response);
        }
        catch (error) {
            logger_1.default.error("Error getting calendar view:", error);
            res.status(500).json({
                success: false,
                error: "Failed to get calendar view",
                timestamp: new Date().toISOString(),
            });
        }
    }
    async getWeeklySchedule(req, res) {
        try {
            const { doctor_id } = req.params;
            const { startDate } = req.query;
            if (!doctor_id) {
                res.status(400).json({
                    success: false,
                    error: "Doctor ID is required",
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            const weeklySchedule = await this.appointmentRepository.getWeeklySchedule(doctor_id, startDate);
            const response = {
                success: true,
                data: weeklySchedule,
                message: "Weekly schedule retrieved successfully",
                timestamp: new Date().toISOString(),
            };
            res.json(response);
        }
        catch (error) {
            logger_1.default.error("Error getting weekly schedule:", error);
            res.status(500).json({
                success: false,
                error: "Failed to get weekly schedule",
                timestamp: new Date().toISOString(),
            });
        }
    }
    async rescheduleAppointment(req, res) {
        try {
            const { id } = req.params;
            const { newDate, newStartTime, newEndTime, reason } = req.body;
            if (!id || !newDate || !newStartTime || !newEndTime) {
                res.status(400).json({
                    success: false,
                    error: "Appointment ID, new date, and new time are required",
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            const currentAppointment = await this.appointmentRepository.getAppointmentById(id);
            if (!currentAppointment) {
                res.status(404).json({
                    success: false,
                    error: "Appointment not found",
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            const conflictCheck = await this.appointmentRepository.checkConflicts(currentAppointment.doctor_id, newDate, newStartTime, newEndTime, id);
            if (conflictCheck.has_conflict) {
                res.status(400).json({
                    success: false,
                    error: "New time slot conflicts with existing appointment",
                    details: conflictCheck,
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            const [rsh, rsm] = newStartTime.split(":").map(Number);
            const [reh, rem] = newEndTime.split(":").map(Number);
            const newDuration = Math.max(0, reh * 60 + rem - (rsh * 60 + rsm));
            const updatedAppointment = await this.appointmentRepository.updateAppointment(id, {
                appointment_date: newDate,
                appointment_time: newStartTime,
                duration_minutes: newDuration,
                notes: reason ? `Rescheduled: ${reason}` : currentAppointment.notes,
            });
            const response = {
                success: true,
                data: updatedAppointment,
                message: "Appointment rescheduled successfully",
                timestamp: new Date().toISOString(),
            };
            res.json(response);
        }
        catch (error) {
            logger_1.default.error("Error rescheduling appointment:", error);
            res.status(500).json({
                success: false,
                error: "Failed to reschedule appointment",
                timestamp: new Date().toISOString(),
            });
        }
    }
    async getDoctorAppointmentStats(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    error: "Validation failed",
                    details: errors.array(),
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            const { doctor_id } = req.params;
            const stats = await this.appointmentRepository.getDoctorAppointmentStats(doctor_id);
            const response = {
                success: true,
                data: stats,
                message: "Doctor appointment statistics retrieved successfully",
                timestamp: new Date().toISOString(),
            };
            res.json(response);
        }
        catch (error) {
            logger_1.default.error("Error getting doctor appointment stats:", error);
            res.status(500).json({
                success: false,
                error: "Failed to get doctor appointment statistics",
                timestamp: new Date().toISOString(),
            });
        }
    }
    async getDoctorPatientCount(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    error: "Validation failed",
                    details: errors.array(),
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            const { doctor_id } = req.params;
            const patientCount = await this.appointmentRepository.getDoctorPatientCount(doctor_id);
            const response = {
                success: true,
                data: { total_patients: patientCount },
                message: "Doctor patient count retrieved successfully",
                timestamp: new Date().toISOString(),
            };
            res.json(response);
        }
        catch (error) {
            logger_1.default.error("Error getting doctor patient count:", error);
            res.status(500).json({
                success: false,
                error: "Failed to get doctor patient count",
                timestamp: new Date().toISOString(),
            });
        }
    }
}
exports.AppointmentController = AppointmentController;
//# sourceMappingURL=appointment.controller.js.map