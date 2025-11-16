/**
 * CreatePaymentReminderUseCase - Command Use Case
 * Create payment reminder schedule for invoice using Event-Driven Architecture
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, Event-Driven
 */
import { IInvoiceRepository } from '../../domain/repositories/IInvoiceRepository';
import { IEventBus } from '@shared/infrastructure/event-bus/IEventBus';
export interface CreatePaymentReminderCommand {
    invoiceId: string;
    reminderDays?: number[];
}
export interface CreatePaymentReminderResult {
    success: boolean;
    invoiceId: string;
    reminders: Array<{
        type: string;
        scheduledDate: Date;
        scheduleId: string;
    }>;
    message: string;
}
export declare class CreatePaymentReminderUseCase {
    private readonly invoiceRepository;
    private readonly eventBus;
    constructor(invoiceRepository: IInvoiceRepository, eventBus: IEventBus);
    execute(command: CreatePaymentReminderCommand): Promise<CreatePaymentReminderResult>;
}
//# sourceMappingURL=CreatePaymentReminderUseCase.d.ts.map