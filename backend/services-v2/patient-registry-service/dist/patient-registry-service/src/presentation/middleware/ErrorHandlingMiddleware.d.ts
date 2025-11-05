/**
 * Error Handling Middleware
 * Centralized error handling for Express
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, HIPAA
 */
import { Request, Response, NextFunction } from 'express';
import { ILogger } from '../../../../shared/application/services/logger.interface';
/**
 * Custom application error
 */
export declare class ApplicationError extends Error {
    code?: string | undefined;
    details?: unknown | undefined;
    statusCode: number;
    constructor(statusCode: number, message: string, code?: string | undefined, details?: unknown | undefined);
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
 * Error handling middleware with PHI/PII redaction
 */
export declare class ErrorHandlingMiddleware {
    private logger;
    constructor(logger: ILogger);
    /**
     * Redact sensitive data from request before logging
     * HIPAA compliance - remove PHI/PII from logs
     */
    private redactSensitiveData;
    /**
     * Handle errors with PHI/PII redaction
     */
    handle(): (err: Error, req: Request, res: Response, _next: NextFunction) => void;
    /**
     * Handle 404 Not Found
     */
    notFound(): (req: Request, res: Response) => void;
    /**
     * Async handler wrapper
     * Catches async errors and passes to error middleware
     */
    static asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>): (req: Request, res: Response, next: NextFunction) => void;
}
/**
 * Success response helper
 */
export declare class ResponseHelper {
    /**
     * Send success response
     */
    static success<T>(res: Response, data: T, message?: string, statusCode?: number): void;
    /**
     * Send created response
     */
    static created<T>(res: Response, data: T, message?: string): void;
    /**
     * Send no content response
     */
    static noContent(res: Response): void;
    /**
     * Send paginated response
     */
    static paginated<T>(res: Response, data: T[], page: number, limit: number, total: number, message?: string): void;
}
//# sourceMappingURL=ErrorHandlingMiddleware.d.ts.map