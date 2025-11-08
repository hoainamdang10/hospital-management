/**
 * PayOS Payment Service
 * Integration with PayOS payment gateway for Vietnam
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 */

import PayOS from '@payos/node';

export interface PaymentItem {
  name: string;
  quantity: number;
  price: number;
  unit?: string;
}

export interface CreatePaymentRequest {
  orderCode: number;
  amount: number;
  description: string;
  items: PaymentItem[];
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
}

export interface PaymentLinkResponse {
  bin: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  description: string;
  orderCode: number;
  paymentLinkId: string;
  status: string;
  checkoutUrl: string;
  qrCode: string;
}

export class PayOSService {
  private payOS: PayOS;
  private returnUrl: string;
  private cancelUrl: string;

  constructor(
    clientId: string,
    apiKey: string,
    checksumKey: string,
    returnUrl: string,
    cancelUrl: string
  ) {
    if (!clientId || !apiKey || !checksumKey) {
      throw new Error('PayOS credentials are required');
    }

    this.payOS = new PayOS(clientId, apiKey, checksumKey);
    this.returnUrl = returnUrl;
    this.cancelUrl = cancelUrl;

    console.log('[PayOSService] Initialized successfully');
  }

  /**
   * Create payment link for invoice
   */
  async createPaymentLink(request: CreatePaymentRequest): Promise<PaymentLinkResponse> {
    try {
      const paymentData = {
        orderCode: request.orderCode,
        amount: request.amount,
        description: request.description,
        items: request.items,
        returnUrl: this.returnUrl,
        cancelUrl: this.cancelUrl,
        buyerName: request.buyerName,
        buyerEmail: request.buyerEmail,
        buyerPhone: request.buyerPhone,
      };

      console.log('[PayOSService] Creating payment link:', {
        orderCode: request.orderCode,
        amount: request.amount,
      });

      const response = await this.payOS.createPaymentLink(paymentData);

      console.log('[PayOSService] Payment link created:', {
        paymentLinkId: response.paymentLinkId,
        orderCode: response.orderCode,
      });

      return response as PaymentLinkResponse;
    } catch (error: any) {
      console.error('[PayOSService] Failed to create payment link:', error);
      throw new Error(`PayOS Error: ${error.message}`);
    }
  }

  /**
   * Get payment information by order code or payment link ID
   */
  async getPaymentInfo(orderId: string | number): Promise<any> {
    try {
      console.log('[PayOSService] Getting payment info for:', orderId);
      const paymentInfo = await this.payOS.getPaymentLinkInformation(orderId);
      return paymentInfo;
    } catch (error: any) {
      console.error('[PayOSService] Failed to get payment info:', error);
      throw new Error(`PayOS Error: ${error.message}`);
    }
  }

  /**
   * Cancel payment link
   */
  async cancelPayment(orderCode: number, reason?: string): Promise<any> {
    try {
      console.log('[PayOSService] Cancelling payment:', { orderCode, reason });
      const result = await this.payOS.cancelPaymentLink(orderCode, reason);
      return result;
    } catch (error: any) {
      console.error('[PayOSService] Failed to cancel payment:', error);
      throw new Error(`PayOS Error: ${error.message}`);
    }
  }

  /**
   * Verify webhook data from PayOS
   */
  verifyWebhookData(webhookBody: any): any {
    try {
      console.log('[PayOSService] Verifying webhook data');
      const verifiedData = this.payOS.verifyPaymentWebhookData(webhookBody);
      return verifiedData;
    } catch (error: any) {
      console.error('[PayOSService] Webhook verification failed:', error);
      throw new Error(`Invalid webhook signature: ${error.message}`);
    }
  }

  /**
   * Confirm webhook URL (one-time setup)
   */
  async confirmWebhook(webhookUrl: string): Promise<string> {
    try {
      console.log('[PayOSService] Confirming webhook URL:', webhookUrl);
      const result = await this.payOS.confirmWebhook(webhookUrl);
      console.log('[PayOSService] Webhook confirmed successfully');
      return result;
    } catch (error: any) {
      console.error('[PayOSService] Failed to confirm webhook:', error);
      throw new Error(`PayOS Error: ${error.message}`);
    }
  }
}
