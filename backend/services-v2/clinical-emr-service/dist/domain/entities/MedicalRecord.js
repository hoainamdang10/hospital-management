"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MedicalRecord = void 0;
const crypto_1 = require("crypto");
class MedicalRecord {
    constructor(props) {
        this.props = props;
    }
    static create(initial) {
        return new MedicalRecord({
            ...initial,
            id: initial.id ?? (0, crypto_1.randomUUID)(),
            createdAt: initial.createdAt ?? new Date(),
            updatedAt: initial.updatedAt ?? new Date(),
        });
    }
    update(partial) {
        this.props = {
            ...this.props,
            ...partial,
            updatedAt: new Date(),
        };
    }
    toJSON() {
        return this.props;
    }
}
exports.MedicalRecord = MedicalRecord;
