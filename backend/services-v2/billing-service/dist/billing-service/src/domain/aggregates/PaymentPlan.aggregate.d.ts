/**
 * PaymentPlan - Aggregate Root
 * Payment plan for installment payments
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance DDD, Aggregate Pattern
 */
import { AggregateRoot } from '../../../../shared/domain/AggregateRoot';
import { PaymentPlanId } from '../value-objects/PaymentPlanId';
import { Installment, PaymentMethod } from '../entities/Installment.entity';
export declare enum PaymentPlanStatus {
    ACTIVE = "active",
    COMPLETED = "completed",
    DEFAULTED = "defaulted",
    CANCELLED = "cancelled",
    SUSPENDED = "suspended"
}
export declare enum PaymentFrequency {
    MONTHLY = "monthly",
    WEEKLY = "weekly",
    BIWEEKLY = "biweekly"
}
export interface PaymentPlanProps {
    planId: PaymentPlanId;
    invoiceId: string;
    patientId: string;
    totalAmount: number;
    downPayment: number;
    remainingAmount: number;
    numberOfInstallments: number;
    installmentAmount: number;
    frequency: PaymentFrequency;
    startDate: Date;
    endDate: Date;
    status: PaymentPlanStatus;
    terms?: string;
    notes?: string;
    installments: Installment[];
    createdBy: string;
    createdAt: Date;
    updatedBy?: string;
    updatedAt: Date;
}
export declare class PaymentPlan extends AggregateRoot<PaymentPlanProps> {
    private constructor();
    static create(props: Omit<PaymentPlanProps, 'planId' | 'installments' | 'createdAt' | 'updatedAt'>): PaymentPlan;
    static reconstitute(props: PaymentPlanProps, id: string): PaymentPlan;
    get planId(): PaymentPlanId;
    get invoiceId(): string;
    get patientId(): string;
    get totalAmount(): number;
    get downPayment(): number;
    get remainingAmount(): number;
    get numberOfInstallments(): number;
    get installmentAmount(): number;
    get frequency(): PaymentFrequency;
    get startDate(): Date;
    get endDate(): Date;
    get status(): PaymentPlanStatus;
    get terms(): string | undefined;
    get notes(): string | undefined;
    get installments(): Installment[];
    get createdBy(): string;
    get updatedBy(): string | undefined;
    get createdAt(): Date;
    get updatedAt(): Date;
    private generateInstallments;
    private calculateDueDate;
    recordInstallmentPayment(installmentNumber: number, amount: number, method: PaymentMethod, transactionId?: string, notes?: string): void;
    updateStatus(status: PaymentPlanStatus, notes?: string, updatedBy?: string): void;
    cancel(reason: string, cancelledBy: string): void;
    suspend(reason: string, suspendedBy: string): void;
    checkOverdueInstallments(): void;
    getOverdueInstallments(): Installment[];
    getPaidInstallments(): Installment[];
    getNextDueInstallment(): Installment | undefined;
    getPaymentProgress(): number;
    validate(): void;
}
//# sourceMappingURL=PaymentPlan.aggregate.d.ts.map