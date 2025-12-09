"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Invoice = void 0;
const aggregate_root_1 = require("../../../../shared/domain/base/aggregate-root");
const InvoiceId_1 = require("../value-objects/InvoiceId");
const Money_1 = require("../value-objects/Money");
const InvoiceStatus_1 = require("../value-objects/InvoiceStatus");
const Payment_1 = require("../entities/Payment");
const InvoiceCreatedEvent_1 = require("../events/InvoiceCreatedEvent");
const PaymentProcessedEvent_1 = require("../events/PaymentProcessedEvent");
const PaymentRefundRequestedEvent_1 = require("../events/PaymentRefundRequestedEvent");
const PaymentRefundedEvent_1 = require("../events/PaymentRefundedEvent");
const domain_events_1 = require("../../../../shared/domain/events/domain-events");
class Invoice extends aggregate_root_1.HealthcareAggregateRoot {
    constructor(props, id) {
        super(props, id);
    }
    static create(patientId, items, options = {}) {
        if (items.length === 0) {
            throw new Error("Invoice must have at least one item");
        }
        const invoiceId = InvoiceId_1.InvoiceId.generate();
        const now = new Date();
        const taxRate = options.taxRate ?? 0.1;
        // Calculate subtotal
        const subtotal = items.reduce((sum, item) => sum.add(item.totalPrice), Money_1.Money.zero());
        // Calculate tax (10% VAT)
        const tax = subtotal.multiply(taxRate);
        // Calculate insurance coverage
        const insuranceCoverageAmount = options.insuranceCoverageAmount ?? 0;
        const insuranceCoverage = Money_1.Money.create(insuranceCoverageAmount);
        // Calculate total and outstanding (with insurance deduction)
        const totalAmount = subtotal.add(tax);
        const outstandingAmount = totalAmount.subtract(insuranceCoverage);
        // Ensure outstanding is never negative
        const finalOutstanding = outstandingAmount.amount < 0
            ? Money_1.Money.zero()
            : outstandingAmount;
        // Generate invoice number automatically
        const invoiceNumber = Invoice.generateInvoiceNumber();
        const invoiceDueDate = new Date(now.getTime() + 10 * 60 * 1000);
        const invoice = new Invoice({
            id: invoiceId,
            patientId,
            invoiceNumber,
            items,
            subtotal,
            tax,
            insuranceCoverage,
            insurance: options.insurance,
            totalAmount,
            outstandingAmount: finalOutstanding,
            status: InvoiceStatus_1.InvoiceStatus.pending(), // Start with PENDING (waiting for payment)
            payments: [],
            paidAt: undefined, // Not paid yet
            createdAt: now,
            updatedAt: now,
            dueDate: invoiceDueDate,
            metadata: {},
        });
        invoice.addDomainEvent(new InvoiceCreatedEvent_1.InvoiceCreatedEvent(invoiceId.value, invoiceNumber, patientId, totalAmount.amount, totalAmount.currency, invoice.status.value, now, invoiceDueDate));
        return invoice;
    }
    // REMOVED (Phase 1 Prepaid Model): finalize(), cancel(), processInsuranceClaim()
    // These are out of scope for MVP. Future implementation for Phase 2+
    /**
     * Process refund for cancelled appointment
     * @param refundPercentage Percentage of total amount to refund (0-100)
     * @param reason Refund reason
     * @param refundedBy User who initiated the refund
     * @returns Refund amount
     */
    processRefund(refundPercentage, reason, refundedBy) {
        // Validate refund percentage
        if (refundPercentage < 0 || refundPercentage > 100) {
            throw new Error("Refund percentage must be between 0 and 100");
        }
        // Validate invoice is paid
        if (!this.props.status.isPaid()) {
            throw new Error("Cannot refund unpaid invoice");
        }
        // Calculate refund amount
        const refundAmount = this.props.totalAmount.amount * (refundPercentage / 100);
        // Get original payment for refund tracking
        // Find first non-refund payment (original payment, not refund record)
        // Database doesn't store payment status, so we identify by method !== 'refund'
        const originalPayment = this.props.payments.find((p) => p.method !== "refund");
        const originalPaymentMethod = originalPayment?.method || "payos";
        // Create refund payment record (type: 'refund')
        // This will be saved as a negative payment in payment_records table
        // Status: 'refund_pending' - will be updated when gateway confirms
        const refundPayment = Payment_1.Payment.createRefund(Money_1.Money.createSigned(refundAmount, this.props.totalAmount.currency), originalPaymentMethod, `REFUND-${this.props.id.value}-${Date.now()}`, // Transaction ID
        reason, refundedBy);
        // Add refund payment to payments array
        this.props.payments.push(refundPayment);
        // Calculate outstanding amount based on actual payment amounts
        // Database doesn't store payment status, so we calculate based on method and amount
        // - Positive amounts (method !== 'refund'): payments received
        // - Negative amounts (method === 'refund'): refunds issued
        const totalPaid = this.props.payments
            .filter((p) => p.method !== "refund" && p.amount.amount > 0)
            .reduce((sum, p) => sum + p.amount.amount, 0);
        const totalRefunded = this.props.payments
            .filter((p) => p.method === "refund" && p.amount.amount < 0)
            .reduce((sum, p) => sum + Math.abs(p.amount.amount), 0);
        const netPayment = totalPaid - totalRefunded;
        const newOutstanding = this.props.totalAmount.amount - netPayment;
        this.props.outstandingAmount = Money_1.Money.create(Math.max(0, newOutstanding), this.props.totalAmount.currency);
        // Keep status as partially_paid while refund is pending
        // Status will be updated to 'refunded' when gateway confirms
        this.props.status = InvoiceStatus_1.InvoiceStatus.partiallyPaid();
        this.props.updatedAt = new Date();
        // Extract VNPAY data from original payment (if available)
        const vnpayData = originalPayment?.vnpayData;
        // ONLY emit PaymentRefundRequestedEvent
        // PaymentRefundedEvent will be emitted by worker/webhook when gateway confirms
        this.addDomainEvent(new PaymentRefundRequestedEvent_1.PaymentRefundRequestedEvent(refundPayment.id, // refundId
        originalPayment?.id || "unknown", // originalPaymentId
        this.props.id.value, // invoiceId
        this.props.staffId || "system", // staffId
        this.props.patientId, // patientId
        refundAmount, // refundAmount
        this.props.totalAmount.currency, // currency
        reason, // reason
        refundedBy, // refundedBy
        originalPaymentMethod, // originalPaymentMethod
        originalPayment?.transactionId, // originalTransactionId
        this.props.appointmentId, // appointmentId
        vnpayData?.vnpTxnRef, // VNPAY transaction reference
        vnpayData?.vnpTransactionNo, // VNPAY transaction number
        vnpayData?.vnpPayDate));
        return refundAmount;
    }
    /**
     * Complete refund after gateway confirmation
     * Called by worker/webhook when PayOS/VNPAY confirms refund
     * @param refundPaymentId ID of the refund payment to complete
     * @param gatewayRefundId Refund ID from payment gateway
     */
    completeRefund(refundPaymentId, gatewayRefundId) {
        // Find the refund payment
        const refundPayment = this.props.payments.find((p) => p.id === refundPaymentId && p.method === "refund");
        if (!refundPayment) {
            throw new Error(`Refund payment ${refundPaymentId} not found`);
        }
        if (refundPayment.status !== "refund_pending") {
            throw new Error(`Refund payment ${refundPaymentId} is not pending`);
        }
        // Complete the refund payment
        refundPayment.completeRefund(gatewayRefundId);
        // Recalculate outstanding amount with completed refund
        // Database doesn't store payment status, so we calculate based on method and amount
        const totalPaid = this.props.payments
            .filter((p) => p.method !== "refund" && p.amount.amount > 0)
            .reduce((sum, p) => sum + p.amount.amount, 0);
        const totalRefunded = this.props.payments
            .filter((p) => p.method === "refund" && p.amount.amount < 0)
            .reduce((sum, p) => sum + Math.abs(p.amount.amount), 0);
        const netPayment = totalPaid - totalRefunded;
        const newOutstanding = this.props.totalAmount.amount - netPayment;
        this.props.outstandingAmount = Money_1.Money.create(Math.max(0, newOutstanding), this.props.totalAmount.currency);
        // Update invoice status based on refund amount
        const refundAmount = Math.abs(refundPayment.amount.amount);
        if (refundAmount >= this.props.totalAmount.amount) {
            // Full refund: set outstanding to 0 and status to refunded
            this.props.outstandingAmount = Money_1.Money.zero(this.props.totalAmount.currency);
            this.props.status = InvoiceStatus_1.InvoiceStatus.refunded();
        }
        else if (newOutstanding > 0) {
            // Partial refund: keep as partially_paid
            this.props.status = InvoiceStatus_1.InvoiceStatus.partiallyPaid();
        }
        else {
            // Edge case: fully paid after partial refund
            this.props.status = InvoiceStatus_1.InvoiceStatus.paid();
        }
        this.props.updatedAt = new Date();
        // Emit PaymentRefundedEvent now that gateway has confirmed
        // Find original payment by method (not status, since DB doesn't persist status)
        const originalPayment = this.props.payments.find((p) => p.method !== "refund" && p.amount.amount > 0);
        this.addDomainEvent(new PaymentRefundedEvent_1.PaymentRefundedEvent(refundPayment.id, // refundId
        originalPayment?.id || "unknown", // originalPaymentId
        this.props.id.value, // invoiceId
        this.props.staffId || "system", // staffId
        this.props.patientId, // patientId
        refundAmount, // refundAmount
        this.props.totalAmount.currency, // currency
        refundPayment.refundReason || "Refund completed", // reason
        refundPayment.refundedBy || "system", // refundedBy
        new Date(), // timestamp
        this.props.appointmentId, // appointmentId
        gatewayRefundId));
    }
    /**
     * Mark invoice as expired (payment timeout)
     */
    markAsExpired(reason, expiredBy = "system") {
        if (this.props.status.value === "expired") {
            return;
        }
        if (this.props.status.isPaid() || this.props.status.isRefunded()) {
            throw new Error("Cannot expire a settled invoice");
        }
        this.props.status = InvoiceStatus_1.InvoiceStatus.expired();
        this.props.updatedAt = new Date();
        this.props.metadata = {
            ...(this.props.metadata || {}),
            expiredReason: reason,
            expiredBy,
        };
        this.addDomainEvent(new domain_events_1.InvoiceExpiredEvent(this.props.id.value, this.props.invoiceNumber || this.props.id.value, this.props.patientId, this.props.appointmentId, this.props.totalAmount.amount, this.props.dueDate, this.props.updatedAt, reason));
    }
    processPayment(payment) {
        if (this.props.status.isCancelled()) {
            throw new Error("Cannot process payment for cancelled invoice");
        }
        if (this.props.status.isPaid()) {
            throw new Error("Invoice is already paid");
        }
        payment.complete();
        this.props.payments.push(payment);
        const totalPaid = this.props.payments.reduce((sum, p) => sum.add(p.amount), Money_1.Money.zero());
        // Calculate outstanding: totalAmount - insuranceCoverage - totalPaid
        const afterInsurance = this.props.totalAmount.subtract(this.props.insuranceCoverage);
        this.props.outstandingAmount = afterInsurance.subtract(totalPaid);
        if (this.props.outstandingAmount.amount <= 0) {
            this.props.status = InvoiceStatus_1.InvoiceStatus.paid();
            this.props.paidAt = new Date(); // Set paid timestamp
        }
        this.props.updatedAt = new Date();
        // Emit PaymentProcessedEvent with appointmentId for prepaid flow
        this.addDomainEvent(new PaymentProcessedEvent_1.PaymentProcessedEvent(this.props.id.value, payment.id, this.props.patientId, payment.amount.amount, payment.amount.currency, payment.method, this.props.appointmentId));
    }
    static generateInvoiceNumber() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const random = Math.floor(Math.random() * 10000)
            .toString()
            .padStart(4, "0");
        return `INV-${year}${month}-${random}`;
    }
    // Required by HealthcareAggregateRoot
    get id() {
        return this.props.id.value;
    }
    validateBusinessInvariants() {
        if (this.props.items.length === 0) {
            throw new Error("Invoice must have at least one item");
        }
        if (this.props.totalAmount.amount < 0) {
            throw new Error("Total amount cannot be negative");
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
            metadata: this.props.metadata || {},
            invoiceNumber: this.props.invoiceNumber,
            items: this.props.items.map((item) => item.toPersistence()),
            subtotal: this.props.subtotal.amount,
            tax: this.props.tax.amount,
            insuranceCoverage: this.props.insuranceCoverage.amount,
            insurance: this.props.insurance ? {
                provider: this.props.insurance.provider,
                policyNumber: this.props.insurance.policyNumber,
                coveragePercentage: this.props.insurance.coveragePercentage,
            } : null,
            totalAmount: this.props.totalAmount.amount,
            outstandingAmount: this.props.outstandingAmount.amount,
            currency: this.props.totalAmount.currency,
            status: this.props.status.value,
            payments: this.props.payments.map((p) => p.toPersistence()),
            paidAt: this.props.paidAt,
            createdAt: this.props.createdAt,
            updatedAt: this.props.updatedAt,
            dueDate: this.props.dueDate,
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
    get metadata() {
        return this.props.metadata || {};
    }
    setMetadata(metadata) {
        this.props.metadata = {
            ...(this.props.metadata || {}),
            ...(metadata || {}),
        };
        this.props.updatedAt = new Date();
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
    get insurance() {
        return this.props.insurance;
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
    get paidAt() {
        return this.props.paidAt;
    }
    get dueDate() {
        return this.props.dueDate;
    }
}
exports.Invoice = Invoice;
//# sourceMappingURL=Invoice.js.map