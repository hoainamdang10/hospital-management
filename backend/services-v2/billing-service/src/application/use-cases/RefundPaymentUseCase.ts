/**
 * RefundPaymentUseCase - Application Layer
 * V2 Clean Architecture + DDD Implementation
 * Use case for processing payment refunds with Vietnamese healthcare compliance
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS, Vietnamese Healthcare Standards
 */

import { IBillingRepository } from '../../domain/repositories/IBillingRepository';
import { IEventBus } from '../../../../shared/events/event-bus.interface';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
import { InvoiceId } from '../../domain/value-objects/InvoiceId';
import { Money } from '../../domain/value-objects/Money';
import { PaymentMethod, InvoiceStatus } from '../../domain/aggregates/BillingAggregate';
import { BaseHealthcareUseCase } from '../../../../shared/application/base/BaseHealthcareUseCase';

export interface RefundPaymentRequest {
  invoiceId: string;
  refundAmount: number;
  refundReason: string;
  refundMethod: PaymentMethod;
  processedBy: string;
  notes?: string;
  refundToOriginalMethod?: boolean;
}

export interface RefundPaymentResponse {
  success: boolean;
  data?: {
    invoiceId: string;
    refundId: string;
    refundAmount: number;
    refundMethod: PaymentMethod;
    refundDate: Date;
    remainingBalance: number;
    status: InvoiceStatus;
  };
  message: string;
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

/**
 * Refund Payment Use Case
 * Implements payment refund processing with Vietnamese healthcare compliance
 */
export class RefundPaymentUseCase extends BaseHealthcareUseCase<RefundPaymentRequest, RefundPaymentResponse> {
  constructor(
    private readonly billingRepository: IBillingRepository,
    private readonly eventBus: IEventBus,
    logger: ILogger
  ) {
    super(logger);
  }

  /**
   * Execute payment refund
   */
  protected async executeImpl(request: RefundPaymentRequest): Promise<RefundPaymentResponse> {
    try {
      this.logger.info('Processing payment refund', {
        invoiceId: request.invoiceId,
        refundAmount: request.refundAmount,
        refundReason: request.refundReason,
        processedBy: request.processedBy
      });

      // 1. Validate request
      const validation = this.validateRequest(request);
      if (!validation.isValid) {
        return {
          success: false,
          message: 'Dữ liệu đầu vào không hợp lệ',
          errors: validation.errors
        };
      }

      // 2. Get billing aggregate
      const invoiceId = InvoiceId.create(request.invoiceId);
      const billingAggregate = await this.billingRepository.findById(invoiceId);

      if (!billingAggregate) {
        return {
          success: false,
          message: 'Không tìm thấy hóa đơn'
        };
      }

      // 3. Validate refund eligibility
      const eligibilityCheck = this.validateRefundEligibility(billingAggregate, request.refundAmount);
      if (!eligibilityCheck.isValid) {
        return {
          success: false,
          message: eligibilityCheck.message,
          errors: eligibilityCheck.errors
        };
      }

      // 4. Process refund
      const refundAmount = Money.create(request.refundAmount, 'VND');
      const refundId = this.generateRefundId();

      billingAggregate.processRefund(
        refundId,
        refundAmount,
        request.refundReason,
        request.refundMethod,
        request.processedBy,
        {
          notes: request.notes,
          refundToOriginalMethod: request.refundToOriginalMethod
        }
      );

      // 5. Save updated aggregate
      await this.billingRepository.save(billingAggregate);

      // 6. Publish domain events
      const events = billingAggregate.getUncommittedEvents();
      for (const event of events) {
        await this.eventBus.publish(event);
      }
      billingAggregate.markEventsAsCommitted();

      this.logger.info('Payment refund processed successfully', {
        invoiceId: request.invoiceId,
        refundId,
        refundAmount: request.refundAmount,
        newStatus: billingAggregate.status
      });

      return {
        success: true,
        message: 'Hoàn tiền thành công',
        data: {
          invoiceId: request.invoiceId,
          refundId,
          refundAmount: request.refundAmount,
          refundMethod: request.refundMethod,
          refundDate: new Date(),
          remainingBalance: billingAggregate.remainingBalance.amount,
          status: billingAggregate.status
        }
      };

    } catch (error) {
      this.logger.error('Error processing payment refund', {
        invoiceId: request.invoiceId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        message: 'Lỗi xử lý hoàn tiền: ' + (error instanceof Error ? error.message : 'Unknown error')
      };
    }
  }

  /**
   * Validate refund payment request
   */
  private validateRequest(request: RefundPaymentRequest): { isValid: boolean; errors: any[] } {
    const errors: any[] = [];

    if (!request.invoiceId) {
      errors.push({
        field: 'invoiceId',
        message: 'Invoice ID là bắt buộc',
        code: 'REQUIRED_FIELD'
      });
    }

    if (!request.refundAmount || request.refundAmount <= 0) {
      errors.push({
        field: 'refundAmount',
        message: 'Số tiền hoàn phải lớn hơn 0',
        code: 'INVALID_VALUE'
      });
    }

    if (!request.refundReason) {
      errors.push({
        field: 'refundReason',
        message: 'Lý do hoàn tiền là bắt buộc',
        code: 'REQUIRED_FIELD'
      });
    }

    if (!request.refundMethod) {
      errors.push({
        field: 'refundMethod',
        message: 'Phương thức hoàn tiền là bắt buộc',
        code: 'REQUIRED_FIELD'
      });
    }

    if (!request.processedBy) {
      errors.push({
        field: 'processedBy',
        message: 'Người xử lý hoàn tiền là bắt buộc',
        code: 'REQUIRED_FIELD'
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate refund eligibility
   */
  private validateRefundEligibility(
    billingAggregate: any,
    refundAmount: number
  ): { isValid: boolean; message?: string; errors?: any[] } {
    const errors: any[] = [];

    // Check if invoice is paid
    if (billingAggregate.status !== InvoiceStatus.PAID && 
        billingAggregate.status !== InvoiceStatus.PARTIALLY_PAID) {
      errors.push({
        field: 'status',
        message: 'Chỉ có thể hoàn tiền cho hóa đơn đã thanh toán',
        code: 'INVALID_STATUS'
      });
    }

    // Check if refund amount is valid
    const totalPaid = billingAggregate.totalPaid?.amount || 0;
    const totalRefunded = billingAggregate.totalRefunded?.amount || 0;
    const availableForRefund = totalPaid - totalRefunded;

    if (refundAmount > availableForRefund) {
      errors.push({
        field: 'refundAmount',
        message: `Số tiền hoàn không thể vượt quá ${availableForRefund.toLocaleString('vi-VN')} VND`,
        code: 'EXCEEDS_AVAILABLE_AMOUNT'
      });
    }

    // Check refund time limit (e.g., 30 days)
    const daysSincePayment = Math.floor(
      (Date.now() - billingAggregate.lastPaymentDate?.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSincePayment > 30) {
      errors.push({
        field: 'timeLimit',
        message: 'Đã quá thời hạn hoàn tiền (30 ngày)',
        code: 'REFUND_TIME_EXPIRED'
      });
    }

    return {
      isValid: errors.length === 0,
      message: errors.length > 0 ? errors[0].message : undefined,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * Generate unique refund ID
   */
  private generateRefundId(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `RF-${timestamp}-${random}`;
  }
}
