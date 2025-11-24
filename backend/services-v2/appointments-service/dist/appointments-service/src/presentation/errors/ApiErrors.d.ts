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
export declare class ApiError extends Error {
    statusCode: number;
    message: string;
    code?: string | undefined;
    details?: any | undefined;
    constructor(statusCode: number, message: string, code?: string | undefined, details?: any | undefined);
    toJSON(): {
        success: boolean;
        error: {
            code: string;
            message: string;
            details: any;
        };
    };
}
/**
 * 400 Bad Request
 */
export declare class BadRequestError extends ApiError {
    constructor(message?: string, details?: any);
}
/**
 * 401 Unauthorized
 */
export declare class UnauthorizedError extends ApiError {
    constructor(message?: string, details?: any);
}
/**
 * 403 Forbidden
 */
export declare class ForbiddenError extends ApiError {
    constructor(message?: string, details?: any);
}
/**
 * 404 Not Found
 */
export declare class NotFoundError extends ApiError {
    constructor(resource?: string, details?: any);
}
/**
 * 409 Conflict
 */
export declare class ConflictError extends ApiError {
    constructor(message?: string, details?: any);
}
/**
 * 422 Unprocessable Entity
 */
export declare class ValidationError extends ApiError {
    constructor(message?: string, details?: any);
}
/**
 * 429 Too Many Requests
 */
export declare class RateLimitError extends ApiError {
    constructor(message?: string, details?: any);
}
/**
 * 500 Internal Server Error
 */
export declare class InternalServerError extends ApiError {
    constructor(message?: string, details?: any);
}
/**
 * 503 Service Unavailable
 */
export declare class ServiceUnavailableError extends ApiError {
    constructor(message?: string, details?: any);
}
/**
 * Business Logic Errors
 */
export declare class AppointmentNotFoundError extends NotFoundError {
    constructor(appointmentId: string);
}
export declare class AppointmentAlreadyExistsError extends ConflictError {
    constructor(appointmentId: string);
}
export declare class AppointmentConflictError extends ConflictError {
    constructor(message: string, details?: any);
}
export declare class InvalidAppointmentStatusError extends BadRequestError {
    constructor(currentStatus: string, requestedAction: string);
}
export declare class SlotNotAvailableError extends ConflictError {
    constructor(providerId: string, timeSlot: string);
}
export declare class ProviderNotAvailableError extends ConflictError {
    constructor(providerId: string, date: string);
}
export declare class PatientNotFoundError extends NotFoundError {
    constructor(patientId: string);
}
export declare class ProviderNotFoundError extends NotFoundError {
    constructor(providerId: string);
}
export declare class InvalidDateRangeError extends BadRequestError {
    constructor(message?: string);
}
export declare class PastDateError extends BadRequestError {
    constructor(message?: string);
}
export declare class OutsideBusinessHoursError extends BadRequestError {
    constructor(message?: string);
}
export declare class DuplicateAppointmentError extends ConflictError {
    constructor(patientId: string, providerId: string, date: string);
}
/**
 * Check if error is an API error
 */
export declare function isApiError(error: any): error is ApiError;
/**
 * Convert domain errors to API errors
 */
export declare function toApiError(error: Error): ApiError;
//# sourceMappingURL=ApiErrors.d.ts.map