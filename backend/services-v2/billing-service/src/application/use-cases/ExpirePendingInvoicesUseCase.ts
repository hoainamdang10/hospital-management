import { IInvoiceRepository } from "../../domain/repositories/IInvoiceRepository";
import { IEventBus } from "@shared/application/services/event-bus.interface";
import { logger } from "../../infrastructure/logging/logger";

export interface ExpirePendingInvoicesResult {
  expiredCount: number;
  errors: string[];
}

/**
 * ExpirePendingInvoicesUseCase
 * Finds unpaid invoices past their due date, marks them as expired and emits events.
 */
export class ExpirePendingInvoicesUseCase {
  constructor(
    private readonly invoiceRepository: IInvoiceRepository,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(referenceDate: Date = new Date()): Promise<ExpirePendingInvoicesResult> {
    const errors: string[] = [];
    let expiredCount = 0;

    try {
      const expiredInvoices =
        await this.invoiceRepository.findExpiredPendingInvoices(referenceDate);

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

          logger.info("[ExpirePendingInvoicesUseCase] Invoice expired", {
            invoiceId: invoice.id,
            appointmentId: invoice.getAppointmentId(),
            dueDate: invoice.dueDate?.toISOString(),
          });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unknown error";
          logger.error(
            "[ExpirePendingInvoicesUseCase] Failed to expire invoice",
            {
              invoiceId: invoice.id,
              error: message,
            },
          );
          errors.push(`Invoice ${invoice.id}: ${message}`);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error(
        "[ExpirePendingInvoicesUseCase] Fatal error while scanning invoices",
        { error: message },
      );
      errors.push(message);
    }

    return {
      expiredCount,
      errors,
    };
  }
}
