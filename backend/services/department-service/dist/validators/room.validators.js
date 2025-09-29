"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRoomSearch = exports.validateUpdateRoom = exports.validateCreateRoom = exports.validateRoomId = void 0;
const express_validator_1 = require("express-validator");
const ROOM_ID_PATTERN = /^[A-Z]{3,4}-ROOM-\d{3}$/;
const DEPARTMENT_ID_PATTERN = /^DEPT\d{3}$/;
exports.validateRoomId = [
    (0, express_validator_1.param)('roomId')
        .matches(ROOM_ID_PATTERN)
        .withMessage('Room ID must be in format DEPT-ROOM-XXX (e.g., CARD-ROOM-001)')
];
exports.validateCreateRoom = [
    (0, express_validator_1.body)('room_number')
        .isLength({ min: 1, max: 20 })
        .withMessage('Room number must be between 1 and 20 characters')
        .matches(/^[A-Z0-9\-]+$/)
        .withMessage('Room number can only contain uppercase letters, numbers, and hyphens'),
    (0, express_validator_1.body)('department_id')
        .matches(DEPARTMENT_ID_PATTERN)
        .withMessage('Department ID must be in format DEPT followed by 3 digits'),
    (0, express_validator_1.body)('room_type')
        .optional()
        .isIn(['consultation', 'surgery', 'emergency', 'ward', 'icu', 'laboratory'])
        .withMessage('Room type must be one of: consultation, surgery, emergency, ward, icu, laboratory'),
    (0, express_validator_1.body)('capacity')
        .isInt({ min: 1, max: 100 })
        .withMessage('Capacity must be between 1 and 100'),
    (0, express_validator_1.body)('equipment_ids')
        .optional()
        .isArray()
        .withMessage('Equipment IDs must be an array'),
    (0, express_validator_1.body)('location.floor')
        .optional()
        .isInt({ min: -5, max: 50 })
        .withMessage('Floor must be between -5 and 50'),
    (0, express_validator_1.body)('location.wing')
        .optional()
        .isLength({ min: 1, max: 10 })
        .withMessage('Wing must be between 1 and 10 characters')
        .matches(/^[A-Z0-9]+$/)
        .withMessage('Wing can only contain uppercase letters and numbers'),
    (0, express_validator_1.body)('location.coordinates.x')
        .optional()
        .isFloat()
        .withMessage('X coordinate must be a number'),
    (0, express_validator_1.body)('location.coordinates.y')
        .optional()
        .isFloat()
        .withMessage('Y coordinate must be a number'),
    (0, express_validator_1.body)('notes')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Notes must not exceed 500 characters')
];
exports.validateUpdateRoom = [
    (0, express_validator_1.body)('room_number')
        .optional()
        .isLength({ min: 1, max: 20 })
        .withMessage('Room number must be between 1 and 20 characters')
        .matches(/^[A-Z0-9\-]+$/)
        .withMessage('Room number can only contain uppercase letters, numbers, and hyphens'),
    (0, express_validator_1.body)('department_id')
        .optional()
        .matches(DEPARTMENT_ID_PATTERN)
        .withMessage('Department ID must be in format DEPT followed by 3 digits'),
    (0, express_validator_1.body)('room_type')
        .optional()
        .isIn(['consultation', 'surgery', 'emergency', 'ward', 'icu', 'laboratory'])
        .withMessage('Room type must be one of: consultation, surgery, emergency, ward, icu, laboratory'),
    (0, express_validator_1.body)('capacity')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Capacity must be between 1 and 100'),
    (0, express_validator_1.body)('equipment_ids')
        .optional()
        .isArray()
        .withMessage('Equipment IDs must be an array'),
    (0, express_validator_1.body)('status')
        .optional()
        .isIn(['available', 'occupied', 'maintenance', 'cleaning'])
        .withMessage('Status must be one of: available, occupied, maintenance, cleaning'),
    (0, express_validator_1.body)('location.floor')
        .optional()
        .isInt({ min: -5, max: 50 })
        .withMessage('Floor must be between -5 and 50'),
    (0, express_validator_1.body)('location.wing')
        .optional()
        .isLength({ min: 1, max: 10 })
        .withMessage('Wing must be between 1 and 10 characters')
        .matches(/^[A-Z0-9]+$/)
        .withMessage('Wing can only contain uppercase letters and numbers'),
    (0, express_validator_1.body)('location.coordinates.x')
        .optional()
        .isFloat()
        .withMessage('X coordinate must be a number'),
    (0, express_validator_1.body)('location.coordinates.y')
        .optional()
        .isFloat()
        .withMessage('Y coordinate must be a number'),
    (0, express_validator_1.body)('notes')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Notes must not exceed 500 characters'),
    (0, express_validator_1.body)('is_active')
        .optional()
        .isBoolean()
        .withMessage('is_active must be a boolean value')
];
exports.validateRoomSearch = [
    (0, express_validator_1.query)('search')
        .optional()
        .isLength({ min: 1, max: 100 })
        .withMessage('Search term must be between 1 and 100 characters'),
    (0, express_validator_1.query)('department_id')
        .optional()
        .matches(DEPARTMENT_ID_PATTERN)
        .withMessage('Department ID must be in format DEPT followed by 3 digits'),
    (0, express_validator_1.query)('room_type')
        .optional()
        .isIn(['consultation', 'surgery', 'emergency', 'ward', 'icu', 'laboratory'])
        .withMessage('Room type must be one of: consultation, surgery, emergency, ward, icu, laboratory'),
    (0, express_validator_1.query)('status')
        .optional()
        .isIn(['available', 'occupied', 'maintenance', 'cleaning'])
        .withMessage('Status must be one of: available, occupied, maintenance, cleaning'),
    (0, express_validator_1.query)('floor')
        .optional()
        .isInt({ min: -5, max: 50 })
        .withMessage('Floor must be between -5 and 50'),
    (0, express_validator_1.query)('wing')
        .optional()
        .isLength({ min: 1, max: 10 })
        .withMessage('Wing must be between 1 and 10 characters'),
    (0, express_validator_1.query)('min_capacity')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Minimum capacity must be a positive integer'),
    (0, express_validator_1.query)('max_capacity')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Maximum capacity must be a positive integer'),
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
        .isIn(['room_number', 'room_type', 'capacity', 'status', 'created_at', 'updated_at'])
        .withMessage('Sort by must be one of: room_number, room_type, capacity, status, created_at, updated_at'),
    (0, express_validator_1.query)('sort_order')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('Sort order must be either asc or desc')
];
//# sourceMappingURL=room.validators.js.map