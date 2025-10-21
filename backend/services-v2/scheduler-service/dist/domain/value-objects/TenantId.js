"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantId = void 0;
class TenantId {
    constructor(value) {
        this.value = value;
    }
    static create(value) {
        if (!value || value.trim().length === 0) {
            throw new Error('Tenant ID cannot be empty');
        }
        const trimmedValue = value.trim();
        if (trimmedValue.length > 100) {
            throw new Error('Tenant ID cannot exceed 100 characters');
        }
        if (!/^[a-zA-Z0-9_-]+$/.test(trimmedValue)) {
            throw new Error('Tenant ID can only contain alphanumeric characters, hyphens, and underscores');
        }
        return new TenantId(trimmedValue);
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
exports.TenantId = TenantId;
//# sourceMappingURL=TenantId.js.map