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
export interface PaymentCompletedEventData {
    invoiceId: string;
    paymentId: string;
    amount: number;
    currency: string;
    method: string;
    processedAt: Date;
    appointmentId?: string;
}
/**
 * PaymentCompletedHandler
 * Handles billing.payment.completed events to auto-confirm appointments
 */
export declare class PaymentCompletedHandler {
    private readonly appointmentRepository;
    constructor(appointmentRepository: IAppointmentRepository);
    /**
     * Handle payment completed event
     * Auto-confirms appointment after successful payment
     */
    handle(data: PaymentCompletedEventData): Promise<void>;
}
//# sourceMappingURL=PaymentCompletedHandler.d.ts.map