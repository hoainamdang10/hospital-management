/**
 * GetPayOSPaymentStatusUseCase - Application Layer
 * Use case for checking PayOS payment status
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
import { BaseHealthcareUseCase } from '../../../../shared/application/base/BaseHealthcareUseCase';

export interface GetPayOSPaymentStatusRequest {
  orderCode: string;
}

export interface GetPayOSPaymentStatusResponse {
  success: boolean;
  data?: {
    orderCode: string;
    status: 'PENDING' | 'PROCESSING' | 'PAID' | 'CANCELLED' | 'EXPIRED';
    amount: number;
    currency: string;
    description: string;
    transactions: Array<{
      reference: string;
      amount: number;
      description: string;
      transactionDateTime: string;
      accountNumber: string;
    }>;
    createdAt: Date;
    paidAt?: Date;
    cancelledAt?: Date;
  };
  message: string;
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

export class GetPayOSPaymentStatusUseCase extends BaseHealthcareUseCase<GetPayOSPaymentStatusRequest, GetPayOSPaymentStatusResponse> {
  private readonly PAYOS_API_URL = process.env.PAYOS_API_URL || 'https://api-merchant.payos.vn';
  private readonly PAYOS_CLIENT_ID = process.env.PAYOS_CLIENT_ID || '';
  private readonly PAYOS_API_KEY = process.env.PAYOS_API_KEY || '';

  constructor(logger: ILogger) {
    super(logger);
  }

  protected async executeCore(request: GetPayOSPaymentStatusRequest): Promise<GetPayOSPaymentStatusResponse> {
    try {
      this.logger.info('Getting PayOS payment status', { 
        orderCode: request.orderCode
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

      // Call PayOS API to get payment status
      const paymentStatus = await this.getPaymentStatusFromPayOS(request.orderCode);

      return {
        success: true,
        data: paymentStatus,
        message: 'Lấy trạng thái thanh toán thành công'
      };

    } catch (error) {
      this.logger.error('Error getting PayOS payment status', { error, request });
      
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

  private async getPaymentStatusFromPayOS(orderCode: string): Promise<any> {
    // TODO: Replace with actual PayOS API call
    // For now, return mock response
    
    // Mock API call
    // const response = await fetch(`${this.PAYOS_API_URL}/v2/payment-requests/${orderCode}`, {
    //   method: 'GET',
    //   headers: {
    //     'x-client-id': this.PAYOS_CLIENT_ID,
    //     'x-api-key': this.PAYOS_API_KEY,
    //     'Content-Type': 'application/json'
    //   }
    // });

    // Mock response
    return {
      orderCode,
      status: 'PENDING',
      amount: 100000,
      currency: 'VND',
      description: `Thanh toán hóa đơn ${orderCode}`,
      transactions: [],
      createdAt: new Date(),
      paidAt: undefined,
      cancelledAt: undefined
    };
  }
}

