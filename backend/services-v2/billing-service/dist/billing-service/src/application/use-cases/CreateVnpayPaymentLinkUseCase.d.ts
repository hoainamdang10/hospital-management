import { BaseHealthcareUseCase } from "../../../../shared/application/base/base-healthcare-use-case";
import { IInvoiceRepository } from "../../domain/repositories/IInvoiceRepository";
import { ILogger } from "../../../../shared/application/services/logger.interface";
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
export declare class CreateVnpayPaymentLinkUseCase extends BaseHealthcareUseCase<CreateVnpayPaymentLinkRequest, CreateVnpayPaymentLinkResponse> {
    private readonly invoiceRepository;
    private readonly payosService;
    private readonly defaultReturnUrl?;
    private readonly defaultCancelUrl?;
    protected readonly logger: ILogger;
    constructor(invoiceRepository: IInvoiceRepository, payosService: VnpayIntegrationService, logger: ILogger, defaultReturnUrl?: string | undefined, defaultCancelUrl?: string | undefined);
    protected executeImpl(request: CreateVnpayPaymentLinkRequest): Promise<CreateVnpayPaymentLinkResponse>;
}
//# sourceMappingURL=CreateVnpayPaymentLinkUseCase.d.ts.map