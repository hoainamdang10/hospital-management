import { body, param } from 'express-validator';

// Format validation patterns - STANDARDIZED with shared validators
// Department-Based ID System - Consistent 4-character department codes
const DOCTOR_ID_PATTERN = /^[A-Z]{4}-DOC-\d{6}-\d{3}$/;           // CARD-DOC-202506-001
const LICENSE_PATTERN = /^[A-Z]{2,4}\d{6,10}$/;                   // BS001235 or VN-BS-001235
const DEPARTMENT_ID_PATTERN = /^DEPT\d{3}$/;                      // DEPT001 (exactly 3 digits)
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9+\-\s()]+$/;
const TIME_PATTERN = /^([01]?[0-9]|2[0-3]):[0-5][0-9]-([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

// Status enum values
const VALID_STATUSES = ['active', 'inactive', 'on_leave'];
const VALID_GENDERS = ['male', 'female', 'other'];

export const validateDoctorId = [
  param('doctor_id')
    .matches(DOCTOR_ID_PATTERN)
    .withMessage('Doctor ID must be in format DEPT-DOC-YYYYMM-XXX (e.g., CARD-DOC-202506-001)')
];

export const validateCreateDoctor = [
  // Profile ID validation (UUID from Supabase Auth)
  body('profile_id')
    .optional()
    .matches(UUID_PATTERN)
    .withMessage('Profile ID must be a valid UUID'),

  // License number validation (unique, specific format)
  body('license_number')
    .notEmpty()
    .withMessage('License number is required')
    .matches(LICENSE_PATTERN)
    .withMessage('License number must be 2-4 letters followed by 6-10 digits (e.g., BS001235)'),

  // Specialization validation
  body('specialization')
    .notEmpty()
    .withMessage('Specialization is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Specialization must be 2-100 characters'),

  // Qualification validation
  body('qualification')
    .notEmpty()
    .withMessage('Qualification is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Qualification must be 2-200 characters'),

  // Experience years validation (0-50 range)
  body('experience_years')
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage('Experience years must be between 0 and 50'),

  // Consultation fee validation (decimal 8,2)
  body('consultation_fee')
    .optional()
    .isFloat({ min: 0, max: 999999.99 })
    .withMessage('Consultation fee must be between 0 and 999,999.99'),

  // Department ID validation (DEPT format)
  body('department_id')
    .notEmpty()
    .withMessage('Department ID is required')
    .matches(DEPARTMENT_ID_PATTERN)
    .withMessage('Department ID must be in format DEPT + numbers (e.g., DEPT001)'),

  // Status validation (enum)
  body('status')
    .optional()
    .isIn(VALID_STATUSES)
    .withMessage(`Status must be one of: ${VALID_STATUSES.join(', ')}`),

  // Bio validation (optional text)
  body('bio')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Bio cannot exceed 1000 characters'),

  // Languages spoken validation (array)
  body('languages_spoken')
    .optional()
    .isArray()
    .withMessage('Languages spoken must be an array')
    .custom((languages) => {
      if (languages && languages.length > 0) {
        const validLanguages = languages.every((lang: string) => 
          typeof lang === 'string' && lang.length >= 2 && lang.length <= 50
        );
        if (!validLanguages) {
          throw new Error('Each language must be a string between 2-50 characters');
        }
      }
      return true;
    }),

  // Working hours validation (JSON format)
  body('working_hours')
    .optional()
    .isObject()
    .withMessage('Working hours must be a valid JSON object')
    .custom((workingHours) => {
      if (workingHours) {
        const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const providedDays = Object.keys(workingHours);
        
        // Check if all provided days are valid
        const invalidDays = providedDays.filter(day => !validDays.includes(day));
        if (invalidDays.length > 0) {
          throw new Error(`Invalid day(s): ${invalidDays.join(', ')}. Valid days: ${validDays.join(', ')}`);
        }

        // Check time format for each day
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

export const validateUpdateDoctor = [
  // All fields are optional for update, but must follow same format rules
  body('profile_id')
    .optional()
    .matches(UUID_PATTERN)
    .withMessage('Profile ID must be a valid UUID'),

  body('license_number')
    .optional()
    .matches(LICENSE_PATTERN)
    .withMessage('License number must be 2-4 letters followed by 6-10 digits'),

  body('specialization')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Specialization must be 2-100 characters'),

  body('qualification')
    .optional()
    .isLength({ min: 2, max: 200 })
    .withMessage('Qualification must be 2-200 characters'),

  body('experience_years')
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage('Experience years must be between 0 and 50'),

  body('consultation_fee')
    .optional()
    .isFloat({ min: 0, max: 999999.99 })
    .withMessage('Consultation fee must be between 0 and 999,999.99'),

  body('department_id')
    .optional()
    .matches(DEPARTMENT_ID_PATTERN)
    .withMessage('Department ID must be in format DEPT + numbers'),

  body('status')
    .optional()
    .isIn(VALID_STATUSES)
    .withMessage(`Status must be one of: ${VALID_STATUSES.join(', ')}`),

  body('bio')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Bio cannot exceed 1000 characters'),



  body('working_hours')
    .optional()
    .isObject()
    .withMessage('Working hours must be a valid JSON object')
];

// Profile-related validations (from linked profiles table)
export const validateProfileFields = [
  body('email')
    .optional()
    .matches(EMAIL_PATTERN)
    .withMessage('Invalid email format'),

  body('phone_number')
    .optional()
    .matches(PHONE_PATTERN)
    .withMessage('Phone number can only contain numbers, +, -, spaces, and parentheses'),

  body('full_name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be 2-100 characters')
    .matches(/^[\p{L}\s]+$/u)
    .withMessage('Full name can only contain letters and spaces'),

  body('role')
    .optional()
    .equals('doctor')
    .withMessage('Role must be "doctor" for doctor profiles')
];

// Custom validation functions
export const validateWorkingHoursFormat = (workingHours: any): boolean => {
  if (!workingHours || typeof workingHours !== 'object') return false;
  
  const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  
  for (const [day, timeRange] of Object.entries(workingHours)) {
    if (!validDays.includes(day)) return false;
    if (timeRange !== 'off' && typeof timeRange === 'string') {
      if (!TIME_PATTERN.test(timeRange)) return false;
    }
  }
  
  return true;
};

export const validateLanguagesArray = (languages: any): boolean => {
  if (!Array.isArray(languages)) return false;
  return languages.every((lang: any) => 
    typeof lang === 'string' && lang.length >= 2 && lang.length <= 50
  );
};

export const validateDoctorIdFormat = (doctor_id: string): boolean => {
  return DOCTOR_ID_PATTERN.test(doctor_id);
};

export const validateLicenseNumberFormat = (licenseNumber: string): boolean => {
  return LICENSE_PATTERN.test(licenseNumber);
};

export const validateDepartmentIdFormat = (departmentId: string): boolean => {
  return DEPARTMENT_ID_PATTERN.test(departmentId);
};
