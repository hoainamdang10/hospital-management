"use strict";
/**
 * Validate Cancellation Policy Use Case - Application Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidateCancellationPolicyUseCase = void 0;
const use_case_interface_1 = require("../../../../shared/application/use-cases/base/use-case.interface");
/**
 * Validate Cancellation Policy Use Case
 *
 * Business Rules:
 * 1. Free cancellation if > 24 hours before appointment
 * 2. 50% fee if 12-24 hours before appointment
 * 3. 100% fee if < 12 hours before appointment
 * 4. Emergency appointments: different policy
 * 5. No refund if already checked in
 */
class ValidateCancellationPolicyUseCase extends use_case_interface_1.BaseHealthcareUseCase {
    constructor(appointmentRepository) {
        super();
        this.appointmentRepository = appointmentRepository;
        // Cancellation policy thresholds (in hours)
        this.FREE_CANCELLATION_HOURS = 24;
        this.PARTIAL_FEE_HOURS = 12;
        this.PARTIAL_FEE_PERCENTAGE = 50;
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
            // 2. Check if already checked in
            // NOTE: Simplified 3-role flow doesn't use check-in step
            // Doctors can start appointments directly from CONFIRMED/SCHEDULED
            // if (appointment.getCheckedInAt()) {
            //   return {
            //     success: true,
            //     message: 'Đã check-in, không thể hủy',
            //     policy: {
            //       canCancel: false,
            //       cancellationFee: appointment.getConsultationFee(),
            //       refundAmount: 0,
            //       refundPercentage: 0,
            //       hoursBeforeAppointment: 0,
            //       reason: 'Bệnh nhân đã check-in'
            //     }
            //   };
            // }
            // 3. Calculate hours before appointment
            const appointmentDateTime = new Date(`${appointment.timeSlot.appointmentDate}T${appointment.timeSlot.appointmentTime}`);
            const now = new Date();
            const hoursBeforeAppointment = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
            // 4. Apply cancellation policy
            let cancellationFee = 0;
            let refundPercentage = 100;
            let reason = '';
            if (hoursBeforeAppointment < 0) {
                // Past appointment
                cancellationFee = appointment.consultationFee;
                refundPercentage = 0;
                reason = 'Lịch hẹn đã qua';
            }
            else if (hoursBeforeAppointment >= this.FREE_CANCELLATION_HOURS) {
                // Free cancellation
                cancellationFee = 0;
                refundPercentage = 100;
                reason = `Hủy miễn phí (> ${this.FREE_CANCELLATION_HOURS}h trước giờ hẹn)`;
            }
            else if (hoursBeforeAppointment >= this.PARTIAL_FEE_HOURS) {
                // Partial fee
                cancellationFee = appointment.consultationFee * (this.PARTIAL_FEE_PERCENTAGE / 100);
                refundPercentage = 100 - this.PARTIAL_FEE_PERCENTAGE;
                reason = `Phí hủy ${this.PARTIAL_FEE_PERCENTAGE}% (${this.PARTIAL_FEE_HOURS}-${this.FREE_CANCELLATION_HOURS}h trước giờ hẹn)`;
            }
            else {
                // Full fee
                cancellationFee = appointment.consultationFee;
                refundPercentage = 0;
                reason = `Phí hủy 100% (< ${this.PARTIAL_FEE_HOURS}h trước giờ hẹn)`;
            }
            const refundAmount = appointment.consultationFee - cancellationFee;
            // 5. Return policy details
            return {
                success: true,
                message: 'Kiểm tra chính sách hủy thành công',
                policy: {
                    canCancel: hoursBeforeAppointment >= 0,
                    cancellationFee,
                    refundAmount,
                    refundPercentage,
                    hoursBeforeAppointment: Math.max(0, hoursBeforeAppointment),
                    reason
                }
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Kiểm tra chính sách hủy thất bại',
                errors: [error instanceof Error ? error.message : 'Unknown error']
            };
        }
    }
    async authorize(request, userId) {
        // Anyone can check cancellation policy
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
exports.ValidateCancellationPolicyUseCase = ValidateCancellationPolicyUseCase;
//# sourceMappingURL=ValidateCancellationPolicy.use-case.js.map