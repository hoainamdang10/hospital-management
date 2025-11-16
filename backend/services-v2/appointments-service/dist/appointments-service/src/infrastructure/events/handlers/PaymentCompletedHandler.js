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
const Logger_1 = require("../../logging/Logger");
const logger = (0, Logger_1.createLogger)('PaymentCompletedHandler');
/**
 * PaymentCompletedHandler
 * Handles billing.payment.completed events to auto-confirm appointments
 */
class PaymentCompletedHandler {
    constructor(appointmentRepository) {
        this.appointmentRepository = appointmentRepository;
    }
    /**
     * Handle payment completed event
     * Auto-confirms appointment after successful payment
     */
    async handle(data) {
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
            // Check if appointment is in SCHEDULED status
            if (appointment.status === 'scheduled') {
                // Auto-confirm appointment after successful payment
                appointment.confirm('system'); // System auto-confirmation
                // Mark appointment as paid (Flow 3 - Payment Tracking)
                appointment.markAsPaid();
                await this.appointmentRepository.save(appointment);
                logger.info(`Appointment auto-confirmed and marked as paid. AppointmentId: ${data.appointmentId}, PaymentId: ${data.paymentId}, InvoiceId: ${data.invoiceId}, Status: scheduled → confirmed, PaymentStatus: pending → paid`);
            }
            else {
                // Appointment already confirmed or in different status
                logger.info(`Appointment not in SCHEDULED status - skipping auto-confirmation. AppointmentId: ${data.appointmentId}, CurrentStatus: ${appointment.status}, PaymentId: ${data.paymentId}, InvoiceId: ${data.invoiceId}`);
            }
        }
        catch (error) {
            logger.error(`Error handling payment completed event. AppointmentId: ${data.appointmentId}, InvoiceId: ${data.invoiceId}, PaymentId: ${data.paymentId}, Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error; // Re-throw to trigger retry mechanism
        }
    }
}
exports.PaymentCompletedHandler = PaymentCompletedHandler;
//# sourceMappingURL=PaymentCompletedHandler.js.map