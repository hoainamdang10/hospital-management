"use strict";
/**
 * Transfer Appointment Use Case - Application Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransferAppointmentUseCase = void 0;
const use_case_interface_1 = require("../../../../shared/application/use-cases/base/use-case.interface");
const Appointment_aggregate_1 = require("../../domain/aggregates/Appointment.aggregate");
const IAuthorizationService_1 = require("../services/IAuthorizationService");
/**
 * Transfer Appointment Use Case
 *
 * Business Rules:
 * 1. Find alternative doctor
 * 2. Check new doctor availability
 * 3. Transfer appointment
 * 4. Notify both doctors & patient
 * 5. Update queue if needed
 * 6. Maintain appointment history
 */
class TransferAppointmentUseCase extends use_case_interface_1.BaseHealthcareUseCase {
    constructor(appointmentRepository, authorizationService) {
        super();
        this.appointmentRepository = appointmentRepository;
        this.authorizationService = authorizationService;
    }
    async executeInternal(request) {
        try {
            // 1. Find appointment (need to get before authorization check)
            const appointment = await this.appointmentRepository.findByAppointmentId(request.appointmentId);
            if (!appointment) {
                return {
                    success: false,
                    message: 'Không tìm thấy lịch hẹn',
                    errors: ['Appointment not found']
                };
            }
            // 2. Authorization check
            const canTransfer = await this.authorizationService.canTransferAppointment(request.transferredBy, request.appointmentId, {
                patientId: appointment.patientId,
                doctorId: appointment.doctorId,
            });
            if (!canTransfer) {
                throw new IAuthorizationService_1.AuthorizationError('You are not authorized to transfer this appointment', request.transferredBy, 'transfer_appointment', request.appointmentId);
            }
            // 3. Validate can transfer
            const validationError = this.validateTransfer(appointment, request.newDoctorId);
            if (validationError) {
                return {
                    success: false,
                    message: validationError,
                    errors: [validationError]
                };
            }
            // 3. Check new doctor availability
            const isAvailable = await this.checkDoctorAvailability(request.newDoctorId, appointment.timeSlot.appointmentDate, appointment.timeSlot.appointmentTime);
            if (!isAvailable) {
                return {
                    success: false,
                    message: 'Bác sĩ mới không khả dụng vào thời gian này',
                    errors: ['New doctor not available']
                };
            }
            // 4. Store old doctor ID before transfer
            const oldDoctorId = appointment.getDoctorId();
            // 5. Transfer appointment using aggregate business method
            appointment.transfer(request.newDoctorId, request.reason, request.transferredBy);
            // 6. Save
            await this.appointmentRepository.save(appointment);
            // 7. Return success response
            return {
                success: true,
                message: 'Chuyển lịch hẹn thành công',
                appointment: {
                    appointmentId: appointment.getAppointmentId().value,
                    patientId: appointment.getPatientId() || '',
                    oldDoctorId,
                    newDoctorId: request.newDoctorId,
                    appointmentDate: appointment.getTimeSlot().appointmentDate,
                    appointmentTime: appointment.getTimeSlot().appointmentTime,
                    status: appointment.getStatus()
                }
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Chuyển lịch hẹn thất bại',
                errors: [error instanceof Error ? error.message : 'Unknown error']
            };
        }
    }
    /**
     * Validate if appointment can be transferred
     */
    validateTransfer(appointment, newDoctorId) {
        // Cannot transfer to same doctor
        if (appointment.doctorId === newDoctorId || appointment.getDoctorId?.() === newDoctorId) {
            return 'Không thể chuyển cho cùng bác sĩ';
        }
        // Cannot transfer completed appointments
        if (appointment.getStatus() === Appointment_aggregate_1.AppointmentStatus.COMPLETED) {
            return 'Không thể chuyển lịch hẹn đã hoàn thành';
        }
        // Cannot transfer cancelled appointments
        if (appointment.getStatus() === Appointment_aggregate_1.AppointmentStatus.CANCELLED) {
            return 'Không thể chuyển lịch hẹn đã hủy';
        }
        // Cannot transfer no-show appointments
        if (appointment.getStatus() === Appointment_aggregate_1.AppointmentStatus.NO_SHOW) {
            return 'Không thể chuyển lịch hẹn no-show';
        }
        return null;
    }
    /**
     * Check if new doctor is available
     */
    async checkDoctorAvailability(doctorId, date, time) {
        try {
            const appointmentDateTime = new Date(`${date}T${time}`);
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            // Get doctor's appointments on that day
            const existingAppointments = await this.appointmentRepository.findByTimeSlot(doctorId, startOfDay, endOfDay);
            // Check for conflicts
            for (const existing of existingAppointments) {
                if (existing.getStatus() === Appointment_aggregate_1.AppointmentStatus.CANCELLED || existing.getStatus() === Appointment_aggregate_1.AppointmentStatus.NO_SHOW) {
                    continue;
                }
                const existingTime = new Date(`${existing.timeSlot.appointmentDate}T${existing.timeSlot.appointmentTime}`);
                const existingEndTime = new Date(existingTime.getTime() + existing.durationMinutes * 60000);
                const newEndTime = new Date(appointmentDateTime.getTime() + 30 * 60000);
                // Check for overlap
                if ((appointmentDateTime >= existingTime && appointmentDateTime < existingEndTime) ||
                    (newEndTime > existingTime && newEndTime <= existingEndTime) ||
                    (appointmentDateTime <= existingTime && newEndTime >= existingEndTime)) {
                    return false;
                }
            }
            return true;
        }
        catch (error) {
            console.error('Error checking doctor availability:', error);
            return false;
        }
    }
    async authorize(request, userId) {
        // Authorization enforced in executeInternal() via authorizationService.canTransferAppointment()
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
exports.TransferAppointmentUseCase = TransferAppointmentUseCase;
//# sourceMappingURL=TransferAppointment.use-case.js.map