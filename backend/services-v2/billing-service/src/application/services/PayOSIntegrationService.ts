/**
 * PayOSIntegrationService - Application Layer
 * Service for integrating with PayOS payment gateway
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, PayOS API Integration
 */

import { Money } from '../../domain/value-objects/Money';

export interface PayOSPaymentRequest {
  orderCode: string;
  amount: number;
  description: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  buyerAddress?: string;
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  returnUrl?: string;
  cancelUrl?: string;
  expiredAt?: number;
}

export interface PayOSPaymentResponse {
  success: boolean;
  data?: {
    bin: string;
    accountNumber: string;
    accountName: string;
    amount: number;
    description: string;
    orderCode: string;
    currency: string;
    paymentLinkId: string;
    status: string;
    checkoutUrl: string;
    qrCode: string;
    deepLink: string;
    deepLinkWebApp: string;
  };
  error?: {
    code: string;
    desc: string;
  };
  message: string;
}

export interface PayOSWebhookData {
  code: string;
  desc: string;
  data: {
    orderCode: string;
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
  };
  signature: string;
}

export interface PayOSPaymentInfo {
  id: string;
  orderCode: string;
  amount: number;
  amountPaid: number;
  amountRemaining: number;
  status: 'PENDING' | 'PROCESSING' | 'PAID' | 'CANCELLED';
  createdAt: string;
  transactions: Array<{
    reference: string;
    amount: number;
    accountNumber: string;
    description: string;
    transactionDateTime: string;
    virtualAccountName?: string;
    virtualAccountNumber?: string;
    counterAccountBankId?: string;
    counterAccountBankName?: string;
    counterAccountName?: string;
    counterAccountNumber?: string;
  }>;
}

/**
 * PayOSIntegrationService
 * Handles PayOS payment gateway integration
 */
export class PayOSIntegrationService {
  private readonly apiUrl: string;
  private readonly clientId: string;
  private readonly apiKey: string;
  private readonly checksumKey: string;

  constructor(
    apiUrl: string = 'https://api-merchant.payos.vn',
    clientId: string,
    apiKey: string,
    checksumKey: string
  ) {
    this.apiUrl = apiUrl;
    this.clientId = clientId;
    this.apiKey = apiKey;
    this.checksumKey = checksumKey;
  }

  /**
   * Create payment link
   */
  async createPaymentLink(request: PayOSPaymentRequest): Promise<PayOSPaymentResponse> {
    try {
      // Validate request
      const validationError = this.validatePaymentRequest(request);
      if (validationError) {
        return {
          success: false,
          error: { code: 'VALIDATION_ERROR', desc: validationError },
          message: 'Dữ liệu thanh toán không hợp lệ'
        };
      }

      // Prepare payload
      const payload = {
        orderCode: parseInt(request.orderCode),
        amount: request.amount,
        description: request.description,
        buyerName: request.buyerName,
        buyerEmail: request.buyerEmail,
        buyerPhone: request.buyerPhone,
        buyerAddress: request.buyerAddress,
        items: request.items || [],
        returnUrl: request.returnUrl || `${process.env.FRONTEND_URL}/payment/success`,
        cancelUrl: request.cancelUrl || `${process.env.FRONTEND_URL}/payment/cancel`,
        expiredAt: request.expiredAt || Math.floor(Date.now() / 1000) + 15 * 60 // 15 minutes
      };

      // Create signature
      const signature = this.createSignature(payload);

      // Make API call
      const response = await fetch(`${this.apiUrl}/v2/payment-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': this.clientId,
          'x-api-key': this.apiKey,
          'x-signature': signature
        },
        body: JSON.stringify(payload)
      });

      const responseData = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: responseData.code || 'API_ERROR',
            desc: responseData.desc || 'Lỗi từ PayOS API'
          },
          message: 'Không thể tạo link thanh toán'
        };
      }

      return {
        success: true,
        data: {
          bin: responseData.data.bin,
          accountNumber: responseData.data.accountNumber,
          accountName: responseData.data.accountName,
          amount: responseData.data.amount,
          description: responseData.data.description,
          orderCode: responseData.data.orderCode.toString(),
          currency: responseData.data.currency,
          paymentLinkId: responseData.data.paymentLinkId,
          status: responseData.data.status,
          checkoutUrl: responseData.data.checkoutUrl,
          qrCode: responseData.data.qrCode,
          deepLink: responseData.data.deepLink,
          deepLinkWebApp: responseData.data.deepLinkWebApp
        },
        message: 'Tạo link thanh toán thành công'
      };

    } catch (error) {
      console.error('PayOS createPaymentLink error:', error);
      return {
        success: false,
        error: { code: 'SYSTEM_ERROR', desc: 'Lỗi hệ thống' },
        message: 'Lỗi hệ thống khi tạo link thanh toán'
      };
    }
  }

  /**
   * Get payment information
   */
  async getPaymentInfo(orderCode: string): Promise<{
    success: boolean;
    data?: PayOSPaymentInfo;
    error?: { code: string; desc: string };
    message: string;
  }> {
    try {
      const response = await fetch(`${this.apiUrl}/v2/payment-requests/${orderCode}`, {
        method: 'GET',
        headers: {
          'x-client-id': this.clientId,
          'x-api-key': this.apiKey
        }
      });

      const responseData = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: responseData.code || 'API_ERROR',
            desc: responseData.desc || 'Lỗi từ PayOS API'
          },
          message: 'Không thể lấy thông tin thanh toán'
        };
      }

      return {
        success: true,
        data: responseData.data,
        message: 'Lấy thông tin thanh toán thành công'
      };

    } catch (error) {
      console.error('PayOS getPaymentInfo error:', error);
      return {
        success: false,
        error: { code: 'SYSTEM_ERROR', desc: 'Lỗi hệ thống' },
        message: 'Lỗi hệ thống khi lấy thông tin thanh toán'
      };
    }
  }

  /**
   * Cancel payment
   */
  async cancelPayment(orderCode: string, cancellationReason?: string): Promise<{
    success: boolean;
    data?: any;
    error?: { code: string; desc: string };
    message: string;
  }> {
    try {
      const payload = {
        cancellationReason: cancellationReason || 'Hủy thanh toán'
      };

      const response = await fetch(`${this.apiUrl}/v2/payment-requests/${orderCode}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': this.clientId,
          'x-api-key': this.apiKey
        },
        body: JSON.stringify(payload)
      });

      const responseData = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: responseData.code || 'API_ERROR',
            desc: responseData.desc || 'Lỗi từ PayOS API'
          },
          message: 'Không thể hủy thanh toán'
        };
      }

      return {
        success: true,
        data: responseData.data,
        message: 'Hủy thanh toán thành công'
      };

    } catch (error) {
      console.error('PayOS cancelPayment error:', error);
      return {
        success: false,
        error: { code: 'SYSTEM_ERROR', desc: 'Lỗi hệ thống' },
        message: 'Lỗi hệ thống khi hủy thanh toán'
      };
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(webhookData: PayOSWebhookData): boolean {
    try {
      const expectedSignature = this.createWebhookSignature(webhookData.data);
      return expectedSignature === webhookData.signature;
    } catch (error) {
      console.error('PayOS verifyWebhookSignature error:', error);
      return false;
    }
  }

  /**
   * Process webhook
   */
  async processWebhook(webhookData: PayOSWebhookData): Promise<{
    success: boolean;
    data?: {
      orderCode: string;
      amount: number;
      status: string;
      transactionId: string;
      paidAt: Date;
      paymentMethod: string;
    };
    error?: { code: string; desc: string };
    message: string;
  }> {
    try {
      // Verify signature
      if (!this.verifyWebhookSignature(webhookData)) {
        return {
          success: false,
          error: { code: 'INVALID_SIGNATURE', desc: 'Chữ ký webhook không hợp lệ' },
          message: 'Webhook không hợp lệ'
        };
      }

      // Process webhook data
      const data = webhookData.data;
      
      return {
        success: true,
        data: {
          orderCode: data.orderCode.toString(),
          amount: data.amount,
          status: this.mapPayOSStatus(webhookData.code),
          transactionId: data.reference,
          paidAt: new Date(data.transactionDateTime),
          paymentMethod: 'payos'
        },
        message: 'Xử lý webhook thành công'
      };

    } catch (error) {
      console.error('PayOS processWebhook error:', error);
      return {
        success: false,
        error: { code: 'SYSTEM_ERROR', desc: 'Lỗi hệ thống' },
        message: 'Lỗi hệ thống khi xử lý webhook'
      };
    }
  }

  /**
   * Generate order code
   */
  generateOrderCode(): string {
    // PayOS requires numeric order code
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `${timestamp}${random}`.slice(-10); // Keep last 10 digits
  }

  /**
   * Format amount for PayOS (VND, no decimals)
   */
  formatAmount(money: Money): number {
    if (money.currency !== 'VND') {
      throw new Error('PayOS chỉ hỗ trợ VND');
    }
    return Math.round(money.amount);
  }

  /**
   * Validate payment request
   */
  private validatePaymentRequest(request: PayOSPaymentRequest): string | null {
    if (!request.orderCode) {
      return 'Mã đơn hàng không được để trống';
    }

    if (!request.amount || request.amount <= 0) {
      return 'Số tiền phải lớn hơn 0';
    }

    if (request.amount < 1000) {
      return 'Số tiền tối thiểu là 1,000 VND';
    }

    if (request.amount > 500000000) {
      return 'Số tiền tối đa là 500,000,000 VND';
    }

    if (!request.description) {
      return 'Mô tả thanh toán không được để trống';
    }

    if (request.description.length > 255) {
      return 'Mô tả thanh toán không được quá 255 ký tự';
    }

    return null;
  }

  /**
   * Create signature for API requests
   */
  private createSignature(payload: any): string {
    // Implementation would depend on PayOS signature algorithm
    // This is a simplified version
    const crypto = require('crypto');
    const sortedKeys = Object.keys(payload).sort();
    const signatureString = sortedKeys
      .map(key => `${key}=${payload[key]}`)
      .join('&');
    
    return crypto
      .createHmac('sha256', this.checksumKey)
      .update(signatureString)
      .digest('hex');
  }

  /**
   * Create webhook signature
   */
  private createWebhookSignature(data: any): string {
    // Implementation would depend on PayOS webhook signature algorithm
    const crypto = require('crypto');
    const signatureString = JSON.stringify(data);
    
    return crypto
      .createHmac('sha256', this.checksumKey)
      .update(signatureString)
      .digest('hex');
  }

  /**
   * Map PayOS status to internal status
   */
  private mapPayOSStatus(code: string): string {
    switch (code) {
      case '00':
        return 'PAID';
      case '01':
        return 'PROCESSING';
      case '02':
        return 'CANCELLED';
      default:
        return 'PENDING';
    }
  }

  /**
   * Get Vietnamese status display
   */
  getVietnameseStatus(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'Chờ thanh toán';
      case 'PROCESSING':
        return 'Đang xử lý';
      case 'PAID':
        return 'Đã thanh toán';
      case 'CANCELLED':
        return 'Đã hủy';
      default:
        return 'Không xác định';
    }
  }

  /**
   * Create payment description for Vietnamese healthcare
   */
  createPaymentDescription(invoiceId: string, patientName?: string): string {
    let description = `Thanh toan hoa don ${invoiceId}`;
    if (patientName) {
      description += ` - BN: ${patientName}`;
    }
    return description.substring(0, 255); // PayOS limit
  }
}
