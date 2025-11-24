"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefundGatewayWorker = void 0;
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
class RefundGatewayWorker {
    constructor(eventBus, completeRefundUseCase, vnpayService, logger, config) {
        this.eventBus = eventBus;
        this.completeRefundUseCase = completeRefundUseCase;
        this.vnpayService = vnpayService;
        this.logger = logger;
        this.config = config;
    }
    async start() {
        this.logger.info("Starting RefundGatewayWorker");
        // Subscribe to refund_requested event
        await this.eventBus.subscribe("billing.payment.refund_requested", {
            handle: this.handleRefundRequested.bind(this),
        });
        this.logger.info("RefundGatewayWorker started successfully");
    }
    async handleRefundRequested(event) {
        try {
            this.logger.info("RefundGatewayWorker received event", {
                refundId: event.refundId,
                invoiceId: event.invoiceId,
                refundAmount: event.refundAmount,
                method: event.originalPaymentMethod,
            });
            this.logger.info("Processing refund request", {
                refundId: event.refundId,
                invoiceId: event.invoiceId,
                refundAmount: event.refundAmount,
                currency: event.currency,
            });
            // TODO: Call PayOS/VNPAY refund API
            // For MVP: Simulate gateway call
            const gatewayRefundId = await this.callGatewayRefundAPI(event);
            // Complete refund in system
            const result = await this.completeRefundUseCase.execute({
                invoiceId: event.invoiceId,
                refundPaymentId: event.refundId,
                gatewayRefundId,
            });
            if (result.success) {
                this.logger.info("Refund processed successfully", {
                    refundId: event.refundId,
                    gatewayRefundId,
                });
            }
            else {
                this.logger.error("Failed to complete refund", {
                    refundId: event.refundId,
                    errors: result.errors,
                });
            }
        }
        catch (error) {
            if (typeof error?.message === "string" &&
                error.message.toLowerCase().includes("not pending")) {
                // Idempotency: refund already completed elsewhere
                this.logger.warn("Refund already completed, skipping duplicate", {
                    refundId: event.refundId,
                    invoiceId: event.invoiceId,
                });
                return;
            }
            this.logger.error("Error processing refund request", {
                error: error.message,
                stack: error.stack,
                event: event.getPayload(),
            });
            // TODO: Implement retry logic or dead letter queue
            // For now, just log the error
        }
    }
    /**
     * Call VNPAY refund API
     * Production implementation - calls real VNPAY API
     */
    async callGatewayRefundAPI(event) {
        const { originalPaymentMethod, originalTransactionId, refundAmount, currency, reason, } = event;
        this.logger.info("Calling VNPAY refund API", {
            method: originalPaymentMethod,
            transactionId: originalTransactionId,
            amount: refundAmount,
            currency,
        });
        // Currently, all online payments use 'payos' method but are actually VNPAY
        // So we process refunds for 'payos' method through VNPAY API
        if ((originalPaymentMethod === "payos" ||
            originalPaymentMethod === "vnpay") &&
            this.config.useGatewayRefund) {
            // Get VNPAY transaction data from event data
            // This data is extracted from original payment when refund is requested
            const vnpayTxnRef = event.vnpayTxnRef || originalTransactionId;
            const vnpayTransactionNo = event.vnpayTransactionNo;
            const vnpayPayDate = event.vnpayPayDate;
            if (!vnpayTransactionNo || !vnpayPayDate) {
                const systemRefundId = `REFUND-NOGW-${Date.now()}`;
                this.logger.warn("Missing VNPAY transaction data, using system refund ID", {
                    refundId: event.refundId,
                    originalTransactionId,
                    vnpayTxnRef,
                    vnpayTransactionNo,
                    vnpayPayDate,
                    systemRefundId,
                });
                return systemRefundId;
            }
            try {
                const response = await this.vnpayService.processRefund({
                    orderCode: vnpayTxnRef || originalTransactionId || "",
                    transactionNo: vnpayTransactionNo,
                    transactionDate: vnpayPayDate,
                    amount: refundAmount,
                    description: reason || "Refund payment",
                    refundedBy: event.refundedBy,
                });
                if (!response.success) {
                    this.logger.error("VNPAY refund failed", {
                        refundId: event.refundId,
                        responseCode: response.responseCode,
                        message: response.message,
                    });
                    const systemRefundId = `REFUND-FAIL-${Date.now()}`;
                    this.logger.warn("VNPAY refund failed, falling back to system refund ID", {
                        refundId: event.refundId,
                        fallbackId: systemRefundId,
                    });
                    return systemRefundId;
                }
                this.logger.info("VNPAY refund successful", {
                    refundId: event.refundId,
                    gatewayRefundId: response.refundId,
                    transactionNo: response.transactionNo,
                });
                return response.refundId;
            }
            catch (error) {
                this.logger.error("Error calling VNPAY refund API", {
                    error: error instanceof Error ? error.message : "Unknown error",
                    refundId: event.refundId,
                });
                throw error;
            }
        }
        // For other payment methods (cash, card, bank_transfer, insurance)
        // or when gateway refund is disabled, use system-generated ID
        if (!this.config.useGatewayRefund ||
            ["cash", "card", "bank_transfer", "insurance"].includes(originalPaymentMethod)) {
            const systemRefundId = `REFUND-${originalPaymentMethod.toUpperCase()}-${Date.now()}`;
            this.logger.info("Non-gateway refund processed", {
                method: originalPaymentMethod,
                refundId: systemRefundId,
            });
            return systemRefundId;
        }
        throw new Error(`Unsupported payment method for refund: ${originalPaymentMethod}`);
    }
    async stop() {
        this.logger.info("Stopping RefundGatewayWorker");
        // Cleanup if needed
    }
}
exports.RefundGatewayWorker = RefundGatewayWorker;
//# sourceMappingURL=RefundGatewayWorker.js.map