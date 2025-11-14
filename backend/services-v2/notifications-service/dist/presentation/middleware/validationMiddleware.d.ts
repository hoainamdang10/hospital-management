/**
 * validationMiddleware - Request Validation Middleware
 * JSON schema validation middleware with Vietnamese error messages
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Vietnamese Healthcare Standards, Data Validation
 */
import { Request, Response, NextFunction } from 'express';
interface ValidationSchema {
    [key: string]: {
        required?: boolean;
        type?: 'string' | 'number' | 'boolean' | 'array' | 'object';
        minLength?: number;
        maxLength?: number;
        minimum?: number;
        maximum?: number;
        minItems?: number;
        maxItems?: number;
        enum?: string[];
        format?: 'email' | 'date' | 'date-time' | 'phone' | 'url';
        items?: {
            type?: string;
            enum?: string[];
        };
        properties?: ValidationSchema;
    };
}
export declare function validateRequest(req: Request, res: Response, next: NextFunction): void;
export declare const validationMiddleware: (schema: ValidationSchema) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Validate Vietnamese healthcare specific fields
 */
export declare const validateHealthcareFields: (req: Request, res: Response, next: NextFunction) => void;
export {};
//# sourceMappingURL=validationMiddleware.d.ts.map