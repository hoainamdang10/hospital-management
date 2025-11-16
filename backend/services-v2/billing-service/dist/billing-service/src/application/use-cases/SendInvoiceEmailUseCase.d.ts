/**
 * SendInvoiceEmailUseCase - Command Use Case
 * Send invoice via email to patient using Event-Driven Architecture
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, Event-Driven
 */
import { IInvoiceRepository } from '../../domain/repositories/IInvoiceRepository';
import { IEventBus } from '@shared/infrastructure/event-bus/IEventBus';
export interface SendInvoiceEmailCommand {
    invoiceId: string;
    recipientEmail?: string;
}
export interface SendInvoiceEmailResult {
    success: boolean;
    invoiceId: string;
    notificationId: string;
    message: string;
}
export declare class SendInvoiceEmailUseCase {
    private readonly invoiceRepository;
    private readonly eventBus;
    constructor(invoiceRepository: IInvoiceRepository, eventBus: IEventBus);
    execute(command: SendInvoiceEmailCommand): Promise<SendInvoiceEmailResult>;
    private formatInvoiceEmail;
}
//# sourceMappingURL=SendInvoiceEmailUseCase.d.ts.map