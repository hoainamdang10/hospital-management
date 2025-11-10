import { BaseHealthcareUseCase } from '@shared/application/base/base-healthcare-use-case';
import { IInvoiceRepository } from '../../domain/repositories/IInvoiceRepository';
import { IEventBus } from '@shared/application/services/event-bus.interface';
import { ILogger } from '@shared/application/services/logger.interface';
import { PayOSIntegrationService, WebhookData } from '../../infrastructure/services/PayOSIntegrationService';
import { Payment } from '../../domain/entities/Payment';
import { Money } from '../../domain/value-objects/Money';

export interface HandlePayOSWebhookRequest {
  webhookData: WebhookData;
  signature: string;
}

export interface HandlePayOSWebhookResponse {
  success: boolean;
  message: string;
  invoiceId?: string;
  paymentId?: string;
}

export class HandlePayOSWebhookUseCase extends BaseHealthcareUseCase<HandlePayOSWebhookRequest, HandlePayOSWebhookResponse> {
  protected readonly logger: ILogger;

  constructor(
    private readonly invoiceRepository: IInvoiceRepository,
    private readonly eventBus: IEventBus,
    private readonly payosService: PayOSIntegrationService,
    logger: ILogger
  ) {
    super();
    this.logger = logger;
  }

  protected async executeImpl(request: HandlePayOSWebhookRequest): Promise<HandlePayOSWebhookResponse> {
    this.logger.info('Handling PayOS webhook', { 
      orderCode: request.webhookData.orderCode 
    });

    // Verify webhook signature
    const isValid = this.payosService.verifyWebhookSignature(
      request.webhookData,
      request.signature
    );

    if (!isValid) {
      this.logger.error('Invalid webhook signature', { 
        orderCode: request.webhookData.orderCode 
      });
      throw new Error('Invalid webhook signature');
    }

    // Check payment status
    if (request.webhookData.code !== '00') {
      this.logger.warn('Payment not successful', { 
        orderCode: request.webhookData.orderCode,
        code: request.webhookData.code,
        desc: request.webhookData.desc
      });
      return {
        success: false,
        message: `Payment failed: ${request.webhookData.desc}`
      };
    }

    // Find invoice by description (contains invoice ID or invoice number)
    const description = request.webhookData.description;
    const invoiceIdMatch = description.match(/INV-\d{6}-\d{4}/);
    
    let invoice = null;
    if (invoiceIdMatch) {
      invoice = await this.invoiceRepository.findByInvoiceNumber(invoiceIdMatch[0]);
    }

    if (!invoice) {
      this.logger.error('Invoice not found from webhook', { 
        description,
        orderCode: request.webhookData.orderCode 
      });
      throw new Error('Invoice not found');
    }

    // Create payment
    const payment = Payment.create(
      Money.create(request.webhookData.amount),
      'payos',
      request.webhookData.reference
    );

    // Process payment
    invoice.processPayment(payment);
    await this.invoiceRepository.save(invoice);

    // Publish events
    const events = invoice.getUncommittedEvents();
    for (const event of events) {
      await this.eventBus.publish(event);
    }
    invoice.markEventsAsCommitted();

    this.logger.info('PayOS webhook processed successfully', { 
      invoiceId: invoice.id,
      paymentId: payment.id,
      amount: request.webhookData.amount 
    });

    return {
      success: true,
      message: 'Payment processed successfully',
      invoiceId: invoice.id,
      paymentId: payment.id
    };
  }
}
