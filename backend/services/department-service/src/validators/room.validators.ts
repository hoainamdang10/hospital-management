import { body, param, query, ValidationChain } from 'express-validator';

// Validation patterns
const ROOM_ID_PATTERN = /^[A-Z]{3,4}-ROOM-\d{3}$/; // CARD-ROOM-001, NEUR-ROOM-002, etc.
const DEPARTMENT_ID_PATTERN = /^DEPT\d{3}$/; // DEPT001, DEPT002, etc.

// Common validations
export const validateRoomId: ValidationChain[] = [
  param('roomId')
    .matches(ROOM_ID_PATTERN)
    .withMessage('Room ID must be in format DEPT-ROOM-XXX (e.g., CARD-ROOM-001)')
];

// Create room validation
export const validateCreateRoom: ValidationChain[] = [
  body('room_number')
    .isLength({ min: 1, max: 20 })
    .withMessage('Room number must be between 1 and 20 characters')
    .matches(/^[A-Z0-9\-]+$/)
    .withMessage('Room number can only contain uppercase letters, numbers, and hyphens'),

  body('department_id')
    .matches(DEPARTMENT_ID_PATTERN)
    .withMessage('Department ID must be in format DEPT followed by 3 digits'),

  body('room_type')
    .optional()
    .isIn(['consultation', 'surgery', 'emergency', 'ward', 'icu', 'laboratory'])
    .withMessage('Room type must be one of: consultation, surgery, emergency, ward, icu, laboratory'),

  body('capacity')
    .isInt({ min: 1, max: 100 })
    .withMessage('Capacity must be between 1 and 100'),

  body('equipment_ids')
    .optional()
    .isArray()
    .withMessage('Equipment IDs must be an array'),

  body('location.floor')
    .optional()
    .isInt({ min: -5, max: 50 })
    .withMessage('Floor must be between -5 and 50'),

  body('location.wing')
    .optional()
    .isLength({ min: 1, max: 10 })
    .withMessage('Wing must be between 1 and 10 characters')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Wing can only contain uppercase letters and numbers'),

  body('location.coordinates.x')
    .optional()
    .isFloat()
    .withMessage('X coordinate must be a number'),

  body('location.coordinates.y')
    .optional()
    .isFloat()
    .withMessage('Y coordinate must be a number'),

  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters')
];

// Update room validation
export const validateUpdateRoom: ValidationChain[] = [
  body('room_number')
    .optional()
    .isLength({ min: 1, max: 20 })
    .withMessage('Room number must be between 1 and 20 characters')
    .matches(/^[A-Z0-9\-]+$/)
    .withMessage('Room number can only contain uppercase letters, numbers, and hyphens'),

  body('department_id')
    .optional()
    .matches(DEPARTMENT_ID_PATTERN)
    .withMessage('Department ID must be in format DEPT followed by 3 digits'),

  body('room_type')
    .optional()
    .isIn(['consultation', 'surgery', 'emergency', 'ward', 'icu', 'laboratory'])
    .withMessage('Room type must be one of: consultation, surgery, emergency, ward, icu, laboratory'),

  body('capacity')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Capacity must be between 1 and 100'),

  body('equipment_ids')
    .optional()
    .isArray()
    .withMessage('Equipment IDs must be an array'),

  body('status')
    .optional()
    .isIn(['available', 'occupied', 'maintenance', 'cleaning'])
    .withMessage('Status must be one of: available, occupied, maintenance, cleaning'),

  body('location.floor')
    .optional()
    .isInt({ min: -5, max: 50 })
    .withMessage('Floor must be between -5 and 50'),

  body('location.wing')
    .optional()
    .isLength({ min: 1, max: 10 })
    .withMessage('Wing must be between 1 and 10 characters')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Wing can only contain uppercase letters and numbers'),

  body('location.coordinates.x')
    .optional()
    .isFloat()
    .withMessage('X coordinate must be a number'),

  body('location.coordinates.y')
    .optional()
    .isFloat()
    .withMessage('Y coordinate must be a number'),

  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters'),

  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean value')
];

// Search rooms validation
export const validateRoomSearch: ValidationChain[] = [
  query('search')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters'),

  query('department_id')
    .optional()
    .matches(DEPARTMENT_ID_PATTERN)
    .withMessage('Department ID must be in format DEPT followed by 3 digits'),

  query('room_type')
    .optional()
    .isIn(['consultation', 'surgery', 'emergency', 'ward', 'icu', 'laboratory'])
    .withMessage('Room type must be one of: consultation, surgery, emergency, ward, icu, laboratory'),

  query('status')
    .optional()
    .isIn(['available', 'occupied', 'maintenance', 'cleaning'])
    .withMessage('Status must be one of: available, occupied, maintenance, cleaning'),

  query('floor')
    .optional()
    .isInt({ min: -5, max: 50 })
    .withMessage('Floor must be between -5 and 50'),

  query('wing')
    .optional()
    .isLength({ min: 1, max: 10 })
    .withMessage('Wing must be between 1 and 10 characters'),

  query('min_capacity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Minimum capacity must be a positive integer'),

  query('max_capacity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Maximum capacity must be a positive integer'),

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
    .isIn(['room_number', 'room_type', 'capacity', 'status', 'created_at', 'updated_at'])
    .withMessage('Sort by must be one of: room_number, room_type, capacity, status, created_at, updated_at'),

  query('sort_order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be either asc or desc')
];
