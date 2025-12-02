import { BaseHealthcareUseCase } from "../../../../shared/application/base/base-healthcare-use-case";
import { IInvoiceRepository } from "../../domain/repositories/IInvoiceRepository";
import { IEventBus } from "../../../../shared/application/services/event-bus.interface";
import { ILogger } from "../../../../shared/application/services/logger.interface";
import { VnpayIntegrationService, WebhookData } from "../../infrastructure/services/VnpayIntegrationService";
import { WalletService } from "../services/WalletService";
export interface HandlePayOSWebhookRequest {
    webhookData: WebhookData;
    signature?: string;
    rawPayload?: any;
}
export interface HandlePayOSWebhookResponse {
    success: boolean;
    message: string;
    invoiceId?: string;
    paymentId?: string;
}
export declare class HandlePayOSWebhookUseCase extends BaseHealthcareUseCase<HandlePayOSWebhookRequest, HandlePayOSWebhookResponse> {
    private readonly invoiceRepository;
    private readonly eventBus;
    private readonly payosService;
    private readonly walletService?;
    protected readonly logger: ILogger;
    constructor(invoiceRepository: IInvoiceRepository, eventBus: IEventBus, payosService: VnpayIntegrationService, logger: ILogger, walletService?: WalletService | undefined);
    protected executeImpl(request: HandlePayOSWebhookRequest): Promise<HandlePayOSWebhookResponse>;
    private isPingWebhook;
    private getInvoiceMetadata;
    private isWalletTopUpInvoice;
    private isWalletTopUpProcessed;
    private handleWalletTopUp;
}
//# sourceMappingURL=HandlePayOSWebhookUseCase.d.ts.map