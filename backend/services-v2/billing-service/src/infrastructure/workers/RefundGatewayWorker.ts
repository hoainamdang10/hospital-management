import { IEventBus } from '@shared/infrastructure/event-bus/EventBus';
import { PaymentRefundRequestedEvent } from '../../domain/events/PaymentRefundRequestedEvent';
import { CompleteRefundUseCase } from '../../application/use-cases/CompleteRefundUseCase';
import { VnpayIntegrationService } from '../services/VnpayIntegrationService';
import { ILogger } from '@shared/application/services/logger.interface';

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
export class RefundGatewayWorker {
  constructor(
    private readonly eventBus: IEventBus,
    private readonly completeRefundUseCase: CompleteRefundUseCase,
    private readonly vnpayService: VnpayIntegrationService,
    private readonly logger: ILogger
  ) {}

  async start(): Promise<void> {
    this.logger.info('Starting RefundGatewayWorker');

    // Subscribe to refund_requested event
    await this.eventBus.subscribe(
      'billing.payment.refund_requested',
      {
        handle: this.handleRefundRequested.bind(this)
      }
    );

    this.logger.info('RefundGatewayWorker started successfully');
  }

  private async handleRefundRequested(event: PaymentRefundRequestedEvent): Promise<void> {
    try {
      this.logger.info('Processing refund request', {
        refundId: event.refundId,
        invoiceId: event.invoiceId,
        refundAmount: event.refundAmount,
        currency: event.currency
      });

      // TODO: Call PayOS/VNPAY refund API
      // For MVP: Simulate gateway call
      const gatewayRefundId = await this.callGatewayRefundAPI(event);

      // Complete refund in system
      const result = await this.completeRefundUseCase.execute({
        invoiceId: event.invoiceId,
        refundPaymentId: event.refundId,
        gatewayRefundId
      });

      if (result.success) {
        this.logger.info('Refund processed successfully', {
          refundId: event.refundId,
          gatewayRefundId
        });
      } else {
        this.logger.error('Failed to complete refund', {
          refundId: event.refundId,
          errors: result.errors
        });
      }

    } catch (error: any) {
      this.logger.error('Error processing refund request', {
        error: error.message,
        stack: error.stack,
        event: event.getPayload()
      });

      // TODO: Implement retry logic or dead letter queue
      // For now, just log the error
    }
  }

  /**
   * Call VNPAY refund API
   * Production implementation - calls real VNPAY API
   */
  private async callGatewayRefundAPI(event: PaymentRefundRequestedEvent): Promise<string> {
    const { originalPaymentMethod, originalTransactionId, refundAmount, currency, reason } = event;

    this.logger.info('Calling VNPAY refund API', {
      method: originalPaymentMethod,
      transactionId: originalTransactionId,
      amount: refundAmount,
      currency
    });

    // Currently, all online payments use 'payos' method but are actually VNPAY
    // So we process refunds for 'payos' method through VNPAY API
    if (originalPaymentMethod === 'payos' || originalPaymentMethod === 'vnpay') {
      // Get VNPAY transaction data from event data
      // This data is extracted from original payment when refund is requested
      const vnpayTxnRef = event.vnpayTxnRef || originalTransactionId;
      const vnpayTransactionNo = event.vnpayTransactionNo;
      const vnpayPayDate = event.vnpayPayDate;

      if (!vnpayTransactionNo || !vnpayPayDate) {
        this.logger.error('Missing VNPAY transaction data for refund', {
          refundId: event.refundId,
          originalTransactionId,
          vnpayTxnRef,
          vnpayTransactionNo,
          vnpayPayDate
        });
        throw new Error('Missing VNPAY transaction data (vnpayTransactionNo or vnpayPayDate). Cannot process refund.');
      }

      try {
        const response = await this.vnpayService.processRefund({
          orderCode: vnpayTxnRef || originalTransactionId || '',
          transactionNo: vnpayTransactionNo,
          transactionDate: vnpayPayDate,
          amount: refundAmount,
          description: reason || 'Refund payment',
          refundedBy: event.refundedBy
        });

        if (!response.success) {
          this.logger.error('VNPAY refund failed', {
            refundId: event.refundId,
            responseCode: response.responseCode,
            message: response.message
          });
          throw new Error(`VNPAY refund failed: ${response.message}`);
        }

        this.logger.info('VNPAY refund successful', {
          refundId: event.refundId,
          gatewayRefundId: response.refundId,
          transactionNo: response.transactionNo
        });

        return response.refundId;
      } catch (error) {
        this.logger.error('Error calling VNPAY refund API', {
          error: error instanceof Error ? error.message : 'Unknown error',
          refundId: event.refundId
        });
        throw error;
      }
    }

    // For other payment methods (cash, card, bank_transfer, insurance)
    // No gateway refund needed - just return a system-generated ID
    if (['cash', 'card', 'bank_transfer', 'insurance'].includes(originalPaymentMethod)) {
      const systemRefundId = `REFUND-${originalPaymentMethod.toUpperCase()}-${Date.now()}`;
      this.logger.info('Non-gateway refund processed', {
        method: originalPaymentMethod,
        refundId: systemRefundId
      });
      return systemRefundId;
    }

    throw new Error(`Unsupported payment method for refund: ${originalPaymentMethod}`);
  }

  async stop(): Promise<void> {
    this.logger.info('Stopping RefundGatewayWorker');
    // Cleanup if needed
  }
}

