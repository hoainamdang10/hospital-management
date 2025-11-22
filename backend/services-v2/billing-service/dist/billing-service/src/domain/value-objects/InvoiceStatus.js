"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceStatus = void 0;
const value_object_1 = require("../../../../shared/domain/base/value-object");
class InvoiceStatus extends value_object_1.ValueObject {
    constructor(props) {
        super(props);
    }
    static create(value) {
        return new InvoiceStatus({ value });
    }
    static draft() {
        return new InvoiceStatus({ value: 'draft' });
    }
    static pending() {
        return new InvoiceStatus({ value: 'pending' });
    }
    static partiallyPaid() {
        return new InvoiceStatus({ value: 'partially_paid' });
    }
    static paid() {
        return new InvoiceStatus({ value: 'paid' });
    }
    static cancelled() {
        return new InvoiceStatus({ value: 'cancelled' });
    }
    static overdue() {
        return new InvoiceStatus({ value: 'overdue' });
    }
    static refunded() {
        return new InvoiceStatus({ value: 'refunded' });
    }
    get value() {
        return this.props.value;
    }
    isDraft() {
        return this.props.value === 'draft';
    }
    isPending() {
        return this.props.value === 'pending';
    }
    isPartiallyPaid() {
        return this.props.value === 'partially_paid';
    }
    isPaid() {
        return this.props.value === 'paid';
    }
    isCancelled() {
        return this.props.value === 'cancelled';
    }
    isOverdue() {
        return this.props.value === 'overdue';
    }
    isRefunded() {
        return this.props.value === 'refunded';
    }
    validateFormat() {
        const validStatuses = ['draft', 'pending', 'partially_paid', 'paid', 'cancelled', 'overdue', 'refunded'];
        if (!validStatuses.includes(this.props.value)) {
            throw new Error(`Invalid invoice status: ${this.props.value}`);
        }
    }
}
exports.InvoiceStatus = InvoiceStatus;
//# sourceMappingURL=InvoiceStatus.js.map