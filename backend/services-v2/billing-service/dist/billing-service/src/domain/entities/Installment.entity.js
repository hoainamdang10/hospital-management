"use strict";
/**
 * Installment - Entity
 * Individual installment in a payment plan
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance DDD, Entity Pattern
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Installment = exports.PaymentMethod = exports.InstallmentStatus = void 0;
const InstallmentId_1 = require("../value-objects/InstallmentId");
var InstallmentStatus;
(function (InstallmentStatus) {
    InstallmentStatus["PENDING"] = "pending";
    InstallmentStatus["PAID"] = "paid";
    InstallmentStatus["OVERDUE"] = "overdue";
    InstallmentStatus["PARTIAL"] = "partial";
    InstallmentStatus["WAIVED"] = "waived";
})(InstallmentStatus || (exports.InstallmentStatus = InstallmentStatus = {}));
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["CASH"] = "cash";
    PaymentMethod["BANK_TRANSFER"] = "bank_transfer";
    PaymentMethod["VNPAY"] = "vnpay";
    PaymentMethod["MOMO"] = "momo";
    PaymentMethod["ZALOPAY"] = "zalopay";
    PaymentMethod["CREDIT_CARD"] = "credit_card";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
class Installment {
    constructor(props) {
        this.props = props;
    }
    static create(props) {
        return new Installment({
            ...props,
            installmentId: InstallmentId_1.InstallmentId.create(),
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    }
    static reconstitute(props, id) {
        return new Installment({
            ...props,
            installmentId: InstallmentId_1.InstallmentId.fromString(id),
        });
    }
    get installmentId() {
        return this.props.installmentId;
    }
    get planId() {
        return this.props.planId;
    }
    get installmentNumber() {
        return this.props.installmentNumber;
    }
    get dueDate() {
        return this.props.dueDate;
    }
    get amount() {
        return this.props.amount;
    }
    get paidAmount() {
        return this.props.paidAmount;
    }
    get remainingAmount() {
        return this.props.remainingAmount;
    }
    get status() {
        return this.props.status;
    }
    get paymentMethod() {
        return this.props.paymentMethod;
    }
    get paymentDate() {
        return this.props.paymentDate;
    }
    get transactionId() {
        return this.props.transactionId;
    }
    get notes() {
        return this.props.notes;
    }
    recordPayment(amount, method, transactionId, notes) {
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
        }
        else if (this.props.paidAmount > 0) {
            this.props.status = InstallmentStatus.PARTIAL;
        }
        this.props.updatedAt = new Date();
    }
    markOverdue() {
        if (this.props.status === InstallmentStatus.PENDING && new Date() > this.props.dueDate) {
            this.props.status = InstallmentStatus.OVERDUE;
            this.props.updatedAt = new Date();
        }
    }
    waive(notes) {
        this.props.status = InstallmentStatus.WAIVED;
        this.props.remainingAmount = 0;
        this.props.notes = notes;
        this.props.updatedAt = new Date();
    }
    isOverdue() {
        return this.props.status === InstallmentStatus.OVERDUE ||
            (this.props.status === InstallmentStatus.PENDING && new Date() > this.props.dueDate);
    }
    isPaid() {
        return this.props.status === InstallmentStatus.PAID;
    }
}
exports.Installment = Installment;
//# sourceMappingURL=Installment.entity.js.map