import { BaseHealthcareUseCase } from '@shared/application/base/base-healthcare-use-case';
import { IInvoiceRepository } from '../../domain/repositories/IInvoiceRepository';
import { IEventBus } from '@shared/application/services/event-bus.interface';
import { ILogger } from '@shared/application/services/logger.interface';
import { Invoice } from '../../domain/aggregates/Invoice';
import { InvoiceItem } from '../../domain/entities/InvoiceItem';
import { Money } from '../../domain/value-objects/Money';
import { Insurance } from '../../domain/value-objects/Insurance';

export interface CreateInvoiceRequest {
  patientId: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
  insurance?: {
    provider: string;
    policyNumber: string;
    coveragePercentage: number;
  };
}

export interface CreateInvoiceResponse {
  invoiceId: string;
  invoiceNumber?: string;
  totalAmount: number;
  outstandingAmount: number;
  status: string;
}

export class CreateInvoiceUseCase extends BaseHealthcareUseCase<CreateInvoiceRequest, CreateInvoiceResponse> {
  protected readonly logger: ILogger;

  constructor(
    private readonly invoiceRepository: IInvoiceRepository,
    private readonly eventBus: IEventBus,
    logger: ILogger
  ) {
    super();
    this.logger = logger;
  }

  protected async executeImpl(request: CreateInvoiceRequest): Promise<CreateInvoiceResponse> {
    this.logger.info('Creating invoice', { patientId: request.patientId });

    // Create invoice items
    const items = request.items.map(item =>
      InvoiceItem.create(
        item.description,
        item.quantity,
        Money.create(item.unitPrice)
      )
    );

    // Create insurance if provided
    const insurance = request.insurance
      ? Insurance.create(
          request.insurance.provider,
          request.insurance.policyNumber,
          request.insurance.coveragePercentage
        )
      : undefined;

    // Create invoice
    const invoice = Invoice.create(request.patientId, items, insurance);

    // Save invoice
    await this.invoiceRepository.save(invoice);

    // Publish domain events
    const events = invoice.getUncommittedEvents();
    for (const event of events) {
      await this.eventBus.publish(event);
    }
    invoice.markEventsAsCommitted();

    this.logger.info('Invoice created successfully', { invoiceId: invoice.id });

    return {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      totalAmount: invoice.totalAmount.amount,
      outstandingAmount: invoice.outstandingAmount.amount,
      status: invoice.status.value
    };
  }
}
