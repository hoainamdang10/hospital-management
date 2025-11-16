"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Invoice = void 0;
const aggregate_root_1 = require("../../../../shared/domain/base/aggregate-root");
const InvoiceId_1 = require("../value-objects/InvoiceId");
const Money_1 = require("../value-objects/Money");
const InvoiceStatus_1 = require("../value-objects/InvoiceStatus");
const InvoiceCreatedEvent_1 = require("../events/InvoiceCreatedEvent");
const PaymentProcessedEvent_1 = require("../events/PaymentProcessedEvent");
class Invoice extends aggregate_root_1.HealthcareAggregateRoot {
    constructor(props, id) {
        super(props, id);
    }
    static create(patientId, items) {
        if (items.length === 0) {
            throw new Error('Invoice must have at least one item');
        }
        const invoiceId = InvoiceId_1.InvoiceId.generate();
        const now = new Date();
        // Calculate subtotal
        const subtotal = items.reduce((sum, item) => sum.add(item.totalPrice), Money_1.Money.zero());
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
            status: InvoiceStatus_1.InvoiceStatus.pending(), // Phase 1: Start with PENDING (waiting for payment)
            payments: [],
            createdAt: now,
            updatedAt: now
        });
        invoice.addDomainEvent(new InvoiceCreatedEvent_1.InvoiceCreatedEvent(invoiceId.value, patientId, totalAmount.amount, totalAmount.currency, 'draft'));
        return invoice;
    }
    // REMOVED (Phase 1 Prepaid Model): finalize(), cancel(), processInsuranceClaim()
    // These are out of scope for MVP. Future implementation for Phase 2+
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
        // Phase 1 Prepaid Model: No insurance coverage deduction
        this.props.outstandingAmount = this.props.totalAmount.subtract(totalPaid);
        if (this.props.outstandingAmount.amount <= 0) {
            this.props.status = InvoiceStatus_1.InvoiceStatus.paid();
        }
        this.props.updatedAt = new Date();
        // Emit PaymentProcessedEvent with appointmentId for prepaid flow
        this.addDomainEvent(new PaymentProcessedEvent_1.PaymentProcessedEvent(this.props.id.value, payment.id, payment.amount.amount, payment.amount.currency, payment.method, this.props.appointmentId // Pass appointmentId to event
        ));
    }
    static generateInvoiceNumber() {
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
    setAppointmentId(appointmentId) {
        this.props.appointmentId = appointmentId;
        this.props.updatedAt = new Date();
    }
    getAppointmentId() {
        return this.props.appointmentId;
    }
    setStaffId(staffId) {
        this.props.staffId = staffId;
        this.props.updatedAt = new Date();
    }
    getStaffId() {
        return this.props.staffId;
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
            createdAt: this.props.createdAt,
            updatedAt: this.props.updatedAt
            // REMOVED (Phase 1): insuranceCoverage, insurance, finalizedAt, cancelledAt, cancellationReason
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
    get totalAmount() {
        return this.props.totalAmount;
    }
    get outstandingAmount() {
        return this.props.outstandingAmount;
    }
    get status() {
        return this.props.status;
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