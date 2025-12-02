import { BaseHealthcareUseCase } from "@shared/application/base/base-healthcare-use-case";
import { CreateInvoiceUseCase } from "./CreateInvoiceUseCase";
import { CreateVnpayPaymentLinkUseCase } from "./CreateVnpayPaymentLinkUseCase";

export interface CreateWalletTopUpLinkRequest {
  patientId: string;
  amount: number;
  description?: string;
  createdBy?: string;
  returnUrl?: string;
  cancelUrl?: string;
}

export interface CreateWalletTopUpLinkResponse {
  invoiceId: string;
  checkoutUrl: string;
  qrCode: string;
  paymentLinkId: string;
  orderCode: number;
  amount: number;
}

export class CreateWalletTopUpLinkUseCase extends BaseHealthcareUseCase<
  CreateWalletTopUpLinkRequest,
  CreateWalletTopUpLinkResponse
> {
  constructor(
    private readonly createInvoiceUseCase: CreateInvoiceUseCase,
    private readonly createPaymentLinkUseCase: CreateVnpayPaymentLinkUseCase,
  ) {
    super();
  }

  protected async executeImpl(
    request: CreateWalletTopUpLinkRequest,
  ): Promise<CreateWalletTopUpLinkResponse> {
    if (!request.patientId) {
      throw new Error("patientId is required");
    }
    if (
      !request.amount ||
      Number.isNaN(request.amount) ||
      request.amount <= 0
    ) {
      throw new Error("amount must be greater than 0");
    }

    const description =
      request.description?.trim() || "Nạp ví tài khoản bệnh nhân";

    const invoiceResponse = await this.createInvoiceUseCase.execute({
      patientId: request.patientId,
      items: [
        {
          description,
          quantity: 1,
          unitPrice: request.amount,
        },
      ],
      metadata: {
        invoiceType: "wallet_topup",
        serviceName: "Nạp ví tài khoản",
        walletTopUp: true,
        walletTopUpAmount: request.amount,
        walletTopUpCreatedBy: request.createdBy || "patient",
      },
    });

    const paymentLinkResponse = await this.createPaymentLinkUseCase.execute({
      invoiceId: invoiceResponse.invoiceId,
      returnUrl: request.returnUrl,
      cancelUrl: request.cancelUrl,
    });

    return {
      invoiceId: invoiceResponse.invoiceId,
      checkoutUrl: paymentLinkResponse.checkoutUrl,
      qrCode: paymentLinkResponse.qrCode,
      paymentLinkId: paymentLinkResponse.paymentLinkId,
      orderCode: paymentLinkResponse.orderCode,
      amount: paymentLinkResponse.amount,
    };
  }
}
