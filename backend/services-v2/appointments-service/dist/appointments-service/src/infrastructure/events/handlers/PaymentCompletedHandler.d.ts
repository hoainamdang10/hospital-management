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
import { IEventBus } from "../../../../../shared/application/services/event-bus.interface";
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
    private readonly appointmentReadModelRepository;
    private eventBus?;
    constructor(appointmentRepository: IAppointmentRepository, appointmentReadModelRepository: IAppointmentReadModelRepository, eventBus?: IEventBus | undefined);
    setEventBus(eventBus: IEventBus): void;
    /**
     * Handle payment completed event
     * Auto-confirms appointment after successful payment
     */
    handle(data: PaymentCompletedEventData): Promise<void>;
    private isAlreadyPaidOrConfirmed;
    private resolvePaymentTimestamp;
    private isDeadlineError;
    private handleExpiredPayment;
    private syncReadModelPaymentStatus;
    private publishPaymentExpiredEvent;
}
//# sourceMappingURL=PaymentCompletedHandler.d.ts.map