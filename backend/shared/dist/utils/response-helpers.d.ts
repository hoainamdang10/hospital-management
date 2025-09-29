import { StandardApiResponse, StandardHealthCheck } from "../types/common.types";
/**
 * Helper functions to create standardized API responses across all microservices
 */
export declare class ResponseHelper {
    private static serviceName;
    private static serviceVersion;
    /**
     * Initialize the response helper with service information
     */
    static initialize(serviceName: string, version?: string): void;
    /**
     * Create a successful response
     */
    static success<T>(data: T, pagination?: StandardApiResponse["pagination"]): StandardApiResponse<T>;
    /**
     * Create an error response
     */
    static error(message: string, code?: string, details?: any, statusCode?: number): StandardApiResponse<null>;
    /**
     * Create a paginated response
     */
    static paginated<T>(data: T[], page: number, limit: number, total: number): StandardApiResponse<T[]>;
    /**
     * Create a standardized health check response
     */
    static healthCheck(status: "healthy" | "unhealthy" | "degraded", dependencies?: StandardHealthCheck["dependencies"], features?: StandardHealthCheck["features"]): StandardHealthCheck;
    /**
     * Create validation error response
     */
    static validationError(errors: any[]): StandardApiResponse<null>;
    /**
     * Create not found error response
     */
    static notFound(resource: string, id?: string): StandardApiResponse<null>;
    /**
     * Create unauthorized error response
     */
    static unauthorized(message?: string): StandardApiResponse<null>;
    /**
     * Create forbidden error response
     */
    static forbidden(message?: string): StandardApiResponse<null>;
    /**
     * Create internal server error response
     */
    static internalError(message?: string): StandardApiResponse<null>;
    /**
     * Create service unavailable error response
     */
    static serviceUnavailable(service: string): StandardApiResponse<null>;
    /**
     * Create bad request error response
     */
    static badRequest(message?: string): StandardApiResponse<null>;
}
/**
 * Middleware to add request ID to responses
 */
export declare function addRequestId(req: any, res: any, next: any): void;
/**
 * Vietnamese error messages mapping
 */
export declare const VietnameseErrorMessages: {
    UNAUTHORIZED: string;
    FORBIDDEN: string;
    INVALID_TOKEN: string;
    TOKEN_EXPIRED: string;
    VALIDATION_ERROR: string;
    REQUIRED_FIELD: string;
    INVALID_FORMAT: string;
    INVALID_EMAIL: string;
    INVALID_PHONE: string;
    INVALID_LICENSE: string;
    NOT_FOUND: string;
    ALREADY_EXISTS: string;
    DUPLICATE_ENTRY: string;
    INTERNAL_ERROR: string;
    SERVICE_UNAVAILABLE: string;
    DATABASE_ERROR: string;
    NETWORK_ERROR: string;
    APPOINTMENT_CONFLICT: string;
    DOCTOR_NOT_AVAILABLE: string;
    PATIENT_NOT_FOUND: string;
    DOCTOR_NOT_FOUND: string;
    DEPARTMENT_NOT_FOUND: string;
    PAYMENT_FAILED: string;
    PAYMENT_CANCELLED: string;
    INVALID_PAYMENT_METHOD: string;
    INSUFFICIENT_FUNDS: string;
    FILE_TOO_LARGE: string;
    INVALID_FILE_TYPE: string;
    UPLOAD_FAILED: string;
    RATE_LIMIT_EXCEEDED: string;
    TOO_MANY_REQUESTS: string;
};
/**
 * Enhanced ResponseHelper with Vietnamese error messages
 */
export declare class EnhancedResponseHelper extends ResponseHelper {
    /**
     * Create error response with Vietnamese message
     */
    static errorVi(messageKey: keyof typeof VietnameseErrorMessages, code?: string, details?: any, customMessage?: string): StandardApiResponse<null>;
    /**
     * Create validation error with Vietnamese messages
     */
    static validationErrorVi(errors: Array<{
        field: string;
        message: string;
    }>): StandardApiResponse<null>;
    /**
     * Translate common validation messages to Vietnamese
     */
    private static translateValidationMessage;
}
/**
 * Express middleware to handle async errors and convert them to standardized responses
 */
export declare function asyncErrorHandler(fn: Function): (req: any, res: any, next: any) => void;
/**
 * Global error handling middleware for Express
 */
export declare function globalErrorHandler(error: any, req: any, res: any, next: any): any;
/**
 * Validation helper to check required fields
 */
export declare function validateRequiredFields(data: any, requiredFields: string[]): string[];
/**
 * Helper to create consistent pagination info
 */
export declare function createPaginationInfo(page: number, limit: number, total: number): {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
};
//# sourceMappingURL=response-helpers.d.ts.map