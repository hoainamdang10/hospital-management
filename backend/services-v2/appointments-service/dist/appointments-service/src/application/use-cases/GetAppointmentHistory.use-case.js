"use strict";
/**
 * Get Appointment History Use Case - Application Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, HIPAA, Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAppointmentHistoryUseCase = void 0;
const use_case_interface_1 = require("../../../../shared/application/use-cases/base/use-case.interface");
const IAuthorizationService_1 = require("../services/IAuthorizationService");
/**
 * Get Appointment History Use Case
 *
 * Business Rules:
 * 1. Get all past appointments for patient or doctor
 * 2. Filter by date range, status
 * 3. Show cancellation history
 * 4. Show no-show history
 * 5. Calculate statistics
 */
class GetAppointmentHistoryUseCase extends use_case_interface_1.BaseHealthcareUseCase {
    constructor(appointmentRepository, authorizationService) {
        super();
        this.appointmentRepository = appointmentRepository;
        this.authorizationService = authorizationService;
    }
    async executeInternal(request) {
        try {
            // 1. Authorization check
            const canView = await this.authorizationService.canViewAppointmentHistory(request.requestedBy, request.patientId, request.doctorId);
            if (!canView) {
                throw new IAuthorizationService_1.AuthorizationError('You are not authorized to view appointment history', request.requestedBy, 'view_appointment_history', request.patientId || request.doctorId || 'unknown');
            }
            // 2. Build date range
            const startDate = request.startDate
                ? new Date(request.startDate)
                : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000); // 1 year ago
            const endDate = request.endDate
                ? new Date(request.endDate)
                : new Date();
            // 2. Get appointments
            let appointments = [];
            if (request.patientId) {
                // Get patient's appointments
                appointments = await this.getPatientAppointments(request.patientId, startDate, endDate);
            }
            else if (request.doctorId) {
                // Get doctor's appointments
                appointments = await this.getDoctorAppointments(request.doctorId, startDate, endDate);
            }
            else {
                return {
                    success: false,
                    message: 'Vui lòng cung cấp patientId hoặc doctorId',
                    errors: ['Missing required parameter']
                };
            }
            // 3. Filter by status if provided
            if (request.status && request.status.length > 0) {
                appointments = appointments.filter(apt => request.status.includes(apt.status));
            }
            // 4. Calculate statistics
            const totalCompleted = appointments.filter(apt => apt.status === 'completed').length;
            const totalCancelled = appointments.filter(apt => apt.status === 'cancelled').length;
            const totalNoShow = appointments.filter(apt => apt.status === 'no_show').length;
            const total = appointments.length;
            const completionRate = total > 0 ? (totalCompleted / total) * 100 : 0;
            const noShowRate = total > 0 ? (totalNoShow / total) * 100 : 0;
            // 5. Pagination
            const limit = request.limit || 50;
            const offset = request.offset || 0;
            const paginatedAppointments = appointments.slice(offset, offset + limit);
            // 6. Map to response format
            const history = paginatedAppointments.map(apt => ({
                appointmentId: apt.appointmentId.value,
                patientId: apt.patientId,
                doctorId: apt.doctorId,
                appointmentDate: apt.timeSlot.appointmentDate,
                appointmentTime: apt.timeSlot.appointmentTime,
                status: apt.status,
                appointmentType: apt.appointmentType,
                consultationFee: apt.consultationFee,
                createdAt: apt.createdAt,
                completedAt: apt.completedAt,
                cancelledAt: apt.cancelledAt,
                cancellationReason: apt.cancellationReason,
                noShowAt: apt.noShowAt
            }));
            return {
                success: true,
                message: 'Lấy lịch sử lịch hẹn thành công',
                history: {
                    total,
                    appointments: history,
                    statistics: {
                        totalCompleted,
                        totalCancelled,
                        totalNoShow,
                        completionRate: Math.round(completionRate * 100) / 100,
                        noShowRate: Math.round(noShowRate * 100) / 100
                    }
                }
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Lấy lịch sử lịch hẹn thất bại',
                errors: [error instanceof Error ? error.message : 'Unknown error']
            };
        }
    }
    /**
     * Get patient's appointments
     */
    async getPatientAppointments(patientId, startDate, endDate) {
        // Get all appointments in date range
        const allAppointments = await this.appointmentRepository.findByTimeSlot('', // Empty doctor ID to get all
        startDate, endDate);
        // Filter by patient ID
        return allAppointments.filter(apt => apt.patientId === patientId);
    }
    /**
     * Get doctor's appointments
     */
    async getDoctorAppointments(doctorId, startDate, endDate) {
        return await this.appointmentRepository.findByTimeSlot(doctorId, startDate, endDate);
    }
    async authorize(request, userId) {
        // Authorization enforced in executeInternal() via authorizationService.canViewAppointmentHistory()
        return !!userId;
    }
    involvesPHI(request) {
        return true;
    }
    getPatientId(request) {
        return request.patientId || null;
    }
}
exports.GetAppointmentHistoryUseCase = GetAppointmentHistoryUseCase;
//# sourceMappingURL=GetAppointmentHistory.use-case.js.map