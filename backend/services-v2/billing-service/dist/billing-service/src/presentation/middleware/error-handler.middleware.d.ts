/**
 * Error Handler Middleware - Presentation Layer
 * Centralized error handling for Billing Service
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, HIPAA, Security Best Practices
 */
import { Request, Response, NextFunction } from 'express';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
/**
 * Custom application error base class
 */
export declare class ApplicationError extends Error {
    statusCode: number;
    code?: string;
    details?: unknown;
    constructor(statusCode: number, message: string, code?: string, details?: unknown);
}
/**
 * Domain error (business rule violation)
 */
export declare class DomainError extends ApplicationError {
    constructor(message: string, details?: unknown);
}
/**
 * Not found error
 */
export declare class NotFoundError extends ApplicationError {
    constructor(resource: string, identifier?: string);
}
/**
 * Validation error
 */
export declare class ValidationError extends ApplicationError {
    constructor(message: string, errors?: Array<{
        field: string;
        message: string;
    }>);
}
/**
 * Unauthorized error
 */
export declare class UnauthorizedError extends ApplicationError {
    constructor(message?: string);
}
/**
 * Forbidden error
 */
export declare class ForbiddenError extends ApplicationError {
    constructor(message?: string);
}
/**
 * Conflict error (duplicate resource)
 */
export declare class ConflictError extends ApplicationError {
    constructor(message: string, details?: unknown);
}
/**
 * Payment error
 */
export declare class PaymentError extends ApplicationError {
    constructor(message: string, details?: unknown);
}
/**
 * Insurance error
 */
export declare class InsuranceError extends ApplicationError {
    constructor(message: string, details?: unknown);
}
/**
 * Error handler middleware factory
 */
export declare function createErrorHandler(logger?: ILogger): (err: Error, req: Request, res: Response, _next: NextFunction) => void;
/**
 * Default error handler (without logger)
 */
export declare const errorHandler: (err: Error, req: Request, res: Response, _next: NextFunction) => void;
//# sourceMappingURL=error-handler.middleware.d.ts.map