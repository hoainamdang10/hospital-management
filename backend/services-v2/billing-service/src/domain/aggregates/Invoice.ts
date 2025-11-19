import { HealthcareAggregateRoot } from '@shared/domain/base/aggregate-root';
import { InvoiceId } from '../value-objects/InvoiceId';
import { Money } from '../value-objects/Money';
import { InvoiceStatus } from '../value-objects/InvoiceStatus';
import { Insurance } from '../value-objects/Insurance';
import { InvoiceItem } from '../entities/InvoiceItem';
import { Payment } from '../entities/Payment';
import { InvoiceCreatedEvent } from '../events/InvoiceCreatedEvent';
import { PaymentProcessedEvent } from '../events/PaymentProcessedEvent';
// REMOVED: InvoiceFinalizedEvent, InvoiceCancelledEvent, InsuranceClaimProcessedEvent - Out of scope for Phase 1

export interface InvoiceProps {
  id: InvoiceId;
  patientId: string;
  appointmentId?: string;
  staffId?: string;
  invoiceNumber?: string;
  items: InvoiceItem[];
  subtotal: Money;
  tax: Money;
  totalAmount: Money;
  outstandingAmount: Money;
  status: InvoiceStatus;
  payments: Payment[];
  paidAt?: Date; // Timestamp when invoice was fully paid
  createdAt: Date;
  updatedAt: Date;
  // REMOVED (Phase 1 Prepaid Model): finalizedAt, cancelledAt, cancellationReason, insurance, insuranceCoverage
}

export class Invoice extends HealthcareAggregateRoot<InvoiceProps> {
  private constructor(props: InvoiceProps, id?: string) {
    super(props, id);
  }

  public static create(
    patientId: string,
    items: InvoiceItem[]
  ): Invoice {
    if (items.length === 0) {
      throw new Error('Invoice must have at least one item');
    }

    const invoiceId = InvoiceId.generate();
    const now = new Date();

    // Calculate subtotal
    const subtotal = items.reduce(
      (sum, item) => sum.add(item.totalPrice),
      Money.zero()
    );

    // Calculate tax (10% VAT)
    const tax = subtotal.multiply(0.1);

    // Calculate total and outstanding (no insurance coverage in Phase 1 Prepaid Model)
    const totalAmount = subtotal.add(tax);
    const outstandingAmount = totalAmount;

    // Generate invoice number automatically
    const invoiceNumber = Invoice.generateInvoiceNumber();

    const invoice = new Invoice({
      id: invoiceId,
      patientId,
      invoiceNumber,
      items,
      subtotal,
      tax,
      totalAmount,
      outstandingAmount,
      status: InvoiceStatus.pending(), // Phase 1: Start with PENDING (waiting for payment)
      payments: [],
      paidAt: undefined, // Not paid yet
      createdAt: now,
      updatedAt: now
    });

    invoice.addDomainEvent(
      new InvoiceCreatedEvent(
        invoiceId.value,
        patientId,
        totalAmount.amount,
        totalAmount.currency,
        'draft'
      )
    );

    return invoice;
  }

  // REMOVED (Phase 1 Prepaid Model): finalize(), cancel(), processInsuranceClaim()
  // These are out of scope for MVP. Future implementation for Phase 2+

  public processPayment(payment: Payment): void {
    if (this.props.status.isCancelled()) {
      throw new Error('Cannot process payment for cancelled invoice');
    }
    if (this.props.status.isPaid()) {
      throw new Error('Invoice is already paid');
    }

    payment.complete();
    this.props.payments.push(payment);

    const totalPaid = this.props.payments.reduce(
      (sum, p) => sum.add(p.amount),
      Money.zero()
    );

    // Phase 1 Prepaid Model: No insurance coverage deduction
    this.props.outstandingAmount = this.props.totalAmount.subtract(totalPaid);

    if (this.props.outstandingAmount.amount <= 0) {
      this.props.status = InvoiceStatus.paid();
      this.props.paidAt = new Date(); // Set paid timestamp
    }

    this.props.updatedAt = new Date();

    // Emit PaymentProcessedEvent with appointmentId for prepaid flow
    this.addDomainEvent(
      new PaymentProcessedEvent(
        this.props.id.value,
        payment.id,
        payment.amount.amount,
        payment.amount.currency,
        payment.method,
        this.props.appointmentId // Pass appointmentId to event
      )
    );
  }

  private static generateInvoiceNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `INV-${year}${month}-${random}`;
  }

  // Required by HealthcareAggregateRoot
  get id(): string {
    return this.props.id.value;
  }

  public validateBusinessInvariants(): void {
    if (this.props.items.length === 0) {
      throw new Error('Invoice must have at least one item');
    }
    if (this.props.totalAmount.amount < 0) {
      throw new Error('Total amount cannot be negative');
    }
  }

  public getPatientId(): string {
    return this.props.patientId;
  }

  public setAppointmentId(appointmentId: string): void {
    this.props.appointmentId = appointmentId;
    this.props.updatedAt = new Date();
  }

  public getAppointmentId(): string | undefined {
    return this.props.appointmentId;
  }

  public setStaffId(staffId: string): void {
    this.props.staffId = staffId;
    this.props.updatedAt = new Date();
  }

  public getStaffId(): string | undefined {
    return this.props.staffId;
  }

  public applyEvent(event: any): void {
    // Event sourcing not implemented yet
  }

  public validate(): void {
    this.validateBusinessInvariants();
  }

  public toPersistence(): any {
    return {
      id: this.props.id.value,
      patientId: this.props.patientId,
      appointmentId: this.props.appointmentId,
      staffId: this.props.staffId,
      invoiceNumber: this.props.invoiceNumber,
      items: this.props.items.map(item => item.toPersistence()),
      subtotal: this.props.subtotal.amount,
      tax: this.props.tax.amount,
      totalAmount: this.props.totalAmount.amount,
      outstandingAmount: this.props.outstandingAmount.amount,
      currency: this.props.totalAmount.currency,
      status: this.props.status.value,
      payments: this.props.payments.map(p => p.toPersistence()),
      paidAt: this.props.paidAt,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt
      // REMOVED (Phase 1): insuranceCoverage, insurance, finalizedAt, cancelledAt, cancellationReason
    };
  }

  // Getters
  get invoiceId(): InvoiceId {
    return this.props.id;
  }

  get patientId(): string {
    return this.props.patientId;
  }

  get invoiceNumber(): string | undefined {
    return this.props.invoiceNumber;
  }

  get items(): InvoiceItem[] {
    return this.props.items;
  }

  get subtotal(): Money {
    return this.props.subtotal;
  }

  get tax(): Money {
    return this.props.tax;
  }

  get totalAmount(): Money {
    return this.props.totalAmount;
  }

  get outstandingAmount(): Money {
    return this.props.outstandingAmount;
  }

  get status(): InvoiceStatus {
    return this.props.status;
  }

  get payments(): Payment[] {
    return this.props.payments;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get paidAt(): Date | undefined {
    return this.props.paidAt;
  }
}
