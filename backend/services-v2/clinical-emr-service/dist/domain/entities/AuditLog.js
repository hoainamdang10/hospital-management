"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLog = void 0;
const crypto_1 = require("crypto");
class AuditLog {
    constructor(props) {
        this.props = props;
    }
    static create(initial) {
        return new AuditLog({
            ...initial,
            id: initial.id ?? (0, crypto_1.randomUUID)(),
            createdAt: initial.createdAt ?? new Date(),
        });
    }
    toJSON() {
        return this.props;
    }
}
exports.AuditLog = AuditLog;
