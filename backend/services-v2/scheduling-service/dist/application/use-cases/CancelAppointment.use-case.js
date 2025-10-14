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
const use_case_interface_1 = require("@shared/application/use-cases/base/use-case.interface");
/**
 * Cancel Appointment Use Case
 */
class CancelAppointmentUseCase extends use_case_interface_1.BaseHealthcareUseCase {
    constructor(appointmentRepository) {
        super();
        this.appointmentRepository = appointmentRepository;
    }
    async executeInternal(request) {
        try {
            // 1. Find appointment
            const appointment = await this.appointmentRepository.findByAppointmentId(request.appointmentId);
            if (!appointment) {
                return {
                    success: false,
                    message: 'Không tìm thấy lịch hẹn',
                    errors: ['Appointment not found']
                };
            }
            // 2. Cancel appointment
            appointment.cancel(request.cancellationReason, request.cancelledBy);
            // 3. Save
            await this.appointmentRepository.save(appointment);
            return {
                success: true,
                message: 'Hủy lịch hẹn thành công'
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Hủy lịch hẹn thất bại',
                errors: [error instanceof Error ? error.message : 'Unknown error']
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