/**
 * CancelPayOSPaymentUseCase - Application Layer
 * Use case for cancelling PayOS payment
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
import { BaseHealthcareUseCase } from '../../../../shared/application/base/BaseHealthcareUseCase';

export interface CancelPayOSPaymentRequest {
  orderCode: string;
  cancellationReason?: string;
}

export interface CancelPayOSPaymentResponse {
  success: boolean;
  data?: {
    orderCode: string;
    status: string;
    cancelledAt: Date;
    cancellationReason?: string;
  };
  message: string;
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

export class CancelPayOSPaymentUseCase extends BaseHealthcareUseCase<CancelPayOSPaymentRequest, CancelPayOSPaymentResponse> {
  private readonly PAYOS_API_URL = process.env.PAYOS_API_URL || 'https://api-merchant.payos.vn';
  private readonly PAYOS_CLIENT_ID = process.env.PAYOS_CLIENT_ID || '';
  private readonly PAYOS_API_KEY = process.env.PAYOS_API_KEY || '';

  constructor(logger: ILogger) {
    super(logger);
  }

  protected async executeCore(request: CancelPayOSPaymentRequest): Promise<CancelPayOSPaymentResponse> {
    try {
      this.logger.info('Cancelling PayOS payment', { 
        orderCode: request.orderCode,
        reason: request.cancellationReason
      });

      // Validate order code
      if (!request.orderCode || request.orderCode.trim().length === 0) {
        return {
          success: false,
          message: 'Order code không hợp lệ',
          errors: [{
            field: 'orderCode',
            message: 'Order code is required',
            code: 'INVALID_ORDER_CODE'
          }]
        };
      }

      // Check payment status first
      const currentStatus = await this.getPaymentStatus(request.orderCode);

      if (currentStatus === 'PAID') {
        return {
          success: false,
          message: 'Không thể hủy giao dịch đã thanh toán',
          errors: [{
            field: 'status',
            message: 'Payment already completed',
            code: 'ALREADY_PAID'
          }]
        };
      }

      if (currentStatus === 'CANCELLED') {
        return {
          success: false,
          message: 'Giao dịch đã được hủy trước đó',
          errors: [{
            field: 'status',
            message: 'Payment already cancelled',
            code: 'ALREADY_CANCELLED'
          }]
        };
      }

      // Cancel payment via PayOS API
      await this.cancelPaymentOnPayOS(request.orderCode, request.cancellationReason);

      return {
        success: true,
        data: {
          orderCode: request.orderCode,
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancellationReason: request.cancellationReason
        },
        message: 'Hủy giao dịch PayOS thành công'
      };

    } catch (error) {
      this.logger.error('Error cancelling PayOS payment', { error, request });
      
      // Check if it's a 404 error (payment not found)
      if ((error as any).statusCode === 404) {
        return {
          success: false,
          message: 'Không tìm thấy giao dịch thanh toán',
          errors: [{
            field: 'orderCode',
            message: 'Payment not found',
            code: 'PAYMENT_NOT_FOUND'
          }]
        };
      }

      throw error;
    }
  }

  private async getPaymentStatus(orderCode: string): Promise<string> {
    // TODO: Replace with actual PayOS API call
    // Mock response
    return 'PENDING';
  }

  private async cancelPaymentOnPayOS(orderCode: string, reason?: string): Promise<void> {
    // TODO: Replace with actual PayOS API call
    
    // Mock API call
    // const response = await fetch(`${this.PAYOS_API_URL}/v2/payment-requests/${orderCode}/cancel`, {
    //   method: 'POST',
    //   headers: {
    //     'x-client-id': this.PAYOS_CLIENT_ID,
    //     'x-api-key': this.PAYOS_API_KEY,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     cancellationReason: reason
    //   })
    // });

    // if (!response.ok) {
    //   throw new Error('Failed to cancel payment on PayOS');
    // }

    this.logger.info('Payment cancelled on PayOS', { orderCode, reason });
  }
}

