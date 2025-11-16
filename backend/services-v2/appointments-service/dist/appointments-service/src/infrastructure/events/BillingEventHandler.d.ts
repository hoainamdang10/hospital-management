/**
 * Billing Event Handler - Infrastructure Layer
 * Handles billing events and updates appointment status accordingly
 *
 * @compliance Clean Architecture, Event-Driven, Idempotent
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
/**
 * Payment Processed Event Data (from Billing Service)
 */
export interface PaymentProcessedEventData {
    invoiceId: string;
    paymentId: string;
    amount: number;
    currency: string;
    method: string;
    processedAt: Date;
    appointmentId?: string;
}
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
export declare class BillingEventHandler {
    private readonly appointmentRepository;
    constructor(appointmentRepository: IAppointmentRepository);
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
    handlePaymentProcessed(data: PaymentProcessedEventData): Promise<void>;
    /**
     * Handle payment failed event (optional - for future)
     * Cancel appointment if payment fails
     */
    handlePaymentFailed(data: {
        appointmentId?: string;
        paymentId: string;
        failureReason: string;
    }): Promise<void>;
}
//# sourceMappingURL=BillingEventHandler.d.ts.map