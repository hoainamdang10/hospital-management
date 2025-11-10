"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Invoice = void 0;
const aggregate_root_1 = require("../../../../shared/domain/base/aggregate-root");
const InvoiceId_1 = require("../value-objects/InvoiceId");
const Money_1 = require("../value-objects/Money");
const InvoiceStatus_1 = require("../value-objects/InvoiceStatus");
const InvoiceCreatedEvent_1 = require("../events/InvoiceCreatedEvent");
const InvoiceFinalizedEvent_1 = require("../events/InvoiceFinalizedEvent");
const InvoiceCancelledEvent_1 = require("../events/InvoiceCancelledEvent");
const PaymentProcessedEvent_1 = require("../events/PaymentProcessedEvent");
const InsuranceClaimProcessedEvent_1 = require("../events/InsuranceClaimProcessedEvent");
class Invoice extends aggregate_root_1.HealthcareAggregateRoot {
    constructor(props, id) {
        super(props, id);
    }
    static create(patientId, items, insurance) {
        if (items.length === 0) {
            throw new Error('Invoice must have at least one item');
        }
        const invoiceId = InvoiceId_1.InvoiceId.generate();
        const now = new Date();
        // Calculate subtotal
        const subtotal = items.reduce((sum, item) => sum.add(item.totalPrice), Money_1.Money.zero());
        // Calculate tax (10% VAT)
        const tax = subtotal.multiply(0.1);
        // Calculate insurance coverage
        let insuranceCoverage = Money_1.Money.zero();
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
            status: InvoiceStatus_1.InvoiceStatus.draft(),
            insurance,
            payments: [],
            createdAt: now,
            updatedAt: now
        });
        invoice.addDomainEvent(new InvoiceCreatedEvent_1.InvoiceCreatedEvent(invoiceId.value, patientId, totalAmount.amount, totalAmount.currency, 'draft'));
        return invoice;
    }
    finalize() {
        if (!this.props.status.isDraft()) {
            throw new Error('Can only finalize draft invoices');
        }
        const invoiceNumber = this.generateInvoiceNumber();
        this.props.invoiceNumber = invoiceNumber;
        this.props.status = InvoiceStatus_1.InvoiceStatus.pending();
        this.props.finalizedAt = new Date();
        this.props.updatedAt = new Date();
        this.addDomainEvent(new InvoiceFinalizedEvent_1.InvoiceFinalizedEvent(this.props.id.value, invoiceNumber));
    }
    cancel(reason) {
        if (this.props.status.isCancelled()) {
            throw new Error('Invoice is already cancelled');
        }
        if (this.props.status.isPaid()) {
            throw new Error('Cannot cancel paid invoice');
        }
        this.props.status = InvoiceStatus_1.InvoiceStatus.cancelled();
        this.props.cancelledAt = new Date();
        this.props.cancellationReason = reason;
        this.props.updatedAt = new Date();
        this.addDomainEvent(new InvoiceCancelledEvent_1.InvoiceCancelledEvent(this.props.id.value, reason));
    }
    processPayment(payment) {
        if (this.props.status.isCancelled()) {
            throw new Error('Cannot process payment for cancelled invoice');
        }
        if (this.props.status.isPaid()) {
            throw new Error('Invoice is already paid');
        }
        payment.complete();
        this.props.payments.push(payment);
        const totalPaid = this.props.payments.reduce((sum, p) => sum.add(p.amount), Money_1.Money.zero());
        this.props.outstandingAmount = this.props.totalAmount.subtract(this.props.insuranceCoverage).subtract(totalPaid);
        if (this.props.outstandingAmount.amount <= 0) {
            this.props.status = InvoiceStatus_1.InvoiceStatus.paid();
        }
        else if (totalPaid.amount > 0) {
            this.props.status = InvoiceStatus_1.InvoiceStatus.partiallyPaid();
        }
        this.props.updatedAt = new Date();
        this.addDomainEvent(new PaymentProcessedEvent_1.PaymentProcessedEvent(this.props.id.value, payment.id, payment.amount.amount, payment.amount.currency, payment.method));
    }
    processInsuranceClaim() {
        if (!this.props.insurance) {
            throw new Error('No insurance information available');
        }
        const approved = this.props.insurance.provider === 'BHYT' || this.props.insurance.provider === 'BHTN';
        this.addDomainEvent(new InsuranceClaimProcessedEvent_1.InsuranceClaimProcessedEvent(this.props.id.value, this.props.insuranceCoverage.amount, this.props.insuranceCoverage.currency, approved));
    }
    generateInvoiceNumber() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `INV-${year}${month}-${random}`;
    }
    // Required by HealthcareAggregateRoot
    get id() {
        return this.props.id.value;
    }
    validateBusinessInvariants() {
        if (this.props.items.length === 0) {
            throw new Error('Invoice must have at least one item');
        }
        if (this.props.totalAmount.amount < 0) {
            throw new Error('Total amount cannot be negative');
        }
    }
    getPatientId() {
        return this.props.patientId;
    }
    applyEvent(event) {
        // Event sourcing not implemented yet
    }
    validate() {
        this.validateBusinessInvariants();
    }
    toPersistence() {
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
    get invoiceId() {
        return this.props.id;
    }
    get patientId() {
        return this.props.patientId;
    }
    get invoiceNumber() {
        return this.props.invoiceNumber;
    }
    get items() {
        return this.props.items;
    }
    get subtotal() {
        return this.props.subtotal;
    }
    get tax() {
        return this.props.tax;
    }
    get insuranceCoverage() {
        return this.props.insuranceCoverage;
    }
    get totalAmount() {
        return this.props.totalAmount;
    }
    get outstandingAmount() {
        return this.props.outstandingAmount;
    }
    get status() {
        return this.props.status;
    }
    get insurance() {
        return this.props.insurance;
    }
    get payments() {
        return this.props.payments;
    }
    get createdAt() {
        return this.props.createdAt;
    }
    get updatedAt() {
        return this.props.updatedAt;
    }
}
exports.Invoice = Invoice;
//# sourceMappingURL=Invoice.js.map