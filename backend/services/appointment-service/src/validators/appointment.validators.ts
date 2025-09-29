import { body, param, query, ValidationChain } from 'express-validator';

// Validation patterns - STANDARDIZED Department-Based ID System
const APPOINTMENT_ID_PATTERN = /^[A-Z]{4}-APT-\d{6}-\d{3}$/;      // CARD-APT-202506-001 (Department-based)
const PATIENT_ID_PATTERN = /^PAT-\d{6}-\d{3}$/;                   // PAT-202506-001 (Standard)
const DOCTOR_ID_PATTERN = /^[A-Z]{4}-DOC-\d{6}-\d{3}$/;          // CARD-DOC-202506-001 (4-char dept code)
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

// Common validations
export const validateAppointmentId: ValidationChain[] = [
  param('appointment_id')
    .matches(APPOINTMENT_ID_PATTERN)
    .withMessage('Appointment ID must be in department-based format (e.g., CARD-APT-YYYYMM-XXX)')
];

export const validatePatientId: ValidationChain[] = [
  param('patient_id')
    .matches(PATIENT_ID_PATTERN)
    .withMessage('Patient ID must be in format PAT-YYYYMM-XXX')
];

export const validateDoctorId: ValidationChain[] = [
  param('doctor_id')
    .matches(DOCTOR_ID_PATTERN)
    .withMessage('Doctor ID must be in department-based format (e.g., CARD-DOC-YYYYMM-XXX)')
];

// Create appointment validation
export const validateCreateAppointment: ValidationChain[] = [
  body('patient_id')
    .matches(PATIENT_ID_PATTERN)
    .withMessage('Patient ID must be in format PAT-YYYYMM-XXX'),

  body('doctor_id')
    .matches(DOCTOR_ID_PATTERN)
    .withMessage('Doctor ID must be in department-based format (e.g., CARD-DOC-YYYYMM-XXX)'),
  
  body('appointment_date')
    .matches(DATE_PATTERN)
    .withMessage('Appointment date must be in YYYY-MM-DD format')
    .custom((value) => {
      const appointmentDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (appointmentDate < today) {
        throw new Error('Appointment date cannot be in the past');
      }
      
      // Check if appointment is not more than 6 months in the future
      const sixMonthsFromNow = new Date();
      sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
      
      if (appointmentDate > sixMonthsFromNow) {
        throw new Error('Appointment date cannot be more than 6 months in the future');
      }
      
      return true;
    }),
  
  body('start_time')
    .matches(TIME_PATTERN)
    .withMessage('Start time must be in HH:mm format'),
  
  body('end_time')
    .matches(TIME_PATTERN)
    .withMessage('End time must be in HH:mm format')
    .custom((value, { req }) => {
      const startTime = req.body.start_time;
      if (startTime && value <= startTime) {
        throw new Error('End time must be after start time');
      }
      return true;
    }),
  
  body('appointment_type')
    .isIn(['consultation', 'follow_up', 'emergency', 'routine_checkup'])
    .withMessage('Appointment type must be consultation, follow_up, emergency, or routine_checkup'),
  
  body('reason')
    .optional()
    .isLength({ min: 1, max: 500 })
    .withMessage('Reason must be between 1 and 500 characters'),
  
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters')
];

// Update appointment validation
export const validateUpdateAppointment: ValidationChain[] = [
  ...validateAppointmentId,
  
  body('appointment_date')
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
  
  body('start_time')
    .optional()
    .matches(TIME_PATTERN)
    .withMessage('Start time must be in HH:mm format'),
  
  body('end_time')
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
  
  body('appointment_type')
    .optional()
    .isIn(['consultation', 'follow_up', 'emergency', 'routine_checkup'])
    .withMessage('Appointment type must be consultation, follow_up, emergency, or routine_checkup'),
  
  body('status')
    .optional()
    .isIn(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'])
    .withMessage('Status must be scheduled, confirmed, in_progress, completed, cancelled, or no_show'),
  
  body('reason')
    .optional()
    .isLength({ min: 1, max: 500 })
    .withMessage('Reason must be between 1 and 500 characters'),
  
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters'),
  
  body('diagnosis')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Diagnosis must not exceed 2000 characters')
];

// Search appointments validation
export const validateAppointmentSearch: ValidationChain[] = [
  query('doctor_id')
    .optional()
    .matches(DOCTOR_ID_PATTERN)
    .withMessage('Doctor ID must be in department-based format (e.g., CARD-DOC-YYYYMM-XXX)'),

  query('patient_id')
    .optional()
    .matches(PATIENT_ID_PATTERN)
    .withMessage('Patient ID must be in format PAT-YYYYMM-XXX'),
  
  query('appointment_date')
    .optional()
    .matches(DATE_PATTERN)
    .withMessage('Appointment date must be in YYYY-MM-DD format'),
  
  query('date_from')
    .optional()
    .matches(DATE_PATTERN)
    .withMessage('Date from must be in YYYY-MM-DD format'),
  
  query('date_to')
    .optional()
    .matches(DATE_PATTERN)
    .withMessage('Date to must be in YYYY-MM-DD format')
    .custom((value, { req }) => {
      const dateFrom = req.query?.date_from as string;
      if (dateFrom && value && value < dateFrom) {
        throw new Error('Date to must be after date from');
      }
      return true;
    }),
  
  query('status')
    .optional()
    .isIn(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'])
    .withMessage('Status must be scheduled, confirmed, in_progress, completed, cancelled, or no_show'),
  
  query('appointment_type')
    .optional()
    .isIn(['consultation', 'follow_up', 'emergency', 'routine_checkup'])
    .withMessage('Appointment type must be consultation, follow_up, emergency, or routine_checkup'),
  
  query('search')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

// Available slots validation
export const validateAvailableSlots: ValidationChain[] = [
  query('doctor_id')
    .matches(DOCTOR_ID_PATTERN)
    .withMessage('Doctor ID must be in department-based format (e.g., CARD-DOC-YYYYMM-XXX)'),
  
  query('date')
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
  
  query('duration')
    .optional()
    .isInt({ min: 15, max: 480 })
    .withMessage('Duration must be between 15 and 480 minutes')
];

// Confirm appointment validation
export const validateConfirmAppointment: ValidationChain[] = [
  ...validateAppointmentId,
  
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters')
];
