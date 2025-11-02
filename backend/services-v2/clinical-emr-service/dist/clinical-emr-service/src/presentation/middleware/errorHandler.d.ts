/**
 * Error Handling Middleware
 * Centralized error handling for Express
 *
 * @compliance Clean Architecture, Express, HIPAA
 */
import { Request, Response, NextFunction } from 'express';
export interface ApiError extends Error {
    statusCode?: number;
    code?: string;
    details?: any;
}
export declare function errorHandler(error: ApiError, req: Request, res: Response, next: NextFunction): void;
export declare function notFoundHandler(req: Request, res: Response): void;
export { errorHandler as errorHandlingMiddleware };
//# sourceMappingURL=errorHandler.d.ts.map