"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateDepartmentSearch = exports.validateUpdateDepartment = exports.validateCreateDepartment = exports.validateDepartmentId = void 0;
const express_validator_1 = require("express-validator");
const DEPARTMENT_ID_PATTERN = /^DEPT\d{3}$/;
const DEPARTMENT_CODE_PATTERN = /^[A-Z]{4}$/;
const PHONE_PATTERN = /^0\d{9}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
exports.validateDepartmentId = [
    (0, express_validator_1.param)('departmentId')
        .matches(DEPARTMENT_ID_PATTERN)
        .withMessage('Department ID must be in format DEPT followed by 3 digits (e.g., DEPT001)')
];
exports.validateCreateDepartment = [
    (0, express_validator_1.body)('department_name')
        .isLength({ min: 2, max: 100 })
        .withMessage('Department name must be between 2 and 100 characters')
        .matches(/^[\p{L}\s\-&()]+$/u)
        .withMessage('Department name can only contain letters, spaces, hyphens, ampersands, and parentheses'),
    (0, express_validator_1.body)('department_code')
        .matches(DEPARTMENT_CODE_PATTERN)
        .withMessage('Department code must be 3-4 uppercase letters (e.g., CARD, NEUR)')
        .custom((value) => {
        const reservedCodes = ['ADMIN', 'TEST', 'TEMP'];
        if (reservedCodes.includes(value)) {
            throw new Error('Department code is reserved');
        }
        return true;
    }),
    (0, express_validator_1.body)('description')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Description must not exceed 500 characters'),
    (0, express_validator_1.body)('parent_department_id')
        .optional()
        .matches(DEPARTMENT_ID_PATTERN)
        .withMessage('Parent department ID must be in format DEPT followed by 3 digits'),
    (0, express_validator_1.body)('head_doctor_id')
        .optional()
        .matches(/^[A-Z]{3,4}-DOC-\d{6}-\d{3}$/)
        .withMessage('Head doctor ID must be in department-based format (e.g., CARD-DOC-202506-001)'),
    (0, express_validator_1.body)('location')
        .optional()
        .isLength({ min: 1, max: 200 })
        .withMessage('Location must be between 1 and 200 characters'),
    (0, express_validator_1.body)('phone_number')
        .optional()
        .matches(PHONE_PATTERN)
        .withMessage('Phone number must be 10 digits starting with 0'),
    (0, express_validator_1.body)('email')
        .optional()
        .matches(EMAIL_PATTERN)
        .withMessage('Email must be a valid email address')
        .isLength({ max: 100 })
        .withMessage('Email must not exceed 100 characters')
];
exports.validateUpdateDepartment = [
    (0, express_validator_1.body)('department_name')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('Department name must be between 2 and 100 characters')
        .matches(/^[\p{L}\s\-&()]+$/u)
        .withMessage('Department name can only contain letters, spaces, hyphens, ampersands, and parentheses'),
    (0, express_validator_1.body)('department_code')
        .optional()
        .matches(DEPARTMENT_CODE_PATTERN)
        .withMessage('Department code must be 3-4 uppercase letters (e.g., CARD, NEUR)'),
    (0, express_validator_1.body)('description')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Description must not exceed 500 characters'),
    (0, express_validator_1.body)('parent_department_id')
        .optional()
        .matches(DEPARTMENT_ID_PATTERN)
        .withMessage('Parent department ID must be in format DEPT followed by 3 digits'),
    (0, express_validator_1.body)('head_doctor_id')
        .optional()
        .matches(/^[A-Z]{3,4}-DOC-\d{6}-\d{3}$/)
        .withMessage('Head doctor ID must be in department-based format'),
    (0, express_validator_1.body)('location')
        .optional()
        .isLength({ min: 1, max: 200 })
        .withMessage('Location must be between 1 and 200 characters'),
    (0, express_validator_1.body)('phone_number')
        .optional()
        .matches(PHONE_PATTERN)
        .withMessage('Phone number must be 10 digits starting with 0'),
    (0, express_validator_1.body)('email')
        .optional()
        .matches(EMAIL_PATTERN)
        .withMessage('Email must be a valid email address')
        .isLength({ max: 100 })
        .withMessage('Email must not exceed 100 characters'),
    (0, express_validator_1.body)('is_active')
        .optional()
        .isBoolean()
        .withMessage('is_active must be a boolean value')
];
exports.validateDepartmentSearch = [
    (0, express_validator_1.query)('search')
        .optional()
        .isLength({ min: 1, max: 100 })
        .withMessage('Search term must be between 1 and 100 characters'),
    (0, express_validator_1.query)('parent_department_id')
        .optional()
        .matches(DEPARTMENT_ID_PATTERN)
        .withMessage('Parent department ID must be in format DEPT followed by 3 digits'),
    (0, express_validator_1.query)('is_active')
        .optional()
        .isBoolean()
        .withMessage('is_active must be a boolean value'),
    (0, express_validator_1.query)('head_doctor_id')
        .optional()
        .matches(/^[A-Z]{3,4}-DOC-\d{6}-\d{3}$/)
        .withMessage('Head doctor ID must be in department-based format'),
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
        .isIn(['department_name', 'department_code', 'created_at', 'updated_at'])
        .withMessage('Sort by must be one of: department_name, department_code, created_at, updated_at'),
    (0, express_validator_1.query)('sort_order')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('Sort order must be either asc or desc')
];
//# sourceMappingURL=department.validators.js.map