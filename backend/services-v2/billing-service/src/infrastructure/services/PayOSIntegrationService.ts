import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';
import { ILogger } from '@shared/application/services/logger.interface';

export interface PayOSConfig {
  clientId: string;
  apiKey: string;
  checksumKey: string;
  baseUrl?: string;
}

export interface CreatePaymentLinkRequest {
  orderCode: number;
  amount: number;
  description: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  buyerAddress?: string;
  returnUrl?: string;
  cancelUrl?: string;
}

export interface PaymentLinkResponse {
  checkoutUrl: string;
  qrCode: string;
  paymentLinkId: string;
  orderCode: number;
  amount: number;
}

export interface PaymentInfo {
  orderCode: number;
  amount: number;
  description: string;
  status: 'PENDING' | 'PROCESSING' | 'PAID' | 'CANCELLED';
  transactions: Array<{
    reference: string;
    amount: number;
    description: string;
    transactionDateTime: string;
  }>;
}

export interface WebhookData {
  orderCode: number;
  amount: number;
  description: string;
  accountNumber: string;
  reference: string;
  transactionDateTime: string;
  currency: string;
  paymentLinkId: string;
  code: string;
  desc: string;
  counterAccountBankId?: string;
  counterAccountBankName?: string;
  counterAccountName?: string;
  counterAccountNumber?: string;
  virtualAccountName?: string;
  virtualAccountNumber?: string;
}

export class PayOSIntegrationService {
  private readonly client: AxiosInstance;
  private readonly checksumKey: string;

  constructor(
    private readonly config: PayOSConfig,
    private readonly logger: ILogger
  ) {
    this.checksumKey = config.checksumKey;
    this.client = axios.create({
      baseURL: config.baseUrl || 'https://api-merchant.payos.vn',
      headers: {
        'x-client-id': config.clientId,
        'x-api-key': config.apiKey,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Create payment link
   */
  async createPaymentLink(request: CreatePaymentLinkRequest): Promise<PaymentLinkResponse> {
    try {
      this.logger.info('Creating PayOS payment link', { orderCode: request.orderCode });

      const signature = this.generateSignature({
        amount: request.amount,
        cancelUrl: request.cancelUrl || '',
        description: request.description,
        orderCode: request.orderCode,
        returnUrl: request.returnUrl || ''
      });

      const payload = {
        ...request,
        signature
      };

      const response = await this.client.post('/v2/payment-requests', payload);

      this.logger.info('PayOS payment link created', { 
        orderCode: request.orderCode,
        paymentLinkId: response.data.data.paymentLinkId 
      });

      return {
        checkoutUrl: response.data.data.checkoutUrl,
        qrCode: response.data.data.qrCode,
        paymentLinkId: response.data.data.paymentLinkId,
        orderCode: request.orderCode,
        amount: request.amount
      };
    } catch (error: any) {
      this.logger.error('Failed to create PayOS payment link', { 
        error: error.message,
        orderCode: request.orderCode 
      });
      throw new Error(`PayOS payment link creation failed: ${error.message}`);
    }
  }

  /**
   * Get payment information
   */
  async getPaymentInfo(orderCode: number): Promise<PaymentInfo> {
    try {
      this.logger.info('Getting PayOS payment info', { orderCode });

      const response = await this.client.get(`/v2/payment-requests/${orderCode}`);

      this.logger.info('PayOS payment info retrieved', { 
        orderCode,
        status: response.data.data.status 
      });

      return response.data.data;
    } catch (error: any) {
      this.logger.error('Failed to get PayOS payment info', { 
        error: error.message,
        orderCode 
      });
      throw new Error(`PayOS payment info retrieval failed: ${error.message}`);
    }
  }

  /**
   * Cancel payment link
   */
  async cancelPaymentLink(orderCode: number, reason?: string): Promise<void> {
    try {
      this.logger.info('Cancelling PayOS payment link', { orderCode, reason });

      await this.client.post(`/v2/payment-requests/${orderCode}/cancel`, {
        cancellationReason: reason
      });

      this.logger.info('PayOS payment link cancelled', { orderCode });
    } catch (error: any) {
      this.logger.error('Failed to cancel PayOS payment link', { 
        error: error.message,
        orderCode 
      });
      throw new Error(`PayOS payment link cancellation failed: ${error.message}`);
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(webhookData: WebhookData, signature: string): boolean {
    try {
      const data = {
        amount: webhookData.amount,
        description: webhookData.description,
        orderCode: webhookData.orderCode,
        reference: webhookData.reference,
        transactionDateTime: webhookData.transactionDateTime
      };

      const expectedSignature = this.generateSignature(data);
      const isValid = expectedSignature === signature;

      this.logger.info('Webhook signature verification', { 
        orderCode: webhookData.orderCode,
        isValid 
      });

      return isValid;
    } catch (error: any) {
      this.logger.error('Webhook signature verification failed', { 
        error: error.message 
      });
      return false;
    }
  }

  /**
   * Confirm webhook URL (one-time setup)
   */
  async confirmWebhookUrl(webhookUrl: string): Promise<void> {
    try {
      this.logger.info('Confirming webhook URL', { webhookUrl });

      await this.client.post('/v2/webhook-url', {
        webhookUrl
      });

      this.logger.info('Webhook URL confirmed', { webhookUrl });
    } catch (error: any) {
      this.logger.error('Failed to confirm webhook URL', { 
        error: error.message,
        webhookUrl 
      });
      throw new Error(`Webhook URL confirmation failed: ${error.message}`);
    }
  }

  /**
   * Generate signature for PayOS requests
   */
  private generateSignature(data: any): string {
    const sortedKeys = Object.keys(data).sort();
    const signatureData = sortedKeys
      .map(key => `${key}=${data[key]}`)
      .join('&');

    return crypto
      .createHmac('sha256', this.checksumKey)
      .update(signatureData)
      .digest('hex');
  }

  /**
   * Generate unique order code
   */
  static generateOrderCode(): number {
    return Math.floor(Date.now() / 1000);
  }
}
