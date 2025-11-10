import { BaseHealthcareUseCase } from '../../../../shared/application/base/base-healthcare-use-case';
import { IInvoiceRepository } from '../../domain/repositories/IInvoiceRepository';
import { IEventBus } from '../../../../shared/application/services/event-bus.interface';
import { ILogger } from '../../../../shared/application/services/logger.interface';
import { PayOSIntegrationService, WebhookData } from '../../infrastructure/services/PayOSIntegrationService';
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
export declare class HandlePayOSWebhookUseCase extends BaseHealthcareUseCase<HandlePayOSWebhookRequest, HandlePayOSWebhookResponse> {
    private readonly invoiceRepository;
    private readonly eventBus;
    private readonly payosService;
    protected readonly logger: ILogger;
    constructor(invoiceRepository: IInvoiceRepository, eventBus: IEventBus, payosService: PayOSIntegrationService, logger: ILogger);
    protected executeImpl(request: HandlePayOSWebhookRequest): Promise<HandlePayOSWebhookResponse>;
}
//# sourceMappingURL=HandlePayOSWebhookUseCase.d.ts.map