"use strict";
/**
 * Complete Appointment Use Case - Application Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompleteAppointmentUseCase = void 0;
const use_case_interface_1 = require("../../shared/application/use-cases/base/use-case.interface");
class CompleteAppointmentUseCase extends use_case_interface_1.BaseHealthcareUseCase {
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
            appointment.complete();
            await this.appointmentRepository.save(appointment);
            return {
                success: true,
                message: 'Hoàn thành lịch hẹn thành công'
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Hoàn thành lịch hẹn thất bại',
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
exports.CompleteAppointmentUseCase = CompleteAppointmentUseCase;
//# sourceMappingURL=CompleteAppointment.use-case.js.map