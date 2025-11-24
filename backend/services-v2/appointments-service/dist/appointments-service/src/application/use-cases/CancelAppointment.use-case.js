"use strict";
/**
 * Cancel Appointment Use Case - Application Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, HIPAA
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CancelAppointmentUseCase = void 0;
const use_case_interface_1 = require("../../../../shared/application/use-cases/base/use-case.interface");
const IAuthorizationService_1 = require("../services/IAuthorizationService");
const AppointmentCancelledEvent_1 = require("../../domain/events/AppointmentCancelledEvent");
/**
 * Cancel Appointment Use Case
 */
class CancelAppointmentUseCase extends use_case_interface_1.BaseHealthcareUseCase {
    constructor(appointmentRepository, authorizationService, reminderService, eventPublisher) {
        super();
        this.appointmentRepository = appointmentRepository;
        this.authorizationService = authorizationService;
        this.reminderService = reminderService;
        this.eventPublisher = eventPublisher;
    }
    async executeInternal(request) {
        try {
            // 0. Validate cancellation reason
            if (!request.cancellationReason ||
                request.cancellationReason.trim() === "") {
                return {
                    success: false,
                    message: "Lý do hủy là bắt buộc",
                    errors: ["Cancellation reason is required"],
                };
            }
            // 1. Find appointment
            const appointment = await this.appointmentRepository.findByAppointmentId(request.appointmentId);
            if (!appointment) {
                return {
                    success: false,
                    message: "Không tìm thấy lịch hẹn",
                    errors: ["Appointment not found"],
                };
            }
            // 2. Authorization check
            const canCancel = await this.authorizationService.canCancelAppointment(request.cancelledBy, request.appointmentId, {
                patientId: appointment.patientId,
                doctorId: appointment.doctorId,
            });
            if (!canCancel) {
                throw new IAuthorizationService_1.AuthorizationError("You are not authorized to cancel this appointment", request.cancelledBy, "cancel_appointment", request.appointmentId);
            }
            // 3. Cancel appointment (domain event will be emitted)
            appointment.cancel(request.cancellationReason, request.cancelledBy);
            // 4. Save (triggers domain events → Event handler → Outbox → Worker → Scheduler)
            await this.appointmentRepository.save(appointment);
            // 5. Cancel all reminders for this appointment
            try {
                await this.reminderService.cancelReminders(request.appointmentId);
                console.log(`[CancelAppointment] Reminders cancelled for appointment ${request.appointmentId}`);
            }
            catch (reminderError) {
                // Log but don't fail the cancellation
                console.error("[CancelAppointment] Failed to cancel reminders:", reminderError);
            }
            // 6. Domain events emitted → AppointmentCancelledSchedulerHandler → Outbox → Worker
            //    No direct HTTP call needed - pure event-driven architecture
            // 7. Calculate cancellation policy for immediate frontend feedback
            const startTime = new Date(`${appointment.timeSlot.appointmentDate}T${appointment.timeSlot.appointmentTime}`);
            const hoursNotice = Math.max(0, (startTime.getTime() - Date.now()) / (1000 * 60 * 60));
            const policy = AppointmentCancelledEvent_1.AppointmentCancelledEvent.calculateCancellationPolicy(hoursNotice);
            const consultationFee = appointment.getConsultationFee();
            const estimatedRefundAmount = policy.refundEligible && policy.refundPercentage
                ? (consultationFee * policy.refundPercentage) / 100
                : 0;
            // Publish cancellation event directly (RabbitMQ) for downstream services (billing)
            if (this.eventPublisher) {
                await this.eventPublisher.publish({
                    eventType: "appointments.cancelled",
                    aggregateId: appointment.appointmentId.value,
                    aggregateType: "appointment",
                    eventData: {
                        appointmentId: appointment.appointmentId.value,
                        patientId: appointment.patientId,
                        staffId: appointment.doctorId,
                        departmentId: appointment.getDepartmentId?.() ??
                            appointment.departmentId ??
                            null,
                        scheduledAt: `${appointment.timeSlot.appointmentDate}T${appointment.timeSlot.appointmentTime}`,
                        cancelledAt: new Date().toISOString(),
                        cancellationReason: request.cancellationReason,
                        cancelledBy: request.cancelledBy,
                        cancellationPolicy: {
                            refundEligible: policy.refundEligible,
                            refundPercentage: policy.refundPercentage ?? 0,
                            penaltyApplied: policy.penaltyApplied,
                            penaltyAmount: policy.penaltyAmount ?? 0,
                            rescheduleAllowed: policy.rescheduleAllowed,
                        },
                    },
                    metadata: {
                        timestamp: new Date(),
                        correlationId: request.appointmentId,
                    },
                });
            }
            return {
                success: true,
                message: "Hủy lịch hẹn thành công",
                cancellationPolicy: {
                    ...policy,
                    hoursNotice,
                    estimatedRefundAmount,
                    consultationFee,
                },
            };
        }
        catch (error) {
            return {
                success: false,
                message: "Hủy lịch hẹn thất bại",
                errors: [error instanceof Error ? error.message : "Unknown error"],
            };
        }
    }
    async authorize(request, userId) {
        return !!userId;
    }
    involvesPHI(request) {
        return true;
    }
    getPatientId(request) {
        return null; // Would need to fetch appointment first
    }
}
exports.CancelAppointmentUseCase = CancelAppointmentUseCase;
//# sourceMappingURL=CancelAppointment.use-case.js.map