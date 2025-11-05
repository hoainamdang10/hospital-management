/**
 * Installment - Entity
 * Individual installment in a payment plan
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance DDD, Entity Pattern
 */

import { InstallmentId } from '../value-objects/InstallmentId';

export enum InstallmentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
  PARTIAL = 'partial',
  WAIVED = 'waived',
}

export enum PaymentMethod {
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  VNPAY = 'vnpay',
  MOMO = 'momo',
  ZALOPAY = 'zalopay',
  CREDIT_CARD = 'credit_card',
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

export class Installment {
  private constructor(private readonly props: InstallmentProps) {}

  public static create(props: Omit<InstallmentProps, 'installmentId' | 'createdAt' | 'updatedAt'>): Installment {
    return new Installment({
      ...props,
      installmentId: InstallmentId.create(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  public static reconstitute(props: InstallmentProps, id: string): Installment {
    return new Installment({
      ...props,
      installmentId: InstallmentId.fromString(id),
    });
  }

  public get installmentId(): InstallmentId {
    return this.props.installmentId;
  }

  public get planId(): string {
    return this.props.planId;
  }

  public get installmentNumber(): number {
    return this.props.installmentNumber;
  }

  public get dueDate(): Date {
    return this.props.dueDate;
  }

  public get amount(): number {
    return this.props.amount;
  }

  public get paidAmount(): number {
    return this.props.paidAmount;
  }

  public get remainingAmount(): number {
    return this.props.remainingAmount;
  }

  public get status(): InstallmentStatus {
    return this.props.status;
  }

  public get paymentMethod(): PaymentMethod | undefined {
    return this.props.paymentMethod;
  }

  public get paymentDate(): Date | undefined {
    return this.props.paymentDate;
  }

  public get transactionId(): string | undefined {
    return this.props.transactionId;
  }

  public get notes(): string | undefined {
    return this.props.notes;
  }

  public recordPayment(amount: number, method: PaymentMethod, transactionId?: string, notes?: string): void {
    if (amount <= 0) {
      throw new Error('Payment amount must be positive');
    }

    if (amount > this.props.remainingAmount) {
      throw new Error('Payment amount exceeds remaining amount');
    }

    this.props.paidAmount += amount;
    this.props.remainingAmount -= amount;
    this.props.paymentMethod = method;
    this.props.paymentDate = new Date();
    this.props.transactionId = transactionId;
    this.props.notes = notes;

    if (this.props.remainingAmount === 0) {
      this.props.status = InstallmentStatus.PAID;
    } else if (this.props.paidAmount > 0) {
      this.props.status = InstallmentStatus.PARTIAL;
    }

    this.props.updatedAt = new Date();
  }

  public markOverdue(): void {
    if (this.props.status === InstallmentStatus.PENDING && new Date() > this.props.dueDate) {
      this.props.status = InstallmentStatus.OVERDUE;
      this.props.updatedAt = new Date();
    }
  }

  public waive(notes?: string): void {
    this.props.status = InstallmentStatus.WAIVED;
    this.props.remainingAmount = 0;
    this.props.notes = notes;
    this.props.updatedAt = new Date();
  }

  public isOverdue(): boolean {
    return this.props.status === InstallmentStatus.OVERDUE || 
           (this.props.status === InstallmentStatus.PENDING && new Date() > this.props.dueDate);
  }

  public isPaid(): boolean {
    return this.props.status === InstallmentStatus.PAID;
  }
}

