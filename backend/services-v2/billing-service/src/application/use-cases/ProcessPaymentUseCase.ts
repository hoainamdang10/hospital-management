/**
 * ProcessPaymentUseCase - Application Layer
 * V2 Clean Architecture + DDD Implementation
 * Use case for processing payments for invoices with PayOS integration
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS, PayOS Integration, Vietnamese Healthcare Standards
 */

import { IBillingRepository } from '../../domain/repositories/IBillingRepository';
import { IEventBus } from '../../../../shared/events/event-bus.interface';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
import { PaymentMethod } from '../../domain/aggregates/BillingAggregate';
import { Money } from '../../domain/value-objects/Money';
import { InvoiceId } from '../../domain/value-objects/InvoiceId';
import { BaseHealthcareUseCase } from '../../../../shared/application/base/BaseHealthcareUseCase';

export interface ProcessPaymentRequest {
  invoiceId: string;
  amount: number;
  currency?: string;
  paymentMethod: PaymentMethod;
  transactionId?: string;
  notes?: string;
  processedBy: string;
  payosData?: {
    orderCode: string;
    paymentLinkId: string;
    checkoutUrl?: string;
    qrCode?: string;
    deepLink?: string;
    deepLinkWebApp?: string;
  };
  cardData?: {
    cardNumber?: string; // Masked
    cardType?: string;
    bankName?: string;
    authorizationCode?: string;
  };
  bankTransferData?: {
    bankCode?: string;
    bankName?: string;
    accountNumber?: string; // Masked
    transferReference?: string;
  };
}

export interface ProcessPaymentResponse {
  success: boolean;
  data?: {
    paymentId: string;
    invoiceId: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    vietnamesePaymentMethod: string;
    transactionId?: string;
    processedAt: Date;
    processedBy: string;
    invoiceStatus: string;
    vietnameseInvoiceStatus: string;
    remainingAmount: number;
    totalPaidAmount: number;
    isFullyPaid: boolean;
    paymentBreakdown: {
      totalAmount: number;
      totalPaid: number;
      remainingAmount: number;
      paymentCount: number;
    };
    vietnameseSummary: string;
  };
  errors?: Array<{
    field: string;
    message: string;
  }>;
  message: string;
}

/**
 * Process Payment Use Case
 * Implements payment processing with PayOS integration and Vietnamese healthcare compliance
 */
export class ProcessPaymentUseCase extends BaseHealthcareUseCase<ProcessPaymentRequest, ProcessPaymentResponse> {

  constructor(
    private readonly billingRepository: IBillingRepository,
    private readonly eventBus: IEventBus,
    logger: ILogger
  ) {
    super(logger);
  }

  /**
   * Execute payment processing
   */
  protected async executeCore(request: ProcessPaymentRequest): Promise<ProcessPaymentResponse> {
    try {
      this.logger.info('Processing payment', {
        invoiceId: request.invoiceId,
        amount: request.amount,
        paymentMethod: request.paymentMethod,
        processedBy: request.processedBy
      });

      // 1. Validate request
      const validation = this.validateRequest(request);
      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors,
          message: 'Dữ liệu thanh toán không hợp lệ'
        };
      }

      // Find invoice
      const invoiceId = InvoiceId.create(request.invoiceId);
      const billing = await this.billingRepository.findById(invoiceId);
      
      if (!billing) {
        return {
          success: false,
          errors: [{ field: 'invoiceId', message: 'Không tìm thấy hóa đơn' }],
          message: 'Hóa đơn không tồn tại'
        };
      }

      // Check if invoice can accept payments
      if (billing.status === 'cancelled') {
        return {
          success: false,
          errors: [{ field: 'invoiceId', message: 'Không thể thanh toán cho hóa đơn đã hủy' }],
          message: 'Hóa đơn đã bị hủy'
        };
      }

      if (billing.status === 'refunded') {
        return {
          success: false,
          errors: [{ field: 'invoiceId', message: 'Không thể thanh toán cho hóa đơn đã hoàn tiền' }],
          message: 'Hóa đơn đã được hoàn tiền'
        };
      }

      // Create money object
      const paymentAmount = Money.create(request.amount, request.currency || 'VND');

      // Check if payment amount is valid
      const remainingAmount = billing.getRemainingAmount();
      if (paymentAmount.greaterThan(remainingAmount)) {
        return {
          success: false,
          errors: [{ 
            field: 'amount', 
            message: `Số tiền thanh toán (${paymentAmount.formatVND()}) vượt quá số tiền còn lại (${remainingAmount.formatVND()})` 
          }],
          message: 'Số tiền thanh toán không hợp lệ'
        };
      }

      // Prepare PayOS data if applicable
      let payosData: any = undefined;
      if (request.paymentMethod === PaymentMethod.PAYOS && request.payosData) {
        payosData = {
          orderCode: request.payosData.orderCode,
          paymentLinkId: request.payosData.paymentLinkId,
          checkoutUrl: request.payosData.checkoutUrl,
          qrCode: request.payosData.qrCode,
          deepLink: request.payosData.deepLink,
          deepLinkWebApp: request.payosData.deepLinkWebApp,
          processedAt: new Date().toISOString()
        };
      }

      // Process payment
      billing.processPayment(
        paymentAmount,
        request.paymentMethod,
        request.processedBy,
        request.transactionId,
        request.notes,
        payosData
      );

      // Save updated billing
      await this.billingRepository.update(billing);

      // Publish domain events
      const domainEvents = billing.getUncommittedEvents();
      for (const event of domainEvents) {
        await this.eventPublisher.publish(event);
      }
      billing.markEventsAsCommitted();

      // Get payment details
      const payments = billing.payments;
      const latestPayment = payments[payments.length - 1];
      const totalPaidAmount = billing.getTotalPaidAmount();
      const newRemainingAmount = billing.getRemainingAmount();

      // Return response
      return {
        success: true,
        data: {
          paymentId: latestPayment.id,
          invoiceId: billing.id.value,
          amount: paymentAmount.amount,
          currency: paymentAmount.currency,
          paymentMethod: request.paymentMethod,
          vietnamesePaymentMethod: this.getVietnamesePaymentMethod(request.paymentMethod),
          transactionId: request.transactionId,
          processedAt: latestPayment.processedAt,
          processedBy: request.processedBy,
          invoiceStatus: billing.status,
          vietnameseInvoiceStatus: billing.getVietnameseStatusDisplay(),
          remainingAmount: newRemainingAmount.amount,
          totalPaidAmount: totalPaidAmount.amount,
          isFullyPaid: billing.isFullyPaid(),
          paymentBreakdown: {
            totalAmount: billing.patientPayment.amount,
            totalPaid: totalPaidAmount.amount,
            remainingAmount: newRemainingAmount.amount,
            paymentCount: payments.length
          },
          vietnameseSummary: this.generateVietnameseSummary(billing, paymentAmount, request.paymentMethod)
        },
        message: 'Thanh toán đã được xử lý thành công'
      };

    } catch (error) {
      console.error('Error in ProcessPaymentUseCase:', error);
      
      // Handle specific domain errors
      if (error instanceof Error) {
        return {
          success: false,
          errors: [{ field: 'general', message: error.message }],
          message: 'Lỗi xử lý thanh toán'
        };
      }

      return {
        success: false,
        errors: [{ field: 'general', message: 'Lỗi hệ thống khi xử lý thanh toán' }],
        message: 'Không thể xử lý thanh toán'
      };
    }
  }

  /**
   * Validate request
   */
  private validateRequest(request: ProcessPaymentRequest): Array<{ field: string; message: string }> {
    const errors: Array<{ field: string; message: string }> = [];

    // Required fields
    if (!request.invoiceId) {
      errors.push({ field: 'invoiceId', message: 'Mã hóa đơn không được để trống' });
    }

    if (!request.amount || request.amount <= 0) {
      errors.push({ field: 'amount', message: 'Số tiền thanh toán phải lớn hơn 0' });
    }

    if (!request.paymentMethod) {
      errors.push({ field: 'paymentMethod', message: 'Phương thức thanh toán không được để trống' });
    } else if (!Object.values(PaymentMethod).includes(request.paymentMethod)) {
      errors.push({ field: 'paymentMethod', message: 'Phương thức thanh toán không hợp lệ' });
    }

    if (!request.processedBy) {
      errors.push({ field: 'processedBy', message: 'Người xử lý thanh toán không được để trống' });
    }

    // Currency validation
    if (request.currency && !['VND', 'USD'].includes(request.currency)) {
      errors.push({ field: 'currency', message: 'Loại tiền tệ không được hỗ trợ' });
    }

    // PayOS specific validation
    if (request.paymentMethod === PaymentMethod.PAYOS) {
      if (!request.payosData) {
        errors.push({ field: 'payosData', message: 'Dữ liệu PayOS không được để trống' });
      } else {
        if (!request.payosData.orderCode) {
          errors.push({ field: 'payosData.orderCode', message: 'Mã đơn hàng PayOS không được để trống' });
        }

        if (!request.payosData.paymentLinkId) {
          errors.push({ field: 'payosData.paymentLinkId', message: 'ID link thanh toán PayOS không được để trống' });
        }
      }
    }

    // Card payment validation
    if (request.paymentMethod === PaymentMethod.CARD) {
      if (!request.transactionId) {
        errors.push({ field: 'transactionId', message: 'Mã giao dịch thẻ không được để trống' });
      }
    }

    // Bank transfer validation
    if (request.paymentMethod === PaymentMethod.BANK_TRANSFER) {
      if (!request.transactionId) {
        errors.push({ field: 'transactionId', message: 'Mã giao dịch chuyển khoản không được để trống' });
      }

      if (request.bankTransferData && !request.bankTransferData.bankCode) {
        errors.push({ field: 'bankTransferData.bankCode', message: 'Mã ngân hàng không được để trống' });
      }
    }

    // Amount validation (reasonable limits)
    if (request.amount > 1000000000) { // 1 billion VND
      errors.push({ field: 'amount', message: 'Số tiền thanh toán quá lớn' });
    }

    return errors;
  }

  /**
   * Get Vietnamese payment method display
   */
  private getVietnamesePaymentMethod(method: PaymentMethod): string {
    switch (method) {
      case PaymentMethod.CASH:
        return 'Tiền mặt';
      case PaymentMethod.CARD:
        return 'Thẻ';
      case PaymentMethod.BANK_TRANSFER:
        return 'Chuyển khoản';
      case PaymentMethod.PAYOS:
        return 'PayOS';
      case PaymentMethod.INSURANCE_DIRECT:
        return 'Bảo hiểm trực tiếp';
      default:
        return 'Khác';
    }
  }

  /**
   * Generate Vietnamese summary
   */
  private generateVietnameseSummary(
    billing: any, 
    paymentAmount: Money, 
    paymentMethod: PaymentMethod
  ): string {
    const amount = paymentAmount.formatVND();
    const method = this.getVietnamesePaymentMethod(paymentMethod);
    const status = billing.getVietnameseStatusDisplay();
    const remaining = billing.getRemainingAmount().formatVND();

    let summary = `Đã thanh toán ${amount} bằng ${method}. `;
    summary += `Trạng thái hóa đơn: ${status}. `;
    
    if (billing.isFullyPaid()) {
      summary += 'Hóa đơn đã được thanh toán đầy đủ.';
    } else {
      summary += `Còn lại: ${remaining}.`;
    }

    return summary;
  }

  /**
   * Validate PayOS data
   */
  private validatePayOSData(payosData: any): boolean {
    return !!(payosData?.orderCode && payosData?.paymentLinkId);
  }

  /**
   * Mask sensitive data
   */
  private maskCardNumber(cardNumber: string): string {
    if (!cardNumber || cardNumber.length < 4) return cardNumber;
    return '**** **** **** ' + cardNumber.slice(-4);
  }

  /**
   * Mask account number
   */
  private maskAccountNumber(accountNumber: string): string {
    if (!accountNumber || accountNumber.length < 4) return accountNumber;
    return '****' + accountNumber.slice(-4);
  }

  /**
   * Get payment category for analytics
   */
  private getPaymentCategory(method: PaymentMethod): 'electronic' | 'cash' | 'insurance' {
    switch (method) {
      case PaymentMethod.CASH:
        return 'cash';
      case PaymentMethod.INSURANCE_DIRECT:
        return 'insurance';
      case PaymentMethod.CARD:
      case PaymentMethod.BANK_TRANSFER:
      case PaymentMethod.PAYOS:
      default:
        return 'electronic';
    }
  }

  /**
   * Generate payment receipt data
   */
  private generateReceiptData(billing: any, payment: any): any {
    return {
      receiptNumber: `RC-${payment.id}`,
      invoiceNumber: billing.vietnameseInvoiceNumber || billing.id.value,
      patientId: billing.patientId,
      paymentDate: payment.processedAt,
      amount: payment.amount.formatVND(),
      paymentMethod: this.getVietnamesePaymentMethod(payment.method),
      transactionId: payment.transactionId,
      processedBy: payment.processedBy,
      remainingAmount: billing.getRemainingAmount().formatVND(),
      isFullyPaid: billing.isFullyPaid()
    };
  }
}
