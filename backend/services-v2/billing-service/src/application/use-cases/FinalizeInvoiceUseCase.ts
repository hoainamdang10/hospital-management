import { BaseHealthcareUseCase } from '@shared/application/base/base-healthcare-use-case';
import { IInvoiceRepository } from '../../domain/repositories/IInvoiceRepository';
import { IEventBus } from '@shared/application/services/event-bus.interface';
import { ILogger } from '@shared/application/services/logger.interface';

export interface FinalizeInvoiceRequest {
  invoiceId: string;
}

export interface FinalizeInvoiceResponse {
  invoiceId: string;
  invoiceNumber: string;
  status: string;
}

export class FinalizeInvoiceUseCase extends BaseHealthcareUseCase<FinalizeInvoiceRequest, FinalizeInvoiceResponse> {
  protected readonly logger: ILogger;

  constructor(
    private readonly invoiceRepository: IInvoiceRepository,
    private readonly eventBus: IEventBus,
    logger: ILogger
  ) {
    super();
    this.logger = logger;
  }

  protected async executeImpl(request: FinalizeInvoiceRequest): Promise<FinalizeInvoiceResponse> {
    this.logger.info('Finalizing invoice', { invoiceId: request.invoiceId });

    const invoice = await this.invoiceRepository.findById(request.invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    invoice.finalize();
    await this.invoiceRepository.save(invoice);

    const events = invoice.getUncommittedEvents();
    for (const event of events) {
      await this.eventBus.publish(event);
    }
    invoice.markEventsAsCommitted();

    this.logger.info('Invoice finalized successfully', { invoiceId: invoice.id });

    return {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber!,
      status: invoice.status.value
    };
  }
}
