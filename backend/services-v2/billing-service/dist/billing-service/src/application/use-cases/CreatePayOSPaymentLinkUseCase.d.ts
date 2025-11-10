import { BaseHealthcareUseCase } from '../../../../shared/application/base/base-healthcare-use-case';
import { IInvoiceRepository } from '../../domain/repositories/IInvoiceRepository';
import { ILogger } from '../../../../shared/application/services/logger.interface';
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
export declare class CreatePayOSPaymentLinkUseCase extends BaseHealthcareUseCase<CreatePayOSPaymentLinkRequest, CreatePayOSPaymentLinkResponse> {
    private readonly invoiceRepository;
    private readonly payosService;
    protected readonly logger: ILogger;
    constructor(invoiceRepository: IInvoiceRepository, payosService: PayOSIntegrationService, logger: ILogger);
    protected executeImpl(request: CreatePayOSPaymentLinkRequest): Promise<CreatePayOSPaymentLinkResponse>;
}
//# sourceMappingURL=CreatePayOSPaymentLinkUseCase.d.ts.map