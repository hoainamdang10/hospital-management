/**
 * CreatePayOSPaymentLinkUseCase - Application Layer
 * Use case for creating PayOS payment link
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { IBillingRepository } from '../../domain/repositories/IBillingRepository';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
import { InvoiceId } from '../../domain/value-objects/InvoiceId';
import { BaseHealthcareUseCase } from '../../../../shared/application/base/BaseHealthcareUseCase';
import * as crypto from 'crypto';

export interface CreatePayOSPaymentLinkRequest {
  invoiceId: string;
  returnUrl: string;
  cancelUrl: string;
  description?: string;
}

export interface CreatePayOSPaymentLinkResponse {
  success: boolean;
  data?: {
    checkoutUrl: string;
    qrCode: string;
    deepLink: string;
    orderCode: string;
    amount: number;
    currency: string;
    expiresAt: Date;
  };
  message: string;
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

export class CreatePayOSPaymentLinkUseCase extends BaseHealthcareUseCase<CreatePayOSPaymentLinkRequest, CreatePayOSPaymentLinkResponse> {
  private readonly PAYOS_API_URL = process.env.PAYOS_API_URL || 'https://api-merchant.payos.vn';
  private readonly PAYOS_CLIENT_ID = process.env.PAYOS_CLIENT_ID || '';
  private readonly PAYOS_API_KEY = process.env.PAYOS_API_KEY || '';
  private readonly PAYOS_CHECKSUM_KEY = process.env.PAYOS_CHECKSUM_KEY || '';

  constructor(
    private readonly billingRepository: IBillingRepository,
    logger: ILogger
  ) {
    super(logger);
  }

  protected async executeCore(request: CreatePayOSPaymentLinkRequest): Promise<CreatePayOSPaymentLinkResponse> {
    try {
      this.logger.info('Creating PayOS payment link', { 
        invoiceId: request.invoiceId
      });

      // Validate invoice ID
      const invoiceId = InvoiceId.create(request.invoiceId);

      // Get invoice
      const billing = await this.billingRepository.findById(invoiceId);

      if (!billing) {
        return {
          success: false,
          message: 'Không tìm thấy hóa đơn',
          errors: [{
            field: 'invoiceId',
            message: 'Hóa đơn không tồn tại',
            code: 'INVOICE_NOT_FOUND'
          }]
        };
      }

      // Check if invoice can be paid
      if (billing.status === 'PAID') {
        return {
          success: false,
          message: 'Hóa đơn đã được thanh toán',
          errors: [{
            field: 'status',
            message: 'Không thể tạo link thanh toán cho hóa đơn đã thanh toán',
            code: 'ALREADY_PAID'
          }]
        };
      }

      if (billing.status === 'CANCELLED') {
        return {
          success: false,
          message: 'Hóa đơn đã bị hủy',
          errors: [{
            field: 'status',
            message: 'Không thể tạo link thanh toán cho hóa đơn đã hủy',
            code: 'INVOICE_CANCELLED'
          }]
        };
      }

      // Generate order code
      const orderCode = this.generateOrderCode(billing.invoiceId.value);

      // Calculate amount to pay (patient payable amount)
      const amount = billing.patientPaymentAmount.amount;

      // Create PayOS payment data
      const paymentData = {
        orderCode,
        amount,
        description: request.description || `Thanh toán hóa đơn ${billing.invoiceId.value}`,
        returnUrl: request.returnUrl,
        cancelUrl: request.cancelUrl,
        items: billing.items.map(item => ({
          name: item.vietnameseDescription || item.description,
          quantity: item.quantity,
          price: item.unitPrice
        })),
        buyerName: billing.patientId,
        buyerEmail: '', // TODO: Get from patient service
        buyerPhone: '', // TODO: Get from patient service
        expiredAt: Math.floor(Date.now() / 1000) + 15 * 60 // 15 minutes
      };

      // Generate signature
      const signature = this.generateSignature(paymentData);

      // Call PayOS API (mock for now)
      const payosResponse = await this.callPayOSAPI(paymentData, signature);

      return {
        success: true,
        data: {
          checkoutUrl: payosResponse.checkoutUrl,
          qrCode: payosResponse.qrCode,
          deepLink: payosResponse.deepLink,
          orderCode,
          amount,
          currency: 'VND',
          expiresAt: new Date(paymentData.expiredAt * 1000)
        },
        message: 'Tạo link thanh toán PayOS thành công'
      };

    } catch (error) {
      this.logger.error('Error creating PayOS payment link', { error, request });
      throw error;
    }
  }

  private generateOrderCode(invoiceId: string): string {
    const timestamp = Date.now();
    return `${invoiceId}-${timestamp}`;
  }

  private generateSignature(data: any): string {
    const sortedData = this.sortObject(data);
    const dataString = JSON.stringify(sortedData);
    return crypto
      .createHmac('sha256', this.PAYOS_CHECKSUM_KEY)
      .update(dataString)
      .digest('hex');
  }

  private sortObject(obj: any): any {
    return Object.keys(obj)
      .sort()
      .reduce((result: any, key) => {
        result[key] = obj[key];
        return result;
      }, {});
  }

  private async callPayOSAPI(data: any, signature: string): Promise<any> {
    // TODO: Replace with actual PayOS API call
    // For now, return mock response
    return {
      checkoutUrl: `https://pay.payos.vn/web/${data.orderCode}`,
      qrCode: `https://img.vietqr.io/image/payos-${data.orderCode}.png`,
      deepLink: `payos://pay/${data.orderCode}`
    };
  }
}

