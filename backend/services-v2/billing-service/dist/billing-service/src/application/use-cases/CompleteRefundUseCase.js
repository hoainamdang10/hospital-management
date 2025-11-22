"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompleteRefundUseCase = void 0;
/**
 * CompleteRefundUseCase
 *
 * Called by:
 * - RefundGatewayWorker (after calling PayOS/VNPAY API)
 * - RefundWebhookHandler (when gateway sends callback)
 *
 * Responsibilities:
 * - Find invoice by ID
 * - Call invoice.completeRefund()
 * - Save invoice (will emit PaymentRefundedEvent)
 * - Publish domain events
 */
class CompleteRefundUseCase {
    constructor(invoiceRepository, eventBus, logger) {
        this.invoiceRepository = invoiceRepository;
        this.eventBus = eventBus;
        this.logger = logger;
    }
    async execute(request) {
        try {
            this.logger.info('Completing refund', {
                invoiceId: request.invoiceId,
                refundPaymentId: request.refundPaymentId,
                gatewayRefundId: request.gatewayRefundId
            });
            // 1. Find invoice
            const invoice = await this.invoiceRepository.findById(request.invoiceId);
            if (!invoice) {
                this.logger.warn('Invoice not found', {
                    invoiceId: request.invoiceId
                });
                return {
                    success: false,
                    message: 'Không tìm thấy hóa đơn',
                    errors: ['Invoice not found']
                };
            }
            // 2. Complete refund
            invoice.completeRefund(request.refundPaymentId, request.gatewayRefundId);
            // 3. Save invoice (will publish PaymentRefundedEvent)
            await this.invoiceRepository.save(invoice);
            // 4. Publish domain events
            const events = invoice.getUncommittedEvents();
            for (const event of events) {
                await this.eventBus.publish(event);
            }
            invoice.markEventsAsCommitted();
            this.logger.info('Refund completed successfully', {
                invoiceId: invoice.id,
                refundPaymentId: request.refundPaymentId,
                gatewayRefundId: request.gatewayRefundId
            });
            return {
                success: true,
                message: 'Hoàn tiền thành công',
                invoiceId: invoice.id,
                refundPaymentId: request.refundPaymentId
            };
        }
        catch (error) {
            this.logger.error('Failed to complete refund', {
                error: error.message,
                stack: error.stack,
                request
            });
            return {
                success: false,
                message: 'Lỗi khi hoàn thành refund',
                errors: [error.message]
            };
        }
    }
}
exports.CompleteRefundUseCase = CompleteRefundUseCase;
//# sourceMappingURL=CompleteRefundUseCase.js.map