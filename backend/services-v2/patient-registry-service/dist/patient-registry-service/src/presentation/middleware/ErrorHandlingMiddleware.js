"use strict";
/**
 * Error Handling Middleware
 * Centralized error handling for Express
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, HIPAA
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseHelper = exports.ErrorHandlingMiddleware = exports.ConflictError = exports.ForbiddenError = exports.UnauthorizedError = exports.ValidationError = exports.NotFoundError = exports.DomainError = exports.ApplicationError = void 0;
/**
 * Custom application error
 */
class ApplicationError extends Error {
    constructor(statusCode, message, code, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.statusCode = statusCode;
        this.name = 'ApplicationError';
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.ApplicationError = ApplicationError;
/**
 * Domain error (business rule violation)
 */
class DomainError extends ApplicationError {
    constructor(message, details) {
        super(400, message, 'DOMAIN_ERROR', details);
        this.name = 'DomainError';
    }
}
exports.DomainError = DomainError;
/**
 * Not found error
 */
class NotFoundError extends ApplicationError {
    constructor(resource, identifier) {
        const message = identifier
            ? `${resource} với ID ${identifier} không tồn tại`
            : `${resource} không tồn tại`;
        super(404, message, 'NOT_FOUND');
        this.name = 'NotFoundError';
    }
}
exports.NotFoundError = NotFoundError;
/**
 * Validation error
 */
class ValidationError extends ApplicationError {
    constructor(message, errors) {
        super(400, message, 'VALIDATION_ERROR', { errors });
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
/**
 * Unauthorized error
 */
class UnauthorizedError extends ApplicationError {
    constructor(message = 'Unauthorized') {
        super(401, message, 'UNAUTHORIZED');
        this.name = 'UnauthorizedError';
    }
}
exports.UnauthorizedError = UnauthorizedError;
/**
 * Forbidden error
 */
class ForbiddenError extends ApplicationError {
    constructor(message = 'Forbidden') {
        super(403, message, 'FORBIDDEN');
        this.name = 'ForbiddenError';
    }
}
exports.ForbiddenError = ForbiddenError;
/**
 * Conflict error (duplicate resource)
 */
class ConflictError extends ApplicationError {
    constructor(message, details) {
        super(409, message, 'CONFLICT', details);
        this.name = 'ConflictError';
    }
}
exports.ConflictError = ConflictError;
/**
 * Error handling middleware with PHI/PII redaction
 */
class ErrorHandlingMiddleware {
    constructor(logger) {
        this.logger = logger;
    }
    /**
     * Redact sensitive data from request before logging
     * HIPAA compliance - remove PHI/PII from logs
     */
    redactSensitiveData(data) {
        if (!data || typeof data !== 'object')
            return data;
        const redacted = { ...data };
        const sensitiveFields = [
            'password', 'token', 'nationalId', 'phoneNumber', 'email',
            'address', 'dateOfBirth', 'bhytNumber', 'bhtnNumber',
            'personalInfo', 'contactInfo', 'insuranceInfo', 'medicalHistory'
        ];
        for (const field of sensitiveFields) {
            if (field in redacted) {
                redacted[field] = '[REDACTED]';
            }
        }
        return redacted;
    }
    /**
     * Handle errors with PHI/PII redaction
     */
    handle() {
        return (err, req, res, _next) => {
            // Log error WITHOUT sensitive data (HIPAA compliance)
            this.logger.error('Request error', {
                error: err.message,
                stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
                path: req.path,
                method: req.method,
                // DO NOT log body, query, params - they may contain PHI
            });
            // Handle known application errors
            if (err instanceof ApplicationError) {
                res.status(err.statusCode).json({
                    success: false,
                    error: err.code || 'APPLICATION_ERROR',
                    message: err.message,
                    details: err.details
                });
                return;
            }
            // Handle domain errors (from domain layer)
            if (err.name === 'DomainError' || err.message.includes('không được')) {
                res.status(400).json({
                    success: false,
                    error: 'DOMAIN_ERROR',
                    message: err.message
                });
                return;
            }
            // Handle validation errors
            if (err.name === 'ValidationError') {
                res.status(400).json({
                    success: false,
                    error: 'VALIDATION_ERROR',
                    message: err.message
                });
                return;
            }
            // Handle database errors
            if (err.message.includes('duplicate key') || err.message.includes('unique constraint')) {
                res.status(409).json({
                    success: false,
                    error: 'DUPLICATE_RESOURCE',
                    message: 'Tài nguyên đã tồn tại'
                });
                return;
            }
            // Handle Supabase errors
            if (err.message.includes('PGRST')) {
                res.status(500).json({
                    success: false,
                    error: 'DATABASE_ERROR',
                    message: 'Lỗi cơ sở dữ liệu'
                });
                return;
            }
            // Handle circuit breaker errors
            if (err.message.includes('Circuit breaker')) {
                res.status(503).json({
                    success: false,
                    error: 'SERVICE_UNAVAILABLE',
                    message: 'Dịch vụ tạm thời không khả dụng, vui lòng thử lại sau'
                });
                return;
            }
            // Default error response
            res.status(500).json({
                success: false,
                error: 'INTERNAL_SERVER_ERROR',
                message: 'Lỗi hệ thống, vui lòng thử lại sau'
            });
        };
    }
    /**
     * Handle 404 Not Found
     */
    notFound() {
        return (req, res) => {
            res.status(404).json({
                success: false,
                error: 'NOT_FOUND',
                message: `Route ${req.method} ${req.path} không tồn tại`
            });
        };
    }
    /**
     * Async handler wrapper
     * Catches async errors and passes to error middleware
     */
    static asyncHandler(fn) {
        return (req, res, next) => {
            Promise.resolve(fn(req, res, next)).catch(next);
        };
    }
}
exports.ErrorHandlingMiddleware = ErrorHandlingMiddleware;
/**
 * Success response helper
 */
class ResponseHelper {
    /**
     * Send success response
     */
    static success(res, data, message, statusCode = 200) {
        res.status(statusCode).json({
            success: true,
            data,
            message
        });
    }
    /**
     * Send created response
     */
    static created(res, data, message) {
        ResponseHelper.success(res, data, message, 201);
    }
    /**
     * Send no content response
     */
    static noContent(res) {
        res.status(204).send();
    }
    /**
     * Send paginated response
     */
    static paginated(res, data, page, limit, total, message) {
        res.status(200).json({
            success: true,
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            },
            message
        });
    }
}
exports.ResponseHelper = ResponseHelper;
//# sourceMappingURL=ErrorHandlingMiddleware.js.map