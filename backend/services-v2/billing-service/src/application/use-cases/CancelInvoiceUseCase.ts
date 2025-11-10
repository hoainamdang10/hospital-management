import { BaseHealthcareUseCase } from '@shared/application/base/base-healthcare-use-case';
import { IInvoiceRepository } from '../../domain/repositories/IInvoiceRepository';
import { IEventBus } from '@shared/application/services/event-bus.interface';
import { ILogger } from '@shared/application/services/logger.interface';

export interface CancelInvoiceRequest {
  invoiceId: string;
  reason: string;
}

export interface CancelInvoiceResponse {
  invoiceId: string;
  status: string;
  cancelledAt: Date;
}

export class CancelInvoiceUseCase extends BaseHealthcareUseCase<CancelInvoiceRequest, CancelInvoiceResponse> {
  protected readonly logger: ILogger;

  constructor(
    private readonly invoiceRepository: IInvoiceRepository,
    private readonly eventBus: IEventBus,
    logger: ILogger
  ) {
    super();
    this.logger = logger;
  }

  protected async executeImpl(request: CancelInvoiceRequest): Promise<CancelInvoiceResponse> {
    this.logger.info('Cancelling invoice', { invoiceId: request.invoiceId });

    const invoice = await this.invoiceRepository.findById(request.invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    invoice.cancel(request.reason);
    await this.invoiceRepository.save(invoice);

    const events = invoice.getUncommittedEvents();
    for (const event of events) {
      await this.eventBus.publish(event);
    }
    invoice.markEventsAsCommitted();

    this.logger.info('Invoice cancelled successfully', { invoiceId: invoice.id });

    return {
      invoiceId: invoice.id,
      status: invoice.status.value,
      cancelledAt: new Date()
    };
  }
}
