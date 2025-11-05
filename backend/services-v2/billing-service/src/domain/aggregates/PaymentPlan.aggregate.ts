/**
 * PaymentPlan - Aggregate Root
 * Payment plan for installment payments
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance DDD, Aggregate Pattern
 */

import { AggregateRoot } from '@shared/domain/AggregateRoot';
import { PaymentPlanId } from '../value-objects/PaymentPlanId';
import { Installment, InstallmentStatus, PaymentMethod } from '../entities/Installment.entity';

export enum PaymentPlanStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  DEFAULTED = 'defaulted',
  CANCELLED = 'cancelled',
  SUSPENDED = 'suspended',
}

export enum PaymentFrequency {
  MONTHLY = 'monthly',
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
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

export class PaymentPlan extends AggregateRoot<PaymentPlanProps> {
  private constructor(props: PaymentPlanProps, id?: string) {
    super(props, id);
  }

  public static create(
    props: Omit<PaymentPlanProps, 'planId' | 'installments' | 'createdAt' | 'updatedAt'>
  ): PaymentPlan {
    const plan = new PaymentPlan({
      ...props,
      planId: PaymentPlanId.create(),
      installments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Generate installments
    plan.generateInstallments();

    return plan;
  }

  public static reconstitute(props: PaymentPlanProps, id: string): PaymentPlan {
    return new PaymentPlan(
      {
        ...props,
        planId: PaymentPlanId.fromString(id),
      },
      id
    );
  }

  public get planId(): PaymentPlanId {
    return this.props.planId;
  }

  public get invoiceId(): string {
    return this.props.invoiceId;
  }

  public get patientId(): string {
    return this.props.patientId;
  }

  public get totalAmount(): number {
    return this.props.totalAmount;
  }

  public get downPayment(): number {
    return this.props.downPayment;
  }

  public get remainingAmount(): number {
    return this.props.remainingAmount;
  }

  public get numberOfInstallments(): number {
    return this.props.numberOfInstallments;
  }

  public get installmentAmount(): number {
    return this.props.installmentAmount;
  }

  public get frequency(): PaymentFrequency {
    return this.props.frequency;
  }

  public get startDate(): Date {
    return this.props.startDate;
  }

  public get endDate(): Date {
    return this.props.endDate;
  }

  public get status(): PaymentPlanStatus {
    return this.props.status;
  }

  public get terms(): string | undefined {
    return this.props.terms;
  }

  public get notes(): string | undefined {
    return this.props.notes;
  }

  public get installments(): Installment[] {
    return this.props.installments;
  }

  public get createdBy(): string {
    return this.props.createdBy;
  }

  public get updatedBy(): string | undefined {
    return this.props.updatedBy;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get updatedAt(): Date {
    return this.props.updatedAt;
  }

  private generateInstallments(): void {
    const installments: Installment[] = [];
    let currentDate = new Date(this.props.startDate);

    for (let i = 1; i <= this.props.numberOfInstallments; i++) {
      const dueDate = this.calculateDueDate(currentDate, i);
      const isLastInstallment = i === this.props.numberOfInstallments;

      // Last installment may have different amount due to rounding
      const amount = isLastInstallment
        ? this.props.remainingAmount - (this.props.installmentAmount * (i - 1))
        : this.props.installmentAmount;

      const installment = Installment.create({
        planId: this.props.planId.value,
        installmentNumber: i,
        dueDate,
        amount,
        paidAmount: 0,
        remainingAmount: amount,
        status: InstallmentStatus.PENDING,
      });

      installments.push(installment);
    }

    this.props.installments = installments;
  }

  private calculateDueDate(startDate: Date, installmentNumber: number): Date {
    const date = new Date(startDate);

    switch (this.props.frequency) {
      case PaymentFrequency.MONTHLY:
        date.setMonth(date.getMonth() + installmentNumber);
        break;
      case PaymentFrequency.WEEKLY:
        date.setDate(date.getDate() + (installmentNumber * 7));
        break;
      case PaymentFrequency.BIWEEKLY:
        date.setDate(date.getDate() + (installmentNumber * 14));
        break;
    }

    return date;
  }

  public recordInstallmentPayment(
    installmentNumber: number,
    amount: number,
    method: PaymentMethod,
    transactionId?: string,
    notes?: string
  ): void {
    const installment = this.props.installments.find(
      (inst) => inst.installmentNumber === installmentNumber
    );

    if (!installment) {
      throw new Error(`Installment ${installmentNumber} not found`);
    }

    installment.recordPayment(amount, method, transactionId, notes);

    // Update plan remaining amount
    this.props.remainingAmount -= amount;

    // Check if plan is completed
    if (this.props.remainingAmount === 0) {
      this.props.status = PaymentPlanStatus.COMPLETED;
    }

    this.props.updatedAt = new Date();
  }

  public updateStatus(status: PaymentPlanStatus, notes?: string, updatedBy?: string): void {
    if (this.props.status === PaymentPlanStatus.COMPLETED) {
      throw new Error('Cannot update completed payment plan');
    }

    if (this.props.status === PaymentPlanStatus.CANCELLED) {
      throw new Error('Cannot update cancelled payment plan');
    }

    this.props.status = status;
    if (notes) {
      this.props.notes = notes;
    }
    this.props.updatedBy = updatedBy;
    this.props.updatedAt = new Date();
  }

  public cancel(reason: string, cancelledBy: string): void {
    if (this.props.status === PaymentPlanStatus.COMPLETED) {
      throw new Error('Cannot cancel completed payment plan');
    }

    this.props.status = PaymentPlanStatus.CANCELLED;
    this.props.notes = reason;
    this.props.updatedBy = cancelledBy;
    this.props.updatedAt = new Date();
  }

  public suspend(reason: string, suspendedBy: string): void {
    if (this.props.status === PaymentPlanStatus.COMPLETED) {
      throw new Error('Cannot suspend completed payment plan');
    }

    if (this.props.status === PaymentPlanStatus.CANCELLED) {
      throw new Error('Cannot suspend cancelled payment plan');
    }

    this.props.status = PaymentPlanStatus.SUSPENDED;
    this.props.notes = reason;
    this.props.updatedBy = suspendedBy;
    this.props.updatedAt = new Date();
  }

  public checkOverdueInstallments(): void {
    this.props.installments.forEach((installment) => {
      installment.markOverdue();
    });

    // Check if plan should be marked as defaulted
    const overdueCount = this.props.installments.filter((inst) => inst.isOverdue()).length;
    if (overdueCount >= 2 && this.props.status === PaymentPlanStatus.ACTIVE) {
      this.props.status = PaymentPlanStatus.DEFAULTED;
      this.props.updatedAt = new Date();
    }
  }

  public getOverdueInstallments(): Installment[] {
    return this.props.installments.filter((inst) => inst.isOverdue());
  }

  public getPaidInstallments(): Installment[] {
    return this.props.installments.filter((inst) => inst.isPaid());
  }

  public getNextDueInstallment(): Installment | undefined {
    return this.props.installments.find(
      (inst) => inst.status === InstallmentStatus.PENDING || inst.status === InstallmentStatus.PARTIAL
    );
  }

  public getPaymentProgress(): number {
    const totalPaid = this.props.totalAmount - this.props.remainingAmount;
    return (totalPaid / this.props.totalAmount) * 100;
  }

  public validate(): void {
    if (this.props.totalAmount <= 0) {
      throw new Error('Total amount must be positive');
    }

    if (this.props.downPayment < 0) {
      throw new Error('Down payment cannot be negative');
    }

    if (this.props.downPayment >= this.props.totalAmount) {
      throw new Error('Down payment must be less than total amount');
    }

    if (this.props.numberOfInstallments <= 0) {
      throw new Error('Number of installments must be positive');
    }

    if (this.props.installmentAmount <= 0) {
      throw new Error('Installment amount must be positive');
    }

    if (this.props.endDate <= this.props.startDate) {
      throw new Error('End date must be after start date');
    }
  }
}

