"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClinicalNote = void 0;
const crypto_1 = require("crypto");
class ClinicalNote {
    constructor(props) {
        this.props = props;
    }
    static create(initial) {
        return new ClinicalNote({
            ...initial,
            id: initial.id ?? (0, crypto_1.randomUUID)(),
            createdAt: initial.createdAt ?? new Date(),
            updatedAt: initial.updatedAt ?? new Date(),
        });
    }
    toJSON() {
        return this.props;
    }
}
exports.ClinicalNote = ClinicalNote;
