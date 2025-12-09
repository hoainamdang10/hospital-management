"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutoCompleteAppointmentsUseCase = void 0;
const Logger_1 = require("../../infrastructure/logging/Logger");
const logger = (0, Logger_1.createLogger)("AutoCompleteAppointmentsUseCase");
/**
 * Auto-Complete Past Appointments Use Case
 *
 * Automatically marks past appointments as completed
 * Runs periodically via cron job
 *
 * Business Rule:
 * - Appointments with status CONFIRMED or SCHEDULED
 * - Appointments with status IN_PROGRESS (already started)
 * - Appointment time + buffer (e.g., 30 minutes) has passed
 * - Auto-start from CONFIRMED/SCHEDULED, then mark as COMPLETED
 */
class AutoCompleteAppointmentsUseCase {
    constructor(appointmentRepository, bufferMinutes = 30) {
        this.appointmentRepository = appointmentRepository;
        this.bufferMinutes = bufferMinutes;
    }
    /**
     * Execute use case
     * Finds and completes all past appointments
     *
     * @returns Count of completed appointments
     */
    async execute() {
        const errors = [];
        let completedCount = 0;
        try {
            logger.info("[AutoCompleteAppointmentsUseCase] Starting auto-complete check...");
            // Calculate cutoff time: current time - buffer minutes
            const cutoffTime = new Date();
            cutoffTime.setMinutes(cutoffTime.getMinutes() - this.bufferMinutes);
            logger.info(`[AutoCompleteAppointmentsUseCase] Cutoff time: ${cutoffTime.toISOString()} (${this.bufferMinutes} minutes ago)`);
            // Find appointments that should be auto-completed
            // Query: status IN (CONFIRMED, SCHEDULED, ARRIVED, IN_PROGRESS) AND appointment_datetime < cutoff_time
            const pastAppointments = await this.appointmentRepository.findPastAppointments(cutoffTime);
            logger.info(`[AutoCompleteAppointmentsUseCase] Found ${pastAppointments.length} past appointments to auto-complete`);
            // Complete each past appointment
            for (const appointment of pastAppointments) {
                try {
                    // Verify appointment is actually in the past
                    const appointmentDateTime = appointment.getTimeSlot().getStartTime();
                    if (appointmentDateTime > cutoffTime) {
                        logger.warn(`[AutoCompleteAppointmentsUseCase] Appointment ${appointment.getAppointmentId().value} not yet past cutoff, skipping`);
                        continue;
                    }
                    const scheduledStartTime = appointment.getTimeSlot().getStartTime();
                    // Simplified flow: Start directly from CONFIRMED/SCHEDULED (no check-in)
                    const currentStatus = appointment.getStatus();
                    if (currentStatus === "scheduled" || currentStatus === "confirmed") {
                        try {
                            appointment.start(scheduledStartTime);
                            logger.info(`[AutoCompleteAppointmentsUseCase] Auto start executed for appointment ${appointment.getAppointmentId().value}`);
                        }
                        catch (startError) {
                            const msg = startError instanceof Error
                                ? startError.message
                                : "Unknown error during auto start";
                            errors.push(`Failed to auto start appointment ${appointment.getAppointmentId().value}: ${msg}`);
                            logger.error(`[AutoCompleteAppointmentsUseCase] Error auto start. AppointmentId: ${appointment.getAppointmentId().value}, Error: ${msg}`);
                            continue;
                        }
                    }
                    // Verify appointment is IN_PROGRESS before completing
                    const latestStatus = appointment.getStatus();
                    if (latestStatus !== "in_progress") {
                        logger.warn(`[AutoCompleteAppointmentsUseCase] Appointment ${appointment.getAppointmentId().value} has status ${latestStatus}, expected IN_PROGRESS, skipping`);
                        continue;
                    }
                    // Mark as completed
                    appointment.complete();
                    // Save appointment (will emit AppointmentCompletedEvent)
                    await this.appointmentRepository.save(appointment);
                    completedCount++;
                    logger.info(`[AutoCompleteAppointmentsUseCase] Appointment auto-completed. AppointmentId: ${appointment.getAppointmentId().value}, DateTime: ${appointmentDateTime.toISOString()}`);
                }
                catch (error) {
                    const errorMessage = error instanceof Error ? error.message : "Unknown error";
                    errors.push(`Failed to complete appointment ${appointment.getAppointmentId().value}: ${errorMessage}`);
                    logger.error(`[AutoCompleteAppointmentsUseCase] Error completing appointment. AppointmentId: ${appointment.getAppointmentId().value}, Error: ${errorMessage}`);
                }
            }
            logger.info(`[AutoCompleteAppointmentsUseCase] Auto-complete check completed. Completed: ${completedCount}, Errors: ${errors.length}`);
            return {
                completedCount,
                errors,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            logger.error(`[AutoCompleteAppointmentsUseCase] Fatal error during auto-complete check: ${errorMessage}`);
            throw error;
        }
    }
}
exports.AutoCompleteAppointmentsUseCase = AutoCompleteAppointmentsUseCase;
//# sourceMappingURL=AutoCompleteAppointments.use-case.js.map