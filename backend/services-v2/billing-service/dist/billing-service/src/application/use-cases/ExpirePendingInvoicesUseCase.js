"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpirePendingInvoicesUseCase = void 0;
const logger_1 = require("../../infrastructure/logging/logger");
/**
 * ExpirePendingInvoicesUseCase
 * Finds unpaid invoices past their due date, marks them as expired and emits events.
 */
class ExpirePendingInvoicesUseCase {
    constructor(invoiceRepository, eventBus) {
        this.invoiceRepository = invoiceRepository;
        this.eventBus = eventBus;
    }
    async execute(referenceDate = new Date()) {
        const errors = [];
        let expiredCount = 0;
        try {
            const expiredInvoices = await this.invoiceRepository.findExpiredPendingInvoices(referenceDate);
            for (const invoice of expiredInvoices) {
                try {
                    invoice.markAsExpired("Payment deadline exceeded", "billing-cron");
                    await this.invoiceRepository.save(invoice);
                    const events = invoice.getUncommittedEvents();
                    for (const event of events) {
                        await this.eventBus.publish(event);
                    }
                    invoice.markEventsAsCommitted();
                    expiredCount++;
                    logger_1.logger.info("[ExpirePendingInvoicesUseCase] Invoice expired", {
                        invoiceId: invoice.id,
                        appointmentId: invoice.getAppointmentId(),
                        dueDate: invoice.dueDate?.toISOString(),
                    });
                }
                catch (error) {
                    const message = error instanceof Error ? error.message : "Unknown error";
                    logger_1.logger.error("[ExpirePendingInvoicesUseCase] Failed to expire invoice", {
                        invoiceId: invoice.id,
                        error: message,
                    });
                    errors.push(`Invoice ${invoice.id}: ${message}`);
                }
            }
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error";
            logger_1.logger.error("[ExpirePendingInvoicesUseCase] Fatal error while scanning invoices", { error: message });
            errors.push(message);
        }
        return {
            expiredCount,
            errors,
        };
    }
}
exports.ExpirePendingInvoicesUseCase = ExpirePendingInvoicesUseCase;
//# sourceMappingURL=ExpirePendingInvoicesUseCase.js.map