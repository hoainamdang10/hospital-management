"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePatientSearch = exports.validateSearchPatients = exports.validateUpdatePatient = exports.validateCreatePatient = exports.validateDoctorId = exports.validateProfileId = exports.validatePatientId = void 0;
const express_validator_1 = require("express-validator");
const PATIENT_ID_PATTERN = /^PAT-\d{6}-\d{3}$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PHONE_PATTERN = /^0\d{9}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
exports.validatePatientId = [
    (0, express_validator_1.param)('patient_id')
        .notEmpty()
        .withMessage('Patient ID is required')
        .matches(PATIENT_ID_PATTERN)
        .withMessage('Patient ID must be in format PAT-YYYYMM-XXX (Department-Based ID)')
];
exports.validateProfileId = [
    (0, express_validator_1.param)('profileId')
        .matches(UUID_PATTERN)
        .withMessage('Profile ID must be a valid UUID')
];
exports.validateDoctorId = [
    (0, express_validator_1.param)('doctor_id')
        .matches(/^[A-Z]{4}-DOC-\d{6}-\d{3}$/)
        .withMessage('Doctor ID must be in department-based format (e.g., CARD-DOC-YYYYMM-XXX)')
];
exports.validateCreatePatient = [
    (0, express_validator_1.body)('profile_id')
        .matches(UUID_PATTERN)
        .withMessage('Profile ID must be a valid UUID'),
    (0, express_validator_1.body)('full_name')
        .isLength({ min: 2, max: 100 })
        .withMessage('Full name must be between 2 and 100 characters')
        .matches(/^[\p{L}\s]+$/u)
        .withMessage('Full name can only contain letters and spaces'),
    (0, express_validator_1.body)('date_of_birth')
        .matches(DATE_PATTERN)
        .withMessage('Date of birth must be in YYYY-MM-DD format')
        .custom((value) => {
        const date = new Date(value);
        const now = new Date();
        const age = now.getFullYear() - date.getFullYear();
        if (age < 0 || age > 150) {
            throw new Error('Invalid date of birth');
        }
        return true;
    }),
    (0, express_validator_1.body)('gender')
        .isIn(['male', 'female', 'other'])
        .withMessage('Gender must be male, female, or other'),
    (0, express_validator_1.body)('blood_type')
        .optional()
        .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
        .withMessage('Invalid blood type'),
    (0, express_validator_1.body)('address')
        .optional()
        .isObject()
        .withMessage('Address must be an object'),
    (0, express_validator_1.body)('address.street')
        .optional()
        .isLength({ min: 1, max: 200 })
        .withMessage('Street address must be between 1 and 200 characters'),
    (0, express_validator_1.body)('address.ward')
        .optional()
        .isLength({ min: 1, max: 100 })
        .withMessage('Ward must be between 1 and 100 characters'),
    (0, express_validator_1.body)('address.district')
        .optional()
        .isLength({ min: 1, max: 100 })
        .withMessage('District must be between 1 and 100 characters'),
    (0, express_validator_1.body)('address.city')
        .optional()
        .isLength({ min: 1, max: 100 })
        .withMessage('City must be between 1 and 100 characters'),
    (0, express_validator_1.body)('emergency_contact')
        .optional()
        .isObject()
        .withMessage('Emergency contact must be an object'),
    (0, express_validator_1.body)('emergency_contact.name')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('Emergency contact name must be between 2 and 100 characters'),
    (0, express_validator_1.body)('emergency_contact.phone')
        .optional()
        .matches(PHONE_PATTERN)
        .withMessage('Emergency contact phone must be 10 digits starting with 0'),
    (0, express_validator_1.body)('insurance_info')
        .optional()
        .isObject()
        .withMessage('Insurance info must be an object'),
    (0, express_validator_1.body)('medical_history')
        .optional()
        .isLength({ max: 2000 })
        .withMessage('Medical history must not exceed 2000 characters'),
    (0, express_validator_1.body)('allergies')
        .optional()
        .isArray()
        .withMessage('Allergies must be an array'),
    (0, express_validator_1.body)('allergies.*')
        .optional()
        .isLength({ min: 1, max: 100 })
        .withMessage('Each allergy must be between 1 and 100 characters'),
    (0, express_validator_1.body)('notes')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Notes must not exceed 1000 characters')
];
exports.validateUpdatePatient = [
    ...exports.validatePatientId,
    (0, express_validator_1.body)('full_name')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('Full name must be between 2 and 100 characters')
        .matches(/^[\p{L}\s]+$/u)
        .withMessage('Full name can only contain letters and spaces'),
    (0, express_validator_1.body)('date_of_birth')
        .optional()
        .matches(DATE_PATTERN)
        .withMessage('Date of birth must be in YYYY-MM-DD format'),
    (0, express_validator_1.body)('gender')
        .optional()
        .isIn(['male', 'female', 'other'])
        .withMessage('Gender must be male, female, or other'),
    (0, express_validator_1.body)('blood_type')
        .optional()
        .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
        .withMessage('Invalid blood type'),
    (0, express_validator_1.body)('status')
        .optional()
        .isIn(['active', 'inactive', 'suspended'])
        .withMessage('Status must be active, inactive, or suspended'),
    (0, express_validator_1.body)('address')
        .optional()
        .isObject()
        .withMessage('Address must be an object'),
    (0, express_validator_1.body)('emergency_contact')
        .optional()
        .isObject()
        .withMessage('Emergency contact must be an object'),
    (0, express_validator_1.body)('insurance_info')
        .optional()
        .isObject()
        .withMessage('Insurance info must be an object'),
    (0, express_validator_1.body)('medical_history')
        .optional()
        .isLength({ max: 2000 })
        .withMessage('Medical history must not exceed 2000 characters'),
    (0, express_validator_1.body)('allergies')
        .optional()
        .isArray()
        .withMessage('Allergies must be an array'),
    (0, express_validator_1.body)('notes')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Notes must not exceed 1000 characters')
];
exports.validateSearchPatients = [
    (0, express_validator_1.query)('q')
        .notEmpty()
        .withMessage('Search term (q) is required')
        .isLength({ min: 1, max: 100 })
        .withMessage('Search term must be between 1 and 100 characters'),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('Limit must be between 1 and 50')
];
exports.validatePatientSearch = [
    (0, express_validator_1.query)('search')
        .optional()
        .isLength({ min: 1, max: 100 })
        .withMessage('Search term must be between 1 and 100 characters'),
    (0, express_validator_1.query)('gender')
        .optional()
        .isIn(['male', 'female', 'other'])
        .withMessage('Gender must be male, female, or other'),
    (0, express_validator_1.query)('status')
        .optional()
        .isIn(['active', 'inactive', 'suspended'])
        .withMessage('Status must be active, inactive, or suspended'),
    (0, express_validator_1.query)('blood_type')
        .optional()
        .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
        .withMessage('Invalid blood type'),
    (0, express_validator_1.query)('age_min')
        .optional()
        .isInt({ min: 0, max: 150 })
        .withMessage('Minimum age must be between 0 and 150'),
    (0, express_validator_1.query)('age_max')
        .optional()
        .isInt({ min: 0, max: 150 })
        .withMessage('Maximum age must be between 0 and 150'),
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100')
];
//# sourceMappingURL=patient.validators.js.map