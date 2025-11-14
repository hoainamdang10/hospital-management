"use strict";
/**
 * Patient Constants
 * Shared constants for patient data management
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CRITICAL_PATIENT_FIELDS = exports.PATIENT_FIELDS_WITH_DEFAULTS = exports.getValueOrDefault = exports.isUnupdated = exports.UNUPDATED = void 0;
/**
 * Default value for unupdated patient fields
 */
exports.UNUPDATED = 'Chưa cập nhật';
/**
 * Helper function to check if a value is unupdated
 */
const isUnupdated = (value) => {
    return !value || value === exports.UNUPDATED;
};
exports.isUnupdated = isUnupdated;
/**
 * Helper function to get value or default
 */
const getValueOrDefault = (value, defaultValue) => {
    if ((0, exports.isUnupdated)(value)) {
        return defaultValue || exports.UNUPDATED;
    }
    return value || defaultValue || exports.UNUPDATED;
};
exports.getValueOrDefault = getValueOrDefault;
/**
 * Fields that should use "Chưa cập nhật" as default
 */
exports.PATIENT_FIELDS_WITH_DEFAULTS = [
    'nationality',
    'ethnicity',
    'occupation',
    'maritalStatus',
    'ward',
    'district',
    'city',
    'province'
];
/**
 * Critical fields that should not use "Chưa cập nhật" without validation
 */
exports.CRITICAL_PATIENT_FIELDS = [
    'fullName',
    'dateOfBirth',
    'gender',
    'primaryPhone',
    'email'
];
//# sourceMappingURL=PatientConstants.js.map