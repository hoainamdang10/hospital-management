"use strict";
/**
 * Reschedule Appointment Use Case - Application Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, HIPAA, Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RescheduleAppointmentUseCase = void 0;
const use_case_interface_1 = require("../../../../shared/application/use-cases/base/use-case.interface");
const TimeSlot_vo_1 = require("../../domain/value-objects/TimeSlot.vo");
const Appointment_aggregate_1 = require("../../domain/aggregates/Appointment.aggregate");
const IAuthorizationService_1 = require("../services/IAuthorizationService");
const timezone_1 = require("../../../../shared/utils/timezone");
/**
 * Reschedule Appointment Use Case
 *
 * Business Rules:
 * 1. Cannot reschedule completed/cancelled appointments
 * 2. Cannot reschedule to past time
 * 3. Cannot reschedule within 2 hours of appointment time (configurable)
 * 4. New time slot must be available
 * 5. Must provide reason for rescheduling
 * 6. Cancels old reminders and creates new ones
 * 7. Notifies patient and doctor
 */
class RescheduleAppointmentUseCase extends use_case_interface_1.BaseHealthcareUseCase {
    constructor(appointmentRepository, authorizationService, reminderService) {
        super();
        this.appointmentRepository = appointmentRepository;
        this.authorizationService = authorizationService;
        this.reminderService = reminderService;
        this.MIN_HOURS_BEFORE_RESCHEDULE = 2;
    }
    async executeInternal(request) {
        try {
            // 1. Find appointment
            const appointment = await this.appointmentRepository.findByAppointmentId(request.appointmentId);
            if (!appointment) {
                return {
                    success: false,
                    message: "Không tìm thấy lịch hẹn",
                    errors: ["Appointment not found"],
                };
            }
            // 2. Validate can reschedule
            const validationError = this.validateReschedule(appointment, request);
            if (validationError) {
                return {
                    success: false,
                    message: validationError,
                    errors: [validationError],
                };
            }
            // 3. Create new time slot
            const newStartTimeUtc = (0, timezone_1.convertClinicLocalToUtc)(request.newAppointmentDate, request.newAppointmentTime);
            const newEndTimeUtc = new Date(newStartTimeUtc.getTime() + appointment.getDurationMinutes() * 60000);
            const newTimeSlot = TimeSlot_vo_1.TimeSlot.createWithTimestamps(request.newAppointmentDate, request.newAppointmentTime, newStartTimeUtc, newEndTimeUtc);
            // 4. Check if new time slot is available
            const isAvailable = await this.checkTimeSlotAvailability(appointment.doctorId, newTimeSlot, request.appointmentId, appointment.getDurationMinutes());
            if (!isAvailable) {
                return {
                    success: false,
                    message: "Khung thời gian mới không khả dụng",
                    errors: ["Time slot not available"],
                };
            }
            // 5. Authorization check
            const canReschedule = await this.authorizationService.canRescheduleAppointment(request.rescheduledBy, request.appointmentId, {
                patientId: appointment.patientId,
                doctorId: appointment.doctorId,
            });
            if (!canReschedule) {
                throw new IAuthorizationService_1.AuthorizationError("You are not authorized to reschedule this appointment", request.rescheduledBy, "reschedule_appointment", request.appointmentId);
            }
            // 6. Store old time for response
            const oldDate = appointment.timeSlot.appointmentDate;
            const oldTime = appointment.timeSlot.appointmentTime;
            // 7. Reschedule appointment (domain event will be emitted)
            appointment.reschedule(newTimeSlot, request.reason, request.rescheduledBy);
            // 8. Save (triggers domain events → Event handler → Outbox → Worker → Scheduler)
            await this.appointmentRepository.save(appointment);
            // 9. Cancel old reminders and schedule new ones
            try {
                // Cancel old reminders
                await this.reminderService.cancelReminders(request.appointmentId);
                // Schedule new reminders for the new time
                const newDateTime = newTimeSlot.getStartTime();
                await this.reminderService.scheduleReminders(appointment.appointmentId.value, appointment.patientId, newDateTime, appointment.priority);
                console.log(`[RescheduleAppointment] Reminders rescheduled for appointment ${request.appointmentId}`);
            }
            catch (reminderError) {
                // Log but don't fail the reschedule
                console.error("[RescheduleAppointment] Failed to reschedule reminders:", reminderError);
            }
            // 10. Domain events emitted → AppointmentRescheduledSchedulerHandler → Outbox → Worker
            //     No direct HTTP call needed - pure event-driven architecture
            // 11. Return success response
            return {
                success: true,
                message: "Đổi lịch hẹn thành công",
                appointment: {
                    appointmentId: appointment.appointmentId.value,
                    oldDate,
                    oldTime,
                    newDate: request.newAppointmentDate,
                    newTime: request.newAppointmentTime,
                    status: appointment.status,
                },
            };
        }
        catch (error) {
            return {
                success: false,
                message: "Đổi lịch hẹn thất bại",
                errors: [error instanceof Error ? error.message : "Unknown error"],
            };
        }
    }
    /**
     * Validate if appointment can be rescheduled
     */
    validateReschedule(appointment, request) {
        // Check status
        if (appointment.status === "COMPLETED") {
            return "Không thể đổi lịch hẹn đã hoàn thành";
        }
        if (appointment.getStatus() === Appointment_aggregate_1.AppointmentStatus.CANCELLED) {
            return "Không thể đổi lịch hẹn đã hủy";
        }
        // Check if too close to appointment time
        const appointmentDateTime = appointment.timeSlot.getStartTime();
        const now = new Date();
        const hoursUntilAppointment = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
        if (hoursUntilAppointment < this.MIN_HOURS_BEFORE_RESCHEDULE) {
            return `Không thể đổi lịch trong vòng ${this.MIN_HOURS_BEFORE_RESCHEDULE} giờ trước giờ hẹn`;
        }
        // Check if new time is in the past
        const newDateTime = new Date(`${request.newAppointmentDate}T${request.newAppointmentTime}`);
        if (newDateTime <= now) {
            return "Không thể đổi lịch sang thời gian trong quá khứ";
        }
        // Check if new time is too soon (at least 1 hour from now)
        const hoursUntilNewAppointment = (newDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
        if (hoursUntilNewAppointment < 1) {
            return "Lịch hẹn mới phải cách ít nhất 1 giờ từ bây giờ";
        }
        // Check if reason is provided
        if (!request.reason || request.reason.trim().length < 3) {
            return "Vui lòng cung cấp lý do đổi lịch (tối thiểu 3 ký tự)";
        }
        return null;
    }
    /**
     * Check if time slot is available for doctor
     */
    async checkTimeSlotAvailability(doctorId, timeSlot, excludeAppointmentId, durationMinutes) {
        try {
            // Get appointments for doctor on the new date
            const startOfDay = (0, timezone_1.convertClinicLocalToUtc)(timeSlot.appointmentDate, "00:00:00");
            const endOfDay = (0, timezone_1.convertClinicLocalToUtc)(timeSlot.appointmentDate, "23:59:59");
            const existingAppointments = await this.appointmentRepository.findByTimeSlot(doctorId, startOfDay, endOfDay);
            // Check for conflicts (excluding current appointment)
            const newAppointmentTime = timeSlot.getStartTime();
            const newEndTime = timeSlot.getEndTime(durationMinutes);
            for (const existing of existingAppointments) {
                // Skip the appointment being rescheduled
                if (existing.appointmentId.value === excludeAppointmentId) {
                    continue;
                }
                // Skip cancelled/no-show appointments
                if (existing.getStatus() === Appointment_aggregate_1.AppointmentStatus.CANCELLED ||
                    existing.getStatus() === Appointment_aggregate_1.AppointmentStatus.NO_SHOW) {
                    continue;
                }
                const existingTime = existing.timeSlot.getStartTime();
                const existingEndTime = existing.timeSlot.getEndTime(existing.durationMinutes);
                // Check for overlap
                if ((newAppointmentTime >= existingTime &&
                    newAppointmentTime < existingEndTime) ||
                    (newEndTime > existingTime && newEndTime <= existingEndTime) ||
                    (newAppointmentTime <= existingTime && newEndTime >= existingEndTime)) {
                    return false; // Conflict found
                }
            }
            return true; // No conflicts
        }
        catch (error) {
            console.error("Error checking time slot availability:", error);
            return false;
        }
    }
    async authorize(request, userId) {
        // Authorization enforced in executeInternal() via authorizationService.canRescheduleAppointment()
        return !!userId;
    }
    involvesPHI(request) {
        return true;
    }
    getPatientId(request) {
        // Will be retrieved from appointment
        return null;
    }
}
exports.RescheduleAppointmentUseCase = RescheduleAppointmentUseCase;
//# sourceMappingURL=RescheduleAppointment.use-case.js.map