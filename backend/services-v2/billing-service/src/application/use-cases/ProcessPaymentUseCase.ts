import { BaseHealthcareUseCase } from '@shared/application/base/base-healthcare-use-case';
import { IInvoiceRepository } from '../../domain/repositories/IInvoiceRepository';
import { IEventBus } from '@shared/application/services/event-bus.interface';
import { ILogger } from '@shared/application/services/logger.interface';
import { Payment, PaymentMethod } from '../../domain/entities/Payment';
import { Money } from '../../domain/value-objects/Money';

export interface ProcessPaymentRequest {
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  transactionId?: string;
}

export interface ProcessPaymentResponse {
  paymentId: string;
  invoiceId: string;
  amount: number;
  status: string;
  outstandingAmount: number;
}

export class ProcessPaymentUseCase extends BaseHealthcareUseCase<ProcessPaymentRequest, ProcessPaymentResponse> {
  protected readonly logger: ILogger;

  constructor(
    private readonly invoiceRepository: IInvoiceRepository,
    private readonly eventBus: IEventBus,
    logger: ILogger
  ) {
    super();
    this.logger = logger;
  }

  protected async executeImpl(request: ProcessPaymentRequest): Promise<ProcessPaymentResponse> {
    this.logger.info('Processing payment', { invoiceId: request.invoiceId });

    const invoice = await this.invoiceRepository.findById(request.invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    const payment = Payment.create(
      Money.create(request.amount),
      request.method,
      request.transactionId
    );

    invoice.processPayment(payment);
    await this.invoiceRepository.save(invoice);

    const events = invoice.getUncommittedEvents();
    for (const event of events) {
      await this.eventBus.publish(event);
    }
    invoice.markEventsAsCommitted();

    this.logger.info('Payment processed successfully', { paymentId: payment.id });

    return {
      paymentId: payment.id,
      invoiceId: invoice.id,
      amount: payment.amount.amount,
      status: invoice.status.value,
      outstandingAmount: invoice.outstandingAmount.amount
    };
  }
}
