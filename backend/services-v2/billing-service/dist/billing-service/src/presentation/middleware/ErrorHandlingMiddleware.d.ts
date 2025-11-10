/**
 * Error Handling Middleware
 * Copy from patient-registry-service
 */
import { Request, Response, NextFunction } from "express";
import { ILogger } from "../../../../shared/application/services/logger.interface";
export declare class DomainError extends Error {
    constructor(message: string);
}
export declare class NotFoundError extends Error {
    constructor(message: string);
}
export declare class ValidationError extends Error {
    constructor(message: string);
}
export declare class ResponseHelper {
    static success<T>(data: T, message?: string): {
        success: boolean;
        data: T;
        message: string | undefined;
    };
    static error(message: string, details?: any): {
        success: boolean;
        error: string;
        details: any;
    };
}
export declare class ErrorHandlingMiddleware {
    private logger;
    constructor(logger: ILogger);
    handle(): (err: Error, req: Request, res: Response, next: NextFunction) => void;
    notFound(): (req: Request, res: Response) => void;
}
//# sourceMappingURL=ErrorHandlingMiddleware.d.ts.map