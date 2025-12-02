import { BaseHealthcareUseCase } from "../../../../shared/application/base/base-healthcare-use-case";
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
export declare class CreateWalletTopUpLinkUseCase extends BaseHealthcareUseCase<CreateWalletTopUpLinkRequest, CreateWalletTopUpLinkResponse> {
    private readonly createInvoiceUseCase;
    private readonly createPaymentLinkUseCase;
    constructor(createInvoiceUseCase: CreateInvoiceUseCase, createPaymentLinkUseCase: CreateVnpayPaymentLinkUseCase);
    protected executeImpl(request: CreateWalletTopUpLinkRequest): Promise<CreateWalletTopUpLinkResponse>;
}
//# sourceMappingURL=CreateWalletTopUpLinkUseCase.d.ts.map