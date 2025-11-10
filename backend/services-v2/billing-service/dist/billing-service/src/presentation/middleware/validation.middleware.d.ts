/**
 * Validation Middleware - Presentation Layer
 * Request validation wrapper for Billing Service
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Input Validation, Security, Vietnamese Healthcare Standards
 */
import { Request, Response, NextFunction } from 'express';
/**
 * Validate request wrapper
 * Usage: validateRequest('createInvoice')
 */
export declare function validateRequest(validationType: string): any[] | ((req: Request, res: Response, next: NextFunction) => void);
/**
 * Custom validation middleware for specific fields
 */
export declare function validateField(field: string, validator: (value: any) => boolean, errorMessage: string): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Validate Vietnamese currency amount
 */
export declare function validateVNDAmount(req: Request, res: Response, next: NextFunction): void;
/**
 * Validate date range
 */
export declare function validateDateRange(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=validation.middleware.d.ts.map