"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LabResult = void 0;
const crypto_1 = require("crypto");
class LabResult {
    constructor(props) {
        this.props = props;
    }
    static create(initial) {
        return new LabResult({
            ...initial,
            id: initial.id ?? (0, crypto_1.randomUUID)(),
            createdAt: initial.createdAt ?? new Date(),
        });
    }
    toJSON() {
        return this.props;
    }
}
exports.LabResult = LabResult;
