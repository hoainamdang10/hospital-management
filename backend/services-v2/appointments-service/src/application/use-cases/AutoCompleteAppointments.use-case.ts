import { IAppointmentRepository } from "@/domain/repositories/IAppointmentRepository";
import { createLogger } from "@/infrastructure/logging/Logger";

const logger = createLogger("AutoCompleteAppointmentsUseCase");

/**
 * Auto-Complete Past Appointments Use Case
 *
 * Automatically marks past appointments as completed
 * Runs periodically via cron job
 *
 * Business Rule:
 * - Appointments with status CONFIRMED or SCHEDULED (auto check-in/start)
 * - Appointments with status ARRIVED or IN_PROGRESS (already in workflow)
 * - Appointment time + buffer (e.g., 30 minutes) has passed
 * - Auto-mark as COMPLETED
 */
export class AutoCompleteAppointmentsUseCase {
  // Buffer time after appointment before auto-completing (in minutes)
  private readonly bufferMinutes: number;

  constructor(
    private readonly appointmentRepository: IAppointmentRepository,
    bufferMinutes: number = 30, // Default: 30 minutes (optimized for academic project)
  ) {
    this.bufferMinutes = bufferMinutes;
  }

  /**
   * Execute use case
   * Finds and completes all past appointments
   *
   * @returns Count of completed appointments
   */
  async execute(): Promise<{ completedCount: number; errors: string[] }> {
    const errors: string[] = [];
    let completedCount = 0;

    try {
      logger.info(
        "[AutoCompleteAppointmentsUseCase] Starting auto-complete check...",
      );

      // Calculate cutoff time: current time - buffer minutes
      const cutoffTime = new Date();
      cutoffTime.setMinutes(cutoffTime.getMinutes() - this.bufferMinutes);

      logger.info(
        `[AutoCompleteAppointmentsUseCase] Cutoff time: ${cutoffTime.toISOString()} (${this.bufferMinutes} minutes ago)`,
      );

      // Find appointments that should be auto-completed
      // Query: status IN (CONFIRMED, SCHEDULED, ARRIVED, IN_PROGRESS) AND appointment_datetime < cutoff_time
      const pastAppointments =
        await this.appointmentRepository.findPastAppointments(cutoffTime);

      logger.info(
        `[AutoCompleteAppointmentsUseCase] Found ${pastAppointments.length} past appointments to auto-complete`,
      );

      // Complete each past appointment
      for (const appointment of pastAppointments) {
        try {
          // Verify appointment is actually in the past
          const appointmentDateTime = appointment.getTimeSlot().toDate();

          if (appointmentDateTime > cutoffTime) {
            logger.warn(
              `[AutoCompleteAppointmentsUseCase] Appointment ${appointment.getAppointmentId().value} not yet past cutoff, skipping`,
            );
            continue;
          }

          const scheduledStartTime = appointment.getTimeSlot().getStartTime();

          // Bring CONFIRMED/SCHEDULED appointments into workflow before completing
          const currentStatus = appointment.getStatus();
          if (currentStatus === "scheduled" || currentStatus === "confirmed") {
            try {
              appointment.checkIn(scheduledStartTime);
              logger.info(
                `[AutoCompleteAppointmentsUseCase] Auto check-in executed for appointment ${appointment.getAppointmentId().value}`,
              );
            } catch (checkInError) {
              const msg =
                checkInError instanceof Error
                  ? checkInError.message
                  : "Unknown error during auto check-in";
              errors.push(
                `Failed to auto check-in appointment ${appointment.getAppointmentId().value}: ${msg}`,
              );
              logger.error(
                `[AutoCompleteAppointmentsUseCase] Error auto check-in. AppointmentId: ${appointment.getAppointmentId().value}, Error: ${msg}`,
              );
              continue;
            }
          }

          // Ensure appointment reaches IN_PROGRESS before completion
          if (appointment.getStatus() === "arrived") {
            try {
              appointment.start(scheduledStartTime);
              logger.info(
                `[AutoCompleteAppointmentsUseCase] Auto start executed for appointment ${appointment.getAppointmentId().value}`,
              );
            } catch (startError) {
              const msg =
                startError instanceof Error
                  ? startError.message
                  : "Unknown error during auto start";
              errors.push(
                `Failed to auto start appointment ${appointment.getAppointmentId().value}: ${msg}`,
              );
              logger.error(
                `[AutoCompleteAppointmentsUseCase] Error auto start. AppointmentId: ${appointment.getAppointmentId().value}, Error: ${msg}`,
              );
              continue;
            }
          }

          const latestStatus = appointment.getStatus();
          if (latestStatus !== "arrived" && latestStatus !== "in_progress") {
            logger.warn(
              `[AutoCompleteAppointmentsUseCase] Appointment ${appointment.getAppointmentId().value} has status ${latestStatus}, skipping`,
            );
            continue;
          }

          // Mark as completed
          appointment.complete();

          // Save appointment (will emit AppointmentCompletedEvent)
          await this.appointmentRepository.save(appointment);

          completedCount++;

          logger.info(
            `[AutoCompleteAppointmentsUseCase] Appointment auto-completed. AppointmentId: ${appointment.getAppointmentId().value}, DateTime: ${appointmentDateTime.toISOString()}`,
          );
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          errors.push(
            `Failed to complete appointment ${appointment.getAppointmentId().value}: ${errorMessage}`,
          );

          logger.error(
            `[AutoCompleteAppointmentsUseCase] Error completing appointment. AppointmentId: ${appointment.getAppointmentId().value}, Error: ${errorMessage}`,
          );
        }
      }

      logger.info(
        `[AutoCompleteAppointmentsUseCase] Auto-complete check completed. Completed: ${completedCount}, Errors: ${errors.length}`,
      );

      return {
        completedCount,
        errors,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logger.error(
        `[AutoCompleteAppointmentsUseCase] Fatal error during auto-complete check: ${errorMessage}`,
      );

      throw error;
    }
  }
}
