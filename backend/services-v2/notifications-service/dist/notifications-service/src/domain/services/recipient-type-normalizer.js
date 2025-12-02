"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeRecipientType = normalizeRecipientType;
const RECIPIENT_TYPE_ALIASES = {
    patient: "PATIENT",
    pat: "PATIENT",
    doctor: "DOCTOR",
    doc: "DOCTOR",
    nurse: "NURSE",
    admin: "ADMIN",
    family: "FAMILY",
    staff: "STAFF",
    department: "DEPARTMENT",
    dept: "DEPARTMENT",
};
const ALLOWED_TYPES = [
    "PATIENT",
    "DOCTOR",
    "NURSE",
    "ADMIN",
    "FAMILY",
    "STAFF",
    "DEPARTMENT",
];
/**
 * Chuẩn hóa recipientType về enum hỗ trợ bởi DB constraint.
 * Trả về PATIENT làm fallback để tránh lỗi ghi DB.
 */
function normalizeRecipientType(raw) {
    if (!raw) {
        return "PATIENT";
    }
    const normalizedInput = raw.toString().trim().toUpperCase();
    if (ALLOWED_TYPES.includes(normalizedInput)) {
        return normalizedInput;
    }
    const alias = RECIPIENT_TYPE_ALIASES[normalizedInput.toLowerCase()];
    if (alias) {
        return alias;
    }
    // Fallback an toàn để không văng lỗi constraint
    return "PATIENT";
}
//# sourceMappingURL=recipient-type-normalizer.js.map