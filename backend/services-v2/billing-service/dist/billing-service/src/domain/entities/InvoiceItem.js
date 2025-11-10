"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceItem = void 0;
const entity_1 = require("../../../../shared/domain/base/entity");
class InvoiceItem extends entity_1.Entity {
    constructor(props, id) {
        super(props, id);
    }
    static create(description, quantity, unitPrice, id) {
        if (quantity <= 0) {
            throw new Error('Quantity must be greater than 0');
        }
        const totalPrice = unitPrice.multiply(quantity);
        return new InvoiceItem({ id: id || '', description, quantity, unitPrice, totalPrice }, id);
    }
    get description() {
        return this.props.description;
    }
    get quantity() {
        return this.props.quantity;
    }
    get unitPrice() {
        return this.props.unitPrice;
    }
    get totalPrice() {
        return this.props.totalPrice;
    }
    validate() {
        if (!this.props.description || this.props.description.trim().length === 0) {
            throw new Error('Description cannot be empty');
        }
        if (this.props.quantity <= 0) {
            throw new Error('Quantity must be greater than 0');
        }
    }
    toPersistence() {
        return {
            id: this.id,
            description: this.props.description,
            quantity: this.props.quantity,
            unitPrice: this.props.unitPrice.amount,
            totalPrice: this.props.totalPrice.amount,
            currency: this.props.unitPrice.currency
        };
    }
}
exports.InvoiceItem = InvoiceItem;
//# sourceMappingURL=InvoiceItem.js.map