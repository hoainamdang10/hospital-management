"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpireUnpaidAppointmentsUseCase = void 0;
const Logger_1 = require("../../infrastructure/logging/Logger");
const logger = (0, Logger_1.createLogger)('ExpireUnpaidAppointmentsUseCase');
/**
 * Expire Unpaid Appointments Use Case
 *
 * Automatically cancels appointments with expired payment deadlines
 * Runs periodically via cron job (every 5 minutes)
 *
 * Flow 3 - Phase 1B: Payment Timeout Handling
 */
class ExpireUnpaidAppointmentsUseCase {
    constructor(appointmentRepository) {
        this.appointmentRepository = appointmentRepository;
    }
    /**
     * Execute use case
     * Finds and cancels all appointments with expired payment deadlines
     *
     * @returns Count of expired appointments
     */
    async execute() {
        const errors = [];
        let expiredCount = 0;
        try {
            logger.info('[ExpireUnpaidAppointmentsUseCase] Starting payment timeout check...');
            // Find appointments with expired payment deadlines
            // Query: payment_status = 'pending' AND payment_deadline < NOW()
            const expiredAppointments = await this.appointmentRepository.findExpiredUnpaidAppointments();
            logger.info(`[ExpireUnpaidAppointmentsUseCase] Found ${expiredAppointments.length} expired unpaid appointments`);
            // Cancel each expired appointment
            for (const appointment of expiredAppointments) {
                try {
                    // Check if payment is actually expired (double-check in domain)
                    if (!appointment.isPaymentExpired()) {
                        logger.warn(`[ExpireUnpaidAppointmentsUseCase] Appointment ${appointment.appointmentId.value} not expired, skipping`);
                        continue;
                    }
                    // Cancel appointment with system reason
                    appointment.cancel('Payment timeout - Appointment auto-cancelled due to unpaid invoice', 'system');
                    // Save appointment (will emit AppointmentCancelledEvent)
                    await this.appointmentRepository.save(appointment);
                    expiredCount++;
                    logger.info(`[ExpireUnpaidAppointmentsUseCase] Expired appointment cancelled. AppointmentId: ${appointment.appointmentId.value}, PatientId: ${appointment.patientId}, DoctorId: ${appointment.doctorId}, PaymentDeadline: ${appointment.paymentDeadline?.toISOString()}`);
                }
                catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    errors.push(`Failed to cancel appointment ${appointment.appointmentId.value}: ${errorMessage}`);
                    logger.error(`[ExpireUnpaidAppointmentsUseCase] Error cancelling expired appointment. AppointmentId: ${appointment.appointmentId.value}, Error: ${errorMessage}`);
                }
            }
            logger.info(`[ExpireUnpaidAppointmentsUseCase] Payment timeout check completed. Expired: ${expiredCount}, Errors: ${errors.length}`);
            return {
                expiredCount,
                errors
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger.error(`[ExpireUnpaidAppointmentsUseCase] Fatal error during payment timeout check: ${errorMessage}`);
            throw error;
        }
    }
}
exports.ExpireUnpaidAppointmentsUseCase = ExpireUnpaidAppointmentsUseCase;
//# sourceMappingURL=ExpireUnpaidAppointments.use-case.js.map