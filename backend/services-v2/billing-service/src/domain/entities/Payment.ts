import { Entity } from "@shared/domain/base/entity";
import { Money } from "../value-objects/Money";

export type PaymentMethod =
  | "cash"
  | "card"
  | "bank_transfer"
  | "payos"
  | "insurance"
  | "refund";
export type PaymentStatus =
  | "pending"
  | "completed"
  | "failed"
  | "refunded"
  | "refund_pending";

export interface VnpayTransactionData {
  vnpTxnRef: string; // VNPAY transaction reference (required for refund)
  vnpTransactionNo: string; // VNPAY transaction number (required for refund)
  vnpPayDate: string; // VNPAY payment date in yyyyMMddHHmmss format (required for refund)
}

export interface PaymentProps {
  id: string;
  amount: Money;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  paidAt?: Date;
  refundedAt?: Date;
  refundReason?: string;
  refundedBy?: string;
  gatewayRefundId?: string; // For tracking refund in payment gateway (PayOS/VNPAY)
  vnpayData?: VnpayTransactionData; // VNPAY-specific transaction data for refunds
}

export class Payment extends Entity<PaymentProps> {
  private constructor(props: PaymentProps, id?: string) {
    super(props, id);
  }

  public static create(
    amount: Money,
    method: PaymentMethod,
    transactionId?: string,
    id?: string,
    vnpayData?: VnpayTransactionData,
    status?: PaymentStatus,
    paidAt?: Date,
    refundedAt?: Date,
    refundReason?: string,
    refundedBy?: string,
    gatewayRefundId?: string,
  ): Payment {
    const computedStatus =
      status || (method === "refund" ? "refund_pending" : "pending");

    return new Payment(
      {
        id: id || "",
        amount,
        method,
        status: computedStatus,
        transactionId,
        paidAt,
        refundedAt,
        refundReason,
        refundedBy,
        gatewayRefundId,
        vnpayData,
      },
      id,
    );
  }

  /**
   * Create a refund payment record
   * This represents money being returned to the patient
   * Amount will be stored as negative value to represent outflow
   */
  public static createRefund(
    amount: Money,
    originalPaymentMethod: PaymentMethod,
    transactionId: string,
    reason: string,
    refundedBy: string,
    id?: string,
    status?: PaymentStatus,
    refundedAt?: Date,
    gatewayRefundId?: string,
  ): Payment {
    const computedStatus = status || "refund_pending";

    return new Payment(
      {
        id: id || "",
        amount: Money.createSigned(-Math.abs(amount.amount), amount.currency), // Negative amount for refund
        method: "refund",
        status: computedStatus, // Will be updated when gateway confirms
        transactionId,
        paidAt: undefined,
        refundedAt: refundedAt,
        refundReason: reason,
        refundedBy: refundedBy,
        gatewayRefundId: gatewayRefundId, // Will be set when gateway processes refund
      },
      id,
    );
  }

  get amount(): Money {
    return this.props.amount;
  }

  get method(): PaymentMethod {
    return this.props.method;
  }

  get status(): PaymentStatus {
    return this.props.status;
  }

  get transactionId(): string | undefined {
    return this.props.transactionId;
  }

  get paidAt(): Date | undefined {
    return this.props.paidAt;
  }

  get vnpayData(): VnpayTransactionData | undefined {
    return this.props.vnpayData;
  }

  get refundReason(): string | undefined {
    return this.props.refundReason;
  }

  get refundedBy(): string | undefined {
    return this.props.refundedBy;
  }

  get gatewayRefundId(): string | undefined {
    return this.props.gatewayRefundId;
  }

  get refundedAt(): Date | undefined {
    return this.props.refundedAt;
  }

  public complete(): void {
    if (this.props.status !== "pending") {
      throw new Error("Can only complete pending payments");
    }
    this.props.status = "completed";
    this.props.paidAt = new Date();
  }

  public fail(): void {
    if (this.props.status !== "pending") {
      throw new Error("Can only fail pending payments");
    }
    this.props.status = "failed";
  }

  public refund(): void {
    if (this.props.status !== "completed") {
      throw new Error("Can only refund completed payments");
    }
    this.props.status = "refunded";
    this.props.refundedAt = new Date();
  }

  public validate(): void {
    // Allow negative amounts for refund payments
    if (this.props.method !== "refund" && this.props.amount.amount <= 0) {
      throw new Error("Payment amount must be greater than 0");
    }
    if (this.props.method === "refund" && this.props.amount.amount >= 0) {
      throw new Error("Refund payment amount must be negative");
    }
  }

  /**
   * Mark refund as completed (when gateway confirms)
   */
  public completeRefund(gatewayRefundId?: string): void {
    if (this.props.method !== "refund") {
      throw new Error("Can only complete refund for refund payments");
    }
    if (this.props.status !== "refund_pending") {
      throw new Error("Can only complete pending refunds");
    }
    this.props.status = "completed";
    this.props.refundedAt = new Date();
    if (gatewayRefundId) {
      this.props.gatewayRefundId = gatewayRefundId;
    }
  }

  public toPersistence(): any {
    return {
      id: this.id,
      amount: this.props.amount.amount,
      currency: this.props.amount.currency,
      method: this.props.method,
      status: this.props.status,
      transactionId: this.props.transactionId,
      paidAt: this.props.paidAt,
      refundedAt: this.props.refundedAt,
      refundReason: this.props.refundReason,
      refundedBy: this.props.refundedBy,
      gatewayRefundId: this.props.gatewayRefundId,
      vnpayData: this.props.vnpayData,
    };
  }
}
