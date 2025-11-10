import { HealthcareAggregateRoot } from '@shared/domain/base/aggregate-root';
import { InvoiceId } from '../value-objects/InvoiceId';
import { Money } from '../value-objects/Money';
import { InvoiceStatus } from '../value-objects/InvoiceStatus';
import { Insurance } from '../value-objects/Insurance';
import { InvoiceItem } from '../entities/InvoiceItem';
import { Payment } from '../entities/Payment';
import { InvoiceCreatedEvent } from '../events/InvoiceCreatedEvent';
import { InvoiceFinalizedEvent } from '../events/InvoiceFinalizedEvent';
import { InvoiceCancelledEvent } from '../events/InvoiceCancelledEvent';
import { PaymentProcessedEvent } from '../events/PaymentProcessedEvent';
import { InsuranceClaimProcessedEvent } from '../events/InsuranceClaimProcessedEvent';

export interface InvoiceProps {
  id: InvoiceId;
  patientId: string;
  invoiceNumber?: string;
  items: InvoiceItem[];
  subtotal: Money;
  tax: Money;
  insuranceCoverage: Money;
  totalAmount: Money;
  outstandingAmount: Money;
  status: InvoiceStatus;
  insurance?: Insurance;
  payments: Payment[];
  createdAt: Date;
  updatedAt: Date;
  finalizedAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
}

export class Invoice extends HealthcareAggregateRoot<InvoiceProps> {
  private constructor(props: InvoiceProps, id?: string) {
    super(props, id);
  }

  public static create(
    patientId: string,
    items: InvoiceItem[],
    insurance?: Insurance
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

    // Calculate insurance coverage
    let insuranceCoverage = Money.zero();
    if (insurance) {
      const totalBeforeInsurance = subtotal.add(tax);
      insuranceCoverage = totalBeforeInsurance.multiply(insurance.coveragePercentage / 100);
    }

    // Calculate total and outstanding
    const totalAmount = subtotal.add(tax);
    const outstandingAmount = totalAmount.subtract(insuranceCoverage);

    const invoice = new Invoice({
      id: invoiceId,
      patientId,
      items,
      subtotal,
      tax,
      insuranceCoverage,
      totalAmount,
      outstandingAmount,
      status: InvoiceStatus.draft(),
      insurance,
      payments: [],
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

  public finalize(): void {
    if (!this.props.status.isDraft()) {
      throw new Error('Can only finalize draft invoices');
    }

    const invoiceNumber = this.generateInvoiceNumber();
    this.props.invoiceNumber = invoiceNumber;
    this.props.status = InvoiceStatus.pending();
    this.props.finalizedAt = new Date();
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new InvoiceFinalizedEvent(
        this.props.id.value,
        invoiceNumber
      )
    );
  }

  public cancel(reason: string): void {
    if (this.props.status.isCancelled()) {
      throw new Error('Invoice is already cancelled');
    }
    if (this.props.status.isPaid()) {
      throw new Error('Cannot cancel paid invoice');
    }

    this.props.status = InvoiceStatus.cancelled();
    this.props.cancelledAt = new Date();
    this.props.cancellationReason = reason;
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new InvoiceCancelledEvent(
        this.props.id.value,
        reason
      )
    );
  }

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

    this.props.outstandingAmount = this.props.totalAmount.subtract(this.props.insuranceCoverage).subtract(totalPaid);

    if (this.props.outstandingAmount.amount <= 0) {
      this.props.status = InvoiceStatus.paid();
    } else if (totalPaid.amount > 0) {
      this.props.status = InvoiceStatus.partiallyPaid();
    }

    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new PaymentProcessedEvent(
        this.props.id.value,
        payment.id,
        payment.amount.amount,
        payment.amount.currency,
        payment.method
      )
    );
  }

  public processInsuranceClaim(): void {
    if (!this.props.insurance) {
      throw new Error('No insurance information available');
    }

    const approved = this.props.insurance.provider === 'BHYT' || this.props.insurance.provider === 'BHTN';

    this.addDomainEvent(
      new InsuranceClaimProcessedEvent(
        this.props.id.value,
        this.props.insuranceCoverage.amount,
        this.props.insuranceCoverage.currency,
        approved
      )
    );
  }

  private generateInvoiceNumber(): string {
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
      invoiceNumber: this.props.invoiceNumber,
      items: this.props.items.map(item => item.toPersistence()),
      subtotal: this.props.subtotal.amount,
      tax: this.props.tax.amount,
      insuranceCoverage: this.props.insuranceCoverage.amount,
      totalAmount: this.props.totalAmount.amount,
      outstandingAmount: this.props.outstandingAmount.amount,
      currency: this.props.totalAmount.currency,
      status: this.props.status.value,
      insurance: this.props.insurance ? {
        provider: this.props.insurance.provider,
        policyNumber: this.props.insurance.policyNumber,
        coveragePercentage: this.props.insurance.coveragePercentage
      } : null,
      payments: this.props.payments.map(p => p.toPersistence()),
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
      finalizedAt: this.props.finalizedAt,
      cancelledAt: this.props.cancelledAt,
      cancellationReason: this.props.cancellationReason
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

  get insuranceCoverage(): Money {
    return this.props.insuranceCoverage;
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

  get insurance(): Insurance | undefined {
    return this.props.insurance;
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
}
