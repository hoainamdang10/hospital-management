"use strict";
/**
 * API Error Classes
 * Custom error classes for better error handling
 *
 * @author Hospital Management Team
 * @version 1.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DuplicateAppointmentError = exports.OutsideBusinessHoursError = exports.PastDateError = exports.InvalidDateRangeError = exports.ProviderNotFoundError = exports.PatientNotFoundError = exports.ProviderNotAvailableError = exports.SlotNotAvailableError = exports.InvalidAppointmentStatusError = exports.AppointmentConflictError = exports.AppointmentAlreadyExistsError = exports.AppointmentNotFoundError = exports.ServiceUnavailableError = exports.InternalServerError = exports.RateLimitError = exports.ValidationError = exports.ConflictError = exports.NotFoundError = exports.ForbiddenError = exports.UnauthorizedError = exports.BadRequestError = exports.ApiError = void 0;
exports.isApiError = isApiError;
exports.toApiError = toApiError;
/**
 * Base API Error
 */
class ApiError extends Error {
    constructor(statusCode, message, code, details) {
        super(message);
        this.statusCode = statusCode;
        this.message = message;
        this.code = code;
        this.details = details;
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
exports.ApiError = ApiError;
/**
 * 400 Bad Request
 */
class BadRequestError extends ApiError {
    constructor(message = 'Bad Request', details) {
        super(400, message, 'BAD_REQUEST', details);
    }
}
exports.BadRequestError = BadRequestError;
/**
 * 401 Unauthorized
 */
class UnauthorizedError extends ApiError {
    constructor(message = 'Unauthorized', details) {
        super(401, message, 'UNAUTHORIZED', details);
    }
}
exports.UnauthorizedError = UnauthorizedError;
/**
 * 403 Forbidden
 */
class ForbiddenError extends ApiError {
    constructor(message = 'Forbidden', details) {
        super(403, message, 'FORBIDDEN', details);
    }
}
exports.ForbiddenError = ForbiddenError;
/**
 * 404 Not Found
 */
class NotFoundError extends ApiError {
    constructor(resource = 'Resource', details) {
        super(404, `${resource} not found`, 'NOT_FOUND', details);
    }
}
exports.NotFoundError = NotFoundError;
/**
 * 409 Conflict
 */
class ConflictError extends ApiError {
    constructor(message = 'Conflict', details) {
        super(409, message, 'CONFLICT', details);
    }
}
exports.ConflictError = ConflictError;
/**
 * 422 Unprocessable Entity
 */
class ValidationError extends ApiError {
    constructor(message = 'Validation failed', details) {
        super(422, message, 'VALIDATION_ERROR', details);
    }
}
exports.ValidationError = ValidationError;
/**
 * 429 Too Many Requests
 */
class RateLimitError extends ApiError {
    constructor(message = 'Too many requests', details) {
        super(429, message, 'RATE_LIMIT_EXCEEDED', details);
    }
}
exports.RateLimitError = RateLimitError;
/**
 * 500 Internal Server Error
 */
class InternalServerError extends ApiError {
    constructor(message = 'Internal server error', details) {
        super(500, message, 'INTERNAL_SERVER_ERROR', details);
    }
}
exports.InternalServerError = InternalServerError;
/**
 * 503 Service Unavailable
 */
class ServiceUnavailableError extends ApiError {
    constructor(message = 'Service unavailable', details) {
        super(503, message, 'SERVICE_UNAVAILABLE', details);
    }
}
exports.ServiceUnavailableError = ServiceUnavailableError;
/**
 * Business Logic Errors
 */
class AppointmentNotFoundError extends NotFoundError {
    constructor(appointmentId) {
        super('Appointment', { appointmentId });
        this.code = 'APPOINTMENT_NOT_FOUND';
    }
}
exports.AppointmentNotFoundError = AppointmentNotFoundError;
class AppointmentAlreadyExistsError extends ConflictError {
    constructor(appointmentId) {
        super('Appointment already exists', { appointmentId });
        this.code = 'APPOINTMENT_ALREADY_EXISTS';
    }
}
exports.AppointmentAlreadyExistsError = AppointmentAlreadyExistsError;
class AppointmentConflictError extends ConflictError {
    constructor(message, details) {
        super(message, details);
        this.code = 'APPOINTMENT_CONFLICT';
    }
}
exports.AppointmentConflictError = AppointmentConflictError;
class InvalidAppointmentStatusError extends BadRequestError {
    constructor(currentStatus, requestedAction) {
        super(`Cannot ${requestedAction} appointment with status ${currentStatus}`, {
            currentStatus,
            requestedAction,
        });
        this.code = 'INVALID_APPOINTMENT_STATUS';
    }
}
exports.InvalidAppointmentStatusError = InvalidAppointmentStatusError;
class SlotNotAvailableError extends ConflictError {
    constructor(providerId, timeSlot) {
        super('Time slot is not available', { providerId, timeSlot });
        this.code = 'SLOT_NOT_AVAILABLE';
    }
}
exports.SlotNotAvailableError = SlotNotAvailableError;
class ProviderNotAvailableError extends ConflictError {
    constructor(providerId, date) {
        super('Provider is not available on this date', { providerId, date });
        this.code = 'PROVIDER_NOT_AVAILABLE';
    }
}
exports.ProviderNotAvailableError = ProviderNotAvailableError;
class PatientNotFoundError extends NotFoundError {
    constructor(patientId) {
        super('Patient', { patientId });
        this.code = 'PATIENT_NOT_FOUND';
    }
}
exports.PatientNotFoundError = PatientNotFoundError;
class ProviderNotFoundError extends NotFoundError {
    constructor(providerId) {
        super('Provider', { providerId });
        this.code = 'PROVIDER_NOT_FOUND';
    }
}
exports.ProviderNotFoundError = ProviderNotFoundError;
class InvalidDateRangeError extends BadRequestError {
    constructor(message = 'Invalid date range') {
        super(message);
        this.code = 'INVALID_DATE_RANGE';
    }
}
exports.InvalidDateRangeError = InvalidDateRangeError;
class PastDateError extends BadRequestError {
    constructor(message = 'Cannot schedule appointment in the past') {
        super(message);
        this.code = 'PAST_DATE_NOT_ALLOWED';
    }
}
exports.PastDateError = PastDateError;
class OutsideBusinessHoursError extends BadRequestError {
    constructor(message = 'Appointment time is outside business hours') {
        super(message);
        this.code = 'OUTSIDE_BUSINESS_HOURS';
    }
}
exports.OutsideBusinessHoursError = OutsideBusinessHoursError;
class DuplicateAppointmentError extends ConflictError {
    constructor(patientId, providerId, date) {
        super('Patient already has an appointment with this provider on this date', {
            patientId,
            providerId,
            date,
        });
        this.code = 'DUPLICATE_APPOINTMENT';
    }
}
exports.DuplicateAppointmentError = DuplicateAppointmentError;
/**
 * Check if error is an API error
 */
function isApiError(error) {
    return error instanceof ApiError;
}
/**
 * Convert domain errors to API errors
 */
function toApiError(error) {
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
//# sourceMappingURL=ApiErrors.js.map