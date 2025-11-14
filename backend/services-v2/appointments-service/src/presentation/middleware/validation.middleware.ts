/**
 * Validation Middleware - Presentation Layer
 * Request validation using express-validator
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Input Validation
 */

import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';

/**
 * Validation middleware factory
 * Creates middleware that validates request using provided validation chains
 */
export function validateRequest(validations: ValidationChain[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      const formattedErrors = errors.array().map(error => ({
        field: error.type === 'field' ? (error as any).path : 'unknown',
        message: error.msg,
        value: error.type === 'field' ? (error as any).value : undefined
      }));

      res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Request validation failed',
        details: formattedErrors
      });
      return;
    }

    next();
  };
}

/**
 * UUID validation helper
 */
export function validateUUID(fieldName: string) {
  return {
    isUUID: {
      errorMessage: `${fieldName} must be a valid UUID`,
    }
  };
}

/**
 * Date validation helper
 */
export function validateDate(fieldName: string, format: string = 'YYYY-MM-DD') {
  return {
    isDate: {
      errorMessage: `${fieldName} must be a valid date in ${format} format`,
    },
    matches: {
      options: [/^\d{4}-\d{2}-\d{2}$/],
      errorMessage: `${fieldName} must be in ${format} format`,
    }
  };
}

/**
 * Time validation helper
 */
export function validateTime(fieldName: string) {
  return {
    matches: {
      options: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/],
      errorMessage: `${fieldName} must be in HH:MM:SS format`,
    }
  };
}

/**
 * Email validation helper
 */
export function validateEmail(fieldName: string = 'email') {
  return {
    isEmail: {
      errorMessage: `${fieldName} must be a valid email address`,
    },
    normalizeEmail: true
  };
}

/**
 * Phone number validation helper
 */
export function validatePhone(fieldName: string = 'phone') {
  return {
    matches: {
      options: [/^[\+]?[1-9][\d]{0,15}$/],
      errorMessage: `${fieldName} must be a valid phone number`,
    }
  };
}

/**
 * Pagination validation helpers
 */
export function validatePagination() {
  return [
    {
      query: 'limit',
      optional: { options: { nullable: true } },
      isInt: {
        options: { min: 1, max: 100 },
        errorMessage: 'Limit must be between 1 and 100',
      },
      toInt: true
    },
    {
      query: 'offset',
      optional: { options: { nullable: true } },
      isInt: {
        options: { min: 0 },
        errorMessage: 'Offset must be a non-negative integer',
      },
      toInt: true
    }
  ];
}

/**
 * Common validation rules
 */
export const commonValidations = {
  appointmentId: {
    isString: {
      errorMessage: 'Appointment ID must be a string',
    },
    matches: {
      options: [/^\d{4}-APT-\d{6}-\d{3}$/],
      errorMessage: 'Appointment ID must be in format YYYY-APT-MMDDSS-NNN',
    }
  },
  patientId: {
    isString: {
      errorMessage: 'Patient ID must be a string',
    },
    notEmpty: {
      errorMessage: 'Patient ID cannot be empty',
    }
  },
  doctorId: {
    isString: {
      errorMessage: 'Doctor ID must be a string',
    },
    notEmpty: {
      errorMessage: 'Doctor ID cannot be empty',
    }
  },
  status: {
    isIn: {
      options: [['SCHEDULED', 'CONFIRMED', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']],
      errorMessage: 'Status must be one of: SCHEDULED, CONFIRMED, ARRIVED, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW',
    }
  },
  priority: {
    isIn: {
      options: [['EMERGENCY', 'URGENT', 'NORMAL', 'LOW']],
      errorMessage: 'Priority must be one of: EMERGENCY, URGENT, NORMAL, LOW',
    }
  }
};
