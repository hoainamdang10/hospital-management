/**
 * Billing Service Domain Events
 * Shared event definitions for cross-service communication
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */

import { DomainEvent } from './DomainEvent';

/**
 * PaymentProcessed Event
 * Published when a payment is successfully processed
 */
export class PaymentProcessedEvent extends DomainEvent<{
  paymentId: string;
  invoiceId: string;
  staffId: string;
  patientId: string;
  amount: number;
  consultationFee: number;
  paymentMethod: string;
  processedAt: Date;
}> {
  constructor(
    paymentId: string,
    invoiceId: string,
    staffId: string,
    patientId: string,
    amount: number,
    consultationFee: number,
    paymentMethod: string,
    timestamp: Date = new Date()
  ) {
    super(
      'billing.payment.processed',
      {
        paymentId,
        invoiceId,
        staffId,
        patientId,
        amount,
        consultationFee,
        paymentMethod,
        processedAt: timestamp
      },
      timestamp
    );
  }

  get paymentId(): string {
    return this.data.paymentId;
  }

  get staffId(): string {
    return this.data.staffId;
  }

  get amount(): number {
    return this.data.amount;
  }

  get consultationFee(): number {
    return this.data.consultationFee;
  }
}

/**
 * InvoiceGenerated Event
 * Published when an invoice is generated for a consultation
 */
export class InvoiceGeneratedEvent extends DomainEvent<{
  invoiceId: string;
  staffId: string;
  patientId: string;
  appointmentId?: string;
  totalAmount: number;
  consultationFee: number;
  additionalCharges: number;
  generatedAt: Date;
}> {
  constructor(
    invoiceId: string,
    staffId: string,
    patientId: string,
    totalAmount: number,
    consultationFee: number,
    additionalCharges: number,
    appointmentId?: string,
    timestamp: Date = new Date()
  ) {
    super(
      'billing.invoice.generated',
      {
        invoiceId,
        staffId,
        patientId,
        appointmentId,
        totalAmount,
        consultationFee,
        additionalCharges,
        generatedAt: timestamp
      },
      timestamp
    );
  }

  get invoiceId(): string {
    return this.data.invoiceId;
  }

  get staffId(): string {
    return this.data.staffId;
  }

  get totalAmount(): number {
    return this.data.totalAmount;
  }

  get consultationFee(): number {
    return this.data.consultationFee;
  }
}

/**
 * ConsultationFeeUpdated Event
 * Published when a staff member's consultation fee is updated
 */
export class ConsultationFeeUpdatedEvent extends DomainEvent<{
  staffId: string;
  oldFee: number;
  newFee: number;
  updatedBy: string;
  reason?: string;
  effectiveDate: Date;
  updatedAt: Date;
}> {
  constructor(
    staffId: string,
    oldFee: number,
    newFee: number,
    updatedBy: string,
    effectiveDate: Date,
    reason?: string,
    timestamp: Date = new Date()
  ) {
    super(
      'billing.consultation_fee.updated',
      {
        staffId,
        oldFee,
        newFee,
        updatedBy,
        reason,
        effectiveDate,
        updatedAt: timestamp
      },
      timestamp
    );
  }

  get staffId(): string {
    return this.data.staffId;
  }

  get oldFee(): number {
    return this.data.oldFee;
  }

  get newFee(): number {
    return this.data.newFee;
  }

  get effectiveDate(): Date {
    return this.data.effectiveDate;
  }
}

/**
 * PaymentRefundRequested Event
 * Published when a refund is requested and needs gateway processing
 */
export class PaymentRefundRequestedEvent extends DomainEvent<{
  refundId: string;
  originalPaymentId: string;
  invoiceId: string;
  staffId: string;
  patientId: string;
  appointmentId?: string;
  refundAmount: number;
  currency: string;
  reason: string;
  refundedBy: string;
  originalPaymentMethod: string;
  originalTransactionId?: string;
  vnpayTxnRef?: string; // VNPAY transaction reference (required for refund)
  vnpayTransactionNo?: string; // VNPAY transaction number (required for refund)
  vnpayPayDate?: string; // VNPAY payment date (required for refund)
}> {
  constructor(
    refundId: string,
    originalPaymentId: string,
    invoiceId: string,
    staffId: string,
    patientId: string,
    refundAmount: number,
    currency: string,
    reason: string,
    refundedBy: string,
    originalPaymentMethod: string,
    originalTransactionId?: string,
    appointmentId?: string,
    vnpayTxnRef?: string,
    vnpayTransactionNo?: string,
    vnpayPayDate?: string,
    timestamp: Date = new Date()
  ) {
    super(
      'billing.payment.refund_requested',
      {
        refundId,
        originalPaymentId,
        invoiceId,
        staffId,
        patientId,
        appointmentId,
        refundAmount,
        currency,
        reason,
        refundedBy,
        originalPaymentMethod,
        originalTransactionId,
        vnpayTxnRef,
        vnpayTransactionNo,
        vnpayPayDate
      },
      timestamp
    );
  }

  get refundId(): string {
    return this.data.refundId;
  }

  get refundAmount(): number {
    return this.data.refundAmount;
  }

  get currency(): string {
    return this.data.currency;
  }
}

/**
 * PaymentRefunded Event
 * Published when a payment refund is completed (gateway confirmed)
 */
export class PaymentRefundedEvent extends DomainEvent<{
  refundId: string;
  originalPaymentId: string;
  invoiceId: string;
  staffId: string;
  patientId: string;
  appointmentId?: string;
  refundAmount: number;
  currency: string;
  reason: string;
  refundedBy: string;
  gatewayRefundId?: string;
  refundedAt: Date;
}> {
  constructor(
    refundId: string,
    originalPaymentId: string,
    invoiceId: string,
    staffId: string,
    patientId: string,
    refundAmount: number,
    currency: string,
    reason: string,
    refundedBy: string,
    timestamp: Date = new Date(),
    appointmentId?: string,
    gatewayRefundId?: string
  ) {
    super(
      'billing.payment.refunded',
      {
        refundId,
        originalPaymentId,
        invoiceId,
        staffId,
        patientId,
        appointmentId,
        refundAmount,
        currency,
        reason,
        refundedBy,
        gatewayRefundId,
        refundedAt: timestamp
      },
      timestamp
    );
  }

  get refundId(): string {
    return this.data.refundId;
  }

  get staffId(): string {
    return this.data.staffId;
  }

  get refundAmount(): number {
    return this.data.refundAmount;
  }

  get currency(): string {
    return this.data.currency;
  }

  get appointmentId(): string | undefined {
    return this.data.appointmentId;
  }

  get gatewayRefundId(): string | undefined {
    return this.data.gatewayRefundId;
  }
}
