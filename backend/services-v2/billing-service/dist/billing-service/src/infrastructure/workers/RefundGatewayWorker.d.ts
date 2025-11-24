import { IEventBus } from "../../../../shared/infrastructure/event-bus/EventBus";
import { CompleteRefundUseCase } from "../../application/use-cases/CompleteRefundUseCase";
import { VnpayIntegrationService } from "../services/VnpayIntegrationService";
import { ILogger } from "../../../../shared/application/services/logger.interface";
/**
 * RefundGatewayWorker
 *
 * Consumes: billing.payment.refund_requested
 *
 * Responsibilities:
 * 1. Listen to PaymentRefundRequestedEvent
 * 2. Call VNPAY refund API (real implementation)
 * 3. Get gatewayRefundId from response
 * 4. Call CompleteRefundUseCase to update invoice
 *
 * Production-ready: Calls real VNPAY API for refunds
 */
export declare class RefundGatewayWorker {
    private readonly eventBus;
    private readonly completeRefundUseCase;
    private readonly vnpayService;
    private readonly logger;
    private readonly config;
    constructor(eventBus: IEventBus, completeRefundUseCase: CompleteRefundUseCase, vnpayService: VnpayIntegrationService, logger: ILogger, config: {
        useGatewayRefund: boolean;
    });
    start(): Promise<void>;
    private handleRefundRequested;
    /**
     * Call VNPAY refund API
     * Production implementation - calls real VNPAY API
     */
    private callGatewayRefundAPI;
    stop(): Promise<void>;
}
//# sourceMappingURL=RefundGatewayWorker.d.ts.map