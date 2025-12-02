import { Entity } from "../../../../shared/domain/base/entity";
import { Money } from "../value-objects/Money";
export type PaymentMethod = "cash" | "card" | "bank_transfer" | "payos" | "insurance" | "refund" | "wallet";
export type PaymentStatus = "pending" | "completed" | "failed" | "refunded" | "refund_pending";
export interface VnpayTransactionData {
    vnpTxnRef: string;
    vnpTransactionNo: string;
    vnpPayDate: string;
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
    gatewayRefundId?: string;
    vnpayData?: VnpayTransactionData;
}
export declare class Payment extends Entity<PaymentProps> {
    private constructor();
    static create(amount: Money, method: PaymentMethod, transactionId?: string, id?: string, vnpayData?: VnpayTransactionData, status?: PaymentStatus, paidAt?: Date, refundedAt?: Date, refundReason?: string, refundedBy?: string, gatewayRefundId?: string): Payment;
    /**
     * Create a refund payment record
     * This represents money being returned to the patient
     * Amount will be stored as negative value to represent outflow
     */
    static createRefund(amount: Money, originalPaymentMethod: PaymentMethod, transactionId: string, reason: string, refundedBy: string, id?: string, status?: PaymentStatus, refundedAt?: Date, gatewayRefundId?: string): Payment;
    get amount(): Money;
    get method(): PaymentMethod;
    get status(): PaymentStatus;
    get transactionId(): string | undefined;
    get paidAt(): Date | undefined;
    get vnpayData(): VnpayTransactionData | undefined;
    get refundReason(): string | undefined;
    get refundedBy(): string | undefined;
    get gatewayRefundId(): string | undefined;
    get refundedAt(): Date | undefined;
    complete(): void;
    fail(): void;
    refund(): void;
    validate(): void;
    /**
     * Mark refund as completed (when gateway confirms)
     */
    completeRefund(gatewayRefundId?: string): void;
    toPersistence(): any;
}
//# sourceMappingURL=Payment.d.ts.map