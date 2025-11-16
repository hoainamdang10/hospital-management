import { IAppointmentRepository } from '@/domain/repositories/IAppointmentRepository';
import { createLogger } from '@/infrastructure/logging/Logger';

const logger = createLogger('ExpireUnpaidAppointmentsUseCase');

/**
 * Expire Unpaid Appointments Use Case
 * 
 * Automatically cancels appointments with expired payment deadlines
 * Runs periodically via cron job (every 5 minutes)
 * 
 * Flow 3 - Phase 1B: Payment Timeout Handling
 */
export class ExpireUnpaidAppointmentsUseCase {
  constructor(
    private readonly appointmentRepository: IAppointmentRepository
  ) {}

  /**
   * Execute use case
   * Finds and cancels all appointments with expired payment deadlines
   * 
   * @returns Count of expired appointments
   */
  async execute(): Promise<{ expiredCount: number; errors: string[] }> {
    const errors: string[] = [];
    let expiredCount = 0;

    try {
      logger.info('[ExpireUnpaidAppointmentsUseCase] Starting payment timeout check...');

      // Find appointments with expired payment deadlines
      // Query: payment_status = 'pending' AND payment_deadline < NOW()
      const expiredAppointments = await this.appointmentRepository.findExpiredUnpaidAppointments();

      logger.info(
        `[ExpireUnpaidAppointmentsUseCase] Found ${expiredAppointments.length} expired unpaid appointments`
      );

      // Cancel each expired appointment
      for (const appointment of expiredAppointments) {
        try {
          // Check if payment is actually expired (double-check in domain)
          if (!appointment.isPaymentExpired()) {
            logger.warn(
              `[ExpireUnpaidAppointmentsUseCase] Appointment ${appointment.appointmentId.value} not expired, skipping`
            );
            continue;
          }

          // Cancel appointment with system reason
          appointment.cancel(
            'Payment timeout - Appointment auto-cancelled due to unpaid invoice',
            'system'
          );

          // Save appointment (will emit AppointmentCancelledEvent)
          await this.appointmentRepository.save(appointment);

          expiredCount++;

          logger.info(
            `[ExpireUnpaidAppointmentsUseCase] Expired appointment cancelled. AppointmentId: ${appointment.appointmentId.value}, PatientId: ${appointment.patientId}, DoctorId: ${appointment.doctorId}, PaymentDeadline: ${appointment.paymentDeadline?.toISOString()}`
          );
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(
            `Failed to cancel appointment ${appointment.appointmentId.value}: ${errorMessage}`
          );
          
          logger.error(
            `[ExpireUnpaidAppointmentsUseCase] Error cancelling expired appointment. AppointmentId: ${appointment.appointmentId.value}, Error: ${errorMessage}`
          );
        }
      }

      logger.info(
        `[ExpireUnpaidAppointmentsUseCase] Payment timeout check completed. Expired: ${expiredCount}, Errors: ${errors.length}`
      );

      return {
        expiredCount,
        errors
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(
        `[ExpireUnpaidAppointmentsUseCase] Fatal error during payment timeout check: ${errorMessage}`
      );
      
      throw error;
    }
  }
}

