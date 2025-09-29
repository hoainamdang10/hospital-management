/**
 * PayOSGatewayService - Infrastructure Layer
 * V2 Clean Architecture + DDD Implementation
 * Gateway service for PayOS payment integration with Vietnamese healthcare compliance
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, PayOS API Integration, Vietnamese Healthcare Standards
 */

import { PayOSIntegrationService } from '../../application/services/PayOSIntegrationService';
import { Money } from '../../domain/value-objects/Money';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
import { IAuditService } from '../../../../shared/application/services/audit.service.interface';

export interface PayOSConfig {
  apiUrl: string;
  clientId: string;
  apiKey: string;
  checksumKey: string;
  environment: 'sandbox' | 'production';
  webhookUrl: string;
  returnUrl: string;
  cancelUrl: string;
}

export interface PayOSPaymentRequest {
  invoiceId: string;
  patientId: string;
  amount: Money;
  description: string;
  patientInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  metadata?: Record<string, any>;
  expiredAt?: Date;
}

export interface PayOSPaymentResult {
  success: boolean;
  data?: {
    orderCode: string;
    paymentLinkId: string;
    checkoutUrl: string;
    qrCode: string;
    deepLink: string;
    deepLinkWebApp: string;
    amount: number;
    currency: string;
    status: string;
    expiresAt: Date;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface PayOSWebhookResult {
  success: boolean;
  data?: {
    orderCode: string;
    invoiceId: string;
    amount: number;
    currency: string;
    status: 'PAID' | 'CANCELLED' | 'EXPIRED';
    transactionId: string;
    paidAt: Date;
    paymentMethod: string;
    bankCode?: string;
    bankName?: string;
    accountNumber?: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface PayOSGatewayServiceConfig {
  payosConfig: PayOSConfig;
  logger: ILogger;
  auditService: IAuditService;
}

/**
 * PayOS Gateway Service
 * Infrastructure service for PayOS payment gateway integration with Vietnamese healthcare compliance
 */
export class PayOSGatewayService {
  private readonly payosService: PayOSIntegrationService;
  private readonly config: PayOSConfig;
  private readonly logger: ILogger;
  private readonly auditService: IAuditService;

  constructor(serviceConfig: PayOSGatewayServiceConfig) {
    this.config = serviceConfig.payosConfig;
    this.logger = serviceConfig.logger;
    this.auditService = serviceConfig.auditService;

    this.payosService = new PayOSIntegrationService(
      this.config.apiUrl,
      this.config.clientId,
      this.config.apiKey,
      this.config.checksumKey
    );
  }

  /**
   * Create payment link for invoice
   */
  async createPaymentLink(request: PayOSPaymentRequest): Promise<PayOSPaymentResult> {
    try {
      // Validate request
      const validationError = this.validatePaymentRequest(request);
      if (validationError) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validationError
          }
        };
      }

      // Generate order code
      const orderCode = this.generateOrderCode(request.invoiceId);

      // Format amount for PayOS (VND only, no decimals)
      const amount = this.payosService.formatAmount(request.amount);

      // Create payment description
      const description = this.createPaymentDescription(request);

      // Prepare PayOS request
      const payosRequest = {
        orderCode,
        amount,
        description,
        buyerName: request.patientInfo?.name,
        buyerEmail: request.patientInfo?.email,
        buyerPhone: request.patientInfo?.phone,
        buyerAddress: request.patientInfo?.address,
        items: request.items || this.createDefaultItems(request),
        returnUrl: this.config.returnUrl,
        cancelUrl: this.config.cancelUrl,
        expiredAt: request.expiredAt ? Math.floor(request.expiredAt.getTime() / 1000) : undefined
      };

      // Call PayOS API
      const result = await this.payosService.createPaymentLink(payosRequest);

      if (!result.success) {
        return {
          success: false,
          error: {
            code: result.error?.code || 'PAYOS_ERROR',
            message: result.error?.desc || 'Lỗi từ PayOS',
            details: result.error
          }
        };
      }

      // Return formatted result
      return {
        success: true,
        data: {
          orderCode: result.data!.orderCode,
          paymentLinkId: result.data!.paymentLinkId,
          checkoutUrl: result.data!.checkoutUrl,
          qrCode: result.data!.qrCode,
          deepLink: result.data!.deepLink,
          deepLinkWebApp: result.data!.deepLinkWebApp,
          amount: result.data!.amount,
          currency: result.data!.currency,
          status: result.data!.status,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes default
        }
      };

    } catch (error) {
      console.error('PayOSGatewayService createPaymentLink error:', error);
      return {
        success: false,
        error: {
          code: 'SYSTEM_ERROR',
          message: 'Lỗi hệ thống khi tạo link thanh toán'
        }
      };
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(orderCode: string): Promise<{
    success: boolean;
    data?: {
      orderCode: string;
      status: string;
      amount: number;
      amountPaid: number;
      amountRemaining: number;
      transactions: Array<{
        reference: string;
        amount: number;
        description: string;
        transactionDateTime: Date;
        bankCode?: string;
        bankName?: string;
      }>;
    };
    error?: { code: string; message: string };
  }> {
    try {
      const result = await this.payosService.getPaymentInfo(orderCode);

      if (!result.success) {
        return {
          success: false,
          error: {
            code: result.error?.code || 'PAYOS_ERROR',
            message: result.error?.desc || 'Lỗi khi lấy thông tin thanh toán'
          }
        };
      }

      return {
        success: true,
        data: {
          orderCode: result.data!.orderCode,
          status: result.data!.status,
          amount: result.data!.amount,
          amountPaid: result.data!.amountPaid,
          amountRemaining: result.data!.amountRemaining,
          transactions: result.data!.transactions.map(tx => ({
            reference: tx.reference,
            amount: tx.amount,
            description: tx.description,
            transactionDateTime: new Date(tx.transactionDateTime),
            bankCode: tx.counterAccountBankId,
            bankName: tx.counterAccountBankName
          }))
        }
      };

    } catch (error) {
      console.error('PayOSGatewayService getPaymentStatus error:', error);
      return {
        success: false,
        error: {
          code: 'SYSTEM_ERROR',
          message: 'Lỗi hệ thống khi lấy trạng thái thanh toán'
        }
      };
    }
  }

  /**
   * Cancel payment
   */
  async cancelPayment(orderCode: string, reason?: string): Promise<{
    success: boolean;
    data?: any;
    error?: { code: string; message: string };
  }> {
    try {
      const result = await this.payosService.cancelPayment(
        orderCode,
        reason || 'Hủy thanh toán theo yêu cầu'
      );

      return {
        success: result.success,
        data: result.data,
        error: result.error ? {
          code: result.error.code,
          message: result.error.desc
        } : undefined
      };

    } catch (error) {
      console.error('PayOSGatewayService cancelPayment error:', error);
      return {
        success: false,
        error: {
          code: 'SYSTEM_ERROR',
          message: 'Lỗi hệ thống khi hủy thanh toán'
        }
      };
    }
  }

  /**
   * Process webhook notification
   */
  async processWebhook(webhookData: any, signature: string): Promise<PayOSWebhookResult> {
    try {
      // Process webhook using PayOS service
      const result = await this.payosService.processWebhook({
        code: webhookData.code,
        desc: webhookData.desc,
        data: webhookData.data,
        signature
      });

      if (!result.success) {
        return {
          success: false,
          error: {
            code: result.error?.code || 'WEBHOOK_ERROR',
            message: result.error?.desc || 'Lỗi xử lý webhook'
          }
        };
      }

      // Extract invoice ID from order code
      const invoiceId = this.extractInvoiceIdFromOrderCode(result.data!.orderCode);

      return {
        success: true,
        data: {
          orderCode: result.data!.orderCode,
          invoiceId,
          amount: result.data!.amount,
          currency: 'VND',
          status: result.data!.status as any,
          transactionId: result.data!.transactionId,
          paidAt: result.data!.paidAt,
          paymentMethod: result.data!.paymentMethod,
          bankCode: webhookData.data.counterAccountBankId,
          bankName: webhookData.data.counterAccountBankName,
          accountNumber: webhookData.data.counterAccountNumber
        }
      };

    } catch (error) {
      console.error('PayOSGatewayService processWebhook error:', error);
      return {
        success: false,
        error: {
          code: 'SYSTEM_ERROR',
          message: 'Lỗi hệ thống khi xử lý webhook'
        }
      };
    }
  }

  /**
   * Validate payment request
   */
  private validatePaymentRequest(request: PayOSPaymentRequest): string | null {
    if (!request.invoiceId) {
      return 'Mã hóa đơn không được để trống';
    }

    if (!request.patientId) {
      return 'Mã bệnh nhân không được để trống';
    }

    if (!request.amount || request.amount.amount <= 0) {
      return 'Số tiền phải lớn hơn 0';
    }

    if (request.amount.currency !== 'VND') {
      return 'PayOS chỉ hỗ trợ VND';
    }

    if (request.amount.amount < 1000) {
      return 'Số tiền tối thiểu là 1,000 VND';
    }

    if (request.amount.amount > 500000000) {
      return 'Số tiền tối đa là 500,000,000 VND';
    }

    if (!request.description) {
      return 'Mô tả thanh toán không được để trống';
    }

    return null;
  }

  /**
   * Generate order code from invoice ID
   */
  private generateOrderCode(invoiceId: string): string {
    // Extract numeric part from invoice ID or generate new one
    const timestamp = Date.now();
    const hash = this.simpleHash(invoiceId);
    return `${timestamp}${hash}`.slice(-10); // Keep last 10 digits
  }

  /**
   * Extract invoice ID from order code
   */
  private extractInvoiceIdFromOrderCode(orderCode: string): string {
    // In a real implementation, you would maintain a mapping
    // For now, return the order code as invoice ID
    return orderCode;
  }

  /**
   * Create payment description
   */
  private createPaymentDescription(request: PayOSPaymentRequest): string {
    let description = `Thanh toan hoa don ${request.invoiceId}`;
    
    if (request.patientInfo?.name) {
      description += ` - BN: ${request.patientInfo.name}`;
    }

    // Ensure description is within PayOS limit (255 characters)
    return description.substring(0, 255);
  }

  /**
   * Create default items for PayOS
   */
  private createDefaultItems(request: PayOSPaymentRequest): Array<{ name: string; quantity: number; price: number }> {
    return [{
      name: `Hoa don benh vien ${request.invoiceId}`,
      quantity: 1,
      price: request.amount.amount
    }];
  }

  /**
   * Simple hash function
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString().slice(-3);
  }

  /**
   * Get PayOS status in Vietnamese
   */
  getVietnameseStatus(status: string): string {
    return this.payosService.getVietnameseStatus(status);
  }

  /**
   * Check if environment is production
   */
  isProduction(): boolean {
    return this.config.environment === 'production';
  }

  /**
   * Get webhook URL
   */
  getWebhookUrl(): string {
    return this.config.webhookUrl;
  }

  /**
   * Get return URL
   */
  getReturnUrl(): string {
    return this.config.returnUrl;
  }

  /**
   * Get cancel URL
   */
  getCancelUrl(): string {
    return this.config.cancelUrl;
  }

  /**
   * Format amount for display
   */
  formatAmount(amount: Money): string {
    return amount.formatVND();
  }

  /**
   * Create payment summary for Vietnamese healthcare
   */
  createPaymentSummary(request: PayOSPaymentRequest): {
    invoiceId: string;
    patientName: string;
    amount: string;
    description: string;
    paymentMethod: string;
  } {
    return {
      invoiceId: request.invoiceId,
      patientName: request.patientInfo?.name || 'Không xác định',
      amount: this.formatAmount(request.amount),
      description: request.description,
      paymentMethod: 'PayOS'
    };
  }
}
