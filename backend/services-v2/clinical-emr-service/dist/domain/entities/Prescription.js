"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Prescription = void 0;
const crypto_1 = require("crypto");
class Prescription {
    constructor(props) {
        this.props = props;
    }
    static create(initial) {
        return new Prescription({
            ...initial,
            id: initial.id ?? (0, crypto_1.randomUUID)(),
            createdAt: initial.createdAt ?? new Date(),
        });
    }
    toJSON() {
        return this.props;
    }
}
exports.Prescription = Prescription;
