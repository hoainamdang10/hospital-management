/**
 * Base Controller - Presentation Layer
 * Common controller functionality
 */
import { Request, Response } from 'express';
export declare abstract class BaseController {
    /**
     * Extract user ID from request
     */
    protected extractUserId(req: Request): string;
    /**
     * Extract user roles from request
     */
    protected extractUserRoles(req: Request): string[];
    /**
     * Send success response
     */
    protected sendSuccessResponse(res: Response, data: any, message?: string, statusCode?: number): void;
    /**
     * Send error response
     */
    protected sendErrorResponse(res: Response, message: string, statusCode?: number, errors?: any[]): void;
    /**
     * Handle controller errors
     */
    protected handleControllerError(res: Response, error: unknown, defaultMessage?: string): void;
}
//# sourceMappingURL=BaseController.d.ts.map