/**
 * Validation Middleware - Presentation Layer
 * V2 Clean Architecture + DDD Implementation
 * Request validation middleware with Vietnamese healthcare rules
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Input Validation, Vietnamese Healthcare Standards
 */
import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
/**
 * Validation Middleware Factory
 */
export declare function validateRequest(schema: Joi.ObjectSchema, source?: 'body' | 'query' | 'params'): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Sanitize Request Data
 */
export declare function sanitizeRequest(req: Request, res: Response, next: NextFunction): void;
/**
 * Rate Limiting Middleware
 */
export declare function rateLimitMiddleware(windowMs?: number, // 15 minutes
maxRequests?: number): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Request Size Limit Middleware
 */
export declare function requestSizeLimitMiddleware(maxSize?: number): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Content Type Validation Middleware
 */
export declare function validateContentType(allowedTypes?: string[]): (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
//# sourceMappingURL=ValidationMiddleware.d.ts.map