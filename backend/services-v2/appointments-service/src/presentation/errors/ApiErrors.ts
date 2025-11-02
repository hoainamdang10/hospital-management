/**
 * API Error Classes
 * Custom error classes for better error handling
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 */

/**
 * Base API Error
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public override message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: this.code || this.name,
        message: this.message,
        details: this.details,
      },
    };
  }
}

/**
 * 400 Bad Request
 */
export class BadRequestError extends ApiError {
  constructor(message: string = 'Bad Request', details?: any) {
    super(400, message, 'BAD_REQUEST', details);
  }
}

/**
 * 401 Unauthorized
 */
export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized', details?: any) {
    super(401, message, 'UNAUTHORIZED', details);
  }
}

/**
 * 403 Forbidden
 */
export class ForbiddenError extends ApiError {
  constructor(message: string = 'Forbidden', details?: any) {
    super(403, message, 'FORBIDDEN', details);
  }
}

/**
 * 404 Not Found
 */
export class NotFoundError extends ApiError {
  constructor(resource: string = 'Resource', details?: any) {
    super(404, `${resource} not found`, 'NOT_FOUND', details);
  }
}

/**
 * 409 Conflict
 */
export class ConflictError extends ApiError {
  constructor(message: string = 'Conflict', details?: any) {
    super(409, message, 'CONFLICT', details);
  }
}

/**
 * 422 Unprocessable Entity
 */
export class ValidationError extends ApiError {
  constructor(message: string = 'Validation failed', details?: any) {
    super(422, message, 'VALIDATION_ERROR', details);
  }
}

/**
 * 429 Too Many Requests
 */
export class RateLimitError extends ApiError {
  constructor(message: string = 'Too many requests', details?: any) {
    super(429, message, 'RATE_LIMIT_EXCEEDED', details);
  }
}

/**
 * 500 Internal Server Error
 */
export class InternalServerError extends ApiError {
  constructor(message: string = 'Internal server error', details?: any) {
    super(500, message, 'INTERNAL_SERVER_ERROR', details);
  }
}

/**
 * 503 Service Unavailable
 */
export class ServiceUnavailableError extends ApiError {
  constructor(message: string = 'Service unavailable', details?: any) {
    super(503, message, 'SERVICE_UNAVAILABLE', details);
  }
}

/**
 * Business Logic Errors
 */

export class AppointmentNotFoundError extends NotFoundError {
  constructor(appointmentId: string) {
    super('Appointment', { appointmentId });
    this.code = 'APPOINTMENT_NOT_FOUND';
  }
}

export class AppointmentAlreadyExistsError extends ConflictError {
  constructor(appointmentId: string) {
    super('Appointment already exists', { appointmentId });
    this.code = 'APPOINTMENT_ALREADY_EXISTS';
  }
}

export class AppointmentConflictError extends ConflictError {
  constructor(message: string, details?: any) {
    super(message, details);
    this.code = 'APPOINTMENT_CONFLICT';
  }
}

export class InvalidAppointmentStatusError extends BadRequestError {
  constructor(currentStatus: string, requestedAction: string) {
    super(`Cannot ${requestedAction} appointment with status ${currentStatus}`, {
      currentStatus,
      requestedAction,
    });
    this.code = 'INVALID_APPOINTMENT_STATUS';
  }
}

export class SlotNotAvailableError extends ConflictError {
  constructor(providerId: string, timeSlot: string) {
    super('Time slot is not available', { providerId, timeSlot });
    this.code = 'SLOT_NOT_AVAILABLE';
  }
}

export class ProviderNotAvailableError extends ConflictError {
  constructor(providerId: string, date: string) {
    super('Provider is not available on this date', { providerId, date });
    this.code = 'PROVIDER_NOT_AVAILABLE';
  }
}

export class PatientNotFoundError extends NotFoundError {
  constructor(patientId: string) {
    super('Patient', { patientId });
    this.code = 'PATIENT_NOT_FOUND';
  }
}

export class ProviderNotFoundError extends NotFoundError {
  constructor(providerId: string) {
    super('Provider', { providerId });
    this.code = 'PROVIDER_NOT_FOUND';
  }
}

export class InvalidDateRangeError extends BadRequestError {
  constructor(message: string = 'Invalid date range') {
    super(message);
    this.code = 'INVALID_DATE_RANGE';
  }
}

export class PastDateError extends BadRequestError {
  constructor(message: string = 'Cannot schedule appointment in the past') {
    super(message);
    this.code = 'PAST_DATE_NOT_ALLOWED';
  }
}

export class OutsideBusinessHoursError extends BadRequestError {
  constructor(message: string = 'Appointment time is outside business hours') {
    super(message);
    this.code = 'OUTSIDE_BUSINESS_HOURS';
  }
}

export class DuplicateAppointmentError extends ConflictError {
  constructor(patientId: string, providerId: string, date: string) {
    super('Patient already has an appointment with this provider on this date', {
      patientId,
      providerId,
      date,
    });
    this.code = 'DUPLICATE_APPOINTMENT';
  }
}

/**
 * Check if error is an API error
 */
export function isApiError(error: any): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Convert domain errors to API errors
 */
export function toApiError(error: Error): ApiError {
  if (isApiError(error)) {
    return error;
  }

  // Map domain errors to API errors
  const errorMessage = error.message.toLowerCase();

  if (errorMessage.includes('not found')) {
    return new NotFoundError(error.message);
  }

  if (errorMessage.includes('already exists')) {
    return new ConflictError(error.message);
  }

  if (errorMessage.includes('invalid') || errorMessage.includes('validation')) {
    return new ValidationError(error.message);
  }

  if (errorMessage.includes('unauthorized') || errorMessage.includes('authentication')) {
    return new UnauthorizedError(error.message);
  }

  if (errorMessage.includes('forbidden') || errorMessage.includes('permission')) {
    return new ForbiddenError(error.message);
  }

  // Default to internal server error
  return new InternalServerError(error.message);
}

