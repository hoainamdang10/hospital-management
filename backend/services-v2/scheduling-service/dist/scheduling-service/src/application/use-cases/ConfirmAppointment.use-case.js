"use strict";
/**
 * Confirm Appointment Use Case - Application Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfirmAppointmentUseCase = void 0;
const use_case_interface_1 = require("@shared/application/use-cases/base/use-case.interface");
class ConfirmAppointmentUseCase extends use_case_interface_1.BaseHealthcareUseCase {
    constructor(appointmentRepository) {
        super();
        this.appointmentRepository = appointmentRepository;
    }
    async executeInternal(request) {
        try {
            const appointment = await this.appointmentRepository.findByAppointmentId(request.appointmentId);
            if (!appointment) {
                return {
                    success: false,
                    message: 'Không tìm thấy lịch hẹn',
                    errors: ['Appointment not found']
                };
            }
            appointment.confirm(request.confirmedBy);
            await this.appointmentRepository.save(appointment);
            return {
                success: true,
                message: 'Xác nhận lịch hẹn thành công'
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Xác nhận lịch hẹn thất bại',
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
        return null;
    }
}
exports.ConfirmAppointmentUseCase = ConfirmAppointmentUseCase;
//# sourceMappingURL=ConfirmAppointment.use-case.js.map