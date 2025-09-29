import { body, param, query, ValidationChain } from 'express-validator';

// Validation patterns
const SPECIALTY_ID_PATTERN = /^SPEC\d{3}$/; // SPEC001, SPEC002, etc.
const DEPARTMENT_ID_PATTERN = /^DEPT\d{3}$/; // DEPT001, DEPT002, etc.

// Common validations
export const validateSpecialtyId: ValidationChain[] = [
  param('specialtyId')
    .matches(SPECIALTY_ID_PATTERN)
    .withMessage('Specialty ID must be in format SPEC followed by 3 digits (e.g., SPEC001)')
];

// Create specialty validation
export const validateCreateSpecialty: ValidationChain[] = [
  body('specialty_name')
    .isLength({ min: 2, max: 100 })
    .withMessage('Specialty name must be between 2 and 100 characters')
    .matches(/^[\p{L}\s\-&()]+$/u)
    .withMessage('Specialty name can only contain letters, spaces, hyphens, ampersands, and parentheses'),

  body('specialty_code')
    .optional()
    .isLength({ min: 2, max: 20 })
    .withMessage('Specialty code must be between 2 and 20 characters')
    .matches(/^[A-Z0-9\-]+$/)
    .withMessage('Specialty code can only contain uppercase letters, numbers, and hyphens'),

  body('department_id')
    .matches(DEPARTMENT_ID_PATTERN)
    .withMessage('Department ID must be in format DEPT followed by 3 digits'),

  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),

  body('required_certifications')
    .optional()
    .isArray()
    .withMessage('Required certifications must be an array'),

  body('average_consultation_time')
    .optional()
    .isInt({ min: 15, max: 480 })
    .withMessage('Average consultation time must be between 15 and 480 minutes'),

  body('consultation_fee_range.min')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum consultation fee must be a positive number'),

  body('consultation_fee_range.max')
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

// Update specialty validation
export const validateUpdateSpecialty: ValidationChain[] = [
  body('specialty_name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Specialty name must be between 2 and 100 characters')
    .matches(/^[\p{L}\s\-&()]+$/u)
    .withMessage('Specialty name can only contain letters, spaces, hyphens, ampersands, and parentheses'),

  body('department_id')
    .optional()
    .matches(DEPARTMENT_ID_PATTERN)
    .withMessage('Department ID must be in format DEPT followed by 3 digits'),

  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),

  body('required_certifications')
    .optional()
    .isArray()
    .withMessage('Required certifications must be an array'),

  body('average_consultation_time')
    .optional()
    .isInt({ min: 15, max: 480 })
    .withMessage('Average consultation time must be between 15 and 480 minutes'),

  body('consultation_fee_range.min')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum consultation fee must be a positive number'),

  body('consultation_fee_range.max')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum consultation fee must be a positive number'),

  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean value')
];

// Search specialties validation
export const validateSpecialtySearch: ValidationChain[] = [
  query('search')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters'),

  query('department_id')
    .optional()
    .matches(DEPARTMENT_ID_PATTERN)
    .withMessage('Department ID must be in format DEPT followed by 3 digits'),

  query('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean value'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('sort_by')
    .optional()
    .isIn(['specialty_name', 'department_id', 'created_at', 'updated_at'])
    .withMessage('Sort by must be one of: specialty_name, department_id, created_at, updated_at'),

  query('sort_order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be either asc or desc')
];
