/**
 * Installment - Entity
 * Individual installment in a payment plan
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance DDD, Entity Pattern
 */
import { InstallmentId } from '../value-objects/InstallmentId';
export declare enum InstallmentStatus {
    PENDING = "pending",
    PAID = "paid",
    OVERDUE = "overdue",
    PARTIAL = "partial",
    WAIVED = "waived"
}
export declare enum PaymentMethod {
    CASH = "cash",
    BANK_TRANSFER = "bank_transfer",
    VNPAY = "vnpay",
    MOMO = "momo",
    ZALOPAY = "zalopay",
    CREDIT_CARD = "credit_card"
}
export interface InstallmentProps {
    installmentId: InstallmentId;
    planId: string;
    installmentNumber: number;
    dueDate: Date;
    amount: number;
    paidAmount: number;
    remainingAmount: number;
    status: InstallmentStatus;
    paymentMethod?: PaymentMethod;
    paymentDate?: Date;
    transactionId?: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare class Installment {
    private readonly props;
    private constructor();
    static create(props: Omit<InstallmentProps, 'installmentId' | 'createdAt' | 'updatedAt'>): Installment;
    static reconstitute(props: InstallmentProps, id: string): Installment;
    get installmentId(): InstallmentId;
    get planId(): string;
    get installmentNumber(): number;
    get dueDate(): Date;
    get amount(): number;
    get paidAmount(): number;
    get remainingAmount(): number;
    get status(): InstallmentStatus;
    get paymentMethod(): PaymentMethod | undefined;
    get paymentDate(): Date | undefined;
    get transactionId(): string | undefined;
    get notes(): string | undefined;
    recordPayment(amount: number, method: PaymentMethod, transactionId?: string, notes?: string): void;
    markOverdue(): void;
    waive(notes?: string): void;
    isOverdue(): boolean;
    isPaid(): boolean;
}
//# sourceMappingURL=Installment.entity.d.ts.map