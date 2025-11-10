import { BaseHealthcareUseCase } from '@shared/application/base/base-healthcare-use-case';
import { IInvoiceRepository } from '../../domain/repositories/IInvoiceRepository';
import { IEventBus } from '@shared/application/services/event-bus.interface';
import { ILogger } from '@shared/application/services/logger.interface';
import { Money } from '../../domain/value-objects/Money';

export interface RefundPaymentRequest {
  invoiceId: string;
  paymentId: string;
  reason: string;
}

export interface RefundPaymentResponse {
  success: boolean;
  invoiceId: string;
  paymentId: string;
  refundedAmount: number;
  outstandingAmount: number;
}

export class RefundPaymentUseCase extends BaseHealthcareUseCase<RefundPaymentRequest, RefundPaymentResponse> {
  protected readonly logger: ILogger;

  constructor(
    private readonly invoiceRepository: IInvoiceRepository,
    private readonly eventBus: IEventBus,
    logger: ILogger
  ) {
    super();
    this.logger = logger;
  }

  protected async executeImpl(request: RefundPaymentRequest): Promise<RefundPaymentResponse> {
    this.logger.info('Processing payment refund', { 
      invoiceId: request.invoiceId,
      paymentId: request.paymentId 
    });

    const invoice = await this.invoiceRepository.findById(request.invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    const payment = invoice.payments.find(p => p.id === request.paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status !== 'completed') {
      throw new Error('Can only refund completed payments');
    }

    // Refund the payment
    payment.refund();

    // Recalculate outstanding amount
    const totalPaid = invoice.payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum.add(p.amount), Money.zero());

    const outstandingAmount = invoice.totalAmount
      .subtract(invoice.insuranceCoverage)
      .subtract(totalPaid);

    await this.invoiceRepository.save(invoice);

    const events = invoice.getUncommittedEvents();
    for (const event of events) {
      await this.eventBus.publish(event);
    }
    invoice.markEventsAsCommitted();

    this.logger.info('Payment refunded successfully', { 
      paymentId: payment.id,
      amount: payment.amount.amount 
    });

    return {
      success: true,
      invoiceId: invoice.id,
      paymentId: payment.id,
      refundedAmount: payment.amount.amount,
      outstandingAmount: outstandingAmount.amount
    };
  }
}
