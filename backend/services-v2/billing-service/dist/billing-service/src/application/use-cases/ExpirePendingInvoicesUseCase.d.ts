import { IInvoiceRepository } from "../../domain/repositories/IInvoiceRepository";
import { IEventBus } from "../../../../shared/application/services/event-bus.interface";
export interface ExpirePendingInvoicesResult {
    expiredCount: number;
    errors: string[];
}
/**
 * ExpirePendingInvoicesUseCase
 * Finds unpaid invoices past their due date, marks them as expired and emits events.
 */
export declare class ExpirePendingInvoicesUseCase {
    private readonly invoiceRepository;
    private readonly eventBus;
    constructor(invoiceRepository: IInvoiceRepository, eventBus: IEventBus);
    execute(referenceDate?: Date): Promise<ExpirePendingInvoicesResult>;
}
//# sourceMappingURL=ExpirePendingInvoicesUseCase.d.ts.map