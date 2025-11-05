/**
 * ProcessPaymentCommand - Application Layer
 * Command for processing payment on an invoice
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, DDD
 */

import { PaymentMethod } from '../../domain/aggregates/BillingAggregate';

export interface PayOSPaymentData {
  orderCode: number;
  transactionDateTime: string;
  reference: string;
  accountNumber?: string;
  counterAccountNumber?: string;
  counterAccountName?: string;
  virtualAccountNumber?: string;
  virtualAccountName?: string;
  description?: string;
}

export class ProcessPaymentCommand {
  public readonly invoiceId: string;
  public readonly amount: number;
  public readonly currency: string;
  public readonly paymentMethod: PaymentMethod;
  public readonly processedBy: string;

  // Optional fields
  public readonly transactionId?: string;
  public readonly notes?: string;

  // PayOS specific data
  public readonly payosData?: PayOSPaymentData;

  // Card payment data
  public readonly cardLast4?: string;
  public readonly cardBrand?: string;
  public readonly cardHolderName?: string;

  // Bank transfer data
  public readonly bankName?: string;
  public readonly bankAccountNumber?: string;
  public readonly bankTransferReference?: string;

  // Metadata
  public readonly correlationId?: string;
  public readonly causationId?: string;
  public readonly userId?: string;
  public readonly tenantId?: string;
  public readonly timestamp?: Date;

  constructor(data: {
    invoiceId: string;
    amount: number;
    currency?: string;
    paymentMethod: PaymentMethod;
    processedBy: string;
    transactionId?: string;
    notes?: string;
    payosData?: PayOSPaymentData;
    cardLast4?: string;
    cardBrand?: string;
    cardHolderName?: string;
    bankName?: string;
    bankAccountNumber?: string;
    bankTransferReference?: string;
    correlationId?: string;
    causationId?: string;
    userId?: string;
    tenantId?: string;
    timestamp?: Date;
  }) {
    this.invoiceId = data.invoiceId;
    this.amount = data.amount;
    this.currency = data.currency || 'VND';
    this.paymentMethod = data.paymentMethod;
    this.processedBy = data.processedBy;
    this.transactionId = data.transactionId;
    this.notes = data.notes;
    this.payosData = data.payosData;
    this.cardLast4 = data.cardLast4;
    this.cardBrand = data.cardBrand;
    this.cardHolderName = data.cardHolderName;
    this.bankName = data.bankName;
    this.bankAccountNumber = data.bankAccountNumber;
    this.bankTransferReference = data.bankTransferReference;
    this.correlationId = data.correlationId;
    this.causationId = data.causationId;
    this.userId = data.userId;
    this.tenantId = data.tenantId;
    this.timestamp = data.timestamp || new Date();
  }

  /**
   * Validate command
   */
  public validate(): void {
    const errors: string[] = [];

    if (!this.invoiceId || this.invoiceId.trim() === '') {
      errors.push('Invoice ID is required');
    }

    if (!this.amount || this.amount <= 0) {
      errors.push('Amount must be greater than 0');
    }

    if (!this.currency || this.currency.trim() === '') {
      errors.push('Currency is required');
    }

    // Validate currency format
    if (this.currency && !this.isValidCurrency(this.currency)) {
      errors.push('Currency must be a valid 3-letter code (e.g., VND, USD)');
    }

    if (!this.paymentMethod) {
      errors.push('Payment method is required');
    }

    if (!this.processedBy || this.processedBy.trim() === '') {
      errors.push('Processed by is required');
    }

    // Validate PayOS data if method is PayOS
    if (this.paymentMethod === 'payos' && !this.payosData) {
      errors.push('PayOS data is required for PayOS payment method');
    }

    if (this.payosData) {
      if (!this.payosData.orderCode) {
        errors.push('PayOS order code is required');
      }
      if (!this.payosData.transactionDateTime) {
        errors.push('PayOS transaction date time is required');
      }
      if (!this.payosData.reference) {
        errors.push('PayOS reference is required');
      }
    }

    // Validate card data if method is card
    if (this.paymentMethod === 'card') {
      if (this.cardLast4 && (this.cardLast4.length !== 4 || !/^\d{4}$/.test(this.cardLast4))) {
        errors.push('Card last 4 digits must be exactly 4 numeric digits');
      }
    }

    // Validate bank transfer data if method is bank_transfer
    if (this.paymentMethod === 'bank_transfer') {
      if (!this.bankName && !this.bankAccountNumber && !this.bankTransferReference) {
        errors.push('At least one bank detail (name, account number, or reference) is required for bank transfer');
      }
    }

    if (errors.length > 0) {
      throw new Error(`ProcessPaymentCommand validation failed:\n${errors.join('\n')}`);
    }
  }

  /**
   * Check if currency is valid
   */
  private isValidCurrency(currency: string): boolean {
    const validCurrencies = ['VND', 'USD', 'EUR', 'GBP', 'JPY', 'CNY', 'KRW', 'THB', 'SGD'];
    return validCurrencies.includes(currency.toUpperCase());
  }

  /**
   * Check if payment is via PayOS
   */
  public isPayOSPayment(): boolean {
    return this.paymentMethod === 'payos' && !!this.payosData;
  }

  /**
   * Check if payment is via card
   */
  public isCardPayment(): boolean {
    return this.paymentMethod === 'card';
  }

  /**
   * Check if payment is via bank transfer
   */
  public isBankTransferPayment(): boolean {
    return this.paymentMethod === 'bank_transfer';
  }

  /**
   * Check if payment is via cash
   */
  public isCashPayment(): boolean {
    return this.paymentMethod === 'cash';
  }

  /**
   * Check if payment is via insurance direct
   */
  public isInsuranceDirectPayment(): boolean {
    return this.paymentMethod === 'insurance_direct';
  }

  /**
   * Get payment method display name
   */
  public getPaymentMethodDisplay(): string {
    const displays: Record<PaymentMethod, string> = {
      'cash': 'Tiền mặt',
      'card': 'Thẻ tín dụng/ghi nợ',
      'bank_transfer': 'Chuyển khoản ngân hàng',
      'payos': 'PayOS',
      'insurance_direct': 'Thanh toán trực tiếp bảo hiểm'
    };

    return displays[this.paymentMethod] || this.paymentMethod;
  }

  /**
   * Get formatted amount in VND
   */
  public getFormattedAmount(): string {
    if (this.currency === 'VND') {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(this.amount);
    }

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.currency
    }).format(this.amount);
  }

  /**
   * Check if payment has transaction ID
   */
  public hasTransactionId(): boolean {
    return !!this.transactionId;
  }

  /**
   * Get masked card number if available
   */
  public getMaskedCardNumber(): string | null {
    if (!this.cardLast4) {
      return null;
    }
    return `**** **** **** ${this.cardLast4}`;
  }

  /**
   * Get PayOS order code if available
   */
  public getPayOSOrderCode(): number | null {
    return this.payosData?.orderCode || null;
  }

  /**
   * Convert to plain object for logging/serialization
   */
  public toObject(): Record<string, any> {
    return {
      invoiceId: this.invoiceId,
      amount: this.amount,
      currency: this.currency,
      paymentMethod: this.paymentMethod,
      paymentMethodDisplay: this.getPaymentMethodDisplay(),
      processedBy: this.processedBy,
      transactionId: this.transactionId,
      notes: this.notes,
      hasPayOSData: !!this.payosData,
      payosOrderCode: this.getPayOSOrderCode(),
      isCardPayment: this.isCardPayment(),
      maskedCardNumber: this.getMaskedCardNumber(),
      isBankTransfer: this.isBankTransferPayment(),
      bankName: this.bankName,
      correlationId: this.correlationId,
      causationId: this.causationId,
      userId: this.userId,
      tenantId: this.tenantId,
      timestamp: this.timestamp
    };
  }

  /**
   * Convert to safe object for logging (without sensitive data)
   */
  public toSafeObject(): Record<string, any> {
    return {
      invoiceId: this.invoiceId,
      amount: this.amount,
      currency: this.currency,
      paymentMethod: this.paymentMethod,
      paymentMethodDisplay: this.getPaymentMethodDisplay(),
      processedBy: this.processedBy,
      hasTransactionId: this.hasTransactionId(),
      hasPayOSData: !!this.payosData,
      isCardPayment: this.isCardPayment(),
      hasMaskedCardNumber: !!this.getMaskedCardNumber(),
      isBankTransfer: this.isBankTransferPayment(),
      hasBankName: !!this.bankName,
      correlationId: this.correlationId,
      timestamp: this.timestamp
    };
  }
}
