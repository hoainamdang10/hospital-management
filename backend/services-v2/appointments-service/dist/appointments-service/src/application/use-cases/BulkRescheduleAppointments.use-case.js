"use strict";
/**
 * Bulk Reschedule Appointments Use Case - Application Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BulkRescheduleAppointmentsUseCase = void 0;
const use_case_interface_1 = require("../../../../shared/application/use-cases/base/use-case.interface");
const Appointment_aggregate_1 = require("../../domain/aggregates/Appointment.aggregate");
const IAuthorizationService_1 = require("../services/IAuthorizationService");
/**
 * Bulk Reschedule Appointments Use Case
 *
 * Business Rules:
 * 1. Get all appointments for doctor on specific date
 * 2. Find alternative slots (same doctor or alternative doctors)
 * 3. Suggest new times to patients
 * 4. Auto-reschedule if patient accepts
 * 5. Batch notifications
 * 6. Track rescheduling status
 */
class BulkRescheduleAppointmentsUseCase extends use_case_interface_1.BaseHealthcareUseCase {
    constructor(appointmentRepository, authorizationService) {
        super();
        this.appointmentRepository = appointmentRepository;
        this.authorizationService = authorizationService;
    }
    async executeInternal(request) {
        try {
            // 1. Authorization check
            const canBulkReschedule = await this.authorizationService.canBulkReschedule(request.rescheduledBy, request.doctorId);
            if (!canBulkReschedule) {
                throw new IAuthorizationService_1.AuthorizationError('You are not authorized to bulk reschedule appointments for this doctor', request.rescheduledBy, 'bulk_reschedule', request.doctorId);
            }
            // 2. Get all appointments for doctor on date
            const date = new Date(request.date);
            const appointments = await this.appointmentRepository.findByDoctorAndDate(request.doctorId, date);
            // Filter only scheduled/confirmed appointments
            const activeAppointments = appointments.filter(apt => apt.getStatus() === Appointment_aggregate_1.AppointmentStatus.SCHEDULED || apt.getStatus() === Appointment_aggregate_1.AppointmentStatus.CONFIRMED);
            if (activeAppointments.length === 0) {
                return {
                    success: true,
                    message: 'Không có lịch hẹn nào cần đổi',
                    summary: {
                        totalAppointments: 0,
                        rescheduled: 0,
                        failed: 0,
                        pending: 0
                    },
                    appointments: []
                };
            }
            // 2. Process each appointment
            const results = [];
            let rescheduled = 0;
            let failed = 0;
            let pending = 0;
            for (const appointment of activeAppointments) {
                try {
                    // For now, mark as pending patient confirmation
                    // In real implementation, would find alternative slots and notify patient
                    results.push({
                        appointmentId: appointment.appointmentId.value,
                        patientId: appointment.patientId,
                        status: 'pending_patient_confirmation',
                        oldDate: appointment.timeSlot.appointmentDate,
                        oldTime: appointment.timeSlot.appointmentTime
                    });
                    pending++;
                }
                catch (error) {
                    results.push({
                        appointmentId: appointment.appointmentId.value,
                        patientId: appointment.patientId,
                        status: 'failed',
                        oldDate: appointment.timeSlot.appointmentDate,
                        oldTime: appointment.timeSlot.appointmentTime,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                    failed++;
                }
            }
            // 3. Return summary
            return {
                success: true,
                message: `Đã xử lý ${activeAppointments.length} lịch hẹn`,
                summary: {
                    totalAppointments: activeAppointments.length,
                    rescheduled,
                    failed,
                    pending
                },
                appointments: results
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Đổi lịch hàng loạt thất bại',
                errors: [error instanceof Error ? error.message : 'Unknown error']
            };
        }
    }
    async authorize(request, userId) {
        // Authorization enforced in executeInternal() via authorizationService.canBulkReschedule()
        return !!userId;
    }
    involvesPHI(request) {
        return true;
    }
    getPatientId(request) {
        return null; // Multiple patients
    }
}
exports.BulkRescheduleAppointmentsUseCase = BulkRescheduleAppointmentsUseCase;
//# sourceMappingURL=BulkRescheduleAppointments.use-case.js.map