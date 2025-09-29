import PayOS from '@payos/node';
import crypto from 'crypto';
import { logger } from '../utils/logger';

export interface PaymentRequest {
  orderCode: string;
  amount: number;
  description: string;
  serviceName: string;
  appointmentId: string;
  patientInfo?: {
    doctorName: string;
    department: string;
    appointmentDate: string;
    timeSlot: string;
  };
}

export interface PayOSResponse {
  bin: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  description: string;
  orderCode: number;
  currency: string;
  paymentLinkId: string;
  status: string;
  checkoutUrl: string;
  qrCode: string;
}

export interface PaymentResult {
  success: boolean;
  orderCode: string;
  amount: number;
  transactionId?: string;
  status: 'success' | 'failed' | 'pending' | 'cancelled';
  failureReason?: string;
}

export interface PaymentInfo {
  id: string;
  orderCode: number;
  amount: number;
  amountPaid: number;
  amountRemaining: number;
  status: string;
  createdAt: string;
  transactions: Array<{
    reference: string;
    amount: number;
    accountNumber: string;
    description: string;
    transactionDateTime: string;
  }>;
}

export class PayOSService {
  private payOS: PayOS;
  private readonly returnUrl: string;
  private readonly cancelUrl: string;

  constructor() {
    const clientId = process.env.PAYOS_CLIENT_ID;
    const apiKey = process.env.PAYOS_API_KEY;
    const checksumKey = process.env.PAYOS_CHECKSUM_KEY;

    if (!clientId || !apiKey || !checksumKey) {
      throw new Error('PayOS credentials are not configured properly');
    }

    this.payOS = new PayOS(clientId, apiKey, checksumKey);
    this.returnUrl = `${process.env.FRONTEND_URL}/patient/payment/result`;
    this.cancelUrl = `${process.env.FRONTEND_URL}/patient/payment/result`;

    logger.info('PayOS Service initialized', {
      environment: process.env.PAYOS_ENVIRONMENT || 'sandbox',
      returnUrl: this.returnUrl,
      cancelUrl: this.cancelUrl
    });
  }

  /**
   * Create a payment link with PayOS
   */
  async createPaymentLink(paymentData: PaymentRequest): Promise<PayOSResponse> {
    try {
      logger.info('Creating PayOS payment link', {
        orderCode: paymentData.orderCode,
        amount: paymentData.amount,
        appointmentId: paymentData.appointmentId
      });

      const order = {
        orderCode: parseInt(paymentData.orderCode.replace(/\D/g, '')), // Extract numbers only
        amount: paymentData.amount,
        description: paymentData.description,
        items: [
          {
            name: paymentData.serviceName,
            quantity: 1,
            price: paymentData.amount
          }
        ],
        returnUrl: `${this.returnUrl}?orderCode=${paymentData.orderCode}&appointmentId=${paymentData.appointmentId}`,
        cancelUrl: `${this.cancelUrl}?orderCode=${paymentData.orderCode}&status=CANCELLED`
      };

      const paymentLinkResponse = await this.payOS.createPaymentLink(order);

      logger.info('PayOS payment link created successfully', {
        orderCode: paymentData.orderCode,
        paymentLinkId: paymentLinkResponse.paymentLinkId,
        checkoutUrl: paymentLinkResponse.checkoutUrl
      });

      return paymentLinkResponse;
    } catch (error: any) {
      logger.error('PayOS payment creation failed', {
        error: error?.message || 'Unknown error',
        orderCode: paymentData.orderCode,
        amount: paymentData.amount
      });
      throw new Error(`PayOS payment creation failed: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Verify payment webhook data from PayOS
   */
  async verifyPaymentWebhook(webhookData: any): Promise<PaymentResult> {
    try {
      logger.info('Verifying PayOS webhook', {
        orderCode: webhookData.orderCode,
        amount: webhookData.amount
      });

      // PayOS webhook verification
      const verifiedData = this.payOS.verifyPaymentWebhookData(webhookData);
      
      const result: PaymentResult = {
        success: verifiedData.code === '00',
        orderCode: verifiedData.orderCode.toString(),
        amount: verifiedData.amount,
        transactionId: (verifiedData as any).id || verifiedData.orderCode.toString(),
        status: this.mapPayOSStatusToInternal(verifiedData.code, verifiedData.desc)
      };

      if (!result.success) {
        result.failureReason = verifiedData.desc;
      }

      logger.info('PayOS webhook verified', {
        orderCode: result.orderCode,
        status: result.status,
        success: result.success
      });

      return result;
    } catch (error: any) {
      logger.error('PayOS webhook verification failed', {
        error: error?.message || 'Unknown error',
        webhookData
      });
      throw new Error(`PayOS verification failed: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Get payment information by order code
   */
  async getPaymentInfo(orderCode: string): Promise<PaymentInfo> {
    try {
      logger.info('Getting PayOS payment info', { orderCode });

      const numericOrderCode = parseInt(orderCode.replace(/\D/g, ''));
      const paymentInfo = await this.payOS.getPaymentLinkInformation(numericOrderCode);

      logger.info('PayOS payment info retrieved', {
        orderCode,
        status: paymentInfo.status,
        amount: paymentInfo.amount
      });

      return paymentInfo;
    } catch (error: any) {
      logger.error('PayOS get payment info failed', {
        error: error?.message || 'Unknown error',
        orderCode
      });
      throw new Error(`PayOS get payment info failed: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Cancel a payment link
   */
  async cancelPaymentLink(orderCode: string, reason?: string): Promise<boolean> {
    try {
      logger.info('Cancelling PayOS payment link', { orderCode, reason });

      const numericOrderCode = parseInt(orderCode.replace(/\D/g, ''));
      await this.payOS.cancelPaymentLink(numericOrderCode, reason);

      logger.info('PayOS payment link cancelled successfully', { orderCode });
      return true;
    } catch (error: any) {
      logger.error('PayOS payment cancellation failed', {
        error: error?.message || 'Unknown error',
        orderCode
      });
      throw new Error(`PayOS payment cancellation failed: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Generate a unique order code
   */
  generateOrderCode(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `HOS${timestamp}${random}`;
  }

  /**
   * Validate webhook signature (if PayOS provides signature verification)
   */
  validateWebhookSignature(payload: string, signature: string): boolean {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.PAYOS_CHECKSUM_KEY!)
        .update(payload)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch (error: any) {
      logger.error('Webhook signature validation failed', { error: error?.message || 'Unknown error' });
      return false;
    }
  }

  /**
   * Map PayOS status codes to internal status
   */
  private mapPayOSStatusToInternal(code: string, description?: string): 'success' | 'failed' | 'pending' | 'cancelled' {
    switch (code) {
      case '00':
        return 'success';
      case '01':
      case '02':
        return 'pending';
      case '03':
        return 'cancelled';
      default:
        return 'failed';
    }
  }

  /**
   * Format amount for PayOS (ensure it's an integer)
   */
  formatAmount(amount: number): number {
    return Math.round(amount);
  }

  /**
   * Validate payment amount
   */
  validateAmount(amount: number): boolean {
    return amount > 0 && amount <= 500000000; // PayOS limit: 500M VND
  }

  /**
   * Get PayOS environment info
   */
  getEnvironmentInfo(): { environment: string; isProduction: boolean } {
    const environment = process.env.PAYOS_ENVIRONMENT || 'sandbox';
    return {
      environment,
      isProduction: environment === 'production'
    };
  }
}
