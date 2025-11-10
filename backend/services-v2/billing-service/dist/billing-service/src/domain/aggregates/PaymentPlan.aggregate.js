"use strict";
/**
 * PaymentPlan - Aggregate Root
 * Payment plan for installment payments
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance DDD, Aggregate Pattern
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentPlan = exports.PaymentFrequency = exports.PaymentPlanStatus = void 0;
const AggregateRoot_1 = require("../../../../shared/domain/AggregateRoot");
const PaymentPlanId_1 = require("../value-objects/PaymentPlanId");
const Installment_entity_1 = require("../entities/Installment.entity");
var PaymentPlanStatus;
(function (PaymentPlanStatus) {
    PaymentPlanStatus["ACTIVE"] = "active";
    PaymentPlanStatus["COMPLETED"] = "completed";
    PaymentPlanStatus["DEFAULTED"] = "defaulted";
    PaymentPlanStatus["CANCELLED"] = "cancelled";
    PaymentPlanStatus["SUSPENDED"] = "suspended";
})(PaymentPlanStatus || (exports.PaymentPlanStatus = PaymentPlanStatus = {}));
var PaymentFrequency;
(function (PaymentFrequency) {
    PaymentFrequency["MONTHLY"] = "monthly";
    PaymentFrequency["WEEKLY"] = "weekly";
    PaymentFrequency["BIWEEKLY"] = "biweekly";
})(PaymentFrequency || (exports.PaymentFrequency = PaymentFrequency = {}));
class PaymentPlan extends AggregateRoot_1.AggregateRoot {
    constructor(props, id) {
        super(props, id);
    }
    static create(props) {
        const plan = new PaymentPlan({
            ...props,
            planId: PaymentPlanId_1.PaymentPlanId.create(),
            installments: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        // Generate installments
        plan.generateInstallments();
        return plan;
    }
    static reconstitute(props, id) {
        return new PaymentPlan({
            ...props,
            planId: PaymentPlanId_1.PaymentPlanId.fromString(id),
        }, id);
    }
    get planId() {
        return this.props.planId;
    }
    get invoiceId() {
        return this.props.invoiceId;
    }
    get patientId() {
        return this.props.patientId;
    }
    get totalAmount() {
        return this.props.totalAmount;
    }
    get downPayment() {
        return this.props.downPayment;
    }
    get remainingAmount() {
        return this.props.remainingAmount;
    }
    get numberOfInstallments() {
        return this.props.numberOfInstallments;
    }
    get installmentAmount() {
        return this.props.installmentAmount;
    }
    get frequency() {
        return this.props.frequency;
    }
    get startDate() {
        return this.props.startDate;
    }
    get endDate() {
        return this.props.endDate;
    }
    get status() {
        return this.props.status;
    }
    get terms() {
        return this.props.terms;
    }
    get notes() {
        return this.props.notes;
    }
    get installments() {
        return this.props.installments;
    }
    get createdBy() {
        return this.props.createdBy;
    }
    get updatedBy() {
        return this.props.updatedBy;
    }
    get createdAt() {
        return this.props.createdAt;
    }
    get updatedAt() {
        return this.props.updatedAt;
    }
    generateInstallments() {
        const installments = [];
        let currentDate = new Date(this.props.startDate);
        for (let i = 1; i <= this.props.numberOfInstallments; i++) {
            const dueDate = this.calculateDueDate(currentDate, i);
            const isLastInstallment = i === this.props.numberOfInstallments;
            // Last installment may have different amount due to rounding
            const amount = isLastInstallment
                ? this.props.remainingAmount - (this.props.installmentAmount * (i - 1))
                : this.props.installmentAmount;
            const installment = Installment_entity_1.Installment.create({
                planId: this.props.planId.value,
                installmentNumber: i,
                dueDate,
                amount,
                paidAmount: 0,
                remainingAmount: amount,
                status: Installment_entity_1.InstallmentStatus.PENDING,
            });
            installments.push(installment);
        }
        this.props.installments = installments;
    }
    calculateDueDate(startDate, installmentNumber) {
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
    recordInstallmentPayment(installmentNumber, amount, method, transactionId, notes) {
        const installment = this.props.installments.find((inst) => inst.installmentNumber === installmentNumber);
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
    updateStatus(status, notes, updatedBy) {
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
    cancel(reason, cancelledBy) {
        if (this.props.status === PaymentPlanStatus.COMPLETED) {
            throw new Error('Cannot cancel completed payment plan');
        }
        this.props.status = PaymentPlanStatus.CANCELLED;
        this.props.notes = reason;
        this.props.updatedBy = cancelledBy;
        this.props.updatedAt = new Date();
    }
    suspend(reason, suspendedBy) {
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
    checkOverdueInstallments() {
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
    getOverdueInstallments() {
        return this.props.installments.filter((inst) => inst.isOverdue());
    }
    getPaidInstallments() {
        return this.props.installments.filter((inst) => inst.isPaid());
    }
    getNextDueInstallment() {
        return this.props.installments.find((inst) => inst.status === Installment_entity_1.InstallmentStatus.PENDING || inst.status === Installment_entity_1.InstallmentStatus.PARTIAL);
    }
    getPaymentProgress() {
        const totalPaid = this.props.totalAmount - this.props.remainingAmount;
        return (totalPaid / this.props.totalAmount) * 100;
    }
    validate() {
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
exports.PaymentPlan = PaymentPlan;
//# sourceMappingURL=PaymentPlan.aggregate.js.map