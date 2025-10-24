"use strict";
/**
 * List Appointments Use Case - Application Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListAppointmentsUseCase = void 0;
const use_case_interface_1 = require("../../shared/application/use-cases/base/use-case.interface");
class ListAppointmentsUseCase extends use_case_interface_1.BaseHealthcareUseCase {
    constructor(appointmentRepository) {
        super();
        this.appointmentRepository = appointmentRepository;
    }
    async executeInternal(request) {
        try {
            let appointments;
            if (request.patientId) {
                appointments = await this.appointmentRepository.findByPatientId(request.patientId);
            }
            else if (request.doctorId) {
                appointments = await this.appointmentRepository.findByDoctorId(request.doctorId);
            }
            else if (request.startDate && request.endDate) {
                appointments = await this.appointmentRepository.findByDateRange(request.startDate, request.endDate);
            }
            else {
                return {
                    success: false,
                    message: 'Vui lòng cung cấp patientId, doctorId hoặc date range',
                    errors: ['Missing filter criteria']
                };
            }
            return {
                success: true,
                message: 'Lấy danh sách lịch hẹn thành công',
                appointments: appointments.map(apt => ({
                    id: apt.id,
                    appointmentId: apt.appointmentId.value,
                    patientId: apt.patientId,
                    doctorId: apt.doctorId,
                    appointmentDate: apt.timeSlot.appointmentDate,
                    appointmentTime: apt.timeSlot.appointmentTime,
                    durationMinutes: apt.durationMinutes,
                    type: apt.type,
                    priority: apt.priority,
                    status: apt.status,
                    consultationFee: apt.consultationFee
                })),
                total: appointments.length
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Lấy danh sách lịch hẹn thất bại',
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
        return request.patientId || null;
    }
}
exports.ListAppointmentsUseCase = ListAppointmentsUseCase;
//# sourceMappingURL=ListAppointments.use-case.js.map