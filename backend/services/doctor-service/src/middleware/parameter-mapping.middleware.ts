import { Request, Response, NextFunction } from 'express';

/**
 * Parameter Mapping Middleware
 * Maps kebab-case route parameters to snake_case for database consistency
 * 
 * Example:
 * Route: /api/doctors/:doctor-id
 * URL: /api/doctors/CARD-DOC-202412-001
 * 
 * Before: req.params['doctor-id'] = 'CARD-DOC-202412-001'
 * After: req.params.doctor_id = 'CARD-DOC-202412-001'
 */

interface ParameterMapping {
  [kebabCase: string]: string; // kebab-case -> snake_case
}

// Define parameter mappings
const PARAMETER_MAPPINGS: ParameterMapping = {
  'doctor-id': 'doctor_id',
  'patient-id': 'patient_id',
  'appointment-id': 'appointment_id',
  'department-id': 'department_id',
  'profile-id': 'profile_id',
  'experience-id': 'experience_id',
  'schedule-id': 'schedule_id',
  'review-id': 'review_id',
  'room-id': 'room_id',
  'template-id': 'template_id',
  'record-id': 'record_id',
  'payment-id': 'payment_id',
  'notification-id': 'notification_id',
  'medical-record-id': 'medical_record_id',
  'prescription-id': 'prescription_id',
  'lab-result-id': 'lab_result_id',
  'vital-sign-id': 'vital_sign_id',
  'attachment-id': 'attachment_id',
  'billing-id': 'billing_id',
  'invoice-id': 'invoice_id',
  'specialty-id': 'specialty_id',
  'shift-id': 'shift_id',
  'slot-id': 'slot_id',
  'exception-id': 'exception_id',
  'availability-id': 'availability_id'
};

/**
 * Maps kebab-case route parameters to snake_case
 * This allows us to use REST API standard kebab-case in URLs
 * while maintaining database consistency with snake_case in controllers
 */
export const parameterMappingMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Create a new params object to avoid mutating the original
    const mappedParams: { [key: string]: string } = { ...req.params };

    // Map each kebab-case parameter to snake_case
    Object.keys(req.params).forEach(kebabParam => {
      const snakeParam = PARAMETER_MAPPINGS[kebabParam];
      if (snakeParam) {
        // Add snake_case version
        mappedParams[snakeParam] = req.params[kebabParam];
        
        // Keep original kebab-case for backward compatibility
        // This allows both req.params['doctor-id'] and req.params.doctor_id to work
      }
    });

    // Replace params object
    req.params = mappedParams;

    next();
  } catch (error) {
    console.error('Parameter mapping error:', error);
    next(error);
  }
};

/**
 * Utility function to get mapped parameter name
 * @param kebabCase - The kebab-case parameter name
 * @returns The corresponding snake_case parameter name
 */
export const getMappedParameterName = (kebabCase: string): string => {
  return PARAMETER_MAPPINGS[kebabCase] || kebabCase;
};

/**
 * Utility function to validate if a parameter mapping exists
 * @param kebabCase - The kebab-case parameter name to check
 * @returns True if mapping exists, false otherwise
 */
export const hasParameterMapping = (kebabCase: string): boolean => {
  return kebabCase in PARAMETER_MAPPINGS;
};

/**
 * Get all available parameter mappings
 * Useful for debugging and documentation
 */
export const getAllParameterMappings = (): ParameterMapping => {
  return { ...PARAMETER_MAPPINGS };
};

export default parameterMappingMiddleware;
