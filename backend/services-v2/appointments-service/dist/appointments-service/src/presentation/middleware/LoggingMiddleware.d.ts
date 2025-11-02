/**
 * Logging Middleware
 * Adds correlation IDs and structured logging to requests
 *
 * @author Hospital Management Team
 * @version 1.0.0
 */
import { Request, Response, NextFunction } from 'express';
import { Logger } from '../../infrastructure/logging/Logger';
declare global {
    namespace Express {
        interface Request {
            logger?: Logger;
            correlationId?: string;
        }
    }
}
/**
 * Request logging middleware
 */
export declare function requestLoggingMiddleware(logger: Logger): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Error logging middleware
 */
export declare function errorLoggingMiddleware(logger: Logger): (err: Error, req: Request, res: Response, next: NextFunction) => void;
/**
 * Performance logging middleware
 */
export declare function performanceLoggingMiddleware(logger: Logger, thresholdMs?: number): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=LoggingMiddleware.d.ts.map