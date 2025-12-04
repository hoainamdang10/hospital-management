/**
 * Payment Completed Handler - Infrastructure Layer
 * Handles payment completed events from Billing Service
 * Auto-confirms appointments after successful payment (Prepaid Model)
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture
 */

import { IAppointmentRepository } from "../../../domain/repositories/IAppointmentRepository";
import { IAppointmentReadModelRepository } from "../../../domain/repositories/IAppointmentReadModelRepository";
import { Appointment } from "../../../domain/aggregates/Appointment.aggregate";
import { AppointmentPaymentExpiredEvent } from "@shared/domain/events/domain-events";
import { IEventBus } from "@shared/application/services/event-bus.interface";
import { createLogger } from "../../logging/Logger";

const logger = createLogger("PaymentCompletedHandler");

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
    private readonly appointmentRepository: IAppointmentRepository,
    private readonly appointmentReadModelRepository: IAppointmentReadModelRepository,
    private eventBus?: IEventBus,
  ) {}

  public setEventBus(eventBus: IEventBus): void {
    this.eventBus = eventBus;
  }

  /**
   * Handle payment completed event
   * Auto-confirms appointment after successful payment
   */
  async handle(data: PaymentCompletedEventData): Promise<void> {
    // Normalize snake_case fields if present
    if (!data.appointmentId && (data as any).appointment_id) {
      data.appointmentId = (data as any).appointment_id;
    }
    if (!data.invoiceId && (data as any).invoice_id) {
      data.invoiceId = (data as any).invoice_id;
    }
    if (!data.paymentId && (data as any).payment_id) {
      data.paymentId = (data as any).payment_id;
    }

    logger.info(
      `Processing payment completed event. PaymentId: ${data.paymentId}, InvoiceId: ${data.invoiceId}, AppointmentId: ${data.appointmentId}, Amount: ${data.amount}, Method: ${data.method}`,
    );

    // Validate appointmentId exists
    if (!data.appointmentId) {
      logger.warn(
        `Payment event missing appointmentId - cannot auto-confirm appointment. InvoiceId: ${data.invoiceId}, PaymentId: ${data.paymentId}`,
      );
      return;
    }

    try {
      // Find appointment by ID
      const appointment = await this.appointmentRepository.findByIdString(
        data.appointmentId,
      );

      if (!appointment) {
        logger.error(
          `Appointment not found for payment - cannot auto-confirm. AppointmentId: ${data.appointmentId}, InvoiceId: ${data.invoiceId}, PaymentId: ${data.paymentId}`,
        );
        return;
      }

      const paymentTimestamp = this.resolvePaymentTimestamp(data.processedAt);
      const deadline = appointment.paymentDeadline;

      if (this.isAlreadyPaidOrConfirmed(appointment)) {
        logger.info(
          `Appointment already processed for payment - skipping duplicate event. AppointmentId: ${data.appointmentId}, CurrentStatus: ${appointment.status}, PaymentStatus: ${appointment.paymentStatus}`,
        );
        await this.syncReadModelPaymentStatus(
          data.appointmentId,
          appointment.paymentStatus || "paid",
        );
        return;
      }

      if (deadline && paymentTimestamp > deadline) {
        await this.handleExpiredPayment(
          appointment,
          data,
          deadline,
          paymentTimestamp,
        );
        return;
      }

      try {
        appointment.confirm("system");
      } catch (error) {
        if (error instanceof Error && this.isDeadlineError(error)) {
          await this.handleExpiredPayment(
            appointment,
            data,
            deadline,
            paymentTimestamp,
          );
          return;
        }
        throw error;
      }

      appointment.markAsPaid();

      await this.appointmentRepository.save(appointment);
      await this.syncReadModelPaymentStatus(data.appointmentId, "paid");

      logger.info(
        `Appointment auto-confirmed and marked as paid. AppointmentId: ${data.appointmentId}, PaymentId: ${data.paymentId}, InvoiceId: ${data.invoiceId}, Status: ${appointment.status} → confirmed, PaymentStatus: pending → paid`,
      );
    } catch (error) {
      logger.error(
        `Error handling payment completed event. AppointmentId: ${data.appointmentId}, InvoiceId: ${data.invoiceId}, PaymentId: ${data.paymentId}, Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error; // Re-throw to trigger retry mechanism
    }
  }

  private isAlreadyPaidOrConfirmed(appointment: Appointment): boolean {
    const alreadyPaid = appointment.paymentStatus === "paid";
    const alreadyConfirmed =
      appointment.status === "confirmed" || appointment.status === "completed";
    return alreadyPaid || alreadyConfirmed;
  }

  private resolvePaymentTimestamp(value?: Date | string): Date {
    if (!value) {
      return new Date();
    }
    if (value instanceof Date) {
      return value;
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }

  private isDeadlineError(error: Error): boolean {
    return error.message.includes("payment deadline has passed");
  }

  private async handleExpiredPayment(
    appointment: Appointment,
    data: PaymentCompletedEventData,
    deadline: Date | undefined,
    processedAt: Date,
  ): Promise<void> {
    logger.warn(
      `Payment arrived after deadline. AppointmentId: ${data.appointmentId}, InvoiceId: ${data.invoiceId}, PaymentId: ${data.paymentId}, Deadline: ${deadline?.toISOString()}, ProcessedAt: ${processedAt.toISOString()}`,
    );

    await this.syncReadModelPaymentStatus(data.appointmentId!, "expired");
    await this.publishPaymentExpiredEvent(
      appointment,
      data,
      deadline,
      processedAt,
    );
  }

  private async syncReadModelPaymentStatus(
    appointmentId: string,
    status: string,
  ): Promise<void> {
    try {
      await this.appointmentReadModelRepository.updatePaymentStatus(
        appointmentId,
        status,
      );
    } catch (error) {
      logger.error(
        `Failed to sync payment status for appointment ${appointmentId}`,
        error as Error,
      );
    }
  }

  private async publishPaymentExpiredEvent(
    appointment: Appointment,
    data: PaymentCompletedEventData,
    deadline: Date | undefined,
    processedAt: Date,
  ): Promise<void> {
    if (!this.eventBus) {
      logger.warn(
        "Event bus not configured, cannot publish payment expired event",
      );
      return;
    }

    try {
      const event = new AppointmentPaymentExpiredEvent(
        data.appointmentId!,
        appointment.patientId,
        appointment.doctorId,
        data.invoiceId,
        data.paymentId,
        data.amount,
        data.currency,
        processedAt,
        deadline,
      );
      await this.eventBus.publish(event);
      logger.info(
        `Published appointment.payment.expired event for appointment ${data.appointmentId}`,
      );
    } catch (error) {
      logger.error(
        "Failed to publish AppointmentPaymentExpiredEvent",
        error as Error,
      );
    }
  }
}
