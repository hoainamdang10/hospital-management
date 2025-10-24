/**
 * rateLimitMiddleware - Rate Limiting Middleware
 * Rate limiting middleware for notification service with Vietnamese healthcare context
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Vietnamese Healthcare Standards, API Security
 */
import { Request, Response, NextFunction } from 'express';
export declare const rateLimitMiddleware: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Healthcare-specific rate limiting
 */
export declare const healthcareRateLimitMiddleware: (req: Request, res: Response, next: NextFunction) => void;
/**
 * IP-based rate limiting for public endpoints
 */
export declare const ipRateLimitMiddleware: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=rateLimitMiddleware.d.ts.map