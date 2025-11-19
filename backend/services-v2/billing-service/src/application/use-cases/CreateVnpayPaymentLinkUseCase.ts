import { BaseHealthcareUseCase } from "@shared/application/base/base-healthcare-use-case";
import { IInvoiceRepository } from "../../domain/repositories/IInvoiceRepository";
import { ILogger } from "@shared/application/services/logger.interface";
import { VnpayIntegrationService } from "../../infrastructure/services/VnpayIntegrationService";

export interface CreateVnpayPaymentLinkRequest {
  invoiceId: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  returnUrl?: string;
  cancelUrl?: string;
}

export interface CreateVnpayPaymentLinkResponse {
  success: boolean;
  checkoutUrl: string;
  qrCode: string;
  paymentLinkId: string;
  orderCode: number;
  amount: number;
}

export class CreateVnpayPaymentLinkUseCase extends BaseHealthcareUseCase<
  CreateVnpayPaymentLinkRequest,
  CreateVnpayPaymentLinkResponse
> {
  protected readonly logger: ILogger;

  constructor(
    private readonly invoiceRepository: IInvoiceRepository,
    private readonly payosService: VnpayIntegrationService,
    logger: ILogger,
    private readonly defaultReturnUrl?: string,
    private readonly defaultCancelUrl?: string,
  ) {
    super();
    this.logger = logger;
  }

  protected async executeImpl(
    request: CreateVnpayPaymentLinkRequest,
  ): Promise<CreateVnpayPaymentLinkResponse> {
    this.logger.info("Creating VNPAY payment link", {
      invoiceId: request.invoiceId,
    });

    const invoice = await this.invoiceRepository.findById(request.invoiceId);
    if (!invoice) {
      throw new Error("Invoice not found");
    }

    if (invoice.status.value === "cancelled") {
      throw new Error("Cannot create payment link for cancelled invoice");
    }

    if (invoice.status.value === "paid") {
      throw new Error("Invoice is already paid");
    }

    const orderCode = VnpayIntegrationService.generateOrderCode();

    const paymentLink = await this.payosService.createPaymentLink({
      orderCode,
      amount: invoice.outstandingAmount.amount,
      description: `Thanh toán hóa đơn ${invoice.invoiceNumber || invoice.id}`,
      returnUrl: request.returnUrl || this.defaultReturnUrl,
    });

    this.logger.info("VNPAY payment link created", {
      invoiceId: request.invoiceId,
      orderCode,
      paymentLinkId: paymentLink.paymentLinkId,
    });

    return {
      success: true,
      checkoutUrl: paymentLink.checkoutUrl,
      qrCode: paymentLink.qrCode,
      paymentLinkId: paymentLink.paymentLinkId,
      orderCode: paymentLink.orderCode,
      amount: paymentLink.amount,
    };
  }
}
