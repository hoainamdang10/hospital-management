"use strict";
/**
 * Payment Completed Handler - Infrastructure Layer
 * Handles payment completed events from Billing Service
 * Auto-confirms appointments after successful payment (Prepaid Model)
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentCompletedHandler = void 0;
const domain_events_1 = require("../../../../../shared/domain/events/domain-events");
const Logger_1 = require("../../logging/Logger");
const logger = (0, Logger_1.createLogger)("PaymentCompletedHandler");
/**
 * PaymentCompletedHandler
 * Handles billing.payment.completed events to auto-confirm appointments
 */
class PaymentCompletedHandler {
    constructor(appointmentRepository, appointmentReadModelRepository, eventBus) {
        this.appointmentRepository = appointmentRepository;
        this.appointmentReadModelRepository = appointmentReadModelRepository;
        this.eventBus = eventBus;
    }
    setEventBus(eventBus) {
        this.eventBus = eventBus;
    }
    /**
     * Handle payment completed event
     * Auto-confirms appointment after successful payment
     */
    async handle(data) {
        // Normalize snake_case fields if present
        if (!data.appointmentId && data.appointment_id) {
            data.appointmentId = data.appointment_id;
        }
        if (!data.invoiceId && data.invoice_id) {
            data.invoiceId = data.invoice_id;
        }
        if (!data.paymentId && data.payment_id) {
            data.paymentId = data.payment_id;
        }
        logger.info(`Processing payment completed event. PaymentId: ${data.paymentId}, InvoiceId: ${data.invoiceId}, AppointmentId: ${data.appointmentId}, Amount: ${data.amount}, Method: ${data.method}`);
        // Validate appointmentId exists
        if (!data.appointmentId) {
            logger.warn(`Payment event missing appointmentId - cannot auto-confirm appointment. InvoiceId: ${data.invoiceId}, PaymentId: ${data.paymentId}`);
            return;
        }
        try {
            // Find appointment by ID
            const appointment = await this.appointmentRepository.findByIdString(data.appointmentId);
            if (!appointment) {
                logger.error(`Appointment not found for payment - cannot auto-confirm. AppointmentId: ${data.appointmentId}, InvoiceId: ${data.invoiceId}, PaymentId: ${data.paymentId}`);
                return;
            }
            const paymentTimestamp = this.resolvePaymentTimestamp(data.processedAt);
            const deadline = appointment.paymentDeadline;
            if (this.isAlreadyPaidOrConfirmed(appointment)) {
                logger.info(`Appointment already processed for payment - skipping duplicate event. AppointmentId: ${data.appointmentId}, CurrentStatus: ${appointment.status}, PaymentStatus: ${appointment.paymentStatus}`);
                await this.syncReadModelPaymentStatus(data.appointmentId, appointment.paymentStatus || "paid");
                return;
            }
            if (deadline && paymentTimestamp > deadline) {
                await this.handleExpiredPayment(appointment, data, deadline, paymentTimestamp);
                return;
            }
            try {
                appointment.confirm("system");
            }
            catch (error) {
                if (error instanceof Error && this.isDeadlineError(error)) {
                    await this.handleExpiredPayment(appointment, data, deadline, paymentTimestamp);
                    return;
                }
                throw error;
            }
            appointment.markAsPaid();
            await this.appointmentRepository.save(appointment);
            await this.syncReadModelPaymentStatus(data.appointmentId, "paid");
            logger.info(`Appointment auto-confirmed and marked as paid. AppointmentId: ${data.appointmentId}, PaymentId: ${data.paymentId}, InvoiceId: ${data.invoiceId}, Status: ${appointment.status} → confirmed, PaymentStatus: pending → paid`);
        }
        catch (error) {
            logger.error(`Error handling payment completed event. AppointmentId: ${data.appointmentId}, InvoiceId: ${data.invoiceId}, PaymentId: ${data.paymentId}, Error: ${error instanceof Error ? error.message : "Unknown error"}`);
            throw error; // Re-throw to trigger retry mechanism
        }
    }
    isAlreadyPaidOrConfirmed(appointment) {
        const alreadyPaid = appointment.paymentStatus === "paid";
        const alreadyConfirmed = appointment.status === "confirmed" || appointment.status === "completed";
        return alreadyPaid || alreadyConfirmed;
    }
    resolvePaymentTimestamp(value) {
        if (!value) {
            return new Date();
        }
        if (value instanceof Date) {
            return value;
        }
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
    }
    isDeadlineError(error) {
        return error.message.includes("payment deadline has passed");
    }
    async handleExpiredPayment(appointment, data, deadline, processedAt) {
        logger.warn(`Payment arrived after deadline. AppointmentId: ${data.appointmentId}, InvoiceId: ${data.invoiceId}, PaymentId: ${data.paymentId}, Deadline: ${deadline?.toISOString()}, ProcessedAt: ${processedAt.toISOString()}`);
        await this.syncReadModelPaymentStatus(data.appointmentId, "expired");
        await this.publishPaymentExpiredEvent(appointment, data, deadline, processedAt);
    }
    async syncReadModelPaymentStatus(appointmentId, status) {
        try {
            await this.appointmentReadModelRepository.updatePaymentStatus(appointmentId, status);
        }
        catch (error) {
            logger.error(`Failed to sync payment status for appointment ${appointmentId}`, error);
        }
    }
    async publishPaymentExpiredEvent(appointment, data, deadline, processedAt) {
        if (!this.eventBus) {
            logger.warn("Event bus not configured, cannot publish payment expired event");
            return;
        }
        try {
            const event = new domain_events_1.AppointmentPaymentExpiredEvent(data.appointmentId, appointment.patientId, appointment.doctorId, data.invoiceId, data.paymentId, data.amount, data.currency, processedAt, deadline);
            await this.eventBus.publish(event);
            logger.info(`Published appointment.payment.expired event for appointment ${data.appointmentId}`);
        }
        catch (error) {
            logger.error("Failed to publish AppointmentPaymentExpiredEvent", error);
        }
    }
}
exports.PaymentCompletedHandler = PaymentCompletedHandler;
//# sourceMappingURL=PaymentCompletedHandler.js.map