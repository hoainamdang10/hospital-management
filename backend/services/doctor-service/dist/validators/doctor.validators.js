"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateDepartmentIdFormat = exports.validateLicenseNumberFormat = exports.validateDoctorIdFormat = exports.validateLanguagesArray = exports.validateWorkingHoursFormat = exports.validateProfileFields = exports.validateUpdateDoctor = exports.validateCreateDoctor = exports.validateDoctorId = void 0;
const express_validator_1 = require("express-validator");
const DOCTOR_ID_PATTERN = /^[A-Z]{4}-DOC-\d{6}-\d{3}$/;
const LICENSE_PATTERN = /^[A-Z]{2,4}\d{6,10}$/;
const DEPARTMENT_ID_PATTERN = /^DEPT\d{3}$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9+\-\s()]+$/;
const TIME_PATTERN = /^([01]?[0-9]|2[0-3]):[0-5][0-9]-([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
const VALID_STATUSES = ['active', 'inactive', 'on_leave'];
const VALID_GENDERS = ['male', 'female', 'other'];
exports.validateDoctorId = [
    (0, express_validator_1.param)('doctor_id')
        .matches(DOCTOR_ID_PATTERN)
        .withMessage('Doctor ID must be in format DEPT-DOC-YYYYMM-XXX (e.g., CARD-DOC-202506-001)')
];
exports.validateCreateDoctor = [
    (0, express_validator_1.body)('profile_id')
        .optional()
        .matches(UUID_PATTERN)
        .withMessage('Profile ID must be a valid UUID'),
    (0, express_validator_1.body)('license_number')
        .notEmpty()
        .withMessage('License number is required')
        .matches(LICENSE_PATTERN)
        .withMessage('License number must be 2-4 letters followed by 6-10 digits (e.g., BS001235)'),
    (0, express_validator_1.body)('specialization')
        .notEmpty()
        .withMessage('Specialization is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Specialization must be 2-100 characters'),
    (0, express_validator_1.body)('qualification')
        .notEmpty()
        .withMessage('Qualification is required')
        .isLength({ min: 2, max: 200 })
        .withMessage('Qualification must be 2-200 characters'),
    (0, express_validator_1.body)('experience_years')
        .optional()
        .isInt({ min: 0, max: 50 })
        .withMessage('Experience years must be between 0 and 50'),
    (0, express_validator_1.body)('consultation_fee')
        .optional()
        .isFloat({ min: 0, max: 999999.99 })
        .withMessage('Consultation fee must be between 0 and 999,999.99'),
    (0, express_validator_1.body)('department_id')
        .notEmpty()
        .withMessage('Department ID is required')
        .matches(DEPARTMENT_ID_PATTERN)
        .withMessage('Department ID must be in format DEPT + numbers (e.g., DEPT001)'),
    (0, express_validator_1.body)('status')
        .optional()
        .isIn(VALID_STATUSES)
        .withMessage(`Status must be one of: ${VALID_STATUSES.join(', ')}`),
    (0, express_validator_1.body)('bio')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Bio cannot exceed 1000 characters'),
    (0, express_validator_1.body)('languages_spoken')
        .optional()
        .isArray()
        .withMessage('Languages spoken must be an array')
        .custom((languages) => {
        if (languages && languages.length > 0) {
            const validLanguages = languages.every((lang) => typeof lang === 'string' && lang.length >= 2 && lang.length <= 50);
            if (!validLanguages) {
                throw new Error('Each language must be a string between 2-50 characters');
            }
        }
        return true;
    }),
    (0, express_validator_1.body)('working_hours')
        .optional()
        .isObject()
        .withMessage('Working hours must be a valid JSON object')
        .custom((workingHours) => {
        if (workingHours) {
            const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
            const providedDays = Object.keys(workingHours);
            const invalidDays = providedDays.filter(day => !validDays.includes(day));
            if (invalidDays.length > 0) {
                throw new Error(`Invalid day(s): ${invalidDays.join(', ')}. Valid days: ${validDays.join(', ')}`);
            }
            for (const [day, timeRange] of Object.entries(workingHours)) {
                if (timeRange !== 'off' && typeof timeRange === 'string') {
                    if (!TIME_PATTERN.test(timeRange)) {
                        throw new Error(`Invalid time format for ${day}. Use HH:MM-HH:MM format (e.g., 07:00-16:00) or "off"`);
                    }
                }
            }
        }
        return true;
    })
];
exports.validateUpdateDoctor = [
    (0, express_validator_1.body)('profile_id')
        .optional()
        .matches(UUID_PATTERN)
        .withMessage('Profile ID must be a valid UUID'),
    (0, express_validator_1.body)('license_number')
        .optional()
        .matches(LICENSE_PATTERN)
        .withMessage('License number must be 2-4 letters followed by 6-10 digits'),
    (0, express_validator_1.body)('specialization')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('Specialization must be 2-100 characters'),
    (0, express_validator_1.body)('qualification')
        .optional()
        .isLength({ min: 2, max: 200 })
        .withMessage('Qualification must be 2-200 characters'),
    (0, express_validator_1.body)('experience_years')
        .optional()
        .isInt({ min: 0, max: 50 })
        .withMessage('Experience years must be between 0 and 50'),
    (0, express_validator_1.body)('consultation_fee')
        .optional()
        .isFloat({ min: 0, max: 999999.99 })
        .withMessage('Consultation fee must be between 0 and 999,999.99'),
    (0, express_validator_1.body)('department_id')
        .optional()
        .matches(DEPARTMENT_ID_PATTERN)
        .withMessage('Department ID must be in format DEPT + numbers'),
    (0, express_validator_1.body)('status')
        .optional()
        .isIn(VALID_STATUSES)
        .withMessage(`Status must be one of: ${VALID_STATUSES.join(', ')}`),
    (0, express_validator_1.body)('bio')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Bio cannot exceed 1000 characters'),
    (0, express_validator_1.body)('working_hours')
        .optional()
        .isObject()
        .withMessage('Working hours must be a valid JSON object')
];
exports.validateProfileFields = [
    (0, express_validator_1.body)('email')
        .optional()
        .matches(EMAIL_PATTERN)
        .withMessage('Invalid email format'),
    (0, express_validator_1.body)('phone_number')
        .optional()
        .matches(PHONE_PATTERN)
        .withMessage('Phone number can only contain numbers, +, -, spaces, and parentheses'),
    (0, express_validator_1.body)('full_name')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('Full name must be 2-100 characters')
        .matches(/^[\p{L}\s]+$/u)
        .withMessage('Full name can only contain letters and spaces'),
    (0, express_validator_1.body)('role')
        .optional()
        .equals('doctor')
        .withMessage('Role must be "doctor" for doctor profiles')
];
const validateWorkingHoursFormat = (workingHours) => {
    if (!workingHours || typeof workingHours !== 'object')
        return false;
    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    for (const [day, timeRange] of Object.entries(workingHours)) {
        if (!validDays.includes(day))
            return false;
        if (timeRange !== 'off' && typeof timeRange === 'string') {
            if (!TIME_PATTERN.test(timeRange))
                return false;
        }
    }
    return true;
};
exports.validateWorkingHoursFormat = validateWorkingHoursFormat;
const validateLanguagesArray = (languages) => {
    if (!Array.isArray(languages))
        return false;
    return languages.every((lang) => typeof lang === 'string' && lang.length >= 2 && lang.length <= 50);
};
exports.validateLanguagesArray = validateLanguagesArray;
const validateDoctorIdFormat = (doctor_id) => {
    return DOCTOR_ID_PATTERN.test(doctor_id);
};
exports.validateDoctorIdFormat = validateDoctorIdFormat;
const validateLicenseNumberFormat = (licenseNumber) => {
    return LICENSE_PATTERN.test(licenseNumber);
};
exports.validateLicenseNumberFormat = validateLicenseNumberFormat;
const validateDepartmentIdFormat = (departmentId) => {
    return DEPARTMENT_ID_PATTERN.test(departmentId);
};
exports.validateDepartmentIdFormat = validateDepartmentIdFormat;
//# sourceMappingURL=doctor.validators.js.map