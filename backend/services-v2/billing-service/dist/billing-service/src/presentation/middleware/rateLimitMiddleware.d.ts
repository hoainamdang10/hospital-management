/**
 * rateLimitMiddleware - Presentation Layer
 * Rate limiting middleware for billing service API protection
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance API Security, DDoS Protection, Vietnamese Healthcare Standards
 */
import { Request, Response, NextFunction } from 'express';
/**
 * General API rate limiting
 * 100 requests per 15 minutes per IP
 */
export declare const generalRateLimit: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Strict rate limiting for payment operations
 * 10 requests per 5 minutes per user
 */
export declare const paymentRateLimit: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Insurance validation rate limiting
 * 20 requests per 10 minutes per user
 */
export declare const insuranceRateLimit: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Webhook rate limiting
 * 1000 requests per minute for webhooks (external services)
 */
export declare const webhookRateLimit: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Speed limiting middleware
 * Progressively slow down requests as they approach the rate limit
 */
export declare const speedLimiter: any;
/**
 * Custom rate limiting for different user roles
 */
export declare const roleBasedRateLimit: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Burst protection middleware
 * Prevents rapid-fire requests
 */
export declare const burstProtection: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Combined rate limiting middleware
 * Applies appropriate rate limits based on endpoint
 */
export declare const rateLimitMiddleware: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Rate limit headers middleware
 * Adds custom rate limit information to response headers
 */
export declare const rateLimitHeaders: (req: Request, res: Response, next: NextFunction) => void;
export { generalRateLimit, paymentRateLimit, insuranceRateLimit, webhookRateLimit, speedLimiter, roleBasedRateLimit, burstProtection, rateLimitHeaders };
//# sourceMappingURL=rateLimitMiddleware.d.ts.map