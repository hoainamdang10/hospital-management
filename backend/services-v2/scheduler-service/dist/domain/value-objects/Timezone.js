"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Timezone = void 0;
class Timezone {
    constructor(value) {
        this.value = value;
    }
    static create(value) {
        if (!value || value.trim().length === 0) {
            return Timezone.utc();
        }
        const trimmedValue = value.trim();
        if (!Timezone.VALID_TIMEZONES.includes(trimmedValue)) {
            throw new Error(`Invalid timezone: ${value}. Must be one of: ${Timezone.VALID_TIMEZONES.join(', ')}`);
        }
        return new Timezone(trimmedValue);
    }
    static utc() {
        return new Timezone('UTC');
    }
    static hoChiMinh() {
        return new Timezone('Asia/Ho_Chi_Minh');
    }
    getValue() {
        return this.value;
    }
    isUTC() {
        return this.value === 'UTC';
    }
    equals(other) {
        return this.value === other.value;
    }
    toString() {
        return this.value;
    }
}
exports.Timezone = Timezone;
Timezone.VALID_TIMEZONES = [
    'UTC',
    'Asia/Ho_Chi_Minh',
    'Asia/Bangkok',
    'Asia/Singapore',
    'Asia/Tokyo',
    'America/New_York',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris'
];
//# sourceMappingURL=Timezone.js.map