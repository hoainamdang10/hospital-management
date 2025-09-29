"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSpecialtySearch = exports.validateUpdateSpecialty = exports.validateCreateSpecialty = exports.validateSpecialtyId = void 0;
const express_validator_1 = require("express-validator");
const SPECIALTY_ID_PATTERN = /^SPEC\d{3}$/;
const DEPARTMENT_ID_PATTERN = /^DEPT\d{3}$/;
exports.validateSpecialtyId = [
    (0, express_validator_1.param)('specialtyId')
        .matches(SPECIALTY_ID_PATTERN)
        .withMessage('Specialty ID must be in format SPEC followed by 3 digits (e.g., SPEC001)')
];
exports.validateCreateSpecialty = [
    (0, express_validator_1.body)('specialty_name')
        .isLength({ min: 2, max: 100 })
        .withMessage('Specialty name must be between 2 and 100 characters')
        .matches(/^[\p{L}\s\-&()]+$/u)
        .withMessage('Specialty name can only contain letters, spaces, hyphens, ampersands, and parentheses'),
    (0, express_validator_1.body)('specialty_code')
        .optional()
        .isLength({ min: 2, max: 20 })
        .withMessage('Specialty code must be between 2 and 20 characters')
        .matches(/^[A-Z0-9\-]+$/)
        .withMessage('Specialty code can only contain uppercase letters, numbers, and hyphens'),
    (0, express_validator_1.body)('department_id')
        .matches(DEPARTMENT_ID_PATTERN)
        .withMessage('Department ID must be in format DEPT followed by 3 digits'),
    (0, express_validator_1.body)('description')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Description must not exceed 500 characters'),
    (0, express_validator_1.body)('required_certifications')
        .optional()
        .isArray()
        .withMessage('Required certifications must be an array'),
    (0, express_validator_1.body)('average_consultation_time')
        .optional()
        .isInt({ min: 15, max: 480 })
        .withMessage('Average consultation time must be between 15 and 480 minutes'),
    (0, express_validator_1.body)('consultation_fee_range.min')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Minimum consultation fee must be a positive number'),
    (0, express_validator_1.body)('consultation_fee_range.max')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Maximum consultation fee must be a positive number')
        .custom((value, { req }) => {
        const min = req.body.consultation_fee_range?.min;
        if (min && value && value < min) {
            throw new Error('Maximum fee must be greater than minimum fee');
        }
        return true;
    })
];
exports.validateUpdateSpecialty = [
    (0, express_validator_1.body)('specialty_name')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('Specialty name must be between 2 and 100 characters')
        .matches(/^[\p{L}\s\-&()]+$/u)
        .withMessage('Specialty name can only contain letters, spaces, hyphens, ampersands, and parentheses'),
    (0, express_validator_1.body)('department_id')
        .optional()
        .matches(DEPARTMENT_ID_PATTERN)
        .withMessage('Department ID must be in format DEPT followed by 3 digits'),
    (0, express_validator_1.body)('description')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Description must not exceed 500 characters'),
    (0, express_validator_1.body)('required_certifications')
        .optional()
        .isArray()
        .withMessage('Required certifications must be an array'),
    (0, express_validator_1.body)('average_consultation_time')
        .optional()
        .isInt({ min: 15, max: 480 })
        .withMessage('Average consultation time must be between 15 and 480 minutes'),
    (0, express_validator_1.body)('consultation_fee_range.min')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Minimum consultation fee must be a positive number'),
    (0, express_validator_1.body)('consultation_fee_range.max')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Maximum consultation fee must be a positive number'),
    (0, express_validator_1.body)('is_active')
        .optional()
        .isBoolean()
        .withMessage('is_active must be a boolean value')
];
exports.validateSpecialtySearch = [
    (0, express_validator_1.query)('search')
        .optional()
        .isLength({ min: 1, max: 100 })
        .withMessage('Search term must be between 1 and 100 characters'),
    (0, express_validator_1.query)('department_id')
        .optional()
        .matches(DEPARTMENT_ID_PATTERN)
        .withMessage('Department ID must be in format DEPT followed by 3 digits'),
    (0, express_validator_1.query)('is_active')
        .optional()
        .isBoolean()
        .withMessage('is_active must be a boolean value'),
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    (0, express_validator_1.query)('sort_by')
        .optional()
        .isIn(['specialty_name', 'department_id', 'created_at', 'updated_at'])
        .withMessage('Sort by must be one of: specialty_name, department_id, created_at, updated_at'),
    (0, express_validator_1.query)('sort_order')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('Sort order must be either asc or desc')
];
//# sourceMappingURL=specialty.validators.js.map