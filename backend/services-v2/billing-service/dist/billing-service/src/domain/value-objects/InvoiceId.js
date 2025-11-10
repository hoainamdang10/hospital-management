"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceId = void 0;
const value_object_1 = require("../../../../shared/domain/base/value-object");
const uuid_1 = require("uuid");
class InvoiceId extends value_object_1.ValueObject {
    constructor(props) {
        super(props);
    }
    static create(value) {
        if (!value || value.trim().length === 0) {
            throw new Error('InvoiceId cannot be empty');
        }
        return new InvoiceId({ value: value.trim() });
    }
    static generate() {
        return new InvoiceId({ value: (0, uuid_1.v4)() });
    }
    get value() {
        return this.props.value;
    }
    validateFormat() {
        if (!this.props.value || this.props.value.trim().length === 0) {
            throw new Error('InvoiceId cannot be empty');
        }
    }
}
exports.InvoiceId = InvoiceId;
//# sourceMappingURL=InvoiceId.js.map