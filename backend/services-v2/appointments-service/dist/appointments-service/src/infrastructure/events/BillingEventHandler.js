"use strict";
/**
 * Billing Event Handler - Infrastructure Layer
 * Handles billing events and updates appointment status accordingly
 *
 * @compliance Clean Architecture, Event-Driven, Idempotent
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingEventHandler = void 0;
const Logger_1 = require("../logging/Logger");
const Appointment_aggregate_1 = require("../../domain/aggregates/Appointment.aggregate");
const logger = (0, Logger_1.createLogger)("BillingEventHandler");
/**
 * Billing Event Handler
 * Subscribes to billing.payment.completed and confirms appointments
 *
 * ✅ KEY FEATURES:
 * - Idempotent: Safe to call multiple times for same payment
 * - Multiple guards for safety
 * - Proper error handling with logging
 * - Domain-driven design compliance
 */
class BillingEventHandler {
    constructor(appointmentRepository) {
        this.appointmentRepository = appointmentRepository;
    }
    /**
     * Handle payment processed event from Billing Service
     * Updates appointment status to CONFIRMED when payment succeeds
     *
     * ⚠️ IDEMPOTENT: Safe to call multiple times for same payment
     *
     * FLOW:
     * 1. Billing publishes billing.payment.completed
     * 2. Appointments subscribes and calls this handler
     * 3. Appointment status updated to CONFIRMED
     * 4. Appointment emits appointment.confirmed event
     * 5. Notifications subscribes to appointment.confirmed
     *
     * @param data Payment processed event data
     * @throws Error if appointment not found or update fails
     */
    async handlePaymentProcessed(data) {
        const { appointmentId, paymentId, amount, method, processedAt } = data;
        logger.info("[BillingEventHandler] Payment processed event received", {
            appointmentId,
            paymentId,
            amount,
            method,
            processedAt,
        });
        // ===== GUARD 1: Validate appointmentId exists =====
        if (!appointmentId) {
            logger.warn("[BillingEventHandler] No appointmentId in payment event - skipping", {
                paymentId,
                invoiceId: data.invoiceId,
            });
            return; // Not all payments are appointment-related
        }
        // ===== GUARD 2: Load appointment =====
        const appointment = await this.appointmentRepository.findByIdString(appointmentId);
        if (!appointment) {
            const errorMsg = `Appointment ${appointmentId} not found for payment ${paymentId}. ` +
                "This indicates data inconsistency between Billing and Appointments services.";
            logger.error("[BillingEventHandler] Appointment not found", new Error(errorMsg), {
                appointmentId,
                paymentId,
            });
            throw new Error(errorMsg);
        }
        // ===== GUARD 3: Idempotency check =====
        // Phòng trường hợp Billing publish lại event (at-least-once delivery)
        if (appointment.getStatus() === Appointment_aggregate_1.AppointmentStatus.CONFIRMED) {
            logger.warn("[BillingEventHandler] Appointment already confirmed - idempotent skip", {
                appointmentId,
                paymentId,
                currentStatus: appointment.getStatus(),
                confirmedAt: appointment.getConfirmedAt(),
                message: "Event already processed. This is normal for at-least-once delivery.",
            });
            return; // ✅ Safe exit - event đã xử lý rồi
        }
        // ===== GUARD 4: Status validation (allow SCHEDULED for legacy flows) =====
        const allowedStatuses = [
            Appointment_aggregate_1.AppointmentStatus.PENDING_PAYMENT,
            Appointment_aggregate_1.AppointmentStatus.SCHEDULED, // Hỗ trợ flow ví thanh toán ngay khi đặt
        ];
        if (!allowedStatuses.includes(appointment.getStatus())) {
            logger.warn("[BillingEventHandler] Appointment not in payable status", {
                appointmentId,
                currentStatus: appointment.getStatus(),
                allowedStatuses,
                message: "Payment received but appointment not in expected status. " +
                    "May indicate race condition or manual update.",
            });
            // Không throw error - có thể do race condition hoặc manual update
            // Log để investigate nhưng không block payment confirmation
            return;
        }
        // ===== DOMAIN LOGIC: Confirm appointment =====
        try {
            // Call domain method - will validate and emit domain event
            appointment.confirm("system", `Payment ${paymentId} completed successfully. Amount: ${amount} ${data.currency}, Method: ${method}`);
            // Save aggregate (will collect & publish domain events)
            await this.appointmentRepository.save(appointment);
            // ↑ Repository sẽ:
            //   1. Persist appointment với status=CONFIRMED
            //   2. Emit AppointmentConfirmedEvent qua event bus
            //   3. Notifications Service sẽ subscribe event này
            logger.info("[BillingEventHandler] Appointment confirmed successfully", {
                appointmentId,
                paymentId,
                previousStatus: Appointment_aggregate_1.AppointmentStatus.PENDING_PAYMENT,
                newStatus: Appointment_aggregate_1.AppointmentStatus.CONFIRMED,
                confirmedAt: appointment.getConfirmedAt(),
                confirmedBy: "system",
            });
        }
        catch (error) {
            logger.error("[BillingEventHandler] Failed to confirm appointment", error, {
                appointmentId,
                paymentId,
                errorMessage: error.message,
                errorStack: error.stack,
            });
            // Rethrow để retry mechanism xử lý
            // RabbitMQ sẽ requeue message để thử lại
            throw error;
        }
    }
    /**
     * Handle payment failed event (optional - for future)
     * Cancel appointment if payment fails
     */
    async handlePaymentFailed(data) {
        // FUTURE WORK: Cancel appointment if payment fails
        logger.info("[BillingEventHandler] Payment failed event received", {
            appointmentId: data.appointmentId,
            paymentId: data.paymentId,
            failureReason: data.failureReason,
        });
        // Implementation: Cancel appointment with reason
        // appointment.cancel('system', `Payment failed: ${data.failureReason}`);
    }
}
exports.BillingEventHandler = BillingEventHandler;
//# sourceMappingURL=BillingEventHandler.js.map