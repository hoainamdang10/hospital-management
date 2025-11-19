/**
 * Payment Completed Handler - Infrastructure Layer
 * Handles payment completed events from Billing Service
 * Auto-confirms appointments after successful payment (Prepaid Model)
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture
 */

import { IAppointmentRepository } from '../../../domain/repositories/IAppointmentRepository';
import { createLogger } from '../../logging/Logger';

const logger = createLogger('PaymentCompletedHandler');

export interface PaymentCompletedEventData {
  invoiceId: string;
  paymentId: string;
  amount: number;
  currency: string;
  method: string;
  processedAt: Date;
  appointmentId?: string; // Added for prepaid flow
}

/**
 * PaymentCompletedHandler
 * Handles billing.payment.completed events to auto-confirm appointments
 */
export class PaymentCompletedHandler {
  constructor(
    private readonly appointmentRepository: IAppointmentRepository
  ) {}

  /**
   * Handle payment completed event
   * Auto-confirms appointment after successful payment
   */
  async handle(data: PaymentCompletedEventData): Promise<void> {
    logger.info(
      `Processing payment completed event. PaymentId: ${data.paymentId}, InvoiceId: ${data.invoiceId}, AppointmentId: ${data.appointmentId}, Amount: ${data.amount}, Method: ${data.method}`
    );

    // Validate appointmentId exists
    if (!data.appointmentId) {
      logger.warn(
        `Payment event missing appointmentId - cannot auto-confirm appointment. InvoiceId: ${data.invoiceId}, PaymentId: ${data.paymentId}`
      );
      return;
    }

    try {
      // Find appointment by ID
      const appointment = await this.appointmentRepository.findByIdString(data.appointmentId);
      
      if (!appointment) {
        logger.error(
          `Appointment not found for payment - cannot auto-confirm. AppointmentId: ${data.appointmentId}, InvoiceId: ${data.invoiceId}, PaymentId: ${data.paymentId}`
        );
        return;
      }

      // Check if appointment is in SCHEDULED or PENDING_PAYMENT status (Prepaid Model)
      if (appointment.status === 'scheduled' || appointment.status === 'pending_payment') {
        // Auto-confirm appointment after successful payment
        appointment.confirm('system'); // System auto-confirmation

        // Mark appointment as paid (Flow 3 - Payment Tracking)
        appointment.markAsPaid();

        await this.appointmentRepository.save(appointment);

        logger.info(
          `Appointment auto-confirmed and marked as paid. AppointmentId: ${data.appointmentId}, PaymentId: ${data.paymentId}, InvoiceId: ${data.invoiceId}, Status: ${appointment.status} → confirmed, PaymentStatus: pending → paid`
        );
      } else {
        // Appointment already confirmed or in different status
        logger.info(
          `Appointment not in valid status for auto-confirmation - skipping. AppointmentId: ${data.appointmentId}, CurrentStatus: ${appointment.status}, PaymentId: ${data.paymentId}, InvoiceId: ${data.invoiceId}`
        );
      }
    } catch (error) {
      logger.error(
        `Error handling payment completed event. AppointmentId: ${data.appointmentId}, InvoiceId: ${data.invoiceId}, PaymentId: ${data.paymentId}, Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error; // Re-throw to trigger retry mechanism
    }
  }
}
