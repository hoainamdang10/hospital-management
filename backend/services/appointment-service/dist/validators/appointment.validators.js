"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateConfirmAppointment = exports.validateAvailableSlots = exports.validateAppointmentSearch = exports.validateUpdateAppointment = exports.validateCreateAppointment = exports.validateDoctorId = exports.validatePatientId = exports.validateAppointmentId = void 0;
const express_validator_1 = require("express-validator");
const APPOINTMENT_ID_PATTERN = /^[A-Z]{4}-APT-\d{6}-\d{3}$/;
const PATIENT_ID_PATTERN = /^PAT-\d{6}-\d{3}$/;
const DOCTOR_ID_PATTERN = /^[A-Z]{4}-DOC-\d{6}-\d{3}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
exports.validateAppointmentId = [
    (0, express_validator_1.param)('appointment_id')
        .matches(APPOINTMENT_ID_PATTERN)
        .withMessage('Appointment ID must be in department-based format (e.g., CARD-APT-YYYYMM-XXX)')
];
exports.validatePatientId = [
    (0, express_validator_1.param)('patient_id')
        .matches(PATIENT_ID_PATTERN)
        .withMessage('Patient ID must be in format PAT-YYYYMM-XXX')
];
exports.validateDoctorId = [
    (0, express_validator_1.param)('doctor_id')
        .matches(DOCTOR_ID_PATTERN)
        .withMessage('Doctor ID must be in department-based format (e.g., CARD-DOC-YYYYMM-XXX)')
];
exports.validateCreateAppointment = [
    (0, express_validator_1.body)('patient_id')
        .matches(PATIENT_ID_PATTERN)
        .withMessage('Patient ID must be in format PAT-YYYYMM-XXX'),
    (0, express_validator_1.body)('doctor_id')
        .matches(DOCTOR_ID_PATTERN)
        .withMessage('Doctor ID must be in department-based format (e.g., CARD-DOC-YYYYMM-XXX)'),
    (0, express_validator_1.body)('appointment_date')
        .matches(DATE_PATTERN)
        .withMessage('Appointment date must be in YYYY-MM-DD format')
        .custom((value) => {
        const appointmentDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (appointmentDate < today) {
            throw new Error('Appointment date cannot be in the past');
        }
        const sixMonthsFromNow = new Date();
        sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
        if (appointmentDate > sixMonthsFromNow) {
            throw new Error('Appointment date cannot be more than 6 months in the future');
        }
        return true;
    }),
    (0, express_validator_1.body)('start_time')
        .matches(TIME_PATTERN)
        .withMessage('Start time must be in HH:mm format'),
    (0, express_validator_1.body)('end_time')
        .matches(TIME_PATTERN)
        .withMessage('End time must be in HH:mm format')
        .custom((value, { req }) => {
        const startTime = req.body.start_time;
        if (startTime && value <= startTime) {
            throw new Error('End time must be after start time');
        }
        return true;
    }),
    (0, express_validator_1.body)('appointment_type')
        .isIn(['consultation', 'follow_up', 'emergency', 'routine_checkup'])
        .withMessage('Appointment type must be consultation, follow_up, emergency, or routine_checkup'),
    (0, express_validator_1.body)('reason')
        .optional()
        .isLength({ min: 1, max: 500 })
        .withMessage('Reason must be between 1 and 500 characters'),
    (0, express_validator_1.body)('notes')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Notes must not exceed 1000 characters')
];
exports.validateUpdateAppointment = [
    ...exports.validateAppointmentId,
    (0, express_validator_1.body)('appointment_date')
        .optional()
        .matches(DATE_PATTERN)
        .withMessage('Appointment date must be in YYYY-MM-DD format')
        .custom((value) => {
        if (value) {
            const appointmentDate = new Date(value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (appointmentDate < today) {
                throw new Error('Appointment date cannot be in the past');
            }
        }
        return true;
    }),
    (0, express_validator_1.body)('start_time')
        .optional()
        .matches(TIME_PATTERN)
        .withMessage('Start time must be in HH:mm format'),
    (0, express_validator_1.body)('end_time')
        .optional()
        .matches(TIME_PATTERN)
        .withMessage('End time must be in HH:mm format')
        .custom((value, { req }) => {
        const startTime = req.body.start_time;
        if (startTime && value && value <= startTime) {
            throw new Error('End time must be after start time');
        }
        return true;
    }),
    (0, express_validator_1.body)('appointment_type')
        .optional()
        .isIn(['consultation', 'follow_up', 'emergency', 'routine_checkup'])
        .withMessage('Appointment type must be consultation, follow_up, emergency, or routine_checkup'),
    (0, express_validator_1.body)('status')
        .optional()
        .isIn(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'])
        .withMessage('Status must be scheduled, confirmed, in_progress, completed, cancelled, or no_show'),
    (0, express_validator_1.body)('reason')
        .optional()
        .isLength({ min: 1, max: 500 })
        .withMessage('Reason must be between 1 and 500 characters'),
    (0, express_validator_1.body)('notes')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Notes must not exceed 1000 characters'),
    (0, express_validator_1.body)('diagnosis')
        .optional()
        .isLength({ max: 2000 })
        .withMessage('Diagnosis must not exceed 2000 characters')
];
exports.validateAppointmentSearch = [
    (0, express_validator_1.query)('doctor_id')
        .optional()
        .matches(DOCTOR_ID_PATTERN)
        .withMessage('Doctor ID must be in department-based format (e.g., CARD-DOC-YYYYMM-XXX)'),
    (0, express_validator_1.query)('patient_id')
        .optional()
        .matches(PATIENT_ID_PATTERN)
        .withMessage('Patient ID must be in format PAT-YYYYMM-XXX'),
    (0, express_validator_1.query)('appointment_date')
        .optional()
        .matches(DATE_PATTERN)
        .withMessage('Appointment date must be in YYYY-MM-DD format'),
    (0, express_validator_1.query)('date_from')
        .optional()
        .matches(DATE_PATTERN)
        .withMessage('Date from must be in YYYY-MM-DD format'),
    (0, express_validator_1.query)('date_to')
        .optional()
        .matches(DATE_PATTERN)
        .withMessage('Date to must be in YYYY-MM-DD format')
        .custom((value, { req }) => {
        const dateFrom = req.query?.date_from;
        if (dateFrom && value && value < dateFrom) {
            throw new Error('Date to must be after date from');
        }
        return true;
    }),
    (0, express_validator_1.query)('status')
        .optional()
        .isIn(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'])
        .withMessage('Status must be scheduled, confirmed, in_progress, completed, cancelled, or no_show'),
    (0, express_validator_1.query)('appointment_type')
        .optional()
        .isIn(['consultation', 'follow_up', 'emergency', 'routine_checkup'])
        .withMessage('Appointment type must be consultation, follow_up, emergency, or routine_checkup'),
    (0, express_validator_1.query)('search')
        .optional()
        .isLength({ min: 1, max: 100 })
        .withMessage('Search term must be between 1 and 100 characters'),
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100')
];
exports.validateAvailableSlots = [
    (0, express_validator_1.query)('doctor_id')
        .matches(DOCTOR_ID_PATTERN)
        .withMessage('Doctor ID must be in department-based format (e.g., CARD-DOC-YYYYMM-XXX)'),
    (0, express_validator_1.query)('date')
        .matches(DATE_PATTERN)
        .withMessage('Date must be in YYYY-MM-DD format')
        .custom((value) => {
        const requestDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (requestDate < today) {
            throw new Error('Date cannot be in the past');
        }
        return true;
    }),
    (0, express_validator_1.query)('duration')
        .optional()
        .isInt({ min: 15, max: 480 })
        .withMessage('Duration must be between 15 and 480 minutes')
];
exports.validateConfirmAppointment = [
    ...exports.validateAppointmentId,
    (0, express_validator_1.body)('notes')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Notes must not exceed 500 characters')
];
//# sourceMappingURL=appointment.validators.js.map