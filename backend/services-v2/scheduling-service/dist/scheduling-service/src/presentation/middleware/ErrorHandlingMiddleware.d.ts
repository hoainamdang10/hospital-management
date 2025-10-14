/**
 * Error Handling Middleware - Presentation Layer
 * V2 Clean Architecture + DDD Implementation
 * Centralized error handling with Vietnamese messages and proper HTTP status codes
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Error Handling, Vietnamese Healthcare Standards
 */
import { Request, Response, NextFunction } from 'express';
/**
 * Application Error Types
 */
export declare class AppError extends Error {
    readonly statusCode: number;
    readonly errorCode: string;
    readonly isOperational: boolean;
    constructor(message: string, statusCode?: number, errorCode?: string, isOperational?: boolean);
}
/**
 * Validation Error
 */
export declare class ValidationError extends AppError {
    readonly validationErrors: Array<{
        field: string;
        message: string;
        code?: string;
    }>;
    constructor(message: string, validationErrors?: Array<{
        field: string;
        message: string;
        code?: string;
    }>);
}
/**
 * Business Logic Error
 */
export declare class BusinessLogicError extends AppError {
    constructor(message: string, errorCode?: string);
}
/**
 * Not Found Error
 */
export declare class NotFoundError extends AppError {
    constructor(resource?: string);
}
/**
 * Unauthorized Error
 */
export declare class UnauthorizedError extends AppError {
    constructor(message?: string);
}
/**
 * Forbidden Error
 */
export declare class ForbiddenError extends AppError {
    constructor(message?: string);
}
/**
 * Conflict Error
 */
export declare class ConflictError extends AppError {
    constructor(message?: string);
}
/**
 * Rate Limit Error
 */
export declare class RateLimitError extends AppError {
    constructor(message?: string);
}
/**
 * Error Handling Middleware
 */
export declare function errorHandlingMiddleware(error: Error, req: Request, res: Response, next: NextFunction): void;
/**
 * Async Error Handler Wrapper
 */
export declare function asyncHandler(fn: Function): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Not Found Handler
 */
export declare function notFoundHandler(req: Request, res: Response, next: NextFunction): void;
/**
 * Validation Error Handler
 */
export declare function handleValidationError(error: any, req: Request, res: Response, next: NextFunction): void;
/**
 * Request Timeout Handler
 */
export declare function requestTimeoutHandler(timeout?: number): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=ErrorHandlingMiddleware.d.ts.map