"use strict";
/**
 * BillingAggregate - Domain Layer
 * Core aggregate for billing and invoice management
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Billing Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingAggregate = exports.PaymentMethod = exports.InvoiceStatus = void 0;
const AggregateRoot_1 = require("../../../../shared/domain/AggregateRoot");
const InvoiceId_1 = require("../value-objects/InvoiceId");
const Money_1 = require("../value-objects/Money");
// Domain Events
const InvoiceCreatedEvent_1 = require("../events/InvoiceCreatedEvent");
const InvoiceUpdatedEvent_1 = require("../events/InvoiceUpdatedEvent");
const PaymentProcessedEvent_1 = require("../events/PaymentProcessedEvent");
const InsuranceClaimSubmittedEvent_1 = require("../events/InsuranceClaimSubmittedEvent");
var InvoiceStatus;
(function (InvoiceStatus) {
    InvoiceStatus["DRAFT"] = "draft";
    InvoiceStatus["PENDING"] = "pending";
    InvoiceStatus["PAID"] = "paid";
    InvoiceStatus["PARTIALLY_PAID"] = "partially_paid";
    InvoiceStatus["OVERDUE"] = "overdue";
    InvoiceStatus["CANCELLED"] = "cancelled";
    InvoiceStatus["REFUNDED"] = "refunded";
})(InvoiceStatus || (exports.InvoiceStatus = InvoiceStatus = {}));
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["CASH"] = "cash";
    PaymentMethod["CARD"] = "card";
    PaymentMethod["BANK_TRANSFER"] = "bank_transfer";
    PaymentMethod["PAYOS"] = "payos";
    PaymentMethod["INSURANCE_DIRECT"] = "insurance_direct";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
/**
 * BillingAggregate
 * Manages invoices, payments, and insurance claims
 */
class BillingAggregate extends AggregateRoot_1.AggregateRoot {
    constructor(id, patientId, medicalRecordId, doctorId, appointmentId, issuedBy) {
        super(id);
        this._patientId = patientId;
        this._medicalRecordId = medicalRecordId;
        this._doctorId = doctorId;
        this._appointmentId = appointmentId;
        this._status = InvoiceStatus.DRAFT;
        this._items = [];
        this._subtotal = Money_1.Money.zero();
        this._taxAmount = Money_1.Money.zero();
        this._totalAmount = Money_1.Money.zero();
        this._insuranceCoverage = Money_1.Money.zero();
        this._patientPayment = Money_1.Money.zero();
        this._payments = [];
        this._insuranceClaims = [];
        this._issuedAt = new Date();
        this._issuedBy = issuedBy;
        this._dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
    }
    /**
     * Create new billing aggregate
     */
    static create(patientId, medicalRecordId, doctorId, appointmentId, issuedBy) {
        const id = InvoiceId_1.InvoiceId.generate();
        const billing = new BillingAggregate(id, patientId, medicalRecordId, doctorId, appointmentId, issuedBy);
        // Raise domain event
        billing.addDomainEvent(new InvoiceCreatedEvent_1.InvoiceCreatedEvent(id.value, patientId, medicalRecordId, doctorId, appointmentId, issuedBy, new Date()));
        return billing;
    }
    /**
     * Reconstitute from persistence
     */
    static reconstitute(id, patientId, medicalRecordId, doctorId, appointmentId, status, items, subtotal, taxAmount, totalAmount, insurance, insuranceCoverage, patientPayment, payments, insuranceClaims, dueDate, issuedAt, issuedBy, notes, vietnameseInvoiceNumber) {
        const billing = new BillingAggregate(id, patientId, medicalRecordId, doctorId, appointmentId, issuedBy);
        billing._status = status;
        billing._items = items;
        billing._subtotal = subtotal;
        billing._taxAmount = taxAmount;
        billing._totalAmount = totalAmount;
        billing._insurance = insurance;
        billing._insuranceCoverage = insuranceCoverage;
        billing._patientPayment = patientPayment;
        billing._payments = payments;
        billing._insuranceClaims = insuranceClaims;
        billing._dueDate = dueDate;
        billing._issuedAt = issuedAt;
        billing._notes = notes;
        billing._vietnameseInvoiceNumber = vietnameseInvoiceNumber;
        return billing;
    }
    // Getters
    get patientId() { return this._patientId; }
    get medicalRecordId() { return this._medicalRecordId; }
    get doctorId() { return this._doctorId; }
    get appointmentId() { return this._appointmentId; }
    get status() { return this._status; }
    get items() { return [...this._items]; }
    get subtotal() { return this._subtotal; }
    get taxAmount() { return this._taxAmount; }
    get totalAmount() { return this._totalAmount; }
    get insurance() { return this._insurance; }
    get insuranceCoverage() { return this._insuranceCoverage; }
    get patientPayment() { return this._patientPayment; }
    get payments() { return [...this._payments]; }
    get insuranceClaims() { return [...this._insuranceClaims]; }
    get dueDate() { return this._dueDate; }
    get issuedAt() { return this._issuedAt; }
    get issuedBy() { return this._issuedBy; }
    get notes() { return this._notes; }
    get vietnameseInvoiceNumber() { return this._vietnameseInvoiceNumber; }
    /**
     * Add billing item
     */
    addItem(item) {
        if (this._status !== InvoiceStatus.DRAFT) {
            throw new Error('Không thể thêm item vào hóa đơn đã hoàn thành');
        }
        // Validate item
        if (item.quantity <= 0) {
            throw new Error('Số lượng phải lớn hơn 0');
        }
        if (item.unitPrice.amount <= 0) {
            throw new Error('Đơn giá phải lớn hơn 0');
        }
        // Calculate total price
        const totalPrice = item.unitPrice.multiply(item.quantity);
        const updatedItem = {
            ...item,
            totalPrice
        };
        this._items.push(updatedItem);
        this.recalculateAmounts();
        this.addDomainEvent(new InvoiceUpdatedEvent_1.InvoiceUpdatedEvent(this.id.value, this._patientId, 'item_added', { itemId: item.id, description: item.description }, this._issuedBy, new Date()));
    }
    /**
     * Remove billing item
     */
    removeItem(itemId) {
        if (this._status !== InvoiceStatus.DRAFT) {
            throw new Error('Không thể xóa item khỏi hóa đơn đã hoàn thành');
        }
        const itemIndex = this._items.findIndex(item => item.id === itemId);
        if (itemIndex === -1) {
            throw new Error('Không tìm thấy item');
        }
        const removedItem = this._items[itemIndex];
        this._items.splice(itemIndex, 1);
        this.recalculateAmounts();
        this.addDomainEvent(new InvoiceUpdatedEvent_1.InvoiceUpdatedEvent(this.id.value, this._patientId, 'item_removed', { itemId, description: removedItem.description }, this._issuedBy, new Date()));
    }
    /**
     * Set insurance
     */
    setInsurance(insurance) {
        if (this._status === InvoiceStatus.PAID || this._status === InvoiceStatus.CANCELLED) {
            throw new Error('Không thể thay đổi bảo hiểm cho hóa đơn đã thanh toán hoặc đã hủy');
        }
        this._insurance = insurance;
        this.recalculateAmounts();
        this.addDomainEvent(new InvoiceUpdatedEvent_1.InvoiceUpdatedEvent(this.id.value, this._patientId, 'insurance_updated', {
            insuranceType: insurance.type,
            insuranceNumber: insurance.number,
            coverageLevel: insurance.coverageLevel
        }, this._issuedBy, new Date()));
    }
    /**
     * Finalize invoice (change from draft to pending)
     */
    finalize() {
        if (this._status !== InvoiceStatus.DRAFT) {
            throw new Error('Chỉ có thể hoàn thành hóa đơn ở trạng thái draft');
        }
        if (this._items.length === 0) {
            throw new Error('Hóa đơn phải có ít nhất 1 item');
        }
        this._status = InvoiceStatus.PENDING;
        this._vietnameseInvoiceNumber = this.generateVietnameseInvoiceNumber();
        this.addDomainEvent(new InvoiceUpdatedEvent_1.InvoiceUpdatedEvent(this.id.value, this._patientId, 'finalized', { vietnameseInvoiceNumber: this._vietnameseInvoiceNumber }, this._issuedBy, new Date()));
    }
    /**
     * Process payment
     */
    processPayment(amount, method, processedBy, transactionId, notes, payosData) {
        if (this._status === InvoiceStatus.CANCELLED || this._status === InvoiceStatus.REFUNDED) {
            throw new Error('Không thể thanh toán cho hóa đơn đã hủy hoặc đã hoàn tiền');
        }
        if (amount.amount <= 0) {
            throw new Error('Số tiền thanh toán phải lớn hơn 0');
        }
        const totalPaid = this.getTotalPaidAmount();
        const remainingAmount = this._patientPayment.subtract(totalPaid);
        if (amount.greaterThan(remainingAmount)) {
            throw new Error('Số tiền thanh toán vượt quá số tiền còn lại');
        }
        const payment = {
            id: this.generatePaymentId(),
            amount,
            method,
            transactionId,
            processedAt: new Date(),
            processedBy,
            notes,
            payosData
        };
        this._payments.push(payment);
        this.updatePaymentStatus();
        this.addDomainEvent(new PaymentProcessedEvent_1.PaymentProcessedEvent(this.id.value, this._patientId, payment.id, amount.amount, amount.currency, method, transactionId, processedBy, new Date()));
    }
    /**
     * Submit insurance claim
     */
    submitInsuranceClaim() {
        if (!this._insurance) {
            throw new Error('Không có thông tin bảo hiểm');
        }
        if (!this._insurance.isValid()) {
            throw new Error('Bảo hiểm đã hết hạn');
        }
        if (this._insuranceCoverage.isZero()) {
            throw new Error('Không có số tiền bảo hiểm để claim');
        }
        const existingClaim = this._insuranceClaims.find(claim => claim.status === 'submitted' || claim.status === 'processing');
        if (existingClaim) {
            throw new Error('Đã có claim đang xử lý');
        }
        const claim = {
            id: this.generateClaimId(),
            insurance: this._insurance,
            claimAmount: this._insuranceCoverage,
            status: 'submitted',
            submittedAt: new Date(),
            claimNumber: this.generateClaimNumber()
        };
        this._insuranceClaims.push(claim);
        this.addDomainEvent(new InsuranceClaimSubmittedEvent_1.InsuranceClaimSubmittedEvent(this.id.value, this._patientId, claim.id, this._insurance.type, this._insurance.number, this._insuranceCoverage.amount, this._insuranceCoverage.currency, claim.claimNumber, new Date()));
    }
    /**
     * Cancel invoice
     */
    cancel(reason, cancelledBy) {
        if (this._status === InvoiceStatus.PAID) {
            throw new Error('Không thể hủy hóa đơn đã thanh toán');
        }
        if (this._status === InvoiceStatus.CANCELLED) {
            throw new Error('Hóa đơn đã được hủy');
        }
        this._status = InvoiceStatus.CANCELLED;
        this._notes = `Hủy: ${reason}`;
        this.addDomainEvent(new InvoiceUpdatedEvent_1.InvoiceUpdatedEvent(this.id.value, this._patientId, 'cancelled', { reason, cancelledBy }, cancelledBy, new Date()));
    }
    /**
     * Check if overdue
     */
    isOverdue() {
        return new Date() > this._dueDate &&
            this._status !== InvoiceStatus.PAID &&
            this._status !== InvoiceStatus.CANCELLED;
    }
    /**
     * Get total paid amount
     */
    getTotalPaidAmount() {
        return this._payments.reduce((total, payment) => total.add(payment.amount), Money_1.Money.zero(this._totalAmount.currency));
    }
    /**
     * Get remaining amount to pay
     */
    getRemainingAmount() {
        const totalPaid = this.getTotalPaidAmount();
        return this._patientPayment.subtract(totalPaid);
    }
    /**
     * Check if fully paid
     */
    isFullyPaid() {
        return this.getRemainingAmount().isZero();
    }
    /**
     * Get Vietnamese status display
     */
    getVietnameseStatusDisplay() {
        switch (this._status) {
            case InvoiceStatus.DRAFT: return 'Bản nháp';
            case InvoiceStatus.PENDING: return 'Chờ thanh toán';
            case InvoiceStatus.PAID: return 'Đã thanh toán';
            case InvoiceStatus.PARTIALLY_PAID: return 'Thanh toán một phần';
            case InvoiceStatus.OVERDUE: return 'Quá hạn';
            case InvoiceStatus.CANCELLED: return 'Đã hủy';
            case InvoiceStatus.REFUNDED: return 'Đã hoàn tiền';
            default: return 'Không xác định';
        }
    }
    /**
     * Recalculate amounts
     */
    recalculateAmounts() {
        // Calculate subtotal
        this._subtotal = this._items.reduce((total, item) => total.add(item.totalPrice), Money_1.Money.zero());
        // Calculate tax (VAT 10% for taxable items)
        const taxableAmount = this._items
            .filter(item => item.taxable)
            .reduce((total, item) => total.add(item.totalPrice), Money_1.Money.zero());
        this._taxAmount = taxableAmount.percentage(10);
        // Calculate total
        this._totalAmount = this._subtotal.add(this._taxAmount);
        // Calculate insurance coverage
        if (this._insurance) {
            const coverableAmount = this._items
                .filter(item => item.insuranceCoverable)
                .reduce((total, item) => total.add(item.totalPrice), Money_1.Money.zero());
            this._insuranceCoverage = this._insurance.calculateCoverage(coverableAmount);
        }
        else {
            this._insuranceCoverage = Money_1.Money.zero();
        }
        // Calculate patient payment
        this._patientPayment = this._totalAmount.subtract(this._insuranceCoverage);
    }
    /**
     * Update payment status based on payments
     */
    updatePaymentStatus() {
        const totalPaid = this.getTotalPaidAmount();
        if (totalPaid.isZero()) {
            this._status = InvoiceStatus.PENDING;
        }
        else if (totalPaid.greaterThanOrEqual(this._patientPayment)) {
            this._status = InvoiceStatus.PAID;
        }
        else {
            this._status = InvoiceStatus.PARTIALLY_PAID;
        }
        // Check if overdue
        if (this.isOverdue() && this._status !== InvoiceStatus.PAID) {
            this._status = InvoiceStatus.OVERDUE;
        }
    }
    /**
     * Generate Vietnamese invoice number
     */
    generateVietnameseInvoiceNumber() {
        // Format: HĐ-YYYYMM-XXXXXX
        const year = this._issuedAt.getFullYear();
        const month = String(this._issuedAt.getMonth() + 1).padStart(2, '0');
        const sequence = String(Math.floor(Math.random() * 999999) + 1).padStart(6, '0');
        return `HĐ-${year}${month}-${sequence}`;
    }
    /**
     * Generate payment ID
     */
    generatePaymentId() {
        return `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Generate claim ID
     */
    generateClaimId() {
        return `CLAIM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Generate claim number
     */
    generateClaimNumber() {
        const year = new Date().getFullYear();
        const sequence = String(Math.floor(Math.random() * 999999) + 1).padStart(6, '0');
        return `${year}${sequence}`;
    }
}
exports.BillingAggregate = BillingAggregate;
//# sourceMappingURL=BillingAggregate.js.map