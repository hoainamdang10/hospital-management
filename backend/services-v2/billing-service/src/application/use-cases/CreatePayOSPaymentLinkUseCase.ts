import { BaseHealthcareUseCase } from '@shared/application/base/base-healthcare-use-case';
import { IInvoiceRepository } from '../../domain/repositories/IInvoiceRepository';
import { ILogger } from '@shared/application/services/logger.interface';
import { PayOSIntegrationService } from '../../infrastructure/services/PayOSIntegrationService';

export interface CreatePayOSPaymentLinkRequest {
  invoiceId: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  returnUrl?: string;
  cancelUrl?: string;
}

export interface CreatePayOSPaymentLinkResponse {
  success: boolean;
  checkoutUrl: string;
  qrCode: string;
  paymentLinkId: string;
  orderCode: number;
  amount: number;
}

export class CreatePayOSPaymentLinkUseCase extends BaseHealthcareUseCase<CreatePayOSPaymentLinkRequest, CreatePayOSPaymentLinkResponse> {
  protected readonly logger: ILogger;

  constructor(
    private readonly invoiceRepository: IInvoiceRepository,
    private readonly payosService: PayOSIntegrationService,
    logger: ILogger
  ) {
    super();
    this.logger = logger;
  }

  protected async executeImpl(request: CreatePayOSPaymentLinkRequest): Promise<CreatePayOSPaymentLinkResponse> {
    this.logger.info('Creating PayOS payment link', { invoiceId: request.invoiceId });

    const invoice = await this.invoiceRepository.findById(request.invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.status.value === 'cancelled') {
      throw new Error('Cannot create payment link for cancelled invoice');
    }

    if (invoice.status.value === 'paid') {
      throw new Error('Invoice is already paid');
    }

    const orderCode = PayOSIntegrationService.generateOrderCode();

    const paymentLink = await this.payosService.createPaymentLink({
      orderCode,
      amount: invoice.outstandingAmount.amount,
      description: `Thanh toán hóa đơn ${invoice.invoiceNumber || invoice.id}`,
      items: invoice.items.map(item => ({
        name: item.description,
        quantity: item.quantity,
        price: item.unitPrice.amount
      })),
      buyerName: request.buyerName,
      buyerEmail: request.buyerEmail,
      buyerPhone: request.buyerPhone,
      returnUrl: request.returnUrl || `${process.env.FRONTEND_URL}/billing/payment/success`,
      cancelUrl: request.cancelUrl || `${process.env.FRONTEND_URL}/billing/payment/cancel`
    });

    this.logger.info('PayOS payment link created', { 
      invoiceId: request.invoiceId,
      orderCode,
      paymentLinkId: paymentLink.paymentLinkId 
    });

    return {
      success: true,
      checkoutUrl: paymentLink.checkoutUrl,
      qrCode: paymentLink.qrCode,
      paymentLinkId: paymentLink.paymentLinkId,
      orderCode: paymentLink.orderCode,
      amount: paymentLink.amount
    };
  }
}
