"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DedupKey = void 0;
class DedupKey {
    constructor(value) {
        this.value = value;
    }
    static create(value) {
        if (!value || value.trim().length === 0) {
            throw new Error('Deduplication key cannot be empty');
        }
        const trimmedValue = value.trim();
        if (trimmedValue.length > 255) {
            throw new Error('Deduplication key cannot exceed 255 characters');
        }
        return new DedupKey(trimmedValue);
    }
    static fromParts(parts) {
        if (parts.length === 0) {
            throw new Error('Cannot create deduplication key from empty parts');
        }
        const value = parts.join(':');
        return DedupKey.create(value);
    }
    getValue() {
        return this.value;
    }
    equals(other) {
        return this.value === other.value;
    }
    toString() {
        return this.value;
    }
}
exports.DedupKey = DedupKey;
//# sourceMappingURL=DedupKey.js.map